import React, { useState, useCallback, useRef, useEffect, useLayoutEffect } from 'react';
import { checkJerseyNumber, checkNameExists, checkDuplicateContact } from '../services/api';
import { useToast } from '../context/ToastContext';
import PaymentSystem from './PaymentSystem';
import gsap from 'gsap';

// Price calculation logic
const PRICES = {
    'round-half': 400,
    'round-full': 500,
    'polo-half': 360,
    'polo-full': 400,
};

function calculateItemPrice(collarType, sleeveType) {
    if (!collarType || !sleeveType) return 0;
    return PRICES[`${collarType}-${sleeveType}`] || 400;
}

// Validation logic (kept same)
const validators = {
    name: (v) => (!v || !v.trim() ? 'Name is required' : v.trim().length < 2 ? 'Name must be at least 2 characters' : null),
    mobileNumber: (v) => (!v || !v.trim() ? 'Mobile Number is required' : !/^\d+$/.test(v.trim()) ? 'Mobile number must contain only digits' : null),
    email: (v) => (!v || !v.trim() ? 'Email is required' : !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v) ? 'Please enter a valid email address' : null),
    jerseyNumber: (v) => {
        if (!v || !v.trim()) return 'Jersey number is required';
        if (!/^\d+$/.test(v.trim())) return 'Jersey number must contain only digits';
        const num = parseInt(v.trim(), 10);
        if (isNaN(num) || num < 0 || num > 500) return 'Jersey number must be between 0 and 500';
        return null;
    },
    jerseyName: (v) => (!v || !v.trim() ? 'Jersey name is required' : v.trim().length < 2 ? 'Name must be at least 2 characters' : null),
    size: (v) => (!v ? 'Please select a size' : null),
    collarType: (v) => (!v ? 'Please select collar type' : null),
    sleeveType: (v) => (!v ? 'Please select sleeve type' : null),
};

function debounce(fn, ms) {
    let timer;
    return (...args) => {
        clearTimeout(timer);
        timer = setTimeout(() => fn(...args), ms);
    };
}

