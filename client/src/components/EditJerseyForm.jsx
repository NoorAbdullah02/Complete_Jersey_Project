import React, { useState, useEffect } from 'react';

export default function EditJerseyForm({ item, orderId, onClose, onUpdate, loading }) {
    const val = (camel, snake) => item[camel] || item[snake] || '';

    const [formData, setFormData] = useState({
        jerseyName: val('jerseyName', 'jersey_name'),
        jerseyNumber: val('jerseyNumber', 'jersey_number'),
        size: val('size', 'size'),
        sleeveType: val('sleeveType', 'sleeve_type'),
        batch: val('batch', 'batch') || 'Unassigned',
    });

    useEffect(() => {
        document.body.style.overflow = 'hidden';
        return () => { document.body.style.overflow = ''; };
    }, []);

    const handleSubmit = (e) => {
        e.preventDefault();

        const nameStr = formData.jerseyName.trim().toUpperCase();

        if (!formData.jerseyNumber.toString().trim()) return;
        
        onUpdate(orderId, item.id, {
            jerseyName: nameStr,
            jerseyNumber: formData.jerseyNumber.toString().trim(),
            size: formData.size,
            sleeveType: formData.sleeveType,
            batch: formData.batch,
        });
    };

    const sizes = ['S', 'M', 'L', 'XL', 'XXL', '3XL'];

    return (
        <div 
            className="edit-modal"
            onClick={onClose}
            style={{
                position: 'fixed', inset: 0, zIndex: 1000,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                padding: 16, background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(12px)'
            }}
        >
            <div 
                onClick={(e) => e.stopPropagation()}
                className="glass-morphism animate-fade-in"
                style={{
                    width: '100%', maxWidth: 600, maxHeight: '92vh', overflowY: 'auto',
                    borderRadius: 28, padding: 0, position: 'relative',
                    border: '1px solid rgba(0,242,254,0.2)',
                    boxShadow: '0 0 60px rgba(0,242,254,0.1), 0 25px 50px rgba(0,0,0,0.5)'
                }}
            >
                {/* Top accent bar */}
                <div style={{ height: 3, background: 'linear-gradient(90deg, var(--primary), var(--accent), var(--primary))', borderRadius: '28px 28px 0 0' }}></div>

                {/* Header */}
                <div style={{ padding: '24px 28px 0', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                        <h3 style={{ color: '#fff', fontSize: '1.3rem', fontWeight: 800, fontFamily: "'Orbitron', sans-serif", margin: 0 }}>
                            Edit Jersey
                        </h3>
                        <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.75rem', margin: '4px 0 0' }}>
                            Order ICE-{String(orderId).padStart(3, '0')} · Jersey #{item.id}
                        </p>
                    </div>
                    <button 
                        onClick={onClose}
                        style={{
                            width: 38, height: 38, borderRadius: 12,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)',
                            cursor: 'pointer', color: 'rgba(255,255,255,0.5)', transition: 'all 0.2s ease'
                        }}
                    >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round">
                            <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                        </svg>
                    </button>
                </div>

                {/* Live Preview */}
                <div style={{ margin: '24px 28px 0' }} className="mo-preview">
                    <div className="mo-preview-badge">
                        <span>{formData.jerseyNumber || '?'}</span>
                    </div>
                    <div style={{ minWidth: 0 }}>
                        <div className="mo-preview-name">
                            {formData.jerseyName || 'No Name'}
                        </div>
                        <div className="mo-preview-tags">
                            <span className="mo-preview-tag">{formData.size}</span>
                            <span className="mo-preview-tag">{formData.sleeveType} Sleeve</span>
                        </div>
                    </div>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} style={{ padding: '24px 28px 28px' }}>
                    
                    {/* Number + Name row */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 24 }}>
                        <div className="form-group">
                            <label className="form-label">Jersey Number</label>
                            <input 
                                type="text" inputMode="numeric"
                                className="form-control"
                                style={{ borderRadius: 16, fontSize: '1.5rem', fontWeight: 900, fontFamily: "'Orbitron', sans-serif", letterSpacing: 4, textAlign: 'center' }}
                                maxLength={6}
                                value={formData.jerseyNumber}
                                onChange={(e) => setFormData({ ...formData, jerseyNumber: e.target.value })}
                                required
                                placeholder="00"
                            />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Jersey Name</label>
                            <input 
                                type="text"
                                className="form-control"
                                style={{ borderRadius: 16, textTransform: 'uppercase', fontWeight: 700, letterSpacing: 2 }}
                                maxLength={30}
                                value={formData.jerseyName}
                                onChange={(e) => setFormData({ ...formData, jerseyName: e.target.value.toUpperCase() })}
                                placeholder="ABDULLAH"
                            />
                        </div>
                    </div>

                    {/* Size selector */}
                    <div style={{ marginBottom: 24 }}>
                        <label className="form-label">Size</label>
                        <div className="selector-group">
                            {sizes.map(sz => (
                                <button
                                    key={sz}
                                    type="button"
                                    className={`selector-btn ${formData.size === sz ? 'active' : ''}`}
                                    onClick={() => setFormData({ ...formData, size: sz })}
                                    style={{ minWidth: 'auto', flex: '1 1 0', padding: '14px 8px' }}
                                >
                                    {sz}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Sleeve selector */}
                    <div className="form-group mb-0" style={{ marginTop: 16 }}>
                            <label className="form-label" style={{ display: 'flex', justifyContent: 'space-between' }}>
                                Sleeve Type
                                <span style={{ fontSize: '10px', color: 'var(--primary)', textTransform: 'uppercase', letterSpacing: 1 }}>Admin Only</span>
                            </label>
                            <input 
                                type="text"
                                className="form-control"
                                value={formData.sleeveType + " Sleeve"}
                                disabled
                                style={{ 
                                    borderRadius: 16, 
                                    background: 'rgba(255,255,255,0.02)', 
                                    color: 'rgba(255,255,255,0.3)',
                                    cursor: 'not-allowed',
                                    border: '1px solid rgba(255,255,255,0.05)'
                                }}
                            />
                        </div>

                    {/* Action buttons */}
                    <div style={{ display: 'flex', gap: 12, marginTop: 32 }}>
                        <button type="button" onClick={onClose} className="mo-btn-cancel">
                            Cancel
                        </button>
                        <button type="submit" disabled={loading} className="mo-btn-save">
                            {loading ? '⏳ Saving...' : '✅ Save Changes'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
