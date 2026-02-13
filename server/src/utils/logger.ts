import { getDb } from '../db';
import { auditLogs } from '../db/schema';

export const logActivity = async (userId: number | null, action: string, metadata: any = {}) => {
    try {
        const { db, client } = await getDb();
        try {
            await client.query(
                'INSERT INTO audit_logs (user_id, action, metadata) VALUES ($1, $2, $3)',
                [userId, action, JSON.stringify(metadata)]
            );
        } finally {
            await client.end();
        }
    } catch (error) {
        console.error('Failed to log activity:', error);
    }
};
