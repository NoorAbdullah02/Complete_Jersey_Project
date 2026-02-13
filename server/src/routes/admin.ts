import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { getDb } from '../db';
import { authenticateToken, AuthRequest } from '../middleware/auth';
import { sendEmail, adminVerificationHtml } from '../services/email';
import { validate } from '../middleware/validate';
import { adminLoginSchema, adminRegisterSchema } from '../schemas';
import { authorize } from '../middleware/rbac';
import { logActivity } from '../utils/logger';

const router = Router();

// Startup check for safety
if (!process.env.JWT_SECRET || !process.env.JWT_REFRESH_SECRET) {
    console.warn('⚠️ WARNING: JWT_SECRET or JWT_REFRESH_SECRET is missing! Token management may be unstable.');
}

// Admin registration - Restricted to existing admins (except for the first user)
router.post('/register', validate(adminRegisterSchema), async (req: Request, res: Response) => {
    try {
        const { username, name, email, password, role } = req.body;
        const currentAdminId = (req as AuthRequest).user?.id || null;

        const { client } = await getDb();
        try {
            // Check if this is the first user
            const userCount = await client.query('SELECT COUNT(*) FROM admin_users');
            const isFirstUser = parseInt(userCount.rows[0].count) === 0;

            // If not the first user, require authentication and 'admin' role
            if (!isFirstUser) {
                // We manually handle this here because we want to allow the first user without auth
                const authHeader = req.headers['authorization'];
                const token = authHeader && authHeader.split(' ')[1];
                if (!token) return res.status(401).json({ error: 'Auth required for registration' });

                try {
                    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret') as any;
                    if (decoded.role !== 'admin') return res.status(403).json({ error: 'Only admins can register others' });
                    // Continue...
                } catch (e) {
                    return res.status(401).json({ error: 'Invalid token' });
                }
            }

            // Check if username/email exists
            const existing = await client.query(
                'SELECT id FROM admin_users WHERE username = $1 OR email = $2',
                [username.trim(), email.trim()]
            );

            if (existing.rows.length > 0) {
                return res.status(409).json({ error: 'Username or email already exists' });
            }

            const passwordHash = await bcrypt.hash(password, 12);
            const verificationToken = crypto.randomBytes(32).toString('hex');

            await client.query(
                'INSERT INTO admin_users (username, name, email, password_hash, is_verified, verification_token, role) VALUES ($1, $2, $3, $4, $5, $6, $7)',
                [username.trim(), name?.trim() || username, email.trim(), passwordHash, isFirstUser, isFirstUser ? null : verificationToken, role || (isFirstUser ? 'admin' : 'support')]
            );

            await logActivity(currentAdminId, 'REGISTER_ADMIN', { targetUser: username, role: role || 'support' });

            if (isFirstUser) {
                return res.status(201).json({
                    success: true,
                    message: 'First admin account created and auto-verified! You can login now.',
                });
            }

            // Send verification email
            const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';
            const verifyUrl = `${clientUrl}/admin/verify-email/${verificationToken}`;
            await sendEmail(
                email.trim(),
                'Verify Your Admin Account - ICE Jersey',
                adminVerificationHtml(name || username, verifyUrl),
                `Verify your email: ${verifyUrl}`
            );

            res.status(201).json({
                success: true,
                message: 'Registration successful. Please check your email to verify your account.',
            });
        } finally {
            await client.end();
        }
    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ error: 'Registration failed' });
    }
});

