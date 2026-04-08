import path from 'path';
import dotenv from 'dotenv';
import fs from 'fs';

// Try multiple possible locations for .env file to handle both dev and production
const envPaths = [
    path.join(__dirname, '..', '.env'),               // src/.. = server root (dev)
    path.join(__dirname, '..', '..', '.env'),         // dist/src/.. (production)
    path.join(process.cwd(), '.env'),                 // current working directory
    path.join(process.cwd(), 'server', '.env'),       // server subfolder
];

let envLoaded = false;
for (const envPath of envPaths) {
    if (fs.existsSync(envPath)) {
        const result = dotenv.config({ path: envPath });
        if (result.parsed) {
            console.log(`✅ Environment loaded from: ${envPath}`);
            envLoaded = true;
            break;
        }
    }
}

if (!envLoaded) {
    console.warn('⚠️ No .env file found in standard locations. Relying on process.env variables.');
}

import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
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
import userAuthRoutes from './routes/userAuth';

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
    cors: {
        origin: process.env.ORIGIN || 'http://localhost:5173',
        methods: ['GET', 'POST'],
    }
});

console.log('--- Environment Check ---');
console.log('PORT:', process.env.PORT || '3000 (default)');
console.log('JWT_SECRET:', process.env.JWT_SECRET ? 'LOADED (Safe)' : 'MISSING (Critical!)');
console.log('NODE_ENV:', process.env.NODE_ENV || 'development');
console.log('------------------------');

if (process.env.TRUST_PROXY === 'true') {
    app.set('trust proxy', 1);
} else {
    app.set('trust proxy', false);
}
const PORT = process.env.PORT || 3000;

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

const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    validate: { trustProxy: false }, // Disable trust proxy validation to avoid ERR_ERL_PERMISSIVE_TRUST_PROXY
});

app.use(cors());
app.use((req, res, next) => {
    console.log(`[REQ] ${req.method} ${req.url}`);
    next();
});
app.use(express.json({ limit: '10mb' }));
app.use(csrfProtection); // Apply CSRF protection
app.use(express.static(path.join(__dirname, '..', 'public')));

const clientDist = path.resolve(process.cwd(), '..', 'client', 'dist');
if (fs.existsSync(clientDist)) {
    app.use(express.static(clientDist));
}

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

app.set('io', io);

app.get('/api/health', (req, res) => {
    res.json({
        status: 'OK',
        timestamp: new Date().toISOString(),
        version: '3.0.0-PROD',
    });
});

app.use('/api/auth', authRoutes);
app.use('/api/user-auth', userAuthRoutes);
app.use('/api/orders', apiLimiter, orderRoutes);
app.use('/api/admin', apiLimiter, adminRoutes);
app.use('/api/admin', adminOrderRoutes);
app.use('/api/admin/expenses', expenseRoutes);
app.use('/api/admin/reports', reportRoutes);
app.use('/api/admin/inventory', inventoryRoutes);

app.use('*', (req, res) => {
    const clientDist = path.resolve(process.cwd(), '..', 'client', 'dist');
    if (req.method === 'GET' && !req.path.startsWith('/api') && fs.existsSync(clientDist)) {
        return res.sendFile(path.join(clientDist, 'index.html'));
    }
    return res.status(404).json({ error: 'Route not found' });
});

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
        if (!process.env.JWT_SECRET) {
            throw new Error('JWT_SECRET environment variable is required');
        }

        await initDb();

        // Listen on 0.0.0.0 for production deployment compatibility (Render, Railway, etc.)
        const HOST = process.env.NODE_ENV === 'production' ? '0.0.0.0' : 'localhost';

        httpServer.listen({
            port: PORT,
            host: HOST
        }, () => {
            console.log(`\n🚀 ICE JERSEY PRODUCTION SERVER STARTED!`);
            console.log(`📍 Listening on ${HOST}:${PORT}`);
            console.log(`🔒 Security: Helmet + CSRF + Rate Limiting enabled`);
            console.log(`📡 Real-time: Socket.io backend active\n`);
        });

        // Graceful shutdown
        process.on('SIGTERM', () => {
            console.log('SIGTERM received, shutting down gracefully...');
            httpServer.close(() => {
                console.log('Server closed');
                process.exit(0);
            });
        });
    } catch (error) {
        console.error('Failed to start server:', error);
        process.exit(1);
    }
};

startServer();
