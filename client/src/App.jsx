import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import OrderPage from './pages/OrderPage';
import SuccessPage from './pages/SuccessPage';
import AdminLoginPage from './pages/AdminLoginPage';
import AdminDashboardPage from './pages/AdminDashboardPage';
import AdminRegisterPage from './pages/AdminRegisterPage';
import AdminVerifyNoticePage from './pages/AdminVerifyNoticePage';
import AdminVerifyEmailPage from './pages/AdminVerifyEmailPage';

import { ToastProvider } from './context/ToastContext';
import { ConfirmProvider } from './context/ConfirmContext';

export default function App() {
    return (
        <ToastProvider>
            <ConfirmProvider>
                <BrowserRouter>
                    <Routes>
                    <Route path="/" element={<OrderPage />} />
                    <Route path="/success" element={<SuccessPage />} />
                    <Route path="/admin" element={<AdminLoginPage />} />
                    <Route path="/admin/register" element={<AdminRegisterPage />} />
                    <Route path="/admin/verify-notice" element={<AdminVerifyNoticePage />} />
                    <Route path="/admin/verify-email/:token" element={<AdminVerifyEmailPage />} />
                    <Route path="/admin/dashboard" element={<AdminDashboardPage />} />
                    </Routes>
                </BrowserRouter>
            </ConfirmProvider>
        </ToastProvider>
    );
}
