# Complete Jersey Project

A full-stack Jersey ordering application (React + Vite frontend, Node/Express + TypeScript backend, PostgreSQL via Drizzle ORM) with admin dashboard, payment handling, email notifications (Brevo), and utilities for migrations and maintenance.

Repository remote:

```
git remote add origin https://github.com/NoorAbdullah02/Complete_Jersey_Project.git
```

## Features (brief)
- Customer order flow with multi-item jersey configuration and payment (online or cash/CR).
- Payment validation: online payments require a transaction ID; cash/CR is recorded as `CASH-TO-CR` in `transactions` table.
- Email notifications via Brevo (order confirmations and admin notifications).
- Admin dashboard (React) with order management, bulk status updates, expenses, reports, and mass notifications.
- Friendly UI: toast messages, confirm modal, ErrorBoundary, and reduced heavy background work for better performance.
- Safe migration tooling: `scripts/auto_drizzle_push.ts` to sanitize & apply drizzle-generated SQL non-interactively (use carefully, review in production).

## Repo structure (top-level)
- `server/` - TypeScript backend (Express, Drizzle ORM, migration and utility scripts)
- `client/` - React + Vite frontend app (source in `client/src`)
- `Frontend/` - standalone static admin HTML (legacy/static alternative)
- `client/public` - static assets
- `drizzle/` - generated migration SQL files

## Prerequisites
- Node.js (recommended v20+)
- npm or yarn
- PostgreSQL database
- (optional) Yarn/PNPM

## Environment variables
Create a `.env` file in `server/` (and/or set in your environment). Important variables:

- `DATABASE_URL` - Postgres connection string (required)
- `BREVO_API_KEY` - Brevo (Sendinblue) API key for sending emails
- `BREVO_FROM_EMAIL` - Verified sender email for Brevo
- `ADMIN_EMAIL` - Optional admin email to receive notifications
- `PORT` - Server port (default 3000)
- `NODE_ENV` - `development` or `production`

Example `.env` (do NOT commit):

```
DATABASE_URL=postgres://user:pass@localhost:5432/jerseydb
BREVO_API_KEY=your_brevo_api_key
BREVO_FROM_EMAIL=verified@yourdomain.com
ADMIN_EMAIL=admin@yourdomain.com
PORT=3000
NODE_ENV=development
```

## Install & Run (development)

1. Clone

```bash
git clone https://github.com/NoorAbdullah02/Complete_Jersey_Project.git
cd Complete_Jersey_Project
```

2. Install server deps

```bash
cd server
npm install
# or: pnpm install
```

3. Install client deps

```bash
cd ../client
npm install
```

4. Start backend and frontend dev servers (in separate terminals)

```bash
# terminal 1
cd server
npm run dev

# terminal 2
cd client
npm run dev
```

Frontend dev server runs on Vite (default `http://127.0.0.1:5173`) and proxies `/api` to the backend (server expected at `http://localhost:3000`).

## Build & Production

1. Build client

```bash
cd client
npm run build
```

2. Build/start server

```bash
cd server
npm run build
npm start   # or `node dist/index.js`
```

The server is configured to serve `client/dist` in production if present.

## Database migrations

- The project uses Drizzle (drizzle-kit) for migrations. In development you may generate migrations with `npx drizzle-kit generate`.
- A helper exists to sanitize and apply generated SQL non-interactively: `server/scripts/auto_drizzle_push.ts`. This script removes destructive clauses and wraps constraint/column additions to be idempotent. Use on development/staging only and always back up your DB before running in production.

Example: (from `server/`)

```bash
npx tsx scripts/auto_drizzle_push.ts
```

## Email testing

There is a test script to validate Brevo configuration: `server/scripts/test_email_config.ts` — run it after setting `BREVO_API_KEY` and `BREVO_FROM_EMAIL`.

```bash
cd server
npx tsx scripts/test_email_config.ts
```

## Important behaviors
- Transactions: when an order is created the server will insert a row in the `transactions` table. Online payments require a transaction id; cash/CR orders are recorded with `transaction_ref = 'CASH-TO-CR'`.
- Admin confirm modal + toasts: Admin pages use a friendly confirm modal and toast messages (React) and the static `Frontend/admin.html` also includes toasts and a modal fallback.
- ErrorBoundary: The `SuccessPage` is wrapped with an `ErrorBoundary` to show helpful fallbacks on runtime errors.

## Troubleshooting
- Port in use: If `EADDRINUSE` occurs, stop the process occupying the port or change `PORT`.
- Drizzle push errors: If `drizzle-kit push` tries to drop constraints/columns unexpectedly, review generated SQL under `server/drizzle` and prefer running the safe auto script or craft idempotent migration SQL.
- Email not delivered: Brevo returning `201` indicates acceptance; check Brevo dashboard for bounces/spam filters and ensure `BREVO_FROM_EMAIL` is verified.

## Dev tips for performance & debugging
- The Three.js background is optimized to reduce particle counts and pixel ratio on low-end devices; remove or lazy-load `ThreeBackground` if you need maximum responsiveness.
- Open browser console and network tab to view API errors. The server logs errors to console (check server terminal).

## Contributing
- Fork the repo, create a feature branch, and open a PR. Keep migrations minimal and reviewed.

## License & Credits
- Put your preferred license here.

---
If you want, I can also:
- Add example `.env.example` file.
- Add step-by-step screenshots for admin flows.
- Run the dev servers and verify the main flows and send a short report.

Feel free to tell me what you'd like next.
# Jersey Project Conversion

This project has been successfully converted to a modern full-stack application.

- **Frontend**: React + Vite (in `client/`)
- **Backend**: Node.js + Express + TypeScript + Drizzle ORM (in `server/`)
- **Database**: PostgreSQL (requires local installation)

## Quick Start

1.  **Configure Environment**:
    -   Verify `server/.env` settings (database credentials, email API key).
    -   Ensure PostgreSQL is running and database `jersey_db` exists.

2.  **Run Application**:
    -   Double-click `start-app.bat` in the root folder.
    -   Select Option 4 to start both backend and frontend.

## Features Implemented

### Frontend
-   **Exact UI Replica**: All animations, glassmorphism, and layouts preserved.
-   **Components**: Particles background, Network status, Loading overlay, Order form, Payment modal, Size chart.
-   **Admin Dashboard**: Authenticated route with Overview, Order Management, Expenses, and Reports.

### Backend
-   **API**: RESTful endpoints for Orders and Admin actions.
-   **Database**: PostgreSQL schema with Drizzle ORM.
-   **Security**: JWT Authentication, Helmet, Rate Limiting, Input Validation.
-   **Reporting**: Excel export for various report types.
-   **Email**: Integration with Brevo for transactional emails.

## Commands

-   **Frontend Dev**: `cd client && npm run dev`
-   **Backend Dev**: `cd server && npm run dev`
-   **Build Backend**: `cd server && npm run build`
-   **Generate Migration**: `cd server && npx drizzle-kit generate`