export default function OrderForm({ onSubmit, onPriceChange }) {
    const { showToast } = useToast();
    const formRef = useRef(null);
    const [customer, setCustomer] = useState({
        name: '', mobileNumber: '', email: '', notes: '',
        preSelectedMethod: '', preSelectedProvider: '',
        confirmedAmount: 0, confirmedTotal: 0,
        txnId: ''
    });

    const [items, setItems] = useState([
        { id: 'init-' + Date.now(), jerseyNumber: '', jerseyName: '', batch: '', size: '', collarType: 'polo', sleeveType: 'half', price: 360 }
    ]);

    const [errors, setErrors] = useState({});
    const [fieldStatus, setFieldStatus] = useState({});
    const [warnings, setWarnings] = useState({});

    useEffect(() => {
        const total = items.reduce((sum, item) => sum + (item.price || 0), 0);
        onPriceChange(total);
    }, [items, onPriceChange]);

    // GSAP Animations
    useLayoutEffect(() => {
        const isMobile = window.innerWidth <= 768;
        const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

        if (prefersReducedMotion) return;

        const ctx = gsap.context(() => {
            gsap.fromTo('.glass-card',
                { y: isMobile ? 30 : 50, opacity: 0, scale: isMobile ? 1 : 0.95 },
                { y: 0, opacity: 1, scale: 1, duration: isMobile ? 0.6 : 0.8, stagger: isMobile ? 0.1 : 0.2, ease: 'power3.out' }
            );

            gsap.fromTo('.section-title',
                { y: isMobile ? -30 : -50, opacity: 0 },
                { y: 0, opacity: 1, duration: isMobile ? 0.8 : 1, ease: 'power3.out' }
            );
        }, formRef);

        return () => ctx.revert();
    }, [items.length]);

    // Validation & API Refs
    const debouncedNameCheck = useRef(
        debounce(async (name, itemId) => {
            if (!name || name.length < 2) return;
            try {
                const res = await checkNameExists(name);
                const errorKey = `jerseyName_${itemId}`;
                if (res.data.exists) {
                    setErrors((prev) => ({ ...prev, [errorKey]: 'This jersey name is already taken, but you can still use it.' }));
                    setFieldStatus((prev) => ({ ...prev, [errorKey]: 'error' }));
                } else {
                    setFieldStatus((prev) => ({ ...prev, [errorKey]: 'success' }));
                    setErrors((prev) => { const n = { ...prev }; delete n[errorKey]; return n; });
                }
            } catch (e) { /* ignore */ }
        }, 500)
    ).current;

    const debouncedJerseyCheck = useRef(
        debounce(async (jerseyNumber, itemId) => {
            if (!jerseyNumber) return;
            try {
                const res = await checkJerseyNumber(jerseyNumber);
                if (!res.data.available) {
                    setErrors((prev) => ({ ...prev, [`jerseyNumber_${itemId}`]: 'This number is taken.' }));
                    setFieldStatus((prev) => ({ ...prev, [`jerseyNumber_${itemId}`]: 'warning' }));
                } else {
                    setFieldStatus((prev) => ({ ...prev, [`jerseyNumber_${itemId}`]: 'success' }));
                    setErrors((prev) => { const n = { ...prev }; delete n[`jerseyNumber_${itemId}`]; return n; });
                }
            } catch (e) { /* ignore */ }
        }, 500)
    ).current;

    const debouncedContactCheck = useRef(
        debounce(async (field, value) => {
            if (!value || value.length < 5) return;
            try {
                const res = await checkDuplicateContact({ [field]: value });
                if (res.data.exists) {
                    setWarnings((prev) => ({ ...prev, [field]: 'This contact has already placed an order. You can still proceed.' }));
                } else {
                    setWarnings((prev) => { const n = { ...prev }; delete n[field]; return n; });
                }
            } catch (e) { /* ignore */ }
        }, 800)
    ).current;

    const handleCustomerChange = useCallback((field, value) => {
        setCustomer(prev => ({ ...prev, [field]: value }));
        const error = validators[field]?.(value);
        if (!error) {
            setErrors(prev => { const n = { ...prev }; delete n[field]; return n; });
            if (value.trim?.()) setFieldStatus(prev => ({ ...prev, [field]: 'success' }));
            if (field === 'email' || field === 'mobileNumber') debouncedContactCheck(field, value);
        }
    }, [debouncedContactCheck]);

    const handleItemChange = useCallback((id, field, value) => {
        setItems(prevItems => prevItems.map(item => {
            if (item.id !== id) return item;
            const updatedItem = { ...item, [field]: value };
            if (field === 'collarType' || field === 'sleeveType') {
                updatedItem.price = calculateItemPrice(
                    field === 'collarType' ? value : item.collarType,
                    field === 'sleeveType' ? value : item.sleeveType
                );
            }
            return updatedItem;
        }));

        const error = validators[field]?.(value);
        const errorKey = `${field}_${id}`;
        if (!error) {
            setErrors(prev => { const n = { ...prev }; delete n[errorKey]; return n; });
            if (value?.trim?.() || field === 'batch') setFieldStatus(prev => ({ ...prev, [errorKey]: 'success' }));
        }
        if (field === 'jerseyNumber') debouncedJerseyCheck(value.trim(), id);
        if (field === 'jerseyName') debouncedNameCheck(value.trim(), id);
    }, [debouncedJerseyCheck, debouncedNameCheck]);

    const handleBlur = useCallback((field, value, itemId = null) => {
        const error = validators[field]?.(value);
        const key = itemId ? `${field}_${itemId}` : field;
        if (error) {
            setErrors(prev => ({ ...prev, [key]: error }));
            setFieldStatus(prev => ({ ...prev, [key]: 'error' }));
        } else if (value?.trim?.() || field === 'batch') {
            setFieldStatus(prev => ({ ...prev, [key]: 'success' }));
        }
    }, []);

    const addItem = () => {
        setItems(prev => [
            ...prev,
            { id: `item-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`, jerseyNumber: '', jerseyName: '', batch: '', size: '', collarType: 'polo', sleeveType: 'half', price: 360 }
        ]);
    };

    const removeItem = (id) => {
        if (items.length === 1) return;
        setItems(prev => prev.filter(i => i.id !== id));
        setErrors(prev => {
            const next = { ...prev };
            Object.keys(next).forEach(key => { if (key.endsWith(`_${id}`)) delete next[key]; });
            return next;
        });
    };

    const validateAll = () => {
        const newErrors = {};
        ['name', 'mobileNumber', 'email'].forEach(f => {
            const err = validators[f](customer[f]);
            if (err) newErrors[f] = err;
        });
        items.forEach(item => {
            ['jerseyNumber', 'jerseyName', 'size', 'collarType', 'sleeveType'].forEach(f => {
                const err = validators[f](item[f]);
                if (err) newErrors[`${f}_${item.id}`] = err;
            });
        });

        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            const newStatus = {};
            Object.keys(newErrors).forEach(k => newStatus[k] = 'error');
            setFieldStatus(prev => ({ ...prev, ...newStatus }));
            const firstField = Object.keys(newErrors)[0];
            const element = document.getElementById(firstField);
            if (element) {
                element.scrollIntoView({ behavior: 'smooth', block: 'center' });
                const input = element.tagName === 'INPUT' || element.tagName === 'SELECT' ? element : element.querySelector('input, select');
                input?.focus();
            }
            return false;
        }
        return true;
    };

    const handleFormSubmit = (e, overrideCustomer = null) => {
        if (e) e.preventDefault();
        if (!validateAll()) {
            showToast('Please fill in all required fields marked in red.', 'error');
            return;
        }
        const currentCustomer = overrideCustomer || customer;
        const basePrice = items.reduce((s, i) => s + i.price, 0);
        const finalTotal = currentCustomer.confirmedTotal || basePrice;

        onSubmit({
            ...currentCustomer,
            items,
            totalPrice: finalTotal,
            skipModal: !!currentCustomer.preSelectedMethod
        });
    };

    const fieldClass = (key) => {
        const s = fieldStatus[key];
        return s === 'error' ? 'error' : s === 'success' ? 'success' : '';
    };

    const batches = ['1st', '2nd', '3rd', '4th', '5th', '6th', '7th', '8th', '9th', '10th', '11th', '12th', '13th', '14th', '15th', '16th', '17th', '18th', 'Others'];

    // --- High-End Glass Styles ---

    const glassCardStyle = {
        background: 'rgba(255, 255, 255, 0.03)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        borderRadius: '24px',
        padding: '40px',
        boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.3)',
        position: 'relative',
        overflow: 'hidden'
    };

    const inputStyle = {
        background: 'rgba(0, 0, 0, 0.2)',
        color: '#ffffff',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        borderRadius: '12px',
        padding: '16px 20px',
        fontSize: '1rem',
        width: '100%',
        transition: 'all 0.3s ease',
        outline: 'none',
        fontFamily: "'Poppins', sans-serif"
    };

    const labelStyle = {
        color: 'rgba(255,255,255,0.7)',
        fontSize: '0.85rem',
        fontWeight: '500',
        marginBottom: '10px',
        display: 'block',
        fontFamily: "'Poppins', sans-serif",
        textTransform: 'uppercase',
        letterSpacing: '1px'
    };

    const headerStyle = {
        fontFamily: "'Orbitron', sans-serif",
        color: '#ffffff',
        fontWeight: '800',
        letterSpacing: '2px',
        textShadow: '0 0 20px rgba(99, 102, 241, 0.5)'
    };

    // Helper for Glass Segmented Control
    const SegmentedControl = ({ options, value, onChange }) => (
        <div style={{
            background: 'rgba(0, 0, 0, 0.3)',
            borderRadius: '16px',
            padding: '6px',
            display: 'flex',
            gap: '8px',
            border: '1px solid rgba(255, 255, 255, 0.05)'
        }}>
            {options.map((opt) => (
                <div key={opt.value}
                    onClick={() => onChange(opt.value)}
                    className="hover-glow"
                    style={{
                        flex: 1,
                        textAlign: 'center',
                        padding: '14px',
                        background: value === opt.value ? 'rgba(99, 102, 241, 0.8)' : 'transparent',
                        color: '#ffffff',
                        borderRadius: '12px',
                        cursor: 'pointer',
                        fontWeight: '600',
                        fontSize: '0.9rem',
                        transition: 'all 0.3s ease',
                        boxShadow: value === opt.value ? '0 0 20px rgba(99, 102, 241, 0.4)' : 'none',
                        border: value === opt.value ? '1px solid rgba(255,255,255,0.2)' : '1px solid transparent'
                    }}>
                    {opt.label}
                </div>
            ))}
        </div>
    );

    return (
        <section ref={formRef} className="order-section" style={{ background: 'transparent', padding: '60px 0', position: 'relative', zIndex: 10 }}>
            <h2 className="section-title text-center mb-5" style={{
                ...headerStyle, fontSize: '3rem'
            }}>
                START YOUR <span style={{ color: '#818cf8' }}>LEGACY</span>
            </h2>

            <form id="jersey-order-form" className="order-form container" noValidate onSubmit={handleFormSubmit}>

                {/* Customer Details Card */}
                <div style={glassCardStyle} className="mb-5 glass-card">
                    <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '4px', background: 'linear-gradient(90deg, #6366f1, #a855f7)' }}></div>
                    <h4 className="mb-5" style={{ ...headerStyle, fontSize: '1.5rem', display: 'flex', alignItems: 'center', gap: '15px' }}>
                        <i className="fas fa-user-astronaut" style={{ color: '#818cf8' }}></i> PILOT DATA
                    </h4>

                    <div className="row g-4">
                        <div className="col-lg-6">
                            <label style={labelStyle}>Full Name</label>
                            <input type="text" className={`form-control-custom ${fieldClass('name')}`}
                                placeholder="ENTER NAME" style={{ ...inputStyle }}
                                value={customer.name} onChange={(e) => handleCustomerChange('name', e.target.value)}
                                onFocus={(e) => { e.target.style.background = 'rgba(99, 102, 241, 0.1)'; e.target.style.borderColor = '#818cf8'; e.target.style.boxShadow = '0 0 15px rgba(99, 102, 241, 0.2)'; }}
                                onBlur={(e) => {
                                    e.target.style.background = 'rgba(0, 0, 0, 0.2)';
                                    e.target.style.borderColor = 'rgba(255, 255, 255, 0.1)';
                                    e.target.style.boxShadow = 'none';
                                    handleBlur('name', e.target.value);
                                }} required />
                            {errors.name && <div className="text-danger small mt-2 ps-1">{errors.name}</div>}
                        </div>
                        <div className="col-lg-6">
                            <label style={labelStyle}>Comms Link (Phone)</label>
                            <input type="text" className={`form-control-custom ${fieldClass('mobileNumber')}`}
                                placeholder="01xxxxxxxxx" style={inputStyle}
                                value={customer.mobileNumber} onChange={(e) => handleCustomerChange('mobileNumber', e.target.value)}
                                onFocus={(e) => { e.target.style.background = 'rgba(99, 102, 241, 0.1)'; e.target.style.borderColor = '#818cf8'; e.target.style.boxShadow = '0 0 15px rgba(99, 102, 241, 0.2)'; }}
                                onBlur={(e) => {
                                    e.target.style.background = 'rgba(0, 0, 0, 0.2)';
                                    e.target.style.borderColor = 'rgba(255, 255, 255, 0.1)';
                                    e.target.style.boxShadow = 'none';
                                    handleBlur('mobileNumber', e.target.value);
                                }} required />
                            {errors.mobileNumber && <div className="text-danger small mt-2 ps-1">{errors.mobileNumber}</div>}
                        </div>
                        <div className="col-lg-6">
                            <label style={labelStyle}>Digital ID (Email)</label>
                            <input type="email" className={`form-control-custom ${fieldClass('email')}`}
                                placeholder="name@example.com" style={inputStyle}
                                value={customer.email} onChange={(e) => handleCustomerChange('email', e.target.value)}
                                onFocus={(e) => { e.target.style.background = 'rgba(99, 102, 241, 0.1)'; e.target.style.borderColor = '#818cf8'; e.target.style.boxShadow = '0 0 15px rgba(99, 102, 241, 0.2)'; }}
                                onBlur={(e) => {
                                    e.target.style.background = 'rgba(0, 0, 0, 0.2)';
                                    e.target.style.borderColor = 'rgba(255, 255, 255, 0.1)';
                                    e.target.style.boxShadow = 'none';
                                    handleBlur('email', e.target.value);
                                }} required />
                            {errors.email && <div className="text-danger small mt-2 ps-1">{errors.email}</div>}
                        </div>
                        <div className="col-lg-6">
                            <label style={labelStyle}>Sector</label>
                            <div style={{ ...inputStyle, background: 'rgba(255,255,255,0.05)', color: '#a5b4fc', borderColor: 'transparent', cursor: 'default', display: 'flex', alignItems: 'center' }}>
                                <i className="fas fa-shield-alt me-2"></i> ICE DEPARTMENT
                            </div>
                        </div>
                    </div>
                </div>

                {/* Jersey Items */}
                <div className="items-container">
                    {items.map((item, index) => (
                        <div key={item.id} style={glassCardStyle} className="mb-5 glass-card">
                            <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '4px', background: 'linear-gradient(90deg, #a855f7, #ec4899)' }}></div>
                            <div className="d-flex justify-content-between align-items-center mb-5">
                                <h5 style={{ ...headerStyle, margin: 0, fontSize: '1.25rem' }}>
                                    UNIT {index + 1} CONFIG
                                </h5>
                                {items.length > 1 && (
                                    <button type="button" className="btn btn-sm" onClick={() => removeItem(item.id)}
                                        style={{ color: '#ef4444', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)', borderRadius: '8px', padding: '8px 16px', fontSize: '0.85rem', fontWeight: 'bold' }}>
                                        <i className="fas fa-trash-alt me-2"></i> DISCARD
                                    </button>
                                )}
                            </div>

                            <div className="row g-4">
                                {/* Name on Jersey */}
                                <div className="col-12">
                                    <label style={labelStyle}>Callsign (Name on Back)</label>
                                    <input type="text"
                                        placeholder="E.G. MAVERICK" style={{ ...inputStyle, textTransform: 'uppercase', fontSize: '1.2rem', fontWeight: '600', letterSpacing: '2px', textAlign: 'center' }}
                                        value={item.jerseyName} onChange={(e) => handleItemChange(item.id, 'jerseyName', e.target.value)}
                                        onFocus={(e) => { e.target.style.background = 'rgba(99, 102, 241, 0.1)'; e.target.style.borderColor = '#818cf8'; e.target.style.boxShadow = '0 0 25px rgba(99, 102, 241, 0.3)'; }}
                                        onBlur={(e) => {
                                            e.target.style.background = 'rgba(0, 0, 0, 0.2)';
                                            e.target.style.borderColor = 'rgba(255, 255, 255, 0.1)';
                                            e.target.style.boxShadow = 'none';
                                            handleBlur('jerseyName', e.target.value, item.id);
                                        }} />
                                    {errors[`jerseyName_${item.id}`] && <div className="text-danger small mt-2 ps-1 text-center">{errors[`jerseyName_${item.id}`]}</div>}
                                </div>

                                {/* Jersey Number & Batch */}
                                <div className="col-lg-6">
                                    <label style={labelStyle}>Designation (Number)</label>
                                    <div className="position-relative">
                                        <input type="text"
                                            placeholder="00" style={{ ...inputStyle, fontSize: '1.2rem', fontWeight: '600', textAlign: 'center', fontFamily: "'Orbitron', monospace" }}
                                            value={item.jerseyNumber} onChange={(e) => handleItemChange(item.id, 'jerseyNumber', e.target.value)}
                                            onFocus={(e) => { e.target.style.background = 'rgba(99, 102, 241, 0.1)'; e.target.style.borderColor = '#818cf8'; e.target.style.boxShadow = '0 0 15px rgba(99, 102, 241, 0.2)'; }}
                                            onBlur={(e) => {
                                                e.target.style.background = 'rgba(0, 0, 0, 0.2)';
                                                e.target.style.borderColor = 'rgba(255, 255, 255, 0.1)';
                                                e.target.style.boxShadow = 'none';
                                                handleBlur('jerseyNumber', e.target.value, item.id);
                                            }} />
                                    </div>
                                    {errors[`jerseyNumber_${item.id}`] && <div className="text-danger small mt-2 ps-1 text-center">{errors[`jerseyNumber_${item.id}`]}</div>}
                                </div>

                                <div className="col-lg-6">
                                    <label style={labelStyle}>Batch / Role</label>
                                    <select style={{ ...inputStyle, cursor: 'pointer' }}
                                        value={['Teacher', 'Lab Assistant', 'Alumni'].includes(item.batch) ? 'Others' : item.batch}
                                        onChange={(e) => handleItemChange(item.id, 'batch', e.target.value === 'Others' ? 'Others' : e.target.value)}>
                                        <option value="" style={{ color: '#aaa' }}>SELECT BATCH</option>
                                        {batches.map(b => <option key={b} value={b} style={{ color: '#000' }}>{b}</option>)}
                                    </select>
                                    {(item.batch === 'Others' || ['Teacher', 'Lab Assistant', 'Alumni'].includes(item.batch)) && (
                                        <div className="mt-3">
                                            <select style={{ ...inputStyle, padding: '14px', background: 'rgba(255,255,255,0.05)' }}
                                                value={['Teacher', 'Lab Assistant', 'Alumni'].includes(item.batch) ? item.batch : ''}
                                                onChange={(e) => handleItemChange(item.id, 'batch', e.target.value)}>
                                                <option value="" style={{ color: '#aaa' }}>SPECIFY ROLE...</option>
                                                <option value="Teacher" style={{ color: '#000' }}>Teacher</option>
                                                <option value="Lab Assistant" style={{ color: '#000' }}>Lab Assistant</option>
                                                <option value="Alumni" style={{ color: '#000' }}>Alumni</option>
                                            </select>
                                        </div>
                                    )}
                                </div>

                                {/* Glass Selectors: Collar */}
                                <div className="col-12 mt-3">
                                    <label style={labelStyle}>Collar Module</label>
                                    <SegmentedControl
                                        value={item.collarType}
                                        onChange={(val) => handleItemChange(item.id, 'collarType', val)}
                                        options={[
                                            { value: 'polo', label: 'PREMIUM POLO' },
                                            // { value: 'round', label: 'ROUND NECK' } 
                                        ]}
                                    />
                                </div>

                                {/* Glass Selectors: Sleeve */}
                                <div className="col-12">
                                    <label style={labelStyle}>Armament (Sleeve)</label>
                                    <SegmentedControl
                                        value={item.sleeveType}
                                        onChange={(val) => handleItemChange(item.id, 'sleeveType', val)}
                                        options={[
                                            { value: 'half', label: 'HALF SLEEVE' },
                                            { value: 'full', label: 'FULL SLEEVE' }
                                        ]}
                                    />
                                </div>

                                {/* Size Selection - Glass Squares */}
                                <div className="col-12 mt-4">
                                    <label style={labelStyle}>Chassis Size</label>
                                    <div className="d-flex flex-wrap gap-3 justify-content-center">
                                        {['S', 'M', 'L', 'XL', 'XXL', 'XXXL'].map(s => (
                                            <div key={s}
                                                onClick={() => handleItemChange(item.id, 'size', s)}
                                                style={{
                                                    width: '50px', height: '50px',
                                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                    background: item.size === s ? '#818cf8' : 'rgba(255,255,255,0.05)',
                                                    border: item.size === s ? '1px solid #a5b4fc' : '1px solid rgba(255,255,255,0.1)',
                                                    borderRadius: '12px',
                                                    color: '#ffffff',
                                                    fontWeight: '700',
                                                    fontSize: '1rem',
                                                    cursor: 'pointer',
                                                    transition: 'all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
                                                    boxShadow: item.size === s ? '0 0 20px rgba(129, 140, 248, 0.5)' : 'none',
                                                    transform: item.size === s ? 'scale(1.1)' : 'scale(1)'
                                                }}>
                                                {s}
                                            </div>
                                        ))}
                                    </div>
                                    {errors[`size_${item.id}`] && <div className="text-danger small mt-2 ps-1 text-center">{errors[`size_${item.id}`]}</div>}
                                </div>

                                <div className="col-12 mt-5 pt-4 d-flex justify-content-between align-items-center" style={{ borderTop: '1px solid rgba(255,255,255,0.1)' }}>
                                    <span style={{ color: '#a5b4fc', fontSize: '0.9rem', fontWeight: '500', letterSpacing: '1px' }}>TOTAL</span>
                                    <span style={{ fontSize: '1.8rem', fontFamily: "'Orbitron', sans-serif", fontWeight: '700', color: '#fff', textShadow: '0 0 10px rgba(255, 255, 255, 0.5)' }}>৳{item.price}</span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                <div className="text-center mb-5">
                    <button type="button" onClick={addItem}
                        style={{
                            background: 'rgba(255, 255, 255, 0.05)', border: '1px solid rgba(255, 255, 255, 0.2)', color: '#fff',
                            padding: '16px 40px', borderRadius: '50px', fontWeight: '600', transition: 'all 0.3s ease',
                            fontSize: '0.9rem', letterSpacing: '1px'
                        }}
                        onMouseOver={(e) => { e.currentTarget.style.background = 'rgba(255, 255, 255, 0.15)'; e.currentTarget.style.borderColor = '#fff'; e.currentTarget.style.boxShadow = '0 0 20px rgba(255, 255, 255, 0.2)'; }}
                        onMouseOut={(e) => { e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)'; e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.2)'; e.currentTarget.style.boxShadow = 'none'; }}
                    >
                        <i className="fas fa-plus me-2"></i> ADD CONFIGURATION
                    </button>
                </div>

                {/* Notes */}
                <div style={glassCardStyle} className="mb-5 glass-card">
                    <label style={labelStyle}>Mission Notes</label>
                    <textarea rows="3" placeholder="Additional instructions..." style={inputStyle}
                        value={customer.notes}
                        onChange={(e) => handleCustomerChange('notes', e.target.value)}
                        onFocus={(e) => { e.target.style.background = 'rgba(99, 102, 241, 0.1)'; e.target.style.borderColor = '#818cf8'; }}
                        onBlur={(e) => { e.target.style.background = 'rgba(0, 0, 0, 0.2)'; e.target.style.borderColor = 'rgba(255, 255, 255, 0.1)'; }}
                    ></textarea>
                </div>

                {/* Payment System */}
                <div className="mb-5 glass-card">
                    <PaymentSystem
                        amount={items.reduce((s, i) => s + i.price, 0)}
                        onFinalConfirm={(data) => {
                            setCustomer(prev => ({
                                ...prev,
                                preSelectedMethod: data.method,
                                preSelectedProvider: data.provider || '',
                                confirmedAmount: data.amount,
                                confirmedTotal: data.total,
                                txnId: data.txnId || ''
                            }));
                        }}
                    />
                </div>

                {/* Submit Button */}
                <div className="submit-container pb-5 text-center">
                    {!customer.preSelectedMethod && (
                        <p className="mb-4" style={{ color: '#fbbf24', fontWeight: '600', fontSize: '0.9rem', letterSpacing: '1px' }}>
                            AWAITING PAYMENT CONFIRMATION...
                        </p>
                    )}
                    <button type="submit"
                        style={{
                            background: 'linear-gradient(135deg, #6366f1 0%, #ec4899 100%)',
                            border: 'none',
                            padding: '22px 80px',
                            borderRadius: '50px',
                            color: '#ffffff',
                            fontSize: '1.2rem',
                            fontWeight: '800',
                            fontFamily: "'Orbitron', sans-serif",
                            boxShadow: '0 10px 40px rgba(99, 102, 241, 0.5)',
                            opacity: customer.preSelectedMethod ? 1 : 0.5,
                            cursor: customer.preSelectedMethod ? 'pointer' : 'not-allowed',
                            transition: 'all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
                            letterSpacing: '2px'
                        }}
                        onMouseOver={(e) => { if (customer.preSelectedMethod) { e.currentTarget.style.transform = 'scale(1.05)'; e.currentTarget.style.boxShadow = '0 0 60px rgba(99, 102, 241, 0.7)'; } }}
                        onMouseOut={(e) => { if (customer.preSelectedMethod) { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.boxShadow = '0 10px 40px rgba(99, 102, 241, 0.5)'; } }}
                    >
                        INITIATE ORDER
                    </button>
                </div>
            </form>
        </section>
    );
}
