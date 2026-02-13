import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import path from 'path';
import fs from 'fs';
import { initDb } from './db/index';

// Routes
import orderRoutes from './routes/orders';
import adminRoutes from './routes/admin';
import adminOrderRoutes from './routes/adminOrders';
import expenseRoutes from './routes/expenses';
import reportRoutes from './routes/reports';

const app = express();
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
            connectSrc: ["'self'", "http://localhost:*"],
        },
    },
}));

// Rate limiters
const orderLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 10,
    message: 'Too many order submissions, please try again later',
});

const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
});

// Basic middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.static(path.join(__dirname, '..', 'public')));

// If a built client exists, serve its static files (ensures assets like /assets/* resolve)
const clientDist = path.join(__dirname, '..', '..', 'client', 'dist');
if (fs.existsSync(clientDist)) {
    app.use(express.static(clientDist));
}

// Health check
app.get('/api/health', (req, res) => {
    res.json({
        status: 'OK',
        timestamp: new Date().toISOString(),
        version: '2.0.0',
    });
});

// Root - quick info page so visiting :3000 doesn't return the API 404
app.get('/', (req, res) => {
        res.type('html').send(`
                <html>
                    <head><title>Jersey Project</title></head>
                    <body style="font-family: Arial, sans-serif; text-align:center; padding:40px;">
                        <h1>Jersey Project API</h1>
                        <p>API is available under <code>/api</code>. Health: <a href="/api/health">/api/health</a></p>
                        <p>Frontend (dev): run the client dev server (Vite) on port 5173.</p>
                    </body>
                </html>
        `);
});

// Mount routes
app.use('/api/orders', apiLimiter, orderRoutes);
app.use('/api/admin', apiLimiter, adminRoutes);
app.use('/api/admin', adminOrderRoutes);
app.use('/api/admin/expenses', expenseRoutes);
app.use('/api/admin/reports', reportRoutes);

// SPA fallback / 404 handler
app.use('*', (req, res) => {
    const clientDist = path.join(__dirname, '..', '..', 'client', 'dist');
    if (req.method === 'GET' && !req.path.startsWith('/api') && fs.existsSync(clientDist)) {
        return res.sendFile(path.join(clientDist, 'index.html'));
    }
    return res.status(404).json({ error: 'Route not found' });
});


// Global error handler
app.use((error: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
    console.error('Global error:', error);
    res.status(500).json({ error: 'Internal server error' });
});

// Start server
const startServer = async () => {
    try {
        if (!process.env.DATABASE_URL) {
            throw new Error('DATABASE_URL environment variable is required');
        }

        await initDb();

        app.listen(PORT, () => {
            console.log(`\n🚀 Jersey Order Server Started Successfully!`);
            console.log(`📍 Server: http://localhost:${PORT}`);
            console.log(`🔒 Security: Helmet + Rate Limiting enabled`);
            console.log(`📧 Email: ${process.env.BREVO_API_KEY ? 'Configured' : 'Not configured'}`);
            console.log(`📊 Reports: Excel generation ready`);
            console.log(`🗃️  Database: Connected via Drizzle ORM\n`);
        });
    } catch (error) {
        console.error('Failed to start server:', error);
        process.exit(1);
    }
};

// In production, build the client into `client/dist` and the SPA fallback above
// will serve the static files. Ensure you build the client with `npm run build`
// in the `client` folder before starting the server in production.


startServer();
