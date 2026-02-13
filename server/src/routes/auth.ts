import { Router, Request, Response } from 'express';
import {
    generateRegistrationOptions,
    verifyRegistrationResponse,
    generateAuthenticationOptions,
    verifyAuthenticationResponse
} from '@simplewebauthn/server';
import type {
    RegistrationResponseJSON,
    AuthenticationResponseJSON
} from '@simplewebauthn/types';
import jwt from 'jsonwebtoken';
import { getDb } from '../db';
import { authenticateToken, AuthRequest } from '../middleware/auth';
import { logActivity } from '../utils/logger';

const router = Router();
console.log('🛡️ Auth Router Initialized');

const RP_NAME = 'ICE Jersey Project';
const RP_ID = process.env.RP_ID || 'localhost';
const ORIGIN = process.env.ORIGIN || 'http://localhost:5173';

// --- REGISTER PASSKEY ---

router.post('/register-passkey/options', authenticateToken, async (req: AuthRequest, res: Response) => {
    console.log('🔑 Passkey registration options requested');
    try {
        const adminId = req.user?.id;
        if (!adminId) return res.status(401).json({ error: 'Unauthorized' });

        const { client } = await getDb();
        try {
            const userResult = await client.query('SELECT * FROM admin_users WHERE id = $1', [adminId]);
            const user = userResult.rows[0];

            const authsResult = await client.query('SELECT credential_id FROM authenticators WHERE admin_user_id = $1', [adminId]);
            const excludeCredentials = authsResult.rows.map(row => ({
                id: row.credential_id,
                type: 'public-key' as const,
            }));

            const options = await generateRegistrationOptions({
                rpName: RP_NAME,
                rpID: RP_ID,
                userID: Buffer.from(String(user.id)),
                userName: user.username,
                attestationType: 'none',
                excludeCredentials,
                authenticatorSelection: {
                    residentKey: 'preferred',
                    userVerification: 'preferred',
                    authenticatorAttachment: 'platform',
                },
            });

            await client.query(
                'INSERT INTO webauthn_challenges (challenge, admin_user_id, expires_at) VALUES ($1, $2, $3)',
                [options.challenge, adminId, new Date(Date.now() + 5 * 60 * 1000)]
            );

            res.json(options);
        } finally {
            await client.end();
        }
    } catch (error) {
        console.error('Passkey registration options error:', error);
        res.status(500).json({
            error: 'Failed to generate registration options',
            details: error instanceof Error ? error.message : String(error)
        });
    }
});

router.post('/register-passkey/verify', authenticateToken, async (req: AuthRequest, res: Response) => {
    try {
        const { name: passkeyName, ...webauthnResponse } = req.body;
        const body: RegistrationResponseJSON = webauthnResponse;
        const adminId = req.user?.id;
        if (!adminId) return res.status(401).json({ error: 'Unauthorized' });
        console.log(`[Passkey Verify] Admin ${adminId}, Origin check: ${ORIGIN}, RP_ID: ${RP_ID}`);

        const { client } = await getDb();
        try {
            const challengeResult = await client.query(
                'SELECT challenge FROM webauthn_challenges WHERE admin_user_id = $1 AND expires_at > NOW() ORDER BY expires_at DESC LIMIT 1',
                [adminId]
            );
            const expectedChallenge = challengeResult.rows[0]?.challenge;

            if (!expectedChallenge) {
                return res.status(400).json({ error: 'Challenge missing or expired' });
            }

            const verification = await verifyRegistrationResponse({
                response: body,
                expectedChallenge,
                expectedOrigin: ORIGIN,
                expectedRPID: RP_ID,
            });

            if (verification.verified && verification.registrationInfo) {
                const { credentialPublicKey, credentialID, counter } = verification.registrationInfo;

                await client.query(
                    `INSERT INTO authenticators (
                        credential_id, admin_user_id, credential_public_key, counter, 
                        credential_device_type, credential_backed_up, name
                    ) VALUES ($1, $2, $3, $4, $5, $6, $7)`,
                    [
                        credentialID,
                        adminId,
                        Buffer.from(credentialPublicKey).toString('base64url'),
                        counter,
                        verification.registrationInfo.credentialDeviceType,
                        verification.registrationInfo.credentialBackedUp,
                        passkeyName || 'My Passkey'
                    ]
                );

                await client.query('DELETE FROM webauthn_challenges WHERE admin_user_id = $1', [adminId]);
                await logActivity(adminId, 'REGISTER_PASSKEY', { credentialID });
                res.json({ success: true });
            } else {
                console.error('[Passkey Verify] Verification returned false');
                res.status(400).json({ error: 'Verification failed' });
            }
        } finally {
            await client.end();
        }
    } catch (error) {
        console.error('Passkey verify error:', error);
        res.status(500).json({
            error: 'Failed to verify registration',
            details: error instanceof Error ? error.message : String(error)
        });
    }
});

