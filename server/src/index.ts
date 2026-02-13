import dotenv from 'dotenv';
import path from 'path';
dotenv.config();

import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import fs from 'fs';
import { initDb } from './db/index';
import { csrfProtection } from './middleware/csrf';

// Routes
import orderRoutes from './routes/orders';
import adminRoutes from './routes/admin';
import adminOrderRoutes from './routes/adminOrders';
import expenseRoutes from './routes/expenses';
import reportRoutes from './routes/reports';
import authRoutes from './routes/auth';
import inventoryRoutes from './routes/inventory';

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
    cors: {
        origin: process.env.ORIGIN || 'http://localhost:5173',
        methods: ['GET', 'POST'],
    }
});

// Debug environment loading
console.log('--- Environment Check ---');
console.log('PORT:', process.env.PORT || '3000 (default)');
console.log('JWT_SECRET:', process.env.JWT_SECRET ? 'LOADED (Safe)' : 'MISSING (Critical!)');
console.log('NODE_ENV:', process.env.NODE_ENV || 'development');
console.log('------------------------');

// Enable trust proxy for production
if (process.env.TRUST_PROXY === 'true' || process.env.NODE_ENV === 'production') {
    app.set('trust proxy', true);
}
const PORT = process.env.PORT || 3000;

// Security middleware
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            scriptSrc: ["'self'", "'unsafe-inline'", "https://cdn.tailwindcss.com", "https://cdnjs.cloudflare.com"],
            styleSrc: ["'self'", "'unsafe-inline'", "https://cdn.tailwindcss.com", "https://cdnjs.cloudflare.com", "https://fonts.googleapis.com"],
            fontSrc: ["'self'", "data:", "https://cdnjs.cloudflare.com", "https://fonts.gstatic.com"],
            imgSrc: ["'self'", "data:", "https:"],
            connectSrc: ["'self'", "http://localhost:*", "ws://localhost:*"],
        },
    },
}));

// Rate limiters
const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
});

// Basic middleware
app.use(cors());
app.use((req, res, next) => {
    console.log(`[REQ] ${req.method} ${req.url}`);
    next();
});
app.use(express.json({ limit: '10mb' }));
app.use(csrfProtection); // Apply CSRF protection
app.use(express.static(path.join(__dirname, '..', 'public')));

// SPA fallback
const clientDist = path.resolve(process.cwd(), '..', 'client', 'dist');
if (fs.existsSync(clientDist)) {
    app.use(express.static(clientDist));
}

// WebSocket Logic
io.on('connection', (socket) => {
    console.log(`📡 New WebSocket connection: ${socket.id}`);

    socket.on('join-order-tracking', (orderId) => {
        socket.join(`order-${orderId}`);
        console.log(`📦 User joined tracking for order: ${orderId}`);
    });

    socket.on('disconnect', () => {
        console.log(`🔌 WebSocket disconnected: ${socket.id}`);
    });
});

// Global export of IO for use in routes
app.set('io', io);

// Health check
app.get('/api/health', (req, res) => {
    res.json({
        status: 'OK',
        timestamp: new Date().toISOString(),
        version: '3.0.0-PROD',
    });
});

// Mount routes
app.use('/api/auth', authRoutes);
app.use('/api/orders', apiLimiter, orderRoutes);
app.use('/api/admin', apiLimiter, adminRoutes);
app.use('/api/admin', adminOrderRoutes);
app.use('/api/admin/expenses', expenseRoutes);
app.use('/api/admin/reports', reportRoutes);
app.use('/api/admin/inventory', inventoryRoutes);

// SPA fallback / 404 handler
app.use('*', (req, res) => {
    const clientDist = path.resolve(process.cwd(), '..', 'client', 'dist');
    if (req.method === 'GET' && !req.path.startsWith('/api') && fs.existsSync(clientDist)) {
        return res.sendFile(path.join(clientDist, 'index.html'));
    }
    return res.status(404).json({ error: 'Route not found' });
});

// Global error handler
app.use((error: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
    console.error('Global error:', error);
    if (error instanceof Error) {
        console.error('Stack:', error.stack);
    }
    const statusCode = error.status || error.statusCode || 500;
    res.status(statusCode).json({ error: statusCode === 500 ? 'Internal server error' : error.message, details: error.message });
});

// Start server
const startServer = async () => {
    try {
        if (!process.env.DATABASE_URL) {
            throw new Error('DATABASE_URL environment variable is required');
        }
        await initDb();
        httpServer.listen(PORT, () => {
            console.log(`\n🚀 ICE JERSEY PRODUCTION SERVER STARTED!`);
            console.log(`📍 URL: http://localhost:${PORT}`);
            console.log(`🔒 Security: Helmet + CSRF + Rate Limiting enabled`);
            console.log(`📡 Real-time: Socket.io backend active\n`);
        });
    } catch (error) {
        console.error('Failed to start server:', error);
        process.exit(1);
    }
};

startServer();
