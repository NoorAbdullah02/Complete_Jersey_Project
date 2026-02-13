import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { adminLogin } from '../services/api';
import { useToast } from '../context/ToastContext';

export default function AdminLoginPage() {
    const navigate = useNavigate();
    const { showToast } = useToast();
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const res = await adminLogin(username.trim(), password);
            localStorage.setItem('adminAccessToken', res.data.accessToken);
            localStorage.setItem('adminRefreshToken', res.data.refreshToken);
            showToast('Login successful! Welcome back.', 'success');
            navigate('/admin/dashboard');
        } catch (err) {
            const msg = err.response?.data?.error || 'Login failed';
            setError(msg);
            showToast(msg, 'error');
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
        }}>
            <div style={{
                background: 'var(--card-bg)',
                backdropFilter: 'blur(20px)',
                border: '1px solid var(--glass-border)',
                borderRadius: '24px',
                padding: '48px',
                width: '100%',
                maxWidth: '420px',
                boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
            }}>
                <div style={{ textAlign: 'center', marginBottom: '32px' }}>
                    <div style={{
                        width: '64px',
                        height: '64px',
                        background: 'linear-gradient(135deg, var(--primary), var(--secondary))',
                        borderRadius: '16px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        margin: '0 auto 16px',
                        fontSize: '28px',
                        color: 'white',
                    }}>
                        <i className="fas fa-lock"></i>
                    </div>
                    <h2 style={{
                        color: 'var(--text-main)',
                        fontFamily: "'Orbitron', monospace",
                        fontSize: '1.5rem',
                        fontWeight: '800',
                    }}>Admin Login</h2>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                        ICE Jersey Management System
                    </p>
                </div>

                <form onSubmit={handleSubmit}>
                    <div style={{ marginBottom: '20px' }}>
                        <label style={{ color: 'var(--text-muted)', fontSize: '0.85rem', fontWeight: '600', display: 'block', marginBottom: '8px' }}>
                            Username
                        </label>
                        <input
                            type="text"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            placeholder="Enter username"
                            style={{
                                width: '100%',
                                padding: '14px 18px',
                                borderRadius: '12px',
                                border: '2px solid var(--glass-border)',
                                background: 'rgba(255,255,255,0.05)', /* Semi-transparent for inputs */
                                color: '#ffffff',
                                fontSize: '1rem',
                                outline: 'none',
                                transition: 'all 0.3s ease',
                                boxSizing: 'border-box',
                            }}
                            onFocus={(e) => e.target.style.borderColor = 'var(--primary)'}
                            onBlur={(e) => e.target.style.borderColor = 'var(--glass-border)'}
                            required
                        />
                    </div>

                    <div style={{ marginBottom: '20px' }}>
                        <label style={{ color: 'var(--text-muted)', fontSize: '0.85rem', fontWeight: '600', display: 'block', marginBottom: '8px' }}>
                            Password
                        </label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="Enter password"
                            style={{
                                width: '100%',
                                padding: '14px 18px',
                                borderRadius: '12px',
                                border: '2px solid var(--glass-border)',
                                background: 'rgba(255,255,255,0.05)',
                                color: '#ffffff',
                                fontSize: '1rem',
                                outline: 'none',
                                transition: 'all 0.3s ease',
                                boxSizing: 'border-box',
                            }}
                            onFocus={(e) => e.target.style.borderColor = 'var(--primary)'}
                            onBlur={(e) => e.target.style.borderColor = 'var(--glass-border)'}
                            required
                        />
                    </div>

                    {error && (
                        <div style={{
                            background: 'rgba(220,53,69,0.15)',
                            border: '1px solid rgba(220,53,69,0.3)',
                            borderRadius: '10px',
                            padding: '12px 16px',
                            marginBottom: '20px',
                            color: '#ff6b6b',
                            fontSize: '0.9rem',
                        }}>
                            {error}
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={loading}
                        style={{
                            width: '100%',
                            padding: '16px',
                            borderRadius: '12px',
                            border: 'none',
                            background: 'linear-gradient(135deg, #667eea, #764ba2)',
                            color: 'white',
                            fontSize: '1rem',
                            fontWeight: '700',
                            cursor: loading ? 'not-allowed' : 'pointer',
                            opacity: loading ? 0.7 : 1,
                            transition: 'all 0.3s ease',
                        }}
                    >
                        {loading ? 'Logging in...' : 'Sign In'}
                    </button>

                    <div style={{ textAlign: 'center', marginTop: '24px' }}>
                        <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.9rem' }}>
                            Need an account? <Link to="/admin/register" style={{ color: '#667eea', fontWeight: 'bold', textDecoration: 'none' }}>Register Here</Link>
                        </p>
                    </div>
                </form>
            </div>
        </div>
    );
}