// --- LOGIN WITH PASSKEY ---

router.post('/login-passkey/options', async (req: Request, res: Response) => {
    try {
        const { username } = req.body;
        if (!username) return res.status(400).json({ error: 'Username required' });

        const { client } = await getDb();
        try {
            const userResult = await client.query('SELECT id, username FROM admin_users WHERE username = $1', [username.trim()]);
            const user = userResult.rows[0];

            if (!user) return res.status(404).json({ error: 'User not found' });

            const authsResult = await client.query('SELECT credential_id FROM authenticators WHERE admin_user_id = $1', [user.id]);
            const allowCredentials = authsResult.rows.map(row => ({
                id: row.credential_id,
                type: 'public-key' as const,
            }));

            if (allowCredentials.length === 0) {
                return res.status(400).json({ error: 'No passkeys registered for this account' });
            }

            const options = await generateAuthenticationOptions({
                rpID: RP_ID,
                allowCredentials,
                userVerification: 'preferred',
            });

            await client.query(
                'INSERT INTO webauthn_challenges (challenge, admin_user_id, expires_at) VALUES ($1, $2, $3)',
                [options.challenge, user.id, new Date(Date.now() + 5 * 60 * 1000)]
            );

            res.json(options);
        } finally {
            await client.end();
        }
    } catch (error) {
        console.error('Passkey login options error:', error);
        res.status(500).json({
            error: 'Failed to generate login options',
            details: error instanceof Error ? error.message : String(error)
        });
    }
});

