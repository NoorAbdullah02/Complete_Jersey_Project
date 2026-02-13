import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

export interface AuthRequest extends Request {
    user?: { id: number; username: string };
}

export function authenticateToken(req: AuthRequest, res: Response, next: NextFunction): void {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        res.status(401).json({ error: 'Access token required' });
        return;
    }

    try {
        const secret = process.env.JWT_SECRET || 'fallback-secret';
        const decoded = jwt.verify(token, secret) as {
            id: number;
            username: string;
        };
        req.user = decoded;
        next();
    } catch (err: any) {
        console.error('Auth Middleware Error:', err.message);
        if (err.name === 'JsonWebTokenError') {
            console.error('DEBUG: Token verification failed. Check JWT_SECRET consistency.');
            console.error('DEBUG: Current JWT_SECRET (first 5 chars):', (process.env.JWT_SECRET || 'fallback-secret').substring(0, 5));
        }
        res.status(403).json({ error: 'Invalid token' });
    }
}
