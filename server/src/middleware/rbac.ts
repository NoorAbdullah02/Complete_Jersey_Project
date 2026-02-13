import { Response, NextFunction } from 'express';
import { AuthRequest } from './auth';

export type UserRole = 'admin' | 'manager' | 'support';

/**
 * Middleware to restrict access based on user roles
 * @param allowedRoles Array of roles that are allowed to access the route
 */
export const authorize = (allowedRoles: UserRole[]) => {
    return (req: AuthRequest, res: Response, next: NextFunction) => {
        const user = req.user;

        if (!user) {
            return res.status(401).json({ error: 'Unauthorized: User not authenticated' });
        }

        // Check if the user's role is in the allowedRoles array
        // req.user is populated by authenticateToken, we expect 'role' to be in the JWT payload
        if (!user.role || !allowedRoles.includes(user.role as UserRole)) {
            return res.status(403).json({
                error: 'Forbidden: You do not have the required permissions to access this resource',
                requiredRoles: allowedRoles,
                currentRole: user.role
            });
        }

        next();
    };
};
