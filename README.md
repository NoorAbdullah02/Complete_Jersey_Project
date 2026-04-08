# 🏆 ICE Jersey Project - Official Department Collection

> A premium, immersive 3D web application for ordering official department jerseys with a focus on high-end aesthetics, performance, and user experience.

[![Node.js](https://img.shields.io/badge/Node.js-v20+-green)]()
[![React](https://img.shields.io/badge/React-Latest-blue)]()
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-blue)]()
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Latest-336791)]()

---

## 📋 Table of Contents

- [Overview](#overview)
- [✨ Key Features](#key-features)
- [🛠️ Tech Stack](#tech-stack)
- [🚀 Quick Start](#quick-start)
- [📦 Installation](#installation)
- [🎯 Available Scripts](#available-scripts)
- [🌐 API Endpoints](#api-endpoints)
- [🗄️ Database](#database)
- [🔐 Security](#security)
- [⚙️ Configuration](#configuration)
- [🚢 Deployment](#deployment)
- [🆘 Troubleshooting](#troubleshooting)
- [📞 Support](#support)

---

## Overview

**ICE Jersey** is a full-stack web application for ordering customized official department jerseys. The platform combines modern web technologies with an immersive user interface, secure payment processing, and comprehensive admin management.

### Core Use Cases:
- 👥 **Customers**: Browse, customize, and purchase official jerseys
- 💳 **Payments**: Secure mobile banking integration (bKash, Nagad)
- 📊 **Admin**: Manage orders, inventory, finances, and users
- 📈 **Analytics**: Track sales, revenue, and business metrics

---

## ✨ Key Features

### 👕 Jersey Customization
- ✅ Personalized name printing
- ✅ Jersey number selection
- ✅ Multiple size options (XS to XXXL)
- ✅ Sleeve type customization (Full, Half, Sleeveless)
- ✅ Collar type options
- ✅ Multiple jersey batches/collections
- ✅ Real-time price calculation
- ✅ Live preview before ordering

### 💳 Payment & Orders
- ✅ bKash mobile banking integration
- ✅ Nagad payment gateway
- ✅ Secure transaction processing
- ✅ Order status tracking
- ✅ Digital receipt generation
- ✅ Download invoices
- ✅ Order history and tracking

### 🎨 User Experience
- ✅ **Immersive 3D Experience**: Three.js particle background
- ✅ **Modern UI Design**: Glassmorphism and acrylic effects
- ✅ **Smooth Animations**: GSAP-powered transitions
- ✅ **Mobile Optimized**: Responsive design for all devices
- ✅ **Dark/Light Mode**: Theme switching capability
- ✅ **Real-time Notifications**: Toast and alert messages
- ✅ **Loading States**: Skeleton screens and spinner overlays

### 🔧 Admin Dashboard
- ✅ Order management interface
- ✅ User verification system
- ✅ Inventory tracking
- ✅ Financial reports (revenue, sales)
- ✅ Expense tracking
- ✅ Audit logs
- ✅ Export data (CSV, Excel)
- ✅ Role-based access (Admin, Manager, Support)

### 🔒 Security
- ✅ JWT authentication with refresh tokens
- ✅ WebAuthn/FIDO2 passwordless auth
- ✅ CSRF protection
- ✅ Rate limiting (100 req/15min)
- ✅ BCrypt password hashing
- ✅ Session management
- ✅ Device fingerprinting
- ✅ Audit trail logging
- ✅ Security headers (Helmet)

---

## 🛠️ Tech Stack

### Frontend
```
⚡ Vite (v6.4)          - Lightning-fast build tool
⚛️  React (Latest)       - UI library
📦 React Router (v7)    - Client-side routing
🎮 Three.js (v0.182)    - 3D graphics
✨ GSAP (v3.14)         - Animations
🎨 Tailwind CSS (v3.4)  - Styling
📊 Recharts (v3.7)      - Data visualization
🔐 WebAuthn             - Passwordless auth
```

### Backend
```
🟢 Node.js (v20+)       - Runtime
🚀 Express (v4.21)      - Web framework
📘 TypeScript (v5.7)    - Type safety
🗄️  PostgreSQL           - Database
🔄 Drizzle ORM (v0.39)  - Type-safe ORM
🔐 JWT & BCrypt         - Authentication
⚡ IORedis (v5.9)       - Caching
🔔 Socket.IO (v4.8)     - Real-time
🛡️  Helmet (v8.1)       - Security
```

---

## 🚀 Quick Start

### Prerequisites
- **Node.js** v20+ ([Download](https://nodejs.org))
- **PostgreSQL** database ([Download](https://www.postgresql.org))
- **npm** v10+ (included with Node.js)
- **Git** ([Download](https://git-scm.com))

### Setup (5 minutes)

```bash
# 1. Clone repository
git clone https://github.com/yourusername/Complete_Jersey_Project.git
cd Complete_Jersey_Project

# 2. Install dependencies
npm install
cd server && npm install && cd ..
cd client && npm install && cd ..

# 3. Setup environment files
cp server/.env.example server/.env
cp client/.env.example client/.env

# Edit server/.env with your configuration

# 4. Setup database
cd server
npm run db:push
cd ..

# 5. Start development servers
# Terminal 1:
cd server && npm run dev

# Terminal 2:
cd client && npm run dev

# Access application
# Frontend: http://localhost:5173
# Backend: http://localhost:3000
```

---

## 📦 Installation

### Full Setup with Database

```bash
# Clone project
git clone <repository-url>
cd Complete_Jersey_Project

# Create PostgreSQL database
createdb jersey_db

# Configure environment
vi server/.env  # Add your DATABASE_URL and API keys

# Install all dependencies
npm install

# Build and migrate database
npm run build
cd server && npm run db:push && cd ..

# Test database connection
node server/scripts/test_db_connection.ts

# Start application
npm run start
```

### Docker Setup (Optional)

```bash
# Build image
docker build -t ice-jersey .

# Run container
docker run -p 3000:3000 -p 5173:5173 \
  --env-file .env.docker \
  ice-jersey
```

---

## 🎯 Available Scripts

### Root Commands
```bash
npm run build      # Build entire project (client + server)
npm run start      # Start production server with database migration
```

### Server Commands
```bash
cd server
npm run dev        # Development with hot reload
npm run build      # Build TypeScript to JavaScript
npm run start      # Start production server
npm run db:push    # Migrate database
npm run db:generate # Generate new migration
```

### Client Commands
```bash
cd client
npm run dev        # Development server (HMR enabled)
npm run build      # Production build
npm run preview    # Preview production build locally
```

### Utility Scripts
```bash
# Test email configuration
node server/scripts/test_email_config.ts

# Database operations
node server/scripts/check_schema.js
node server/scripts/reset_admin.js
node server/scripts/dump_orders.js

# Authentication testing
node server/scripts/test_auth_flow.js
```

---

## 🌐 API Endpoints

### Core Routes

| Method | Endpoint | Purpose |
|--------|----------|---------|
| **Auth** |
| POST | `/api/auth/register` | Register new user |
| POST | `/api/auth/login` | User login |
| POST | `/api/auth/logout` | Logout user |
| **Orders** |
| POST | `/api/orders` | Create order |
| GET | `/api/orders` | List user orders |
| GET | `/api/orders/:id` | Get order details |
| PUT | `/api/orders/:id` | Update order |
| POST | `/api/orders/:id/payment` | Process payment |
| **Admin** |
| GET | `/api/admin/dashboard` | Admin statistics |
| GET | `/api/admin/orders` | List all orders |
| GET | `/api/admin/users` | List users |
| GET | `/api/admin/inventory` | Inventory management |
| GET | `/api/admin/reports` | Financial reports |

See [Full API Documentation](#api-endpoints) for complete list.

---

## 🗄️ Database

### Schema Overview

```
Users Table
├── id, email, name
├── password_hash (BCrypt)
├── is_verified (email verification)
└── refreshToken (for token refresh)

AdminUsers Table
├── id, username, email
├── passwordHash, role (admin/manager/support)
└── verificationToken

Orders Table
├── id, customer info
├── items (order_items table)
├── status (pending/confirmed/shipped)
└── timestamps (created_at, updated_at)

OrderItems Table
├── order_id, jersey specs
├── name, number, size
├── sleeve_type, collar_type
└── item_price

Sessions Table
├── session_id, user_id
├── device_info, ip_address
└── expiration tracking

AuditLogs Table
├── user_id, admin_id
├── action, metadata
└── timestamp
```

### Data Backup

```bash
# Backup database
pg_dump jersey_db > backup_$(date +%Y%m%d).sql

# Restore from backup
psql jersey_db < backup_20240415.sql
```

---

## 🔐 Security

### Authentication Methods

1. **JWT Tokens**
   - Access token: 15 min expiry
   - Refresh token: 7 days expiry
   - Token rotation on refresh

2. **WebAuthn (Passwordless)**
   - Biometric login (fingerprint)
   - FIDO2 security keys
   - Platform authenticator

3. **Session Management**
   - Device fingerprinting
   - IP tracking
   - Concurrent session limits
   - Auto-logout

### Best Practices

```bash
# Change admin password
node server/scripts/reset_admin.js

# Rotate JWT secrets
# 1. Update .env with new JWT_SECRET
# 2. Restart server
# 3. Users must re-login

# Monitor security
tail -f server/logs/audit.log
```

---

## ⚙️ Configuration

### Environment Variables

**Server (.env)**
```env
# Database
DATABASE_URL=postgresql://user:pass@localhost/jersey_db

# Server
PORT=3000
NODE_ENV=production
ORIGIN=http://localhost:3000

# Security
JWT_SECRET=your-secret-key-min-32-chars
JWT_REFRESH_SECRET=your-refresh-secret
TRUST_PROXY=true

# Email
BREVO_API_KEY=your-api-key
BREVO_FROM_EMAIL=noreply@jerseystore.com

# WebAuthn
RP_ID=localhost
```

**Client (.env)**
```env
VITE_API_URL=http://localhost:3000/api
```

See [Full Configuration Guide](#environment-variables) for all variables.

---

## 🚢 Deployment

### Deploy to Render

```bash
# 1. Push code to GitHub
git add .
git commit -m "Deploy to production"
git push origin main

# 2. In Render Dashboard:
# - Connect GitHub repository
# - Set environment variables from .env
# - Build: npm run build
# - Start: npm run start

# 3. Monitor deployment
# - Check logs: Render Dashboard -> Logs
# - Look for: "Listening on 0.0.0.0:3000"
```

### Deploy to Railway

```bash
# Install Railway CLI
npm install -g @railway/cli

# Login and link project
railway login
railway link

# Deploy
railway up

# Monitor
railway logs
```

### Production Checklist

- [ ] Database URL configured
- [ ] JWT secrets set (strong, random)
- [ ] Email service configured
- [ ] Payment gateways setup
- [ ] SSL certificate installed
- [ ] CORS origins updated
- [ ] Rate limiting configured
- [ ] Backup strategy enabled
- [ ] Monitoring setup
- [ ] Error tracking (Sentry, etc.)

---

## 🆘 Troubleshooting

### Common Issues

#### Port Already in Use
```bash
# Find process
lsof -i :3000

# Kill process
kill -9 <PID>

# Or use different port
PORT=3001 npm run dev
```

#### Database Connection Failed
```bash
# Test connection
psql $DATABASE_URL -c "SELECT 1"

# Verify credentials
echo $DATABASE_URL

# Check PostgreSQL running
brew services list  # macOS
sudo service postgres status  # Linux
```

#### CORS Errors
```bash
# Update server/.env
ORIGIN=http://localhost:5173

# Verify in server logs
DEBUG=* npm run dev
```

#### Module Not Found
```bash
# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install
```

#### TypeScript Errors
```bash
# Rebuild
rm -rf dist
npm run build

# Update TypeScript
npm install --save-dev typescript@latest
```

### Debug Mode

```bash
# Enable verbose logging
DEBUG=* npm run dev

# Database debugging
DATABASE_LOG_LEVEL=debug npm run dev

# Network requests
NODE_DEBUG=http npm run dev
```

### Getting Help

- 🐛 **Report Bug**: [GitHub Issues](https://github.com/yourusername/Complete_Jersey_Project/issues)
- 💬 **Chat Support**: [Discord](https://discord.gg/icejersey)
- 📧 **Email**: support@icejersey.com
- 📖 **Docs**: [Full Documentation](./README_FULL.md)

---

## 📞 Support

### Resources
- **Full Documentation**: See [README_FULL.md](./README_FULL.md)
- **Project Structure**: [Directory Layout](#project-structure)
- **API Reference**: [API Endpoints](#api-endpoints)
- **Configuration**: [Environment Variables](#configuration)

### Contact
- Email: dev@icejersey.com
- Website: https://icejersey.com
- Support: support@icejersey.com

### Contributing
We welcome contributions! Please:
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

See [CONTRIBUTING.md](./CONTRIBUTING.md) for guidelines.

---

## 📄 License

Licensed under the **ISC License** - See [LICENSE](LICENSE) for details.

---

## 🙏 Acknowledgments

- **Three.js** - 3D graphics engine
- **React** - UI library
- **Tailwind CSS** - Styling framework
- **PostgreSQL** - Database system
- **Express.js** - Backend framework

---

**Last Updated**: April 2026  
**Version**: 1.0.0  
**Status**: ✅ Production Ready

---

### Quick Links

- [📖 Full Documentation](./README_FULL.md)
- [🚀 Getting Started](#quick-start)
- [📦 Installation](#installation)
- [🌐 API Docs](#api-endpoints)
- [🆘 Help](#troubleshooting)

Made with ❤️ by the ICE Jersey Team
   ```

3. **Backend Setup**
   ```bash
   cd server
   npm install
   # Configure your .env file with DB credentials
   npm run dev
   ```

## 🔌 API Endpoints (Highlights)

- `GET /api/health`: Check server status.
- `POST /api/orders/submit`: Submit a new jersey order.
- `GET /api/orders/check-number/:num`: Real-time jersey number availability check.
- `POST /api/admin/login`: Secure admin entry point.

## 📱 Performance Optimization

The project implements several advanced optimization techniques:
- **Conditional Rendering**: Expensive Three.js points are reduced on mobile.
- **GPU Capping**: Pixel ratios are limited on slower devices to prevent lag.
- **Safety Nets**: CSS-level AOS overrides ensure content visibility even if JS execution is delayed.

## 📄 License

This project is developed for the Department of Information and Communication Engineering (BAUET). All rights reserved.
