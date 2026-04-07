import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import AOS from 'aos';
import 'aos/dist/aos.css';

import { 
    requestUserOtp, 
    verifyUserOtp, 
    getMyOrders, 
    deleteUserJersey, 
    updateUserJersey 
} from '../services/api';
import { useToast } from '../context/ToastContext';
import { useConfirm } from '../context/ConfirmContext';

import ThreeBackground from '../components/ThreeBackground';
import NetworkStatus from '../components/NetworkStatus';
import LoadingOverlay from '../components/LoadingOverlay';
import HeroHeader from '../components/HeroHeader';
import OrderCard from '../components/OrderCard';
import EditJerseyForm from '../components/EditJerseyForm';
import Footer from '../components/Footer';

export default function ModifyOrder() {
    const navigate = useNavigate();
    const { addToast } = useToast();
    const { confirm } = useConfirm();
    
    const [step, setStep] = useState('verify');
    const [loading, setLoading] = useState(false);
    const [loadingMsg, setLoadingMsg] = useState('Processing...');
    const [email, setEmail] = useState('');
    const [orderId, setOrderId] = useState('');
    const [otp, setOtp] = useState('');
    const [orders, setOrders] = useState([]);
    const [editingItem, setEditingItem] = useState(null);
    const [isLoggedIn, setIsLoggedIn] = useState(!!localStorage.getItem('userAccessToken'));

    useEffect(() => {
        AOS.init({ duration: 800, once: true, offset: 30 });
        if (isLoggedIn) {
            setStep('orders');
            fetchOrders();
        }
    }, [isLoggedIn]);

    const fetchOrders = useCallback(async () => {
        setLoading(true);
        setLoadingMsg('Loading your orders...');
        try {
            const res = await getMyOrders();
            setOrders(res.data || []);
            setTimeout(() => AOS.refresh(), 200);
        } catch (err) {
            if (err.response?.status === 401) handleLogout();
            else addToast('Could not load your orders.', 'error');
        } finally {
            setLoading(false);
        }
    }, [addToast]);

    const handleRequestOTP = async (e) => {
        e.preventDefault();
        if (!email.trim() || !orderId.trim()) return;
        setLoading(true);
        setLoadingMsg('Sending verification code...');
        try {
            await requestUserOtp(email.trim(), orderId.trim());
            setStep('otp');
            addToast('Verification code sent to your email!', 'success');
        } catch (err) {
            addToast(err.response?.data?.error || 'Could not send code. Check your details.', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleVerifyOTP = async (e) => {
        e.preventDefault();
        if (!otp.trim()) return;
        setLoading(true);
        setLoadingMsg('Verifying code...');
        try {
            const res = await verifyUserOtp(email.trim(), otp.trim());
            const { accessToken, refreshToken } = res.data;
            if (!accessToken) throw new Error('No token');
            localStorage.setItem('userAccessToken', accessToken);
            localStorage.setItem('userRefreshToken', refreshToken);
            setIsLoggedIn(true);
            setStep('orders');
            addToast('Verified! Welcome back.', 'success');
        } catch (err) {
            addToast(err.response?.data?.error || 'Invalid or expired code.', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleLogout = () => {
        localStorage.removeItem('userAccessToken');
        localStorage.removeItem('userRefreshToken');
        setIsLoggedIn(false);
        setStep('verify');
        setOrders([]);
        setEmail('');
        setOrderId('');
        setOtp('');
    };

    const handleDeleteItem = async (oId, itemId) => {
        const yes = await confirm('Remove this jersey from your order? Your total will be recalculated.');
        if (!yes) return;
        setLoading(true);
        setLoadingMsg('Removing jersey...');
        try {
            await deleteUserJersey(oId, itemId);
            setOrders(prev => prev.map(o => 
                o.id === oId ? { ...o, items: o.items.filter(i => i.id !== itemId) } : o
            ).filter(o => o.items && o.items.length > 0));
            addToast('Jersey removed!', 'success');
            setTimeout(() => fetchOrders(), 300);
        } catch (err) {
            addToast(err.response?.data?.error || 'Could not remove jersey.', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateItem = async (oId, itemId, data) => {
        setLoading(true);
        setLoadingMsg('Saving changes...');
        try {
            await updateUserJersey(oId, itemId, data);
            setEditingItem(null); // Instant UI feedback: close modal
            setLoading(false);    // Instant UI feedback: remove overlay
            addToast('Jersey updated!', 'success');
            fetchOrders();        // Refresh list in the background without blocking the UI
        } catch (err) {
            addToast(err.response?.data?.error || 'Could not update jersey.', 'error');
            setLoading(false);
        }
    };

    return (
        <>
            <ThreeBackground />
            <NetworkStatus />
            <LoadingOverlay show={loading} message={loadingMsg} />

            <div style={{ position: 'relative', zIndex: 10 }}>
                <HeroHeader />

                <div className="main-container container-fluid modify-portal" data-aos="fade-up" style={{ position: 'relative', zIndex: 10 }}>
                    
                    {/* Page Title */}
                    <div className="text-center mb-5" data-aos="fade-down">
                        <div style={{
                            display: 'inline-flex', alignItems: 'center', gap: '10px',
                            padding: '8px 20px', borderRadius: '50px',
                            background: 'rgba(0,242,254,0.08)', border: '1px solid rgba(0,242,254,0.2)',
                            marginBottom: '20px'
                        }}>
                            <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--primary)', boxShadow: '0 0 10px var(--primary)' }}></span>
                            <span style={{ color: 'var(--primary)', fontSize: '11px', fontWeight: 800, letterSpacing: '3px', textTransform: 'uppercase' }}>Secure Portal</span>
                        </div>
                        <h2 className="section-title">
                            Modify <span style={{ color: 'var(--primary)' }}>Order</span>
                        </h2>
                        <p style={{ color: 'rgba(255,255,255,0.5)', maxWidth: 400, margin: '10px auto 0' }}>
                            View and manage your ICE jersey registrations securely
                        </p>
                    </div>

                    {/* Main Glass Card */}
                    <div className="glass-morphism" style={{ borderRadius: 30, padding: 0, overflow: 'hidden', maxWidth: 800, margin: '0 auto' }} data-aos="zoom-in">
                        
                        {/* Top glow accent */}
                        <div style={{ height: 3, background: 'linear-gradient(90deg, transparent, var(--primary), var(--accent), var(--primary), transparent)' }}></div>

                        <div style={{ padding: '40px 30px' }}>

                            {/* ===== VERIFY STEP ===== */}
                            {step === 'verify' && (
                                <div style={{ maxWidth: 480, margin: '0 auto' }} className="animate-fade-in">
                                    <div className="text-center mb-4">
                                        <div style={{
                                            width: 70, height: 70, borderRadius: 20,
                                            background: 'linear-gradient(135deg, rgba(0,242,254,0.15), rgba(0,242,254,0.05))',
                                            border: '2px solid rgba(0,242,254,0.25)',
                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            margin: '0 auto 20px',
                                            boxShadow: '0 0 40px rgba(0,242,254,0.15)'
                                        }}>
                                            <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="var(--primary)" strokeWidth="1.5">
                                                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                                            </svg>
                                        </div>
                                        <h3 style={{ color: '#fff', fontSize: '1.5rem', fontWeight: 800, fontFamily: "'Orbitron', sans-serif" }}>Verify Your Identity</h3>
                                        <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: '0.85rem', marginTop: 8 }}>Enter your email and order ID to receive a verification code</p>
                                    </div>

                                    <form onSubmit={handleRequestOTP}>
                                        <div className="form-group mb-3">
                                            <label className="form-label">Email Address</label>
                                            <input 
                                                type="email" 
                                                className="form-control"
                                                placeholder="name@example.com"
                                                value={email}
                                                onChange={(e) => setEmail(e.target.value)}
                                                required
                                                style={{ borderRadius: 16 }}
                                            />
                                        </div>
                                        <div className="form-group mb-4">
                                            <label className="form-label">Order ID</label>
                                            <input 
                                                type="number" 
                                                className="form-control"
                                                placeholder="e.g. 42"
                                                value={orderId}
                                                onChange={(e) => setOrderId(e.target.value)}
                                                required
                                                style={{ borderRadius: 16 }}
                                            />
                                            <small style={{ color: 'rgba(255,255,255,0.35)', fontSize: '0.75rem', display: 'block', marginTop: 8 }}>
                                                💡 The number after "ICE-" in your confirmation email (e.g. ICE-042 → enter 42)
                                            </small>
                                        </div>
                                        <button type="submit" className="size-chart-btn w-100" disabled={loading} style={{ borderRadius: 16, padding: '16px', fontSize: '0.9rem', fontWeight: 800, letterSpacing: 2 }}>
                                            {loading ? '⏳ Sending Code...' : '🔐 Send Verification Code'}
                                        </button>
                                    </form>
                                </div>
                            )}

                            {/* ===== OTP STEP ===== */}
                            {step === 'otp' && (
                                <div style={{ maxWidth: 480, margin: '0 auto' }} className="animate-fade-in">
                                    <div className="text-center mb-4">
                                        <div style={{
                                            width: 70, height: 70, borderRadius: 20,
                                            background: 'linear-gradient(135deg, rgba(180,41,249,0.15), rgba(180,41,249,0.05))',
                                            border: '2px solid rgba(180,41,249,0.25)',
                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            margin: '0 auto 20px',
                                            boxShadow: '0 0 40px rgba(180,41,249,0.15)'
                                        }}>
                                            <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="1.5">
                                                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>
                                            </svg>
                                        </div>
                                        <h3 style={{ color: '#fff', fontSize: '1.5rem', fontWeight: 800, fontFamily: "'Orbitron', sans-serif" }}>Enter Verification Code</h3>
                                        <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: '0.85rem', marginTop: 8 }}>
                                            We sent a 6-digit code to <strong style={{ color: 'var(--primary)' }}>{email}</strong>
                                        </p>
                                    </div>

                                    <form onSubmit={handleVerifyOTP}>
                                        <div className="form-group mb-4">
                                            <input 
                                                type="text"
                                                inputMode="numeric"
                                                className="form-control"
                                                placeholder="000000"
                                                maxLength={6}
                                                value={otp}
                                                onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                                                required
                                                autoFocus
                                                style={{
                                                    borderRadius: 20, textAlign: 'center', fontSize: '2.2rem',
                                                    fontWeight: 900, letterSpacing: '0.4em', padding: '20px',
                                                    fontFamily: "'Orbitron', monospace"
                                                }}
                                            />
                                        </div>
                                        <button type="submit" disabled={loading || otp.length < 6} className="size-chart-btn w-100" style={{
                                            borderRadius: 16, padding: '16px', fontSize: '0.9rem', fontWeight: 800, letterSpacing: 2,
                                            background: otp.length < 6 ? 'rgba(255,255,255,0.1)' : 'linear-gradient(135deg, var(--accent), #7c3aed)',
                                            opacity: otp.length < 6 ? 0.5 : 1,
                                            cursor: otp.length < 6 ? 'not-allowed' : 'pointer'
                                        }}>
                                            {loading ? '⏳ Verifying...' : '✅ Verify & Continue'}
                                        </button>
                                        <button 
                                            type="button" onClick={() => { setStep('verify'); setOtp(''); }}
                                            style={{ display: 'block', width: '100%', marginTop: 16, background: 'none', border: 'none', color: 'rgba(255,255,255,0.4)', fontSize: '0.85rem', cursor: 'pointer', padding: '8px' }}
                                        >
                                            ← Go back & change email
                                        </button>
                                    </form>
                                </div>
                            )}

                            {/* ===== ORDERS STEP ===== */}
                            {step === 'orders' && (
                                <div className="animate-fade-in">
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16, marginBottom: 30 }}>
                                        <div>
                                            <h3 style={{ color: '#fff', fontSize: '1.4rem', fontWeight: 800, fontFamily: "'Orbitron', sans-serif", margin: 0 }}>Your Orders</h3>
                                            <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.8rem', margin: '4px 0 0' }}>{orders.length} {orders.length === 1 ? 'order' : 'orders'} found</p>
                                        </div>
                                        <button onClick={handleLogout} className="mo-btn-delete" style={{ letterSpacing: 2, textTransform: 'uppercase' }}>
                                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>
                                            </svg>
                                            Sign Out
                                        </button>
                                    </div>

                                    {loading && orders.length === 0 ? (
                                        <div className="text-center" style={{ padding: '60px 0' }}>
                                            <div className="spinner" style={{ margin: '0 auto 20px' }}></div>
                                            <p style={{ color: 'rgba(255,255,255,0.4)' }}>Loading your orders...</p>
                                        </div>
                                    ) : orders.length === 0 ? (
                                        <div className="text-center" style={{ padding: '60px 20px', border: '2px dashed rgba(255,255,255,0.1)', borderRadius: 24 }}>
                                            <h4 style={{ color: 'rgba(255,255,255,0.3)', fontWeight: 800 }}>No orders found</h4>
                                            <p style={{ color: 'rgba(255,255,255,0.25)', fontSize: '0.85rem', marginTop: 8 }}>Check that you used the correct email address.</p>
                                        </div>
                                    ) : (
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                                            {orders.map((order) => (
                                                <OrderCard 
                                                    key={order.id} 
                                                    order={order} 
                                                    onEdit={setEditingItem}
                                                    onDelete={handleDeleteItem}
                                                />
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {editingItem && (
                <EditJerseyForm 
                    item={editingItem.item}
                    orderId={editingItem.orderId}
                    onClose={() => setEditingItem(null)}
                    onUpdate={handleUpdateItem}
                    loading={loading}
                />
            )}

            <Footer />
        </>
    );
}
