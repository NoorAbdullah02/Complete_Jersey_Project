import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { adminRegister } from '../services/api';
import { useToast } from '../context/ToastContext';

export default function AdminRegisterPage() {
    const navigate = useNavigate();
    const { showToast } = useToast();
    const [formData, setFormData] = useState({
        username: '',
        name: '',
        email: '',
        password: '',
        confirmPassword: ''
    });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (formData.password !== formData.confirmPassword) {
            setError('Passwords do not match');
            return;
        }

        setLoading(true);
        try {
            const res = await adminRegister({
                username: formData.username.trim(),
                name: formData.name.trim(),
                email: formData.email.trim(),
                password: formData.password
            });

            showToast(res.data.message || 'Registration successful!', 'success');
            if (res.data.message && res.data.message.includes('auto-verified')) {
                navigate('/admin');
            } else {
                navigate(`/admin/verify-notice?email=${encodeURIComponent(formData.email.trim())}`);
            }
        } catch (err) {
            setError(err.response?.data?.error || 'Registration failed');
            showToast(err.response?.data?.error || 'Registration failed', 'error');
        } finally {
            setLoading(false);
        }
    };

    const inputStyle = {
        width: '100%',
        padding: '14px 18px',
        borderRadius: '12px',
        border: '2px solid var(--glass-border)',
        background: 'rgba(255,255,255,0.05)',
        color: '#ffffff', // Explicitly White for visibility
        fontSize: '1rem',
        outline: 'none',
        transition: 'all 0.3s ease',
        boxSizing: 'border-box',
    };

    const labelStyle = {
        color: 'var(--text-muted)',
        fontSize: '0.85rem',
        fontWeight: '600',
        display: 'block',
        marginBottom: '8px'
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
            }}>
                <div style={{ textAlign: 'center', marginBottom: '32px' }}>
                    <div style={{
                        width: '64px',
                        height: '64px',
                        background: 'linear-gradient(135deg, var(--accent), #f5576c)',
                        borderRadius: '16px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        margin: '0 auto 16px',
                        fontSize: '28px',
                        color: 'white',
                    }}>
                        <i className="fas fa-user-plus"></i>
                    </div>
                    <h2 style={{
                        color: 'var(--text-main)',
                        fontFamily: "'Orbitron', monospace",
                        fontSize: '1.5rem',
                        fontWeight: '800',
                    }}>Admin Registration</h2>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                        Create your management account
                    </p>
                </div>

                <form onSubmit={handleSubmit}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '15px' }}>
                        <div>
                            <label style={labelStyle}>Username</label>
                            <input name="username" type="text" value={formData.username} onChange={handleChange} placeholder="jdoe" style={inputStyle} required />
                        </div>
                        <div>
                            <label style={labelStyle}>Full Name</label>
                            <input name="name" type="text" value={formData.name} onChange={handleChange} placeholder="John Doe" style={inputStyle} required />
                        </div>
                    </div>

                    <div style={{ marginBottom: '15px' }}>
                        <label style={labelStyle}>Email Address</label>
                        <input name="email" type="email" value={formData.email} onChange={handleChange} placeholder="admin@example.com" style={inputStyle} required />
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '20px' }}>
                        <div>
                            <label style={labelStyle}>Password</label>
                            <input name="password" type="password" value={formData.password} onChange={handleChange} placeholder="••••••" style={inputStyle} required />
                        </div>
                        <div>
                            <label style={labelStyle}>Confirm</label>
                            <input name="confirmPassword" type="password" value={formData.confirmPassword} onChange={handleChange} placeholder="••••••" style={inputStyle} required />
                        </div>
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
                        }}>{error}</div>
                    )}

                    <button
                        type="submit"
                        disabled={loading}
                        style={{
                            width: '100%',
                            padding: '16px',
                            borderRadius: '12px',
                            border: 'none',
                            background: 'linear-gradient(135deg, #f093fb, #f5576c)',
                            color: 'white',
                            fontSize: '1rem',
                            fontWeight: '700',
                            cursor: loading ? 'not-allowed' : 'pointer',
                            transition: 'all 0.3s ease',
                        }}
                    >
                        {loading ? 'Creating Account...' : 'Register as Admin'}
                    </button>

                    <div style={{ textAlign: 'center', marginTop: '24px' }}>
                        <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.9rem' }}>
                            Already have an account? <Link to="/admin" style={{ color: '#f093fb', fontWeight: 'bold', textDecoration: 'none' }}>Login Here</Link>
                        </p>
                    </div>
                </form>
            </div>
        </div>
    );
}
