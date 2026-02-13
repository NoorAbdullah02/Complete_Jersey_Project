# ICE Jersey Project - Official Department Collection

A premium, immersive 3D web application for ordering official department jerseys. Built with a focus on high-end aesthetics, performance, and user experience.

![Hero Showcase](client/src/assets/images/latest.webp)

## 🚀 Key Features

- **Immersive 3D Experience**: Integrated Three.js stars background for a futuristic feel.
- **Ultra-Modern UI**: Premium "Cyber-Glass" design system with massive glassmorphism and acrylic effects.
- **Dynamic Animations**: Seamless transitions and micro-interactions powered by GSAP (GreenSock).
- **Mobile Optimized**: Performance-tuned for mobile devices with adaptive point counts and reduced GPU load.
- **Professional Order System**: Segmented controls for jersey customization (Name, Number, Size, Sleeve Type).
- **Secure Payment Flow**: Integrated multi-provider mobile banking payment process (bKash & Nagad).
- **Admin Suite**: Dedicated dashboard for managing orders and verifying user authenticity.

## 🛠️ Tech Stack

### Frontend (Client)
- **Framework**: Vite + React
- **3D Engine**: Three.js (@react-three/fiber & @react-three/drei)
- **Animations**: GSAP & AOS (Animate On Scroll)
- **Styling**: Vanilla CSS (Modern CSS3 features) & Bootstrap 5
- **Routing**: React Router DOM v7

### Backend (Server)
- **Environment**: Node.js + Express
- **Language**: TypeScript
- **Database**: PostgreSQL with Sequelize ORM
- **Authentication**: JWT-based secure sessions

## 📦 Getting Started

### Prerequisites
- Node.js (v18+)
- PostgreSQL DATABASE

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd JerseyProject
   ```

2. **Frontend Setup**
   ```bash
   cd client
   npm install
   npm run dev
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
