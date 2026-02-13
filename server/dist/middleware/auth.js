"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authenticateToken = authenticateToken;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (!token) {
        res.status(401).json({ error: 'Access token required' });
        return;
    }
    try {
        const secret = process.env.JWT_SECRET || 'fallback-secret';
        const decoded = jsonwebtoken_1.default.verify(token, secret);
        req.user = decoded;
        next();
    }
    catch (err) {
        console.error('Auth Middleware Error:', err.message);
        if (err.name === 'JsonWebTokenError') {
            console.error('DEBUG: Token verification failed. Check JWT_SECRET consistency.');
            console.error('DEBUG: Current JWT_SECRET (first 5 chars):', (process.env.JWT_SECRET || 'fallback-secret').substring(0, 5));
        }
        res.status(403).json({ error: 'Invalid token' });
    }
}
//# sourceMappingURL=auth.js.map