router.post('/login-passkey/verify', async (req: Request, res: Response) => {
    try {
        const { body, username } = req.body;
        if (!body || !username) return res.status(400).json({ error: 'Body and username required' });

        const { client } = await getDb();
        try {
            const userResult = await client.query('SELECT id, username, name, role FROM admin_users WHERE username = $1', [username.trim()]);
            const user = userResult.rows[0];
            if (!user) return res.status(404).json({ error: 'User not found' });

            const challengeResult = await client.query(
                'SELECT challenge FROM webauthn_challenges WHERE admin_user_id = $1 AND expires_at > NOW() ORDER BY expires_at DESC LIMIT 1',
                [user.id]
            );
            const expectedChallenge = challengeResult.rows[0]?.challenge;

            if (!expectedChallenge) {
                return res.status(400).json({ error: 'Challenge missing or expired' });
            }

            const authResult = await client.query(
                'SELECT * FROM authenticators WHERE credential_id = $1 AND admin_user_id = $2',
                [body.id, user.id]
            );
            const authenticator = authResult.rows[0];

            if (!authenticator) {
                return res.status(400).json({ error: 'Authenticator not found' });
            }

            const verification = await verifyAuthenticationResponse({
                response: body,
                expectedChallenge,
                expectedOrigin: ORIGIN,
                expectedRPID: RP_ID,
                authenticator: {
                    credentialID: (authenticator as any).credential_id,
                    credentialPublicKey: Buffer.from((authenticator as any).credential_public_key, 'base64url'),
                    counter: (authenticator as any).counter,
                },
            });

            if (verification.verified && verification.authenticationInfo) {
                await client.query(
                    'UPDATE authenticators SET counter = $1 WHERE credential_id = $2',
                    [verification.authenticationInfo.newCounter, body.id]
                );

                await client.query('DELETE FROM webauthn_challenges WHERE admin_user_id = $1', [user.id]);

                const secret = process.env.JWT_SECRET || 'fallback-secret';
                const accessToken = jwt.sign({ id: user.id, username: user.username, role: user.role || 'admin' }, secret, { expiresIn: '15m' });
                const refreshToken = jwt.sign({ id: user.id, username: user.username, role: user.role || 'admin' }, process.env.JWT_REFRESH_SECRET || 'fallback-refresh-secret', { expiresIn: '7d' });

                await client.query('UPDATE admin_users SET refresh_token = $1 WHERE id = $2', [refreshToken, user.id]);
                await logActivity(user.id, 'LOGIN_PASSKEY', { device: req.headers['user-agent'] });

                res.json({
                    success: true,
                    accessToken,
                    refreshToken,
                    admin: { username: user.username, name: user.name, role: user.role || 'admin' },
                });
            } else {
                res.status(400).json({ error: 'Authentication failed' });
            }
        } finally {
            await client.end();
        }
    } catch (error) {
        console.error('Passkey login verify error:', error);
        res.status(500).json({ error: 'Failed to verify login' });
    }
});

// --- PASSKEY MANAGEMENT ---

router.get('/passkeys', authenticateToken, async (req: AuthRequest, res: Response) => {
    try {
        const adminId = req.user?.id;
        if (!adminId) return res.status(401).json({ error: 'Unauthorized' });

        const { client } = await getDb();
        try {
            const result = await client.query(
                'SELECT credential_id as id, name, credential_device_type, created_at FROM authenticators WHERE admin_user_id = $1 ORDER BY created_at DESC',
                [adminId]
            );
            res.json({ success: true, passkeys: result.rows });
        } finally {
            await client.end();
        }
    } catch (error) {
        console.error('List passkeys error:', error);
        res.status(500).json({ error: 'Failed to list passkeys' });
    }
});

router.patch('/passkeys/:id', authenticateToken, async (req: AuthRequest, res: Response) => {
    try {
        const adminId = req.user?.id;
        const { id } = req.params;
        const { name } = req.body;
        if (!adminId) return res.status(401).json({ error: 'Unauthorized' });
        if (!name) return res.status(400).json({ error: 'Name is required' });

        const { client } = await getDb();
        try {
            const result = await client.query(
                'UPDATE authenticators SET name = $1 WHERE credential_id = $2 AND admin_user_id = $3',
                [name, id, adminId]
            );
            if (result.rowCount === 0) return res.status(404).json({ error: 'Passkey not found' });
            res.json({ success: true });
        } finally {
            await client.end();
        }
    } catch (error) {
        console.error('Rename passkey error:', error);
        res.status(500).json({ error: 'Failed to rename passkey' });
    }
});

router.delete('/passkeys/:id', authenticateToken, async (req: AuthRequest, res: Response) => {
    try {
        const adminId = req.user?.id;
        const { id } = req.params;
        if (!adminId) return res.status(401).json({ error: 'Unauthorized' });

        const { client } = await getDb();
        try {
            const result = await client.query(
                'DELETE FROM authenticators WHERE credential_id = $1 AND admin_user_id = $2',
                [id, adminId]
            );
            if (result.rowCount === 0) return res.status(404).json({ error: 'Passkey not found' });
            res.json({ success: true });
        } finally {
            await client.end();
        }
    } catch (error) {
        console.error('Delete passkey error:', error);
        res.status(500).json({ error: 'Failed to delete passkey' });
    }
});

export default router;
