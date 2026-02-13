import React, { useState, useEffect } from 'react';
import { useLocation, Link } from 'react-router-dom';
import { resendAdminVerification } from '../services/api';
import { useToast } from '../context/ToastContext';

export default function AdminVerifyNoticePage() {
    const location = useLocation();
    const { showToast } = useToast();
    const query = new URLSearchParams(location.search);
    const email = query.get('email');

    const [cooldown, setCooldown] = useState(0);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (cooldown > 0) {
            const timer = setTimeout(() => setCooldown(cooldown - 1), 1000);
            return () => clearTimeout(timer);
        }
    }, [cooldown]);

    const handleResend = async (e) => {
        if (e) e.preventDefault();
        if (!email) {
            showToast('Email not found. Please try registering again.', 'error');
            return;
        }
        if (cooldown > 0) return;

        setLoading(true);
        try {
            const res = await resendAdminVerification(email);
            showToast(res.data.message || 'Verification email resent!', 'success');
            setCooldown(60); // 1 minute cooldown
        } catch (err) {
            showToast(err.response?.data?.error || 'Failed to resend email', 'error');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'linear-gradient(135deg, var(--dark) 0%, #1e293b 100%)',
            fontFamily: "'Inter', sans-serif",
            padding: '20px'
        }}>
            <div style={{
                background: 'var(--card-bg)',
                backdropFilter: 'blur(20px)',
                border: '1px solid var(--glass-border)',
                borderRadius: '24px',
                padding: '40px',
                width: '100%',
                maxWidth: '480px',
                boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
                textAlign: 'center'
            }}>
                <div style={{
                    width: '80px',
                    height: '80px',
                    background: 'rgba(139, 92, 246, 0.2)',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto 24px',
                    fontSize: '32px',
                    color: '#a78bfa',
                }}>
                    <i className="fas fa-envelope-open-text"></i>
                </div>

                <h2 style={{
                    color: 'var(--text-main)',
                    fontFamily: "'Orbitron', monospace",
                    fontSize: '1.5rem',
                    fontWeight: '800',
                    marginBottom: '16px'
                }}>Check Your Email</h2>

                <p style={{ color: 'var(--text-muted)', fontSize: '1rem', lineHeight: '1.6', marginBottom: '8px' }}>
                    We've sent a verification link to:
                </p>
                <p style={{ color: 'var(--primary)', fontWeight: 'bold', fontSize: '1.1rem', marginBottom: '24px' }}>
                    {email || 'your email'}
                </p>

                <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '32px' }}>
                    Please click the link in that email to activate your admin account.
                    Check your spam folder if you don't see it.
                </p>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <button
                        onClick={(e) => handleResend(e)}
                        disabled={loading || cooldown > 0}
                        style={{
                            width: '100%',
                            padding: '16px',
                            borderRadius: '12px',
                            background: cooldown > 0 ? 'rgba(255,255,255,0.05)' : 'rgba(139, 92, 246, 0.1)',
                            border: cooldown > 0 ? 'none' : '1px solid rgba(139, 92, 246, 0.3)',
                            color: cooldown > 0 ? 'var(--text-muted)' : '#a78bfa',
                            fontSize: '0.95rem',
                            fontWeight: '600',
                            cursor: (loading || cooldown > 0) ? 'not-allowed' : 'pointer',
                            transition: 'all 0.3s ease',
                        }}
                    >
                        {loading ? 'Sending...' : cooldown > 0 ? `Resend available in ${cooldown}s` : 'Resend Verification Email'}
                    </button>

                    <Link to="/admin" style={{
                        color: 'var(--text-muted)',
                        fontSize: '0.9rem',
                        textDecoration: 'none',
                        marginTop: '12px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '8px'
                    }}>
                        <i className="fas fa-arrow-left"></i> Back to Login
                    </Link>
                </div>
            </div>
        </div>
    );
}
