"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const index_1 = require("./db/index");
// Routes
const orders_1 = __importDefault(require("./routes/orders"));
const admin_1 = __importDefault(require("./routes/admin"));
const adminOrders_1 = __importDefault(require("./routes/adminOrders"));
const expenses_1 = __importDefault(require("./routes/expenses"));
const reports_1 = __importDefault(require("./routes/reports"));
const app = (0, express_1.default)();
const PORT = process.env.PORT || 3000;
// Security middleware
app.use((0, helmet_1.default)({
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
const orderLimiter = (0, express_rate_limit_1.default)({
    windowMs: 15 * 60 * 1000,
    max: 10,
    message: 'Too many order submissions, please try again later',
});
const apiLimiter = (0, express_rate_limit_1.default)({
    windowMs: 15 * 60 * 1000,
    max: 100,
});
// Basic middleware
app.use((0, cors_1.default)());
app.use(express_1.default.json({ limit: '10mb' }));
app.use(express_1.default.static(path_1.default.join(__dirname, '..', 'public')));
// If a built client exists, serve its static files (ensures assets like /assets/* resolve)
const clientDist = path_1.default.join(__dirname, '..', '..', 'client', 'dist');
if (fs_1.default.existsSync(clientDist)) {
    app.use(express_1.default.static(clientDist));
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
app.use('/api/orders', apiLimiter, orders_1.default);
app.use('/api/admin', apiLimiter, admin_1.default);
app.use('/api/admin', adminOrders_1.default);
app.use('/api/admin/expenses', expenses_1.default);
app.use('/api/admin/reports', reports_1.default);
// SPA fallback / 404 handler
app.use('*', (req, res) => {
    const clientDist = path_1.default.join(__dirname, '..', '..', 'client', 'dist');
    if (req.method === 'GET' && !req.path.startsWith('/api') && fs_1.default.existsSync(clientDist)) {
        return res.sendFile(path_1.default.join(clientDist, 'index.html'));
    }
    return res.status(404).json({ error: 'Route not found' });
});
// Global error handler
app.use((error, req, res, next) => {
    console.error('Global error:', error);
    res.status(500).json({ error: 'Internal server error' });
});
// Start server
const startServer = async () => {
    try {
        if (!process.env.DATABASE_URL) {
            throw new Error('DATABASE_URL environment variable is required');
        }
        await (0, index_1.initDb)();
        app.listen(PORT, () => {
            console.log(`\n🚀 Jersey Order Server Started Successfully!`);
            console.log(`📍 Server: http://localhost:${PORT}`);
            console.log(`🔒 Security: Helmet + Rate Limiting enabled`);
            console.log(`📧 Email: ${process.env.BREVO_API_KEY ? 'Configured' : 'Not configured'}`);
            console.log(`📊 Reports: Excel generation ready`);
            console.log(`🗃️  Database: Connected via Drizzle ORM\n`);
        });
    }
    catch (error) {
        console.error('Failed to start server:', error);
        process.exit(1);
    }
};
// In production, build the client into `client/dist` and the SPA fallback above
// will serve the static files. Ensure you build the client with `npm run build`
// in the `client` folder before starting the server in production.
startServer();
//# sourceMappingURL=index.js.map