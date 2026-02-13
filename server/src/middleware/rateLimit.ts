import { Request, Response, NextFunction } from 'express';
import redis from '../utils/cache';

export const redisRateLimit = (limit: number, windowSeconds: number) => {
    return async (req: Request, res: Response, next: NextFunction) => {
        if (!redis) return next();
        try {
            const ip = req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress;
            const key = `rate_limit:${req.path}:${ip}`;

            const current = await redis.incr(key);

            if (current === 1) {
                await redis.expire(key, windowSeconds);
            }

            if (current > limit) {
                return res.status(429).json({
                    error: 'Too many requests',
                    message: `Rate limit exceeded. Please try again in a few moments.`,
                    retryAfter: await redis.ttl(key)
                });
            }

            next();
        } catch (error) {
            console.error('Redis Rate Limit Error:', error);
            next();
        }
    };
};