// Admin login
router.post('/login', validate(adminLoginSchema), async (req: Request, res: Response) => {
    try {
        console.log('[Login Attempt] Body:', { ...req.body, password: '***' });
        const { username, password } = req.body;

        const { client } = await getDb();
        try {
            const result = await client.query('SELECT * FROM admin_users WHERE username = $1', [username.trim()]);
            const user = result.rows[0];

            if (!user) {
                return res.status(401).json({ error: 'Invalid credentials' });
            }

            const isMatch = await bcrypt.compare(password, user.password_hash);
            if (!isMatch) {
                return res.status(401).json({ error: 'Invalid credentials' });
            }

            if (!user.is_verified) {
                return res.status(403).json({ error: 'Please verify your email before logging in.' });
            }

            const secret = process.env.JWT_SECRET || 'fallback-secret';
            const accessToken = jwt.sign(
                { id: user.id, username: user.username, role: user.role || 'admin' },
                secret,
                { expiresIn: '15m' }
            );

            const refreshToken = jwt.sign(
                { id: user.id, username: user.username, role: user.role || 'admin' },
                process.env.JWT_REFRESH_SECRET || 'fallback-refresh-secret',
                { expiresIn: '7d' }
            );

            await client.query('UPDATE admin_users SET refresh_token = $1 WHERE id = $2', [refreshToken, user.id]);
            await logActivity(user.id, 'LOGIN_BASIC', { device: req.headers['user-agent'] });

            // Track session for device history
            const ip = req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress;
            const userAgent = req.headers['user-agent'] || 'unknown';
            const sessionId = crypto.createHash('md5').update(`${user.id}-${userAgent}-${ip}`).digest('hex');
            await client.query(`
                INSERT INTO sessions (id, admin_user_id, device_info, ip_address, last_used)
                VALUES ($1, $2, $3, $4, NOW())
                ON CONFLICT (id) DO UPDATE SET last_used = NOW()
            `, [sessionId, user.id, userAgent, ip]);

            res.json({
                success: true,
                accessToken,
                refreshToken,
                admin: { username: user.username, name: user.name, role: user.role },
            });
        } finally {
            await client.end();
        }
    } catch (error) {

        console.error('Login error details:', error);
        if (error instanceof Error) console.error(error.stack);
        res.status(500).json({ error: 'Login failed', details: error instanceof Error ? error.message : String(error) });
    }
});

// Verify Email
router.get('/verify-email/:token', async (req: Request, res: Response) => {
    try {
        const { token } = req.params;
        const { client } = await getDb();
        try {
            const result = await client.query('SELECT id FROM admin_users WHERE verification_token = $1', [token]);
            if (result.rows.length === 0) {
                return res.status(400).json({ error: 'Invalid or expired verification token' });
            }

            await client.query('UPDATE admin_users SET is_verified = true, verification_token = null WHERE id = $1', [result.rows[0].id]);
            res.json({ success: true, message: 'Email verified successfully! You can now login.' });
        } finally {
            await client.end();
        }
    } catch (error) {
        console.error('Email verification error:', error);
        res.status(500).json({ error: 'Verification failed' });
    }
});

// Refresh Token
router.post('/refresh', async (req: Request, res: Response) => {
    try {
        const { refreshToken } = req.body;
        if (!refreshToken) return res.status(401).json({ error: 'Refresh token required' });

        const { client } = await getDb();
        try {
            const result = await client.query('SELECT * FROM admin_users WHERE refresh_token = $1', [refreshToken]);
            const user = result.rows[0];

            if (!user) return res.status(403).json({ error: 'Invalid refresh token' });

            try {
                jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET || 'fallback-refresh-secret');

                const accessToken = jwt.sign(
                    { id: user.id, username: user.username, role: user.role || 'admin' },
                    process.env.JWT_SECRET || 'fallback-secret',
                    { expiresIn: '15m' }
                );

                res.json({ success: true, accessToken });
            } catch (err) {
                await client.query('UPDATE admin_users SET refresh_token = null WHERE id = $1', [user.id]);
                res.status(403).json({ error: 'Expired or invalid refresh token' });
            }
        } finally {
            await client.end();
        }
    } catch (error) {
        console.error('Refresh error:', error);
        res.status(500).json({ error: 'Refresh failed' });
    }
});

// Logout
router.post('/logout', authenticateToken, async (req: AuthRequest, res: Response) => {
    try {
        const { client } = await getDb();
        try {
            await client.query('UPDATE admin_users SET refresh_token = null WHERE id = $1', [req.user?.id]);
            await logActivity(req.user?.id || null, 'LOGOUT');
            res.json({ success: true, message: 'Logged out successfully' });
        } finally {
            await client.end();
        }
    } catch (error) {
        console.error('Logout error:', error);
        res.status(500).json({ error: 'Logout failed' });
    }
});

export default router;
