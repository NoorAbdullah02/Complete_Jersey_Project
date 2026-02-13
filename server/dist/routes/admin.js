"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const crypto_1 = __importDefault(require("crypto"));
const db_1 = require("../db");
const auth_1 = require("../middleware/auth");
const email_1 = require("../services/email");
const router = (0, express_1.Router)();
// Admin registration
router.post('/register', async (req, res) => {
    try {
        const { username, name, email, password } = req.body;
        if (!username || !email || !password) {
            res.status(400).json({ error: 'Username, email, and password are required' });
            return;
        }
        if (password.length < 6) {
            res.status(400).json({ error: 'Password must be at least 6 characters' });
            return;
        }
        const { db, client } = await (0, db_1.getDb)();
        try {
            // Check if username/email exists
            const existing = await client.query('SELECT id FROM admin_users WHERE username = $1 OR email = $2', [username.trim(), email.trim()]);
            if (existing.rows.length > 0) {
                res.status(409).json({ error: 'Username or email already exists' });
                return;
            }
            const passwordHash = await bcryptjs_1.default.hash(password, 12);
            const verificationToken = crypto_1.default.randomBytes(32).toString('hex');
            const userCount = await client.query('SELECT COUNT(*) FROM admin_users');
            const isFirstUser = parseInt(userCount.rows[0].count) === 0;
            await client.query('INSERT INTO admin_users (username, name, email, password_hash, is_verified, verification_token) VALUES ($1, $2, $3, $4, $5, $6)', [username.trim(), name?.trim() || username, email.trim(), passwordHash, isFirstUser, isFirstUser ? null : verificationToken]);
            if (isFirstUser) {
                res.status(201).json({
                    success: true,
                    message: 'Admin account created and auto-verified! You can login now.',
                });
                return;
            }
            // Send verification email
            const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';
            const verifyUrl = `${clientUrl}/admin/verify-email/${verificationToken}`;
            await (0, email_1.sendEmail)(email.trim(), 'Verify Your Admin Account - ICE Jersey', (0, email_1.adminVerificationHtml)(name || username, verifyUrl), `Verify your email: ${verifyUrl}`);
            res.status(201).json({
                success: true,
                message: 'Registration successful. Please check your email to verify your account.',
            });
        }
        finally {
            await client.end();
        }
    }
    catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ error: 'Registration failed' });
    }
});
// Admin login
router.post('/login', async (req, res) => {
    try {
        const { username, password } = req.body;
        if (!username || !password) {
            res.status(400).json({ error: 'Username and password required' });
            return;
        }
        const { db, client } = await (0, db_1.getDb)();
        try {
            const result = await client.query('SELECT * FROM admin_users WHERE username = $1', [username.trim()]);
            const user = result.rows[0];
            if (!user) {
                console.log(`Login Failed: User ${username} not found.`);
                res.status(401).json({ error: 'Invalid credentials' });
                return;
            }
            const isMatch = await bcryptjs_1.default.compare(password, user.password_hash);
            console.log(`Login attempt for ${username}: Password Match = ${isMatch}`);
            if (!isMatch) {
                res.status(401).json({ error: 'Invalid credentials' });
                return;
            }
            if (!user.is_verified) {
                console.log(`Login Failed: User ${username} is not verified.`);
                res.status(403).json({ error: 'Please verify your email before logging in.' });
                return;
            }
            const secret = process.env.JWT_SECRET || 'fallback-secret';
            console.log(`Logging in ${username}. Using JWT_SECRET (5 chars): ${secret.substring(0, 5)}`);
            const accessToken = jsonwebtoken_1.default.sign({ id: user.id, username: user.username }, secret, { expiresIn: '15m' });
            const refreshToken = jsonwebtoken_1.default.sign({ id: user.id, username: user.username }, process.env.JWT_REFRESH_SECRET || 'fallback-refresh-secret', { expiresIn: '7d' });
            // Store refresh token in DB
            await client.query('UPDATE admin_users SET refresh_token = $1 WHERE id = $2', [refreshToken, user.id]);
            res.json({
                success: true,
                accessToken,
                refreshToken,
                admin: { username: user.username, name: user.name },
            });
        }
        finally {
            await client.end();
        }
    }
    catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Login failed' });
    }
});
// Verify token
router.get('/verify', auth_1.authenticateToken, (req, res) => {
    res.json({
        success: true,
        admin: { username: req.user?.username },
    });
});
// Refresh token
router.post('/refresh', async (req, res) => {
    try {
        const { refreshToken } = req.body;
        if (!refreshToken) {
            res.status(401).json({ error: 'Refresh token required' });
            return;
        }
        const { db, client } = await (0, db_1.getDb)();
        try {
            const result = await client.query('SELECT * FROM admin_users WHERE refresh_token = $1', [refreshToken]);
            const user = result.rows[0];
            if (!user) {
                res.status(403).json({ error: 'Invalid refresh token' });
                return;
            }
            try {
                jsonwebtoken_1.default.verify(refreshToken, process.env.JWT_REFRESH_SECRET || 'fallback-refresh-secret');
                const accessToken = jsonwebtoken_1.default.sign({ id: user.id, username: user.username }, process.env.JWT_SECRET || 'fallback-secret', { expiresIn: '15m' });
                res.json({ success: true, accessToken });
            }
            catch (err) {
                // Token is invalid/expired, clear it from DB
                await client.query('UPDATE admin_users SET refresh_token = null WHERE id = $1', [user.id]);
                res.status(403).json({ error: 'Expired or invalid refresh token' });
            }
        }
        finally {
            await client.end();
        }
    }
    catch (error) {
        console.error('Refresh error:', error);
        res.status(500).json({ error: 'Refresh failed' });
    }
});
// Logout
router.post('/logout', async (req, res) => {
    try {
        const { refreshToken } = req.body;
        if (!refreshToken) {
            res.status(400).json({ error: 'Refresh token required for logout' });
            return;
        }
        const { db, client } = await (0, db_1.getDb)();
        try {
            await client.query('UPDATE admin_users SET refresh_token = null WHERE refresh_token = $1', [refreshToken]);
            res.json({ success: true, message: 'Logged out successfully' });
        }
        finally {
            await client.end();
        }
    }
    catch (error) {
        console.error('Logout error:', error);
        res.status(500).json({ error: 'Logout failed' });
    }
});
// Verify email
router.get('/verify-email/:token', async (req, res) => {
    try {
        const { token } = req.params;
        const { db, client } = await (0, db_1.getDb)();
        try {
            const result = await client.query('UPDATE admin_users SET is_verified = true, verification_token = null WHERE verification_token = $1 RETURNING username', [token]);
            if (result.rows.length === 0) {
                res.status(400).json({ error: 'Invalid or expired verification token' });
                return;
            }
            res.json({ success: true, message: `Email verified for ${result.rows[0].username}` });
        }
        finally {
            await client.end();
        }
    }
    catch (error) {
        console.error('Verification error:', error);
        res.status(500).json({ error: 'Verification failed' });
    }
});
// Resend verification email
router.post('/resend-verification', async (req, res) => {
    try {
        const { email } = req.body;
        if (!email) {
            res.status(400).json({ error: 'Email is required' });
            return;
        }
        const { db, client } = await (0, db_1.getDb)();
        try {
            const result = await client.query('SELECT id, username, name, is_verified FROM admin_users WHERE email = $1', [email.trim()]);
            if (result.rows.length === 0) {
                res.status(404).json({ error: 'No admin account found with this email' });
                return;
            }
            const user = result.rows[0];
            if (user.is_verified) {
                res.status(400).json({ error: 'Account is already verified' });
                return;
            }
            const verificationToken = crypto_1.default.randomBytes(32).toString('hex');
            await client.query('UPDATE admin_users SET verification_token = $1 WHERE id = $2', [verificationToken, user.id]);
            const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';
            const verifyUrl = `${clientUrl}/admin/verify-email/${verificationToken}`;
            await (0, email_1.sendEmail)(email.trim(), 'Verify Your Admin Account - ICE Jersey', (0, email_1.adminVerificationHtml)(user.name || user.username, verifyUrl), `Verify your email: ${verifyUrl}`);
            res.json({ success: true, message: 'Verification email resent successfully' });
        }
        finally {
            await client.end();
        }
    }
    catch (error) {
        console.error('Resend verification error:', error);
        res.status(500).json({ error: 'Failed to resend verification email' });
    }
});
exports.default = router;
//# sourceMappingURL=admin.js.map