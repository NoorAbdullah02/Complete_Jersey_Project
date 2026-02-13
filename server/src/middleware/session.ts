import { Response, NextFunction } from 'express';
import { AuthRequest } from './auth';
import { getDb } from '../db';
import crypto from 'crypto';

export const trackSession = async (req: AuthRequest, res: Response, next: NextFunction) => {
    // This middleware should be called after a successful login or periodically
    if (req.user) {
        try {
            const { client } = await getDb();
            try {
                const ip = req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress;
                const userAgent = req.headers['user-agent'] || 'unknown';

                // Create a unique session ID if not exists or just log the event
                const sessionId = crypto.createHash('md5').update(`${req.user.id}-${userAgent}-${ip}`).digest('hex');

                await client.query(`
                    INSERT INTO sessions (id, admin_user_id, device_info, ip_address, last_used)
                    VALUES ($1, $2, $3, $4, NOW())
                    ON CONFLICT (id) DO UPDATE SET last_used = NOW()
                `, [sessionId, req.user.id, userAgent, ip]);
            } finally {
                await client.end();
            }
        } catch (error) {
            console.error('Session tracking error:', error);
        }
    }
    next();
};
