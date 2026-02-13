import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '../context/ToastContext';
import { useConfirm } from '../context/ConfirmContext';
import {
    verifyToken, getOrders, getStats, updateOrderStatus, updateOrder, deleteOrder,
    getExpenses, addExpense, updateExpense, deleteExpense, downloadReport, notifyCollection, bulkUpdateOrders, adminLogout
} from '../services/api';

// ========== ADMIN DASHBOARD CSS (inline styles as objects) ==========
const styles = {
    page: {
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #0f172a, #1e293b)',
        fontFamily: "'Inter', sans-serif",
        color: '#e2e8f0',
    },
    nav: {
        background: 'rgba(15,23,42,0.95)',
        backdropFilter: 'blur(20px)',
        borderBottom: '1px solid rgba(255,255,255,0.1)',
        padding: '12px 16px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '10px',
        position: 'sticky',
        top: 0,
        zIndex: 100,
    },
    title: {
        fontFamily: "'Orbitron', monospace",
        fontSize: '1.3rem',
        fontWeight: 800,
        background: 'linear-gradient(135deg, #667eea, #f093fb)',
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
    },
    container: { maxWidth: '1400px', margin: '0 auto', padding: '16px' },
    tabs: {
        display: 'flex',
        gap: '6px',
        marginBottom: '20px',
        flexWrap: 'wrap',
        overflowX: 'auto',
        WebkitOverflowScrolling: 'touch',
    },
    tab: (active) => ({
        padding: '8px 14px',
        borderRadius: '12px',
        border: 'none',
        background: active ? 'linear-gradient(135deg, #667eea, #764ba2)' : 'rgba(255,255,255,0.05)',
        color: active ? 'white' : 'rgba(255,255,255,0.6)',
        fontWeight: 700,
        cursor: 'pointer',
        transition: 'all 0.3s ease',
        fontSize: '0.8rem',
        whiteSpace: 'nowrap',
    }),
    card: {
        background: 'rgba(255,255,255,0.05)',
        backdropFilter: 'blur(10px)',
        border: '1px solid rgba(255,255,255,0.1)',
        borderRadius: '16px',
        padding: '24px',
        marginBottom: '16px',
    },
    statsGrid: {
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
        gap: '12px',
        marginBottom: '20px',
    },
    statCard: (color) => ({
        background: `linear-gradient(135deg, ${color}30, ${color}10)`,
        backdropFilter: 'blur(10px)',
        border: `1px solid ${color}50`,
        borderRadius: '24px',
        padding: '30px 24px',
        textAlign: 'center',
        position: 'relative',
        overflow: 'hidden',
        boxShadow: `0 10px 30px -10px ${color}40`,
        transition: 'all 0.3s ease',
    }),
    statIcon: (color) => ({
        position: 'absolute',
        top: '10px',
        right: '15px',
        fontSize: '2.5rem',
        color: `${color}20`,
        zIndex: 0,
    }),
    statNumber: {
        fontFamily: "'Orbitron', monospace",
        fontSize: '1.8rem',
        fontWeight: 800,
        marginBottom: '4px',
        position: 'relative',
        zIndex: 1,
        wordBreak: 'break-all',
    },
    statLabel: {
        color: 'rgba(255,255,255,0.7)',
        fontSize: '0.9rem',
        fontWeight: 700,
        textTransform: 'uppercase',
        letterSpacing: '1px',
        position: 'relative',
        zIndex: 1,
    },
    input: {
        padding: '10px 16px',
        borderRadius: '10px',
        border: '1px solid rgba(255,255,255,0.15)',
        background: 'rgba(255,255,255,0.05)',
        color: 'white',
        fontSize: '0.9rem',
        outline: 'none',
        width: '100%',
        boxSizing: 'border-box',
    },
    select: {
        padding: '10px 16px',
        borderRadius: '10px',
        border: '1px solid rgba(255,255,255,0.15)',
        background: 'rgba(30,41,59,0.9)',
        color: 'white',
        fontSize: '0.9rem',
        outline: 'none',
        width: '100%',
        boxSizing: 'border-box',
    },
    btn: (color = '#667eea') => ({
        padding: '8px 16px',
        borderRadius: '8px',
        border: 'none',
        background: color,
        color: 'white',
        fontWeight: 600,
        cursor: 'pointer',
        fontSize: '0.85rem',
        transition: 'all 0.2s ease',
    }),
    btnSmall: (color = '#667eea') => ({
        padding: '4px 10px',
        borderRadius: '6px',
        border: 'none',
        background: color,
        color: 'white',
        fontWeight: 600,
        cursor: 'pointer',
        fontSize: '0.75rem',
        margin: '2px',
    }),
    table: {
        width: '100%',
        borderCollapse: 'collapse',
        fontSize: '0.85rem',
    },
    th: {
        padding: '16px 12px',
        textAlign: 'left',
        borderBottom: '2px solid rgba(255,255,255,0.1)',
        color: 'rgba(255,255,255,0.9)',
        fontWeight: 800,
        fontSize: '0.75rem',
        textTransform: 'uppercase',
        letterSpacing: '1.5px',
    },
    td: {
        padding: '16px 12px',
        borderBottom: '1px solid rgba(255,255,255,0.05)',
        color: '#f1f5f9',
        fontSize: '0.9rem',
    },
    badge: (status) => ({
        padding: '4px 10px',
        borderRadius: '20px',
        fontSize: '0.75rem',
        fontWeight: 700,
        display: 'inline-block',
        background: status === 'done' ? 'rgba(16,185,129,0.2)' : 'rgba(245,158,11,0.2)',
        color: status === 'done' ? '#10b981' : '#f59e0b',
        border: `1px solid ${status === 'done' ? 'rgba(16,185,129,0.4)' : 'rgba(245,158,11,0.4)'}`,
    }),
};

