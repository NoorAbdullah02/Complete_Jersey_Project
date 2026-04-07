import { Router, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { getDb } from '../db';
import { userOtps, users, orders } from '../db/schema';
import { eq, and, gt, desc } from 'drizzle-orm';
import { sendEmail } from '../services/email';

const router = Router();

// Helper to generate 6-digit OTP
const generateOTP = () => Math.floor(100000 + Math.random() * 900000).toString();

// Generate tokens for a user
const generateTokens = (user: { id: number; email: string }) => {
    const secret = process.env.JWT_SECRET || 'fallback-secret';
    const refreshSecret = process.env.JWT_REFRESH_SECRET || 'fallback-refresh-secret';

    const accessToken = jwt.sign(
        { id: user.id, email: user.email, role: 'user' },
        secret,
        { expiresIn: '15m' }
    );

    const refreshToken = jwt.sign(
        { id: user.id, email: user.email, role: 'user' },
        refreshSecret,
        { expiresIn: '7d' }
    );

    return { accessToken, refreshToken };
};

// Helper for OTP Email HTML
const otpEmailHtml = (otp: string) => `
    <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 12px; padding: 24px; background: #ffffff;">
        <h2 style="color: #1e293b; margin-top: 0;">Verification Code</h2>
        <p style="color: #475569; font-size: 16px;">Use the code below to access your order modification portal. This code expires in 10 minutes.</p>
        <div style="background: #f1f5f9; padding: 16px; border-radius: 8px; text-align: center; margin: 24px 0;">
            <span style="font-size: 32px; font-weight: 700; letter-spacing: 4px; color: #3b82f6;">${otp}</span>
        </div>
        <p style="color: #94a3b8; font-size: 14px; margin-bottom: 0;">If you didn't request this code, please ignore this email.</p>
    </div>
`;

// 1. Request OTP
router.post('/request-otp', async (req: Request, res: Response) => {
    const { email: rawEmail, orderId } = req.body;
    const email = rawEmail?.toLowerCase().trim();

    if (!email || !orderId) {
        return res.status(400).json({ error: 'Email and order ID are required' });
    }

    try {
        const { db, client } = await getDb();
        try {
            // Verify order exists and matches email
            const orderRecord = await db.select()
                .from(orders)
                .where(and(eq(orders.id, parseInt(orderId)), eq(orders.email, email)))
                .limit(1);

            if (orderRecord.length === 0) {
                return res.status(404).json({ error: 'No matching order found for this email and ID.' });
            }

            // Generate OTP
            const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
            const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 mins

            await db.insert(userOtps).values({
                email,
                otp: otpCode,
                expiresAt,
            });

            // Send Email
            const emailHtml = otpEmailHtml(otpCode);
            await sendEmail(email, 'Your ICE Jersey Verification Code', emailHtml, `Your code is ${otpCode}`);

            res.json({ success: true, message: 'OTP sent to email.' });
        } finally {
            await client.end();
        }
    } catch (error) {
        console.error('Request OTP Error:', error);
        res.status(500).json({ error: 'Failed to send verification code.' });
    }
});

// 2. Verify OTP
router.post('/verify-otp', async (req: Request, res: Response) => {
    const { email: rawEmail, otp } = req.body;
    const email = rawEmail?.toLowerCase().trim();

    if (!email || !otp) {
        return res.status(400).json({ error: 'Email and OTP are required' });
    }

    try {
        const { db, client } = await getDb();
        try {
            // Get latest valid OTP
            const otpRecord = await db.select()
                .from(userOtps)
                .where(and(eq(userOtps.email, email), eq(userOtps.otp, otp), gt(userOtps.expiresAt, new Date())))
                .orderBy(desc(userOtps.createdAt))
                .limit(1);

            if (otpRecord.length === 0) {
                return res.status(400).json({ error: 'Invalid or expired OTP' });
            }

            // Find or create user
            let userRecord = await db.select()
                .from(users)
                .where(eq(users.email, email))
                .limit(1);

            let user;
            if (userRecord.length === 0) {
                const newUser = await db.insert(users).values({
                    email,
                    isVerified: true,
                }).returning();
                user = newUser[0];
            } else {
                user = userRecord[0];
            }

            const { accessToken, refreshToken } = generateTokens({ id: user.id, email: user.email });

            // Update user with refresh token
            await db.update(users)
                .set({ refreshToken })
                .where(eq(users.id, user.id));

            // Delete used/expired OTPs for this email
            await db.delete(userOtps).where(eq(userOtps.email, email));

            res.json({ accessToken, refreshToken, user: { email: user.email } });
        } finally {
            await client.end();
        }
    } catch (error) {
        console.error('Verify OTP Error:', error);
        res.status(500).json({ error: 'Verification failed' });
    }
});

// 3. Refresh Token
router.post('/refresh', async (req: Request, res: Response) => {
    const { refreshToken } = req.body;

    if (!refreshToken) {
        return res.status(401).json({ error: 'Refresh token required' });
    }

    try {
        const { db, client } = await getDb();
        try {
            const refreshSecret = process.env.JWT_REFRESH_SECRET || 'fallback-refresh-secret';

            const decoded = jwt.verify(refreshToken, refreshSecret) as { id: number; email: string };

            const userResult = await db.select()
                .from(users)
                .where(and(eq(users.id, decoded.id), eq(users.refreshToken, refreshToken)))
                .limit(1);

            if (userResult.length === 0) {
                return res.status(403).json({ error: 'Invalid refresh token' });
            }

            const tokens = generateTokens({ id: decoded.id, email: decoded.email });

            // Update refresh token
            await db.update(users)
                .set({ refreshToken: tokens.refreshToken })
                .where(eq(users.id, decoded.id));

            res.json({ accessToken: tokens.accessToken, refreshToken: tokens.refreshToken });
        } finally {
            await client.end();
        }
    } catch (error) {
        console.error('Refresh Token Error:', error);
        res.status(403).json({ error: 'Invalid or expired refresh token' });
    }
});

export default router;
