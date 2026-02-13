import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { verifyAdminEmail } from '../services/api';
import { useToast } from '../context/ToastContext';

export default function AdminVerifyEmailPage() {
    const { token } = useParams();
    const { showToast } = useToast();
    const [status, setStatus] = useState('verifying'); // 'verifying', 'success', 'error'
    const [message, setMessage] = useState('');

    useEffect(() => {
        const verify = async () => {
            try {
                const res = await verifyAdminEmail(token);
                setStatus('success');
                const msg = res.data.message || 'Email verified successfully!';
                setMessage(msg);
                showToast(msg, 'success');
            } catch (err) {
                setStatus('error');
                const msg = err.response?.data?.error || 'Verification failed. The link may be invalid or expired.';
                setMessage(msg);
                showToast(msg, 'error');
            }
        };
        verify();
    }, [token]);

    const containerStyle = {
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, var(--dark) 0%, #1e293b 100%)',
        fontFamily: "'Inter', sans-serif",
        padding: '20px'
    };

    const cardStyle = {
        background: 'var(--card-bg)',
        backdropFilter: 'blur(20px)',
        border: '1px solid var(--glass-border)',
        borderRadius: '24px',
        padding: '40px',
        width: '100%',
        maxWidth: '480px',
        boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
        textAlign: 'center'
    };

    return (
        <div style={containerStyle}>
            <div style={cardStyle}>
                {status === 'verifying' && (
                    <>
                        <div style={{ color: 'var(--primary)', fontSize: '48px', marginBottom: '20px' }}>
                            <i className="fas fa-circle-notch fa-spin"></i>
                        </div>
                        <h2 style={{ color: 'var(--text-main)', fontFamily: "'Orbitron', monospace", marginBottom: '16px' }}>Verifying Email...</h2>
                        <p style={{ color: 'var(--text-muted)' }}>Please wait while we confirm your account.</p>
                    </>
                )}

                {status === 'success' && (
                    <>
                        <div style={{ color: '#10b981', fontSize: '48px', marginBottom: '20px' }}>
                            <i className="fas fa-check-circle"></i>
                        </div>
                        <h2 style={{ color: 'var(--text-main)', fontFamily: "'Orbitron', monospace", marginBottom: '16px' }}>Success!</h2>
                        <p style={{ color: 'var(--text-muted)', marginBottom: '32px' }}>{message}</p>
                        <Link to="/admin" style={{
                            display: 'block',
                            width: '100%',
                            padding: '16px',
                            background: 'linear-gradient(135deg, #10b981, #059669)',
                            color: 'white',
                            borderRadius: '12px',
                            textDecoration: 'none',
                            fontWeight: '700',
                            transition: 'transform 0.2s'
                        }}>
                            Go to Login
                        </Link>
                    </>
                )}

                {status === 'error' && (
                    <>
                        <div style={{ color: '#ef4444', fontSize: '48px', marginBottom: '20px' }}>
                            <i className="fas fa-exclamation-triangle"></i>
                        </div>
                        <h2 style={{ color: 'var(--text-main)', fontFamily: "'Orbitron', monospace", marginBottom: '16px' }}>Verification Failed</h2>
                        <p style={{ color: 'var(--text-muted)', marginBottom: '32px' }}>{message}</p>
                        <Link to="/admin/register" style={{
                            display: 'block',
                            width: '100%',
                            padding: '16px',
                            background: 'rgba(255,255,255,0.1)',
                            color: 'white',
                            borderRadius: '12px',
                            textDecoration: 'none',
                            fontWeight: '600',
                        }}>
                            Back to Registration
                        </Link>
                    </>
                )}
            </div>
        </div>
    );
}
