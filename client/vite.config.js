import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';


export default defineConfig({
    plugins: [react()],
    appType: 'spa',
    build: {
        chunkSizeWarningLimit: 1000, // Increase from 500kB to 1MB to reduce noise
        rollupOptions: {
            output: {
                manualChunks: {
                    // Separate vendor libraries into chunks
                    'vendor': [
                        'react',
                        'react-dom',
                        'react-router-dom',
                    ],
                    // Separate heavy dependencies
                    'three': ['three'],
                    'utils': [
                        'axios',
                    ],
                    // Separate page components
                    'admin': [
                        './src/pages/AdminDashboardPage.jsx',
                        './src/pages/AdminLoginPage.jsx',
                        './src/pages/AdminRegisterPage.jsx',
                    ],
                },
            },
        },
    },
    server: {
        host: '127.0.0.1',
        port: 5173,
        strictPort: true,
        hmr: {
            host: '127.0.0.1',
            protocol: 'ws',
        },
        // Proxy `/api` to backend during development so client and server appear on same origin
        proxy: {
            '/api': {
                target: 'http://localhost:3000',
                changeOrigin: true,
                secure: false,
            },
        },
    },
});
