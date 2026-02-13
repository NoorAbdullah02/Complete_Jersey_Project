import { Request, Response, NextFunction } from 'express';

/**
 * Modern CSRF protection for SPAs.
 * Since SPAs use Fetch/Axios, they can't be targeted by simple form-based CSRF
 * if we require a custom header (e.g., X-Requested-With) that browsers don't 
 * send automatically on cross-origin requests.
 */
export const csrfProtection = (req: Request, res: Response, next: NextFunction) => {
    // Skip GET, HEAD, OPTIONS requests
    if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
        return next();
    }

    // Bypass for public routes that don't require an existing session
    const publicRoutes = [
        '/api/admin/login',
        '/api/admin/register',
        '/api/admin/refresh',
        '/api/auth/login-passkey',
        '/api/auth/register-passkey',
        '/api/orders',
    ];
    if (publicRoutes.some(route => req.path.startsWith(route))) {
        return next();
    }

    // Require a custom header and check it
    const customHeader = req.headers['x-requested-with'] || req.headers['x-csrf-token'];

    if (!customHeader) {
        console.warn(`[CSRF] Blocked ${req.method} ${req.path} - Missing custom header`);
        return res.status(403).json({
            error: 'Security Check Failed: CSRF Protection Active',
            message: 'All state-changing requests (POST, PATCH, DELETE) must include a custom header.'
        });
    }

    next();
};
