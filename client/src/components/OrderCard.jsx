import React, { useState } from 'react';
import { getMyOrderLogs } from '../services/api';

export default function OrderCard({ order, onEdit, onDelete }) {
    const [expanded, setExpanded] = useState(false);
    const [logs, setLogs] = useState([]);
    const [loadingLogs, setLoadingLogs] = useState(false);
    const [showHistory, setShowHistory] = useState(false);

    const fetchLogs = async () => {
        if (logs.length > 0) {
            setShowHistory(!showHistory);
            return;
        }
        
        setLoadingLogs(true);
        try {
            const res = await getMyOrderLogs(order.id);
            setLogs(res.data?.logs || []);
            setShowHistory(true);
        } catch (err) {
            console.error('Fetch logs error:', err);
        } finally {
            setLoadingLogs(false);
        }
    };

    const formatDate = (dateStr) => {
        try {
            return new Date(dateStr).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' });
        } catch { return '—'; }
    };

    const statusColors = {
        pending: { bg: 'rgba(251,191,36,0.1)', border: 'rgba(251,191,36,0.25)', color: '#fbbf24', dot: '#fbbf24' },
        done: { bg: 'rgba(52,211,153,0.1)', border: 'rgba(52,211,153,0.25)', color: '#34d399', dot: '#34d399' },
        completed: { bg: 'rgba(52,211,153,0.1)', border: 'rgba(52,211,153,0.25)', color: '#34d399', dot: '#34d399' },
        cancelled: { bg: 'rgba(251,113,133,0.1)', border: 'rgba(251,113,133,0.25)', color: '#fb7185', dot: '#fb7185' },
    };
    const sc = statusColors[order.status?.toLowerCase()] || statusColors.pending;
    const items = order.items || [];

    return (
        <div 
            className="glass-morphism-light jersey-item-card" 
            style={{ 
                borderRadius: 24, overflow: 'hidden', 
                transition: 'all 0.4s cubic-bezier(0.4,0,0.2,1)', 
                borderColor: expanded ? 'rgba(0,242,254,0.3)' : undefined, 
                boxShadow: expanded ? '0 0 40px rgba(0,242,254,0.08)' : undefined 
            }}
        >
            {/* Clickable Header */}
            <div 
                style={{ padding: '24px 28px', cursor: 'pointer', userSelect: 'none' }}
                onClick={() => setExpanded(!expanded)}
            >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
                    
                    {/* Left: Order info */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                        <div className="mo-badge">{order.id}</div>
                        <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                                <h4 style={{ margin: 0, color: '#fff', fontSize: '1.1rem', fontWeight: 800, fontFamily: "'Orbitron', sans-serif" }}>
                                    ICE-{String(order.id).padStart(3, '0')}
                                </h4>
                                <span style={{
                                    display: 'inline-flex', alignItems: 'center', gap: 6,
                                    fontSize: '0.65rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: 2,
                                    padding: '4px 12px', borderRadius: 20,
                                    background: sc.bg, border: `1px solid ${sc.border}`, color: sc.color
                                }}>
                                    <span style={{ width: 6, height: 6, borderRadius: '50%', background: sc.dot }}></span>
                                    {order.status}
                                </span>
                            </div>
                            <p style={{ margin: '4px 0 0', color: 'rgba(255,255,255,0.4)', fontSize: '0.75rem', fontWeight: 600 }}>
                                {formatDate(order.created_at)} · {items.length} {items.length === 1 ? 'jersey' : 'jerseys'}
                            </p>
                        </div>
                    </div>

                    {/* Right: Price + chevron */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
                        <div style={{ textAlign: 'right' }}>
                            <div style={{ color: '#fff', fontSize: '1.3rem', fontWeight: 800, fontFamily: "'Orbitron', sans-serif" }}>৳{order.final_price || order.finalPrice}</div>
                            <div style={{ color: 'rgba(255,255,255,0.35)', fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 2 }}>Total</div>
                        </div>
                        <div style={{
                            width: 38, height: 38, borderRadius: 12,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            background: expanded ? 'rgba(0,242,254,0.1)' : 'rgba(255,255,255,0.05)',
                            border: `1px solid ${expanded ? 'rgba(0,242,254,0.25)' : 'rgba(255,255,255,0.08)'}`,
                            transition: 'all 0.3s ease', transform: expanded ? 'rotate(180deg)' : 'rotate(0)'
                        }}>
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={expanded ? 'var(--primary)' : 'rgba(255,255,255,0.4)'} strokeWidth="3" strokeLinecap="round">
                                <path d="M6 9l6 6 6-6"/>
                            </svg>
                        </div>
                    </div>
                </div>

                {/* Collapsed preview pills */}
                {!expanded && items.length > 0 && (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 16 }}>
                        {items.map((item, i) => (
                            <span key={i} className="mo-tag" style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                                <span style={{ color: 'var(--primary)', fontWeight: 900 }}>#{item.jersey_number || item.jerseyNumber}</span>
                                <span style={{ color: 'rgba(255,255,255,0.2)' }}>·</span>
                                {item.jersey_name || item.jerseyName || 'No name'}
                                <span style={{ color: 'rgba(255,255,255,0.2)' }}>·</span>
                                {item.size}
                            </span>
                        ))}
                    </div>
                )}
            </div>

            {/* Expanded detail list */}
            {expanded && (
                <div style={{ padding: '0 28px 28px' }} className="animate-fade-in">
                    <div style={{ height: 1, background: 'linear-gradient(90deg, transparent, rgba(0,242,254,0.15), transparent)', marginBottom: 20 }}></div>
                    
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                        {items.map((item) => (
                            <div key={item.id} className="mo-item-row">
                                {/* Item info */}
                                <div style={{ display: 'flex', alignItems: 'center', gap: 14, flex: 1, minWidth: 0 }}>
                                    <div className="mo-badge">
                                        {item.jersey_number || item.jerseyNumber}
                                    </div>
                                    <div style={{ minWidth: 0 }}>
                                        <div className="mo-item-name">
                                            {item.jersey_name || item.jerseyName || 'No Name Set'}
                                        </div>
                                        <div className="mo-item-meta">
                                            <span className="mo-tag">Size: {item.size}</span>
                                            <span className="mo-tag">{item.sleeve_type || item.sleeveType} Sleeve</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Buttons */}
                                <div style={{ display: 'flex', gap: 8 }}>
                                    <button 
                                        className="mo-btn-edit"
                                        onClick={(e) => { e.stopPropagation(); onEdit({ orderId: order.id, item }); }}
                                    >
                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                            <path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/>
                                        </svg>
                                        Edit
                                    </button>
                                    <button 
                                        className="mo-btn-delete"
                                        onClick={(e) => { e.stopPropagation(); onDelete(order.id, item.id); }}
                                    >
                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                            <polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                                        </svg>
                                        Remove
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* History Section */}
                    <div style={{ marginTop: 20 }}>
                        <button 
                            onClick={(e) => { e.stopPropagation(); fetchLogs(); }}
                            style={{
                                background: 'none', border: 'none', padding: 0,
                                color: showHistory ? 'var(--primary)' : 'rgba(255,255,255,0.4)',
                                fontSize: '0.75rem', fontWeight: 700, 
                                display: 'flex', alignItems: 'center', gap: 8,
                                cursor: 'pointer', transition: 'all 0.2s ease'
                            }}
                        >
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                <path d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
                            </svg>
                            {loadingLogs ? 'Loading History...' : showHistory ? 'Hide Modification History' : 'View Modification History'}
                        </button>

                        {showHistory && logs.length > 0 && (
                            <div style={{ 
                                marginTop: 16, padding: 20, 
                                borderRadius: 16, background: 'rgba(255,255,255,0.03)',
                                border: '1px solid rgba(255,255,255,0.06)'
                            }} className="animate-fade-in">
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                                    {logs.map((log) => {
                                        const details = JSON.parse(log.details || '{}');
                                        return (
                                            <div key={log.id} style={{ display: 'flex', gap: 12 }}>
                                                <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--primary)', marginTop: 6, flexShrink: 0, boxShadow: '0 0 8px var(--primary)' }}></div>
                                                <div style={{ flex: 1 }}>
                                                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, marginBottom: 4 }}>
                                                        <span style={{ color: '#fff', fontSize: '0.8rem', fontWeight: 800 }}>Jersey Modified</span>
                                                        <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: '0.65rem' }}>{formatDate(log.created_at)}</span>
                                                    </div>
                                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                                                        {Object.entries(details).map(([field, vals]) => (
                                                            <div key={field} style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.5)', background: 'rgba(0,0,0,0.2)', padding: '4px 10px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.05)' }}>
                                                                <span style={{ textTransform: 'capitalize', color: 'var(--primary)', fontWeight: 700 }}>{field}:</span> {vals.old} → <span style={{ color: '#fff' }}>{vals.new}</span>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}

                        {showHistory && logs.length === 0 && !loadingLogs && (
                            <p style={{ marginTop: 12, fontSize: '0.75rem', color: 'rgba(255,255,255,0.25)', textAlign: 'center', padding: '16px', border: '1px dashed rgba(255,255,255,0.1)', borderRadius: 12 }}>
                                No modifications have been made to this order yet.
                            </p>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
