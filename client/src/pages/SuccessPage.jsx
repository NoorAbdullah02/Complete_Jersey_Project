import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Particles from '../components/Particles';
import Footer from '../components/Footer';
import ErrorBoundary from '../components/ErrorBoundary';

export default function SuccessPage() {
    const location = useLocation();
    const navigate = useNavigate();
    const [orderData, setOrderData] = useState(null);

    useEffect(() => {
        if (location.state?.orderId) {
            setOrderData(location.state);
        } else {
            // If accessed directly without state, redirect to home
            const timer = setTimeout(() => navigate('/'), 3000);
            return () => clearTimeout(timer);
        }
    }, [location, navigate]);

    // Always scroll to top when this page mounts or when orderData changes
    useEffect(() => {
        try {
            window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
        } catch (e) {
            // fallback for older browsers
            window.scrollTo(0, 0);
        }
    }, [orderData]);

    // Normalize items to an array to avoid runtime errors if items is unexpectedly an object
    const items = Array.isArray(orderData?.items)
        ? orderData.items
        : orderData?.items
            ? Object.values(orderData.items)
            : [];

    // Defensive: if location.state contains the data under a different key (like `order`), prefer that
    useEffect(() => {
        if (!orderData && location.state) {
            const alt = location.state.order || location.state.data || null;
            if (alt) setOrderData({ ...location.state, ...alt });
        }
    }, [location.state, orderData]);

    if (!orderData && !location.state?.orderId) {
        return (
            <div style={{ minHeight: '100vh', background: '#0f172a', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}>
                <p>Redirecting...</p>
            </div>
        );
    }

    return (
        <ErrorBoundary>
            <Particles />
            <div style={{
                minHeight: '100vh',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                alignItems: 'center',
                background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
                color: 'white',
                padding: '20px',
                textAlign: 'center',
                position: 'relative',
                zIndex: 1
            }}>
                <div style={{
                    background: 'rgba(255, 255, 255, 0.05)',
                    backdropFilter: 'blur(10px)',
                    padding: '40px',
                    borderRadius: '20px',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    maxWidth: '600px',
                    width: '100%',
                    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)'
                }} data-aos="zoom-in">

                    <div style={{
                        width: '80px',
                        height: '80px',
                        borderRadius: '50%',
                        background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '40px',
                        margin: '0 auto 20px',
                        boxShadow: '0 0 20px rgba(16, 185, 129, 0.5)'
                    }}>
                        <i className="fas fa-check"></i>
                    </div>

                    <h1 style={{
                        fontFamily: "'Orbitron', sans-serif",
                        fontSize: '2rem',
                        marginBottom: '10px',
                        background: 'linear-gradient(to right, #fff, #a5b4fc)',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent'
                    }}>
                        Order Successful!
                    </h1>

                    <p style={{ color: '#94a3b8', fontSize: '1.1rem', marginBottom: '30px' }}>
                        Thank you for your order. We've received your request.
                    </p>

                    <div style={{
                        background: 'rgba(0, 0, 0, 0.3)',
                        borderRadius: '10px',
                        padding: '20px',
                        marginBottom: '30px',
                        textAlign: 'left'
                    }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '10px' }}>
                            <span style={{ color: '#cbd5e1' }}>Order ID:</span>
                            <span style={{ fontFamily: 'monospace', color: '#667eea', fontWeight: 'bold' }}>
                                {orderData?.orderId || 'N/A'}
                            </span>
                        </div>
                        <div style={{ marginBottom: '10px' }}>
                            <div style={{ color: '#94a3b8', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '1px' }}>Customer Details</div>
                            <div style={{ color: '#fff', fontWeight: 600 }}>{orderData?.name}</div>
                            <div style={{ color: '#fff', fontSize: '0.9rem' }}>{orderData?.email}</div>
                        </div>
                        <div style={{ marginBottom: '15px' }}>
                            <div style={{ color: '#94a3b8', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '5px' }}>Jersey Items</div>
                            {items.map((item, idx) => (
                                <div key={idx} style={{
                                    background: 'rgba(255,255,255,0.05)',
                                    padding: '8px 12px',
                                    borderRadius: '8px',
                                    marginBottom: '5px',
                                    fontSize: '0.9rem',
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center'
                                }}>
                                    <span>
                                        <strong style={{ color: '#667eea' }}>#{item.jerseyNumber}</strong> {item.jerseyName && `(${item.jerseyName})`} - {item.size}
                                    </span>
                                    <span style={{ fontSize: '0.8rem', opacity: 0.6 }}>{item.batch}</span>
                                </div>
                            ))}
                        </div>
                        <div style={{ borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '10px', display: 'flex', justifyContent: 'space-between' }}>
                            <span style={{ color: '#cbd5e1' }}>Transaction ID:</span>
                            <span style={{ color: '#fff' }}>{orderData?.transactionId || 'N/A'}</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '10px' }}>
                            <span style={{ color: '#cbd5e1' }}>Total Price:</span>
                            <span style={{ color: '#10b981', fontWeight: 700 }}>৳{orderData?.finalPrice || orderData?.totalPrice}</span>
                        </div>
                    </div>
                    <div style={{ marginBottom: '30px' }}>
                        <p style={{ fontSize: '0.9rem', color: '#94a3b8', margin: 0 }}>
                            <i className="fas fa-envelope" style={{ marginRight: '8px' }}></i>
                            A confirmation email has been sent to your email address.
                        </p>
                    </div>

                    <button
                        onClick={(e) => { e.preventDefault(); navigate('/'); }}
                        className="btn btn-primary"
                        style={{
                            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                            border: 'none',
                            padding: '12px 30px',
                            borderRadius: '50px',
                            fontSize: '1rem',
                            fontWeight: '600',
                            marginTop: '10px',
                            transition: 'transform 0.2s'
                        }}
                        onMouseEnter={(e) => { if (e.currentTarget) e.currentTarget.style.transform = 'scale(1.05)'; }}
                        onMouseLeave={(e) => { if (e.currentTarget) e.currentTarget.style.transform = 'scale(1)'; }}
                    >
                        <i className="fas fa-home" style={{ marginRight: '8px' }}></i>
                        Back to Home
                    </button>
                </div>
            </div>
            <Footer />
        </ErrorBoundary>
    );
}

