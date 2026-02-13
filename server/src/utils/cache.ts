import Redis from 'ioredis';

const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
let redis: Redis | null = null;

try {
    redis = new Redis(redisUrl, {
        maxRetriesPerRequest: 1,
        retryStrategy: (times) => {
            if (times > 3) return null; // stop retrying after 3 times
            return Math.min(times * 50, 2000);
        }
    });

    redis.on('error', (err) => {
        console.warn('⚠️ Redis Connection Error. Caching will be bypassed.');
    });
} catch (e) {
    console.warn('⚠️ Redis not available. Caching will be bypassed.');
}

export const cacheSet = async (key: string, value: any, ttlSeconds: number = 3600) => {
    if (!redis) return;
    try {
        await redis.set(key, JSON.stringify(value), 'EX', ttlSeconds);
    } catch (e) {
        console.error('Cache set error:', e);
    }
};

export const cacheGet = async <T>(key: string): Promise<T | null> => {
    if (!redis) return null;
    try {
        const data = await redis.get(key);
        return data ? JSON.parse(data) : null;
    } catch (e) {
        console.error('Cache get error:', e);
        return null;
    }
};

export const cacheDelete = async (key: string) => {
    if (!redis) return;
    try {
        await redis.del(key);
    } catch (e) {
        console.error('Cache delete error:', e);
    }
};

export default redis;