export default function AdminDashboardPage() {
    const { showToast } = useToast();
    const { showConfirm } = useConfirm();
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('overview');
    const [stats, setStats] = useState({ totalOrders: 0, ordersByStatus: { pending: 0, done: 0 }, totalRevenue: 0 });
    const [orders, setOrders] = useState([]);
    const [filteredOrders, setFilteredOrders] = useState([]);
    const [batches, setBatches] = useState([]); // New state for batches
    const [searchName, setSearchName] = useState('');
    const [searchJersey, setSearchJersey] = useState('');
    const [searchBatch, setSearchBatch] = useState('');
    const [filterStatus, setFilterStatus] = useState('all');
    const [loading, setLoading] = useState(true);
    const [notifying, setNotifying] = useState(false);
    const [selectedOrders, setSelectedOrders] = useState([]);

    // Expenses
    const [expenses, setExpenses] = useState([]);
    const [expForm, setExpForm] = useState({ description: '', amount: '', category: 'general', date: '' });
    const [editingExpense, setEditingExpense] = useState(null);
    const [showExpEditModal, setShowExpEditModal] = useState(false);
    const [expEditFormData, setExpEditFormData] = useState({ description: '', amount: '', category: 'general', date: '' });

    // Edit Order State
    const [editingOrder, setEditingOrder] = useState(null);
    const [showEditModal, setShowEditModal] = useState(false);
    const [editFormData, setEditFormData] = useState({
        name: '',
        mobileNumber: '',
        email: '',
        transactionId: '',
        notes: '',
        items: []
    });

    useEffect(() => {
        verifyToken()
            .then(() => {
                loadData();
            })
            .catch(() => {
                localStorage.removeItem('adminAccessToken');
                localStorage.removeItem('adminRefreshToken');
                navigate('/admin');
            });
    }, [navigate]);

    const loadData = async () => {
        setLoading(true);
        try {
            const [statsRes, ordersRes] = await Promise.all([getStats(), getOrders()]);
            setStats(statsRes.data.stats);
            setOrders(ordersRes.data.orders || []);
            setFilteredOrders(ordersRes.data.orders || []);

            try {
                const expRes = await getExpenses();
                setExpenses(expRes.data.expenses || []);
            } catch (e) {
                // expenses endpoint may not exist yet
            }

            // Group by batch for Batches tab
            const batchMap = {};
            ordersRes.data.orders.forEach(o => {
                const items = Array.isArray(o.items) ? o.items.filter(i => i !== null) : [];
                items.forEach(item => {
                    const b = item.batch || 'Unassigned';
                    if (!batchMap[b]) batchMap[b] = { name: b, count: 0, orders: [] };
                    batchMap[b].count += 1;
                    if (!batchMap[b].orders.find(ord => ord.id === o.id)) {
                        batchMap[b].orders.push(o);
                    }
                });
            });
            setBatches(Object.values(batchMap).sort((a, b) => b.count - a.count));
        } catch (err) {
            console.error('Load data error:', err);
        } finally {
            setLoading(false);
        }
    };

    // Filter orders
    useEffect(() => {
        let filtered = [...orders];
        if (searchName) {
            filtered = filtered.filter((o) => o.name?.toLowerCase().includes(searchName.toLowerCase()));
        }
        if (searchJersey) {
            // Search in items jersey numbers too
            filtered = filtered.filter((o) => {
                const orderMatch = o.jersey_number?.toString().includes(searchJersey);
                const items = Array.isArray(o.items) ? o.items.filter(i => i !== null) : [];
                const itemMatch = items.some(i => i.jersey_number?.toString().includes(searchJersey));
                return orderMatch || itemMatch;
            });
        }
        if (searchBatch) {
            filtered = filtered.filter((o) => {
                const orderMatch = o.batch?.toLowerCase().includes(searchBatch.toLowerCase());
                const items = Array.isArray(o.items) ? o.items.filter(i => i !== null) : [];
                const itemMatch = items.some(i => i.batch?.toLowerCase().includes(searchBatch.toLowerCase()));
                return orderMatch || itemMatch;
            });
        }
        if (filterStatus !== 'all') {
            filtered = filtered.filter((o) => o.status === filterStatus);
        }
        setFilteredOrders(filtered);
    }, [orders, searchName, searchJersey, searchBatch, filterStatus]);

    const handleStatusChange = async (id, newStatus) => {
        const ok = await showConfirm(`Change status to "${newStatus}"?`, 'Change Order Status');
        if (!ok) return;
        try {
            await updateOrderStatus(id, newStatus);
            showToast(`Order marked as ${newStatus}`, 'success');
            await loadData();
        } catch (err) {
            showToast('Failed to update status: ' + (err.response?.data?.error || err.message), 'error');
        }
    };

    const handleEditClick = (order) => {
        setEditingOrder(order);
        // Filter out any potential null items from json_agg
        const validItems = Array.isArray(order.items) ? order.items.filter(i => i !== null) : [];
        setEditFormData({
            name: order.name || '',
            mobileNumber: order.mobile_number || '',
            email: order.email || '',
            transactionId: order.transaction_id || '',
            notes: order.notes || '',
            items: validItems.map(item => ({
                id: item.id,
                jersey_name: item.jersey_name || '',
                jersey_number: item.jersey_number || '',
                size: item.size || 'M',
                batch: item.batch || ''
            }))
        });
        setShowEditModal(true);
    };

    const handleUpdateOrder = async (e) => {
        e.preventDefault();
        try {
            await updateOrder(editingOrder.id, editFormData);
            showToast('Order updated successfully', 'success');
            setShowEditModal(false);
            await loadData();
        } catch (err) {
            showToast('Update failed: ' + (err.response?.data?.error || err.message), 'error');
        }
    };

    const handleDeleteOrder = async (id) => {
        const ok = await showConfirm('Delete this order? This action cannot be undone.', 'Delete Order');
        if (!ok) return;
        try {
            await deleteOrder(id);
            showToast('Order deleted', 'success');
            await loadData();
        } catch (err) {
            showToast('Failed to delete: ' + (err.response?.data?.error || err.message), 'error');
        }
    };

    const handleSelectAll = (e) => {
        if (e.target.checked) {
            setSelectedOrders(filteredOrders.map(o => o.id));
        } else {
            setSelectedOrders([]);
        }
    };

    const handleSelectOrder = (id) => {
        setSelectedOrders(prev =>
            prev.includes(id) ? prev.filter(oid => oid !== id) : [...prev, id]
        );
    };

    const handleBulkConfirm = async () => {
        if (selectedOrders.length === 0) return;
        const ok = await showConfirm(`Mark ${selectedOrders.length} orders as COMPLETED?`, 'Bulk Update');
        if (!ok) return;
        try {
            await bulkUpdateOrders(selectedOrders, 'done');
            showToast(`${selectedOrders.length} orders updated`, 'success');
            setSelectedOrders([]);
            await loadData();
        } catch (err) {
            showToast('Bulk update failed: ' + (err.response?.data?.error || err.message), 'error');
        }
    };

    const handleAddExpense = async (e) => {
        e.preventDefault();
        if (!expForm.description.trim() || !expForm.amount) return;
        try {
            await addExpense({
                description: expForm.description.trim(),
                amount: parseFloat(expForm.amount),
                category: expForm.category,
                date: expForm.date || new Date().toISOString().split('T')[0],
            });
            setExpForm({ description: '', amount: '', category: 'general', date: '' });
            showToast('Expense added successfully', 'success');
            const res = await getExpenses();
            setExpenses(res.data.expenses || []);
        } catch (err) {
            showToast('Failed to add expense: ' + (err.response?.data?.error || err.message), 'error');
        }
    };

    const handleExpEditClick = (exp) => {
        setEditingExpense(exp);
        setExpEditFormData({
            description: exp.description || '',
            amount: exp.amount || '',
            category: exp.category || 'general',
            date: exp.date || ''
        });
        setShowExpEditModal(true);
    };

    const handleUpdateExpense = async (e) => {
        e.preventDefault();
        try {
            await updateExpense(editingExpense.id, expEditFormData);
            showToast('Expense updated', 'success');
            setShowExpEditModal(false);
            const res = await getExpenses();
            setExpenses(res.data.expenses || []);
            loadData(); // To refresh net balance
        } catch (err) {
            showToast('Update failed: ' + (err.response?.data?.error || err.message), 'error');
        }
    };

    const handleDeleteExpense = async (id) => {
        const ok = await showConfirm('Delete this expense?', 'Delete Expense');
        if (!ok) return;
        try {
            await deleteExpense(id);
            showToast('Expense deleted', 'success');
            const res = await getExpenses();
            setExpenses(res.data.expenses || []);
        } catch (err) {
            showToast('Failed: ' + (err.response?.data?.error || err.message), 'error');
        }
    };

    const handleDownloadReport = async (type) => {
        try {
            const res = await downloadReport(type);
            const url = window.URL.createObjectURL(new Blob([res.data], {
                type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
            }));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `report-${type}-${new Date().toISOString().split('T')[0]}.xlsx`);
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(url);
        } catch (err) {
            showToast('Report download failed: ' + (err.response?.data?.error || err.message), 'error');
        }
    };

    const handleNotifyCollection = async () => {
        const ok = await showConfirm('Send "Ready for Collection" email to ALL paid users? This cannot be undone.', 'Notify Collection');
        if (!ok) return;
        try {
            setNotifying(true);
            const res = await notifyCollection();
            showToast(res.data.message, 'success');
        } catch (err) {
            showToast('Failed to send notifications: ' + (err.response?.data?.error || err.message), 'error');
        } finally {
            setNotifying(false);
        }
    };

    const handleLogout = async () => {
        const refreshToken = localStorage.getItem('adminRefreshToken');
        if (refreshToken) {
            try {
                await adminLogout(refreshToken);
            } catch (err) {
                console.error('Logout error:', err);
            }
        }
        localStorage.removeItem('adminAccessToken');
        localStorage.removeItem('adminRefreshToken');
        navigate('/admin');
    };

    const totalExpenses = expenses.reduce((sum, e) => sum + (parseFloat(e.amount) || 0), 0);

    const renderItems = (order) => {
        const validItems = Array.isArray(order.items) ? order.items.filter(i => i !== null) : [];
        if (validItems.length === 0) {
            // Fallback for old orders where items might be at top level
            const jNum = order.jersey_number || order.jerseyNumber;
            const jSize = order.size;
            const jBatch = order.batch;
            if (!jNum && !jSize) return <span style={{ opacity: 0.5 }}>No Items</span>;
            return (
                <div style={{ fontSize: '0.85rem' }}>
                    <div><span style={{ color: '#667eea', fontWeight: 'bold' }}>#{jNum || '??'}</span> - {jSize || 'N/A'}</div>
                    <div style={{ color: 'rgba(255,255,255,0.5)' }}>{jBatch || 'No Batch'}</div>
                </div>
            );
        }
        return validItems.map((item, idx) => {
            const jNum = item.jersey_number || item.jerseyNumber;
            const jName = item.jersey_name || item.jerseyName;
            return (
                <div key={idx} style={{ fontSize: '0.85rem', marginBottom: '4px' }}>
                    <div>
                        <span style={{ color: '#667eea', fontWeight: 'bold' }}>#{jNum || '??'}</span> - {item.size || 'N/A'}
                        {jName && <span style={{ marginLeft: '8px', opacity: 0.8 }}>(Name: {jName})</span>}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.5)' }}>
                        {item.batch || 'No Batch'} • {item.collar_type}/{item.sleeve_type}
                    </div>
                </div>
            );
        });
    };

    if (loading) {
        return (
            <div style={{ ...styles.page, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div style={{ textAlign: 'center' }}>
                    <div className="spinner" style={{ borderTopColor: '#667eea' }}></div>
                    <p>Loading dashboard...</p>
                </div>
            </div>
        );
    }

    return (
        <div style={styles.page}>
            {/* Navigation */}
            <nav style={styles.nav}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                    <div style={styles.title}>
                        <i className="fas fa-shield-alt"></i> ICE Admin
                    </div>
                </div>
                <div style={{ display: 'flex', gap: '10px' }}>
                    {/* Mass Email Button */}
                    <button style={styles.btn(notifying ? '#9ca3af' : '#8b5cf6')} onClick={handleNotifyCollection} disabled={notifying}>
                        <i className={`fas ${notifying ? 'fa-spinner fa-spin' : 'fa-bullhorn'}`}></i> {notifying ? 'Sending...' : 'Notify Collection'}
                    </button>
                    <button style={styles.btn('#dc3545')} onClick={handleLogout}>
                        <i className="fas fa-sign-out-alt"></i> Logout
                    </button>
                </div>
            </nav>

            <div style={styles.container}>
                {/* Tabs */}
                <div style={styles.tabs}>
                    {['overview', 'registrations', 'batches', 'expenses', 'reports'].map((tab) => (
                        <button key={tab} style={styles.tab(activeTab === tab)} onClick={() => setActiveTab(tab)}>
                            <i className={`fas fa-${tab === 'overview' ? 'chart-pie' : tab === 'registrations' ? 'user-friends' : tab === 'batches' ? 'layer-group' : tab === 'expenses' ? 'receipt' : 'file-contract'}`}></i>{' '}
                            {tab.charAt(0).toUpperCase() + tab.slice(1)}
                        </button>
                    ))}
                </div>

                {/* ====== OVERVIEW ====== */}
                {activeTab === 'overview' && (
                    <>
                        <div style={styles.statsGrid}>
                            <div style={styles.statCard('#6366f1')} onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-5px)'} onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}>
                                <i className="fas fa-shopping-bag" style={styles.statIcon('#6366f1')}></i>
                                <div style={{ ...styles.statNumber, color: '#6366f1' }}>{stats.totalOrders}</div>
                                <div style={styles.statLabel}>Total Orders</div>
                            </div>
                            <div style={styles.statCard('#f59e0b')} onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-5px)'} onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}>
                                <i className="fas fa-clock" style={styles.statIcon('#f59e0b')}></i>
                                <div style={{ ...styles.statNumber, color: '#f59e0b' }}>{stats.ordersByStatus?.pending || 0}</div>
                                <div style={styles.statLabel}>Pending</div>
                            </div>
                            <div style={styles.statCard('#10b981')} onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-5px)'} onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}>
                                <i className="fas fa-check-double" style={styles.statIcon('#10b981')}></i>
                                <div style={{ ...styles.statNumber, color: '#10b981' }}>{stats.ordersByStatus?.done || 0}</div>
                                <div style={styles.statLabel}>Completed</div>
                            </div>
                            <div style={styles.statCard('#ec4899')} onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-5px)'} onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}>
                                <i className="fas fa-coins" style={styles.statIcon('#ec4899')}></i>
                                <div style={{ ...styles.statNumber, color: '#ec4899' }}>৳{stats.totalRevenue?.toLocaleString() || 0}</div>
                                <div style={styles.statLabel}>Revenue</div>
                            </div>
                        </div>

                        <div style={styles.statsGrid}>
                            <div style={styles.statCard('#ef4444')} onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-5px)'} onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}>
                                <i className="fas fa-wallet" style={styles.statIcon('#ef4444')}></i>
                                <div style={{ ...styles.statNumber, color: '#ef4444' }}>৳{totalExpenses.toLocaleString()}</div>
                                <div style={styles.statLabel}>Total Expenses</div>
                            </div>
                            <div style={styles.statCard('#8b5cf6')} onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-5px)'} onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}>
                                <i className="fas fa-balance-scale" style={styles.statIcon('#8b5cf6')}></i>
                                <div style={{ ...styles.statNumber, color: '#8b5cf6' }}>৳{((stats.totalRevenue || 0) - totalExpenses).toLocaleString()}</div>
                                <div style={styles.statLabel}>Net Balance</div>
                            </div>
                        </div>

                        {/* Recent Orders */}
                        <div style={styles.card}>
                            <h3 style={{ marginBottom: '16px', fontWeight: 700 }}>Recent Orders</h3>
                            <div style={{ overflowX: 'auto' }}>
                                <table style={styles.table}>
                                    <thead>
                                        <tr>
                                            <th style={styles.th}>#</th>
                                            <th style={styles.th}>Name</th>
                                            <th style={styles.th}>Items</th>
                                            <th style={styles.th}>Price</th>
                                            <th style={styles.th}>Status</th>
                                            <th style={styles.th}>Date</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {orders.slice(0, 10).map((o, i) => (
                                            <tr key={o.id}>
                                                <td style={styles.td}>{i + 1}</td>
                                                <td style={styles.td}>{o.name}</td>
                                                <td style={styles.td}>{renderItems(o)}</td>
                                                <td style={styles.td}>৳{o.final_price}</td>
                                                <td style={styles.td}><span style={styles.badge(o.status)}>{o.status}</span></td>
                                                <td style={styles.td}>{new Date(o.created_at).toLocaleDateString()}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </>
                )}

                {/* ====== BATCHES ====== */}
                {activeTab === 'batches' && (
                    <div style={styles.card}>
                        <h3 style={{ marginBottom: '24px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <i className="fas fa-layer-group" style={{ color: '#8b5cf6' }}></i> Batch Summary
                        </h3>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px' }}>
                            {batches.map((batch, idx) => (
                                <div key={idx} style={{
                                    background: 'rgba(255,255,255,0.03)',
                                    border: '1px solid rgba(255,255,255,0.1)',
                                    borderRadius: '16px',
                                    padding: '20px',
                                    transition: 'transform 0.2s',
                                    cursor: 'default'
                                }} onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-5px)'} onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                                        <span style={{ fontWeight: 800, fontSize: '1.2rem', color: '#fff' }}>{batch.name}</span>
                                        <span style={{
                                            background: 'rgba(139, 92, 246, 0.2)',
                                            color: '#a78bfa',
                                            padding: '4px 12px',
                                            borderRadius: '20px',
                                            fontSize: '0.8rem',
                                            fontWeight: 700
                                        }}>{batch.count} Jerseys</span>
                                    </div>
                                    <div style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.6)' }}>
                                        <p style={{ margin: '4px 0' }}><i className="fas fa-user-check" style={{ width: '20px' }}></i> {batch.orders.length} Customers</p>
                                        <p style={{ margin: '4px 0' }}><i className="fas fa-calendar-alt" style={{ width: '20px' }}></i> Active Batch</p>
                                    </div>
                                    <button
                                        style={{ ...styles.btnSmall('rgba(255,255,255,0.05)'), width: '100%', marginTop: '15px', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.8)' }}
                                        onClick={() => {
                                            setSearchBatch(batch.name);
                                            setActiveTab('registrations');
                                        }}
                                    >
                                        View All Orders
                                    </button>
                                </div>
                            ))}
                        </div>
                        {batches.length === 0 && (
                            <div style={{ textAlign: 'center', padding: '40px', color: 'rgba(255,255,255,0.3)' }}>
                                <i className="fas fa-inbox" style={{ fontSize: '3rem', marginBottom: '16px' }}></i>
                                <p>No batches found</p>
                            </div>
                        )}
                    </div>
                )}
                {activeTab === 'registrations' && (
                    <>
                        {/* Search/Filter */}
                        <div style={styles.card}>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px' }}>
                                <input style={styles.input} placeholder="Search by name..." value={searchName} onChange={(e) => setSearchName(e.target.value)} />
                                <input style={styles.input} placeholder="Jersey number..." value={searchJersey} onChange={(e) => setSearchJersey(e.target.value)} />
                                <input style={styles.input} placeholder="Batch..." value={searchBatch} onChange={(e) => setSearchBatch(e.target.value)} />
                                <select style={styles.select} value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
                                    <option value="all">All Status</option>
                                    <option value="pending">Pending</option>
                                    <option value="done">Done</option>
                                </select>
                            </div>
                            <p style={{ marginTop: '8px', color: 'rgba(255,255,255,0.5)', fontSize: '0.85rem' }}>
                                Showing {filteredOrders.length} of {orders.length} orders
                                {selectedOrders.length > 0 && (
                                    <span style={{ marginLeft: '16px', color: '#10b981', fontWeight: 700 }}>
                                        {selectedOrders.length} selected
                                    </span>
                                )}
                            </p>
                            {selectedOrders.length > 0 && (
                                <div style={{ marginTop: '16px', display: 'flex', gap: '10px' }}>
                                    <button style={styles.btn('#10b981')} onClick={handleBulkConfirm}>
                                        <i className="fas fa-check-double"></i> Mark Selected as Done
                                    </button>
                                    <button style={styles.btn('#475569')} onClick={() => setSelectedOrders([])}>
                                        Cancel Selection
                                    </button>
                                </div>
                            )}
                        </div>

                        {/* Orders Table */}
                        <div style={{ ...styles.card, overflowX: 'auto' }}>
                            <table style={styles.table}>
                                <thead>
                                    <tr>
                                        <th style={styles.th}>
                                            <input
                                                type="checkbox"
                                                checked={selectedOrders.length === filteredOrders.length && filteredOrders.length > 0}
                                                onChange={handleSelectAll}
                                            />
                                        </th>
                                        <th style={styles.th}>#</th>
                                        <th style={styles.th}>Name</th>
                                        <th style={styles.th}>Mobile</th>
                                        <th style={{ ...styles.th, minWidth: '200px' }}>Items Details</th>
                                        <th style={styles.th}>TxID</th>
                                        <th style={styles.th}>Price</th>
                                        <th style={styles.th}>Status</th>
                                        <th style={styles.th}>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredOrders.map((o, i) => (
                                        <tr key={o.id} style={{ background: selectedOrders.includes(o.id) ? 'rgba(102, 126, 234, 0.1)' : 'transparent' }}>
                                            <td style={styles.td}>
                                                <input
                                                    type="checkbox"
                                                    checked={selectedOrders.includes(o.id)}
                                                    onChange={() => handleSelectOrder(o.id)}
                                                />
                                            </td>
                                            <td style={styles.td}>{i + 1}</td>
                                            <td style={styles.td}>{o.name}</td>
                                            <td style={styles.td}>{o.mobile_number}</td>
                                            <td style={styles.td}>{renderItems(o)}</td>
                                            <td style={styles.td}>{o.transaction_id || '-'}</td>
                                            <td style={styles.td}>৳{o.final_price}</td>
                                            <td style={styles.td}><span style={styles.badge(o.status)}>{o.status}</span></td>
                                            <td style={styles.td}>
                                                <div style={{ display: 'flex', gap: '5px' }}>
                                                    {o.status === 'pending' ? (
                                                        <button style={styles.btnSmall('#10b981')} onClick={() => handleStatusChange(o.id, 'done')}>
                                                            <i className="fas fa-check"></i> Done
                                                        </button>
                                                    ) : (
                                                        <button style={styles.btnSmall('#f59e0b')} onClick={() => handleStatusChange(o.id, 'pending')}>
                                                            <i className="fas fa-undo"></i> Undo
                                                        </button>
                                                    )}
                                                    <button style={styles.btnSmall('#667eea')} onClick={() => handleEditClick(o)}>
                                                        <i className="fas fa-edit"></i>
                                                    </button>
                                                    <button style={styles.btnSmall('#dc3545')} onClick={() => handleDeleteOrder(o.id)}>
                                                        <i className="fas fa-trash"></i>
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                            {filteredOrders.length === 0 && (
                                <p style={{ textAlign: 'center', padding: '24px', color: 'rgba(255,255,255,0.4)' }}>No orders found</p>
                            )}
                        </div>
                    </>
                )}

                {/* ====== EXPENSES ====== */}
                {activeTab === 'expenses' && (
                    <>
                        <div style={styles.card}>
                            <h3 style={{ marginBottom: '16px', fontWeight: 700 }}>Add Expense</h3>
                            <form onSubmit={handleAddExpense} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px', alignItems: 'end' }}>
                                <div>
                                    <label style={{ fontSize: '0.8rem', fontWeight: 600, display: 'block', marginBottom: '4px', color: 'rgba(255,255,255,0.7)' }}>Description</label>
                                    <input style={styles.input} placeholder="e.g. Transport cost" value={expForm.description} onChange={(e) => setExpForm({ ...expForm, description: e.target.value })} required />
                                </div>
                                <div>
                                    <label style={{ fontSize: '0.8rem', fontWeight: 600, display: 'block', marginBottom: '4px', color: 'rgba(255,255,255,0.7)' }}>Amount (৳)</label>
                                    <input style={styles.input} type="number" placeholder="0" value={expForm.amount} onChange={(e) => setExpForm({ ...expForm, amount: e.target.value })} required />
                                </div>
                                <div>
                                    <label style={{ fontSize: '0.8rem', fontWeight: 600, display: 'block', marginBottom: '4px', color: 'rgba(255,255,255,0.7)' }}>Category</label>
                                    <select style={styles.select} value={expForm.category} onChange={(e) => setExpForm({ ...expForm, category: e.target.value })}>
                                        <option value="general">General</option>
                                        <option value="transport">Transport</option>
                                        <option value="printing">Printing</option>
                                        <option value="material">Material</option>
                                        <option value="food">Food</option>
                                        <option value="other">Other</option>
                                    </select>
                                </div>
                                <div>
                                    <label style={{ fontSize: '0.8rem', fontWeight: 600, display: 'block', marginBottom: '4px', color: 'rgba(255,255,255,0.7)' }}>Date</label>
                                    <input style={styles.input} type="date" value={expForm.date} onChange={(e) => setExpForm({ ...expForm, date: e.target.value })} />
                                </div>
                                <button type="submit" style={styles.btn('#10b981')}>
                                    <i className="fas fa-plus"></i> Add
                                </button>
                            </form>
                        </div>

                        <div style={styles.statsGrid}>
                            <div style={styles.statCard('#dc3545')}>
                                <div style={{ ...styles.statNumber, color: '#dc3545' }}>৳{totalExpenses.toLocaleString()}</div>
                                <div style={styles.statLabel}>Total Expenses</div>
                            </div>
                            <div style={styles.statCard('#667eea')}>
                                <div style={{ ...styles.statNumber, color: '#667eea' }}>{expenses.length}</div>
                                <div style={styles.statLabel}>Expense Entries</div>
                            </div>
                        </div>

                        <div style={{ ...styles.card, overflowX: 'auto' }}>
                            <table style={styles.table}>
                                <thead>
                                    <tr>
                                        <th style={styles.th}>#</th>
                                        <th style={styles.th}>Description</th>
                                        <th style={styles.th}>Amount</th>
                                        <th style={styles.th}>Category</th>
                                        <th style={styles.th}>Date</th>
                                        <th style={styles.th}>Action</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {expenses.map((e, i) => (
                                        <tr key={e.id}>
                                            <td style={styles.td}>{i + 1}</td>
                                            <td style={styles.td}>{e.description}</td>
                                            <td style={styles.td}>৳{parseFloat(e.amount).toLocaleString()}</td>
                                            <td style={styles.td}>{e.category}</td>
                                            <td style={styles.td}>{e.date ? new Date(e.date).toLocaleDateString() : '-'}</td>
                                            <td style={styles.td}>
                                                <div style={{ display: 'flex', gap: '5px' }}>
                                                    <button style={styles.btnSmall('#667eea')} onClick={() => handleExpEditClick(e)}>
                                                        <i className="fas fa-edit"></i>
                                                    </button>
                                                    <button style={styles.btnSmall('#dc3545')} onClick={() => handleDeleteExpense(e.id)}>
                                                        <i className="fas fa-trash"></i>
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                            {expenses.length === 0 && (
                                <p style={{ textAlign: 'center', padding: '24px', color: 'rgba(255,255,255,0.4)' }}>No expenses yet</p>
                            )}
                        </div>
                    </>
                )}

                {/* ====== REPORTS ====== */}
                {activeTab === 'reports' && (
                    <div style={styles.card}>
                        <h3 style={{ marginBottom: '24px', fontWeight: 700 }}>
                            <i className="fas fa-file-excel"></i> Download Reports
                        </h3>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
                            {[
                                { type: 'all', icon: 'fa-list', title: 'All Registrations', desc: 'Complete list of all orders', color: '#667eea' },
                                { type: 'paid', icon: 'fa-check-circle', title: 'Paid Users', desc: 'All completed/paid orders', color: '#10b981' },
                                { type: 'unpaid', icon: 'fa-clock', title: 'Unpaid Users', desc: 'All pending orders', color: '#f59e0b' },
                                { type: 'batch', icon: 'fa-layer-group', title: 'Batch-wise Report', desc: 'Orders organized by batch', color: '#8b5cf6' },
                                { type: 'financial', icon: 'fa-chart-line', title: 'Financial Summary', desc: 'Revenue and payment summary', color: '#06b6d4' },
                                { type: 'expenses', icon: 'fa-receipt', title: 'Expenses Report', desc: 'All expenses breakdown', color: '#dc3545' },
                            ].map((r) => (
                                <div
                                    key={r.type}
                                    style={{
                                        background: `linear-gradient(135deg, ${r.color}15, ${r.color}08)`,
                                        border: `1px solid ${r.color}30`,
                                        borderRadius: '14px',
                                        padding: '24px',
                                        cursor: 'pointer',
                                        transition: 'all 0.3s ease',
                                    }}
                                    onClick={() => handleDownloadReport(r.type)}
                                    onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-4px)'; }}
                                    onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; }}
                                >
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                                        <div style={{
                                            width: '48px', height: '48px', borderRadius: '12px',
                                            background: `${r.color}30`, display: 'flex', alignItems: 'center',
                                            justifyContent: 'center', fontSize: '1.2rem', color: r.color,
                                        }}>
                                            <i className={`fas ${r.icon}`}></i>
                                        </div>
                                        <div>
                                            <div style={{ fontWeight: 700, fontSize: '1rem' }}>{r.title}</div>
                                            <div style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.5)' }}>{r.desc}</div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* Edit Order Modal */}
            {showEditModal && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
                    background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center',
                    justifyContent: 'center', zIndex: 1000, backdropFilter: 'blur(5px)'
                }}>
                    <div style={{
                        background: '#1e293b', padding: '32px', borderRadius: '24px',
                        width: '95%', maxWidth: '800px', border: '1px solid rgba(255,255,255,0.1)',
                        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
                        maxHeight: '90vh', overflowY: 'auto'
                    }}>
                        <h3 style={{ marginBottom: '24px', fontFamily: "'Orbitron', monospace", color: '#fff' }}>Edit Order Details</h3>
                        <form onSubmit={handleUpdateOrder}>
                            <div style={{ marginBottom: '16px' }}>
                                <label style={{ ...styles.statLabel, display: 'block', marginBottom: '8px' }}>Customer Name</label>
                                <input style={styles.input} value={editFormData.name} onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })} required />
                            </div>
                            <div style={{ marginBottom: '16px' }}>
                                <label style={{ ...styles.statLabel, display: 'block', marginBottom: '8px' }}>Mobile Number</label>
                                <input style={styles.input} value={editFormData.mobileNumber} onChange={(e) => setEditFormData({ ...editFormData, mobileNumber: e.target.value })} required />
                            </div>
                            <div style={{ marginBottom: '16px' }}>
                                <label style={{ ...styles.statLabel, display: 'block', marginBottom: '8px' }}>Email Address</label>
                                <input style={styles.input} type="email" value={editFormData.email} onChange={(e) => setEditFormData({ ...editFormData, email: e.target.value })} required />
                            </div>
                            <div style={{ marginBottom: '16px' }}>
                                <label style={{ ...styles.statLabel, display: 'block', marginBottom: '8px' }}>Transaction ID</label>
                                <input style={styles.input} value={editFormData.transactionId} onChange={(e) => setEditFormData({ ...editFormData, transactionId: e.target.value })} />
                            </div>
                            <div style={{ marginBottom: '24px' }}>
                                <label style={{ ...styles.statLabel, display: 'block', marginBottom: '8px' }}>Notes</label>
                                <textarea style={{ ...styles.input, height: '80px', resize: 'none' }} value={editFormData.notes} onChange={(e) => setEditFormData({ ...editFormData, notes: e.target.value })} />
                            </div>

                            <div style={{ padding: '20px', background: 'rgba(255,255,255,0.02)', borderRadius: '16px', marginBottom: '24px' }}>
                                <label style={{ ...styles.statLabel, display: 'block', marginBottom: '16px', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '8px', color: '#667eea' }}>
                                    <i className="fas fa-tshirt" style={{ marginRight: '8px' }}></i> Jersey Items
                                </label>

                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 100px 100px', gap: '15px', marginBottom: '10px', padding: '0 12px' }}>
                                    <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase' }}>Jersey Print Name</div>
                                    <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase' }}>Number</div>
                                    <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase' }}>Size</div>
                                </div>

                                {editFormData.items.map((item, idx) => {
                                    if (!item) return null;
                                    return (
                                        <div key={idx} style={{
                                            padding: '12px',
                                            background: 'rgba(255,255,255,0.03)',
                                            borderRadius: '12px',
                                            marginBottom: '10px',
                                            border: '1px solid rgba(255,255,255,0.05)'
                                        }}>
                                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 100px 100px', gap: '15px' }}>
                                                <div>
                                                    <input
                                                        style={{ ...styles.input, fontSize: '0.9rem', padding: '10px 14px' }}
                                                        placeholder="e.g. JOHN DOE"
                                                        value={item.jersey_name || ''}
                                                        onChange={(e) => {
                                                            const newItems = [...editFormData.items];
                                                            newItems[idx].jersey_name = e.target.value.toUpperCase();
                                                            setEditFormData({ ...editFormData, items: newItems });
                                                        }}
                                                    />
                                                </div>
                                                <div>
                                                    <input
                                                        style={{ ...styles.input, fontSize: '0.9rem', padding: '10px 14px' }}
                                                        placeholder="No."
                                                        value={item.jersey_number || ''}
                                                        onChange={(e) => {
                                                            const newItems = [...editFormData.items];
                                                            newItems[idx].jersey_number = e.target.value;
                                                            setEditFormData({ ...editFormData, items: newItems });
                                                        }}
                                                    />
                                                </div>
                                                <div>
                                                    <select
                                                        style={{ ...styles.select, fontSize: '0.9rem', padding: '10px 14px' }}
                                                        value={item.size || ''}
                                                        onChange={(e) => {
                                                            const newItems = [...editFormData.items];
                                                            newItems[idx].size = e.target.value;
                                                            setEditFormData({ ...editFormData, items: newItems });
                                                        }}
                                                    >
                                                        {['S', 'M', 'L', 'XL', 'XXL', '3XL', '4XL'].map(s => <option key={s} value={s}>{s}</option>)}
                                                    </select>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>

                            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                                <button type="button" style={styles.btn('#475569')} onClick={() => setShowEditModal(false)}>Cancel</button>
                                <button type="submit" style={styles.btn('#667eea')}>Save Changes</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
            {/* Edit Expense Modal */}
            {showExpEditModal && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
                    background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center',
                    justifyContent: 'center', zIndex: 1000, backdropFilter: 'blur(5px)'
                }}>
                    <div style={{
                        background: '#1e293b', padding: '32px', borderRadius: '24px',
                        width: '95%', maxWidth: '500px', border: '1px solid rgba(255,255,255,0.1)',
                        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)'
                    }}>
                        <h3 style={{ marginBottom: '24px', fontFamily: "'Orbitron', monospace", color: '#fff' }}>Edit Expense</h3>
                        <form onSubmit={handleUpdateExpense}>
                            <div style={{ marginBottom: '16px' }}>
                                <label style={{ ...styles.statLabel, display: 'block', marginBottom: '8px' }}>Description</label>
                                <input style={styles.input} value={expEditFormData.description} onChange={(e) => setExpEditFormData({ ...expEditFormData, description: e.target.value })} required />
                            </div>
                            <div style={{ marginBottom: '16px' }}>
                                <label style={{ ...styles.statLabel, display: 'block', marginBottom: '8px' }}>Amount (৳)</label>
                                <input style={styles.input} type="number" value={expEditFormData.amount} onChange={(e) => setExpEditFormData({ ...expEditFormData, amount: e.target.value })} required />
                            </div>
                            <div style={{ marginBottom: '16px' }}>
                                <label style={{ ...styles.statLabel, display: 'block', marginBottom: '8px' }}>Category</label>
                                <select style={styles.select} value={expEditFormData.category} onChange={(e) => setExpEditFormData({ ...expEditFormData, category: e.target.value })}>
                                    <option value="general">General</option>
                                    <option value="transport">Transport</option>
                                    <option value="printing">Printing</option>
                                    <option value="material">Material</option>
                                    <option value="food">Food</option>
                                    <option value="other">Other</option>
                                </select>
                            </div>
                            <div style={{ marginBottom: '24px' }}>
                                <label style={{ ...styles.statLabel, display: 'block', marginBottom: '8px' }}>Date</label>
                                <input style={styles.input} type="date" value={expEditFormData.date} onChange={(e) => setExpEditFormData({ ...expEditFormData, date: e.target.value })} />
                            </div>
                            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                                <button type="button" style={styles.btn('#475569')} onClick={() => setShowExpEditModal(false)}>Cancel</button>
                                <button type="submit" style={styles.btn('#10b981')}>Save Changes</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
