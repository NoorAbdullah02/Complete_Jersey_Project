import React, { useState, useEffect, useRef, useLayoutEffect } from "react";
import { getExtraCharge } from "../utils/paymentUtils";
import { useToast } from "../context/ToastContext";
import gsap from 'gsap';

const PaymentSystem = ({ amount: initialAmount = 0, onFinalConfirm }) => {
    const { showToast } = useToast();
    const [amount, setAmount] = useState(initialAmount);
    const [method, setMethod] = useState(""); // 'online' or 'hand'
    const [extraCharge, setExtraCharge] = useState(0);
    const [total, setTotal] = useState(0);
    const [showModal, setShowModal] = useState(false);
    const [provider, setProvider] = useState(""); // 'bkash' or 'nagad'
    const [txnId, setTxnId] = useState("");

    const containerRef = useRef(null);
    const modalRef = useRef(null);

    // Sync local amount with prop
    useEffect(() => {
        setAmount(initialAmount);
    }, [initialAmount]);

    useEffect(() => {
        const charge = method === "online" ? getExtraCharge(Number(amount)) : 0;
        setExtraCharge(charge);
        setTotal(Number(amount) + charge);
    }, [amount, method]);

    // GSAP Entrance
    useLayoutEffect(() => {
        const ctx = gsap.context(() => {
            gsap.fromTo('.ps-entrance',
                { y: 20, opacity: 0 },
                { y: 0, opacity: 1, duration: 0.6, stagger: 0.1, ease: 'power2.out' }
            );
        }, containerRef);
        return () => ctx.revert();
    }, []);

    // GSAP Modal Animation
    useLayoutEffect(() => {
        if (showModal && modalRef.current) {
            gsap.fromTo(modalRef.current,
                { scale: 0.9, opacity: 0 },
                { scale: 1, opacity: 1, duration: 0.4, ease: 'back.out(1.7)' }
            );
        }
    }, [showModal]);

    const handleHandCash = () => {
        setMethod("hand");
    };

    const handleOnlinePayment = () => {
        setMethod("online");
        setShowModal(true);
    };

    const closePortal = () => {
        setShowModal(false);
        setProvider("");
        setTxnId("");
    };

    const copyToClipboard = (text) => {
        navigator.clipboard.writeText(text);
        showToast("Number copied to clipboard!", "success");
    };

    const CARRIERS = {
        bkash: { name: "bKash", number: "01748269350", color: "#e2136e", accent: "pink" },
        nagad: { name: "Nagad", number: "01748269351", color: "#f79c1e", accent: "orange" },
    };

    // --- Glass Styles ---
    const glassStyle = {
        background: 'rgba(255, 255, 255, 0.03)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        borderRadius: '24px',
        boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.3)',
    };

    const tileStyle = (isActive, color = '#6366f1') => ({
        background: isActive ? `rgba(${color === '#e2136e' ? '226, 19, 110' : color === '#f79c1e' ? '247, 156, 30' : '99, 102, 241'}, 0.2)` : 'rgba(255, 255, 255, 0.05)',
        border: isActive ? `1px solid ${color}` : '1px solid rgba(255, 255, 255, 0.1)',
        borderRadius: '16px',
        padding: '20px',
        cursor: 'pointer',
        transition: 'all 0.3s ease',
        boxShadow: isActive ? `0 0 20px ${color}40` : 'none',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '10px',
        color: '#fff'
    });

    const inputStyle = {
        background: 'rgba(0, 0, 0, 0.3)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        borderRadius: '12px',
        padding: '12px 16px',
        color: '#fff',
        width: '100%',
        outline: 'none',
        fontFamily: "'Orbitron', monospace",
        letterSpacing: '1px'
    };

    return (
        <div ref={containerRef} className="ps-container">
            {/* Header */}
            <div className="ps-entrance d-flex justify-content-between align-items-center mb-4">
                <h2 style={{ fontFamily: "'Orbitron', sans-serif", fontWeight: '700', color: '#fff', fontSize: '1.5rem', margin: 0 }}>
                    SECURE <span style={{ color: '#818cf8' }}>GATEWAY</span>
                </h2>
                <div style={{ background: 'rgba(16, 185, 129, 0.2)', border: '1px solid #10b981', color: '#10b981', padding: '4px 12px', borderRadius: '20px', fontSize: '0.75rem', fontWeight: '600' }}>
                    <i className="fas fa-lock me-1"></i> SSL ENCRYPTED
                </div>
            </div>

            {/* Amount Display */}
            <div className="ps-entrance mb-5 text-center">
                <label style={{ display: 'block', color: 'rgba(255,255,255,0.6)', fontSize: '0.9rem', marginBottom: '8px', fontFamily: "'Poppins', sans-serif" }}>TOTAL PAYABLE</label>
                <div style={{ fontSize: '3.5rem', fontFamily: "'Orbitron', sans-serif", fontWeight: '800', color: '#fff', textShadow: '0 0 30px rgba(129, 140, 248, 0.6)' }}>
                    ৳{amount}
                </div>
            </div>

            {/* Method Selection */}
            <div className="ps-entrance row g-3 mb-5">
                <div className="col-6">
                    <div onClick={handleOnlinePayment}
                        style={tileStyle(method === 'online', '#818cf8')}
                        onMouseEnter={(e) => { if (method !== 'online') e.currentTarget.style.background = 'rgba(255,255,255,0.1)'; }}
                        onMouseLeave={(e) => { if (method !== 'online') e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; }}
                    >
                        <i className="fas fa-satellite-dish" style={{ fontSize: '1.8rem', color: method === 'online' ? '#fff' : '#818cf8' }}></i>
                        <span style={{ fontWeight: '600', fontSize: '0.9rem' }}>ONLINE PAY</span>
                    </div>
                </div>
                <div className="col-6">
                    <div onClick={handleHandCash}
                        style={tileStyle(method === 'hand', '#10b981')}
                        onMouseEnter={(e) => { if (method !== 'hand') e.currentTarget.style.background = 'rgba(255,255,255,0.1)'; }}
                        onMouseLeave={(e) => { if (method !== 'hand') e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; }}
                    >
                        <i className="fas fa-hand-holding-medical" style={{ fontSize: '1.8rem', color: method === 'hand' ? '#fff' : '#10b981' }}></i>
                        <span style={{ fontWeight: '600', fontSize: '0.9rem' }}>CASH / CR</span>
                    </div>
                </div>
            </div>

            {/* Receipt Summary */}
            <div className="ps-entrance p-4 mb-4" style={{ background: 'rgba(0,0,0,0.2)', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.05)' }}>
                <div className="d-flex justify-content-between mb-2">
                    <span style={{ color: 'rgba(255,255,255,0.6)' }}>Base Config</span>
                    <span style={{ color: '#fff', fontFamily: "'Orbitron', monospace" }}>৳{amount}</span>
                </div>
                <div className="d-flex justify-content-between mb-3">
                    <span style={{ color: 'rgba(255,255,255,0.6)' }}>Protocol Fee</span>
                    <span style={{ color: '#fbbf24', fontFamily: "'Orbitron', monospace" }}>+ ৳{extraCharge}</span>
                </div>
                <div style={{ height: '1px', background: 'rgba(255,255,255,0.1)', marginBottom: '15px' }}></div>
                <div className="d-flex justify-content-between align-items-center">
                    <span style={{ color: '#fff', fontWeight: '600' }}>SETTLEMENT TOTAL</span>
                    <span style={{ color: '#818cf8', fontWeight: '700', fontSize: '1.4rem', fontFamily: "'Orbitron', sans-serif" }}>৳{total}</span>
                </div>
            </div>

            {/* Hand Cash Confirmation */}
            {method === "hand" && (
                <div className="ps-entrance">
                    <button
                        onClick={() => {
                            if (onFinalConfirm) onFinalConfirm({ amount: Number(amount), method: "hand", total: Number(amount) });
                            showToast("Protocol accepted. Proceed to initialization.", "success");
                        }}
                        style={{
                            width: '100%',
                            padding: '18px',
                            borderRadius: '16px',
                            background: '#10b981',
                            color: '#000',
                            fontWeight: '700',
                            fontSize: '1rem',
                            border: 'none',
                            fontFamily: "'Orbitron', sans-serif",
                            boxShadow: '0 0 20px rgba(16, 185, 129, 0.4)',
                            transition: 'all 0.3s ease'
                        }}
                        onMouseOver={(e) => e.currentTarget.style.transform = 'scale(1.02)'}
                        onMouseOut={(e) => e.currentTarget.style.transform = 'scale(1)'}
                    >
                        CONFIRM CASH PROTOCOL
                    </button>
                    <p className="text-center mt-3" style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.8rem' }}>
                        * Verify physical currency transfer with Unit Commander (CR).
                    </p>
                </div>
            )}

            {/* Online Payment Modal */}
            {showModal && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
                    background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(8px)', zIndex: 1000,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px'
                }}>
                    <div ref={modalRef} style={{ ...glassStyle, width: '100%', maxWidth: '450px', background: '#18181b', border: '1px solid rgba(255,255,255,0.1)' }}>
                        <div className="d-flex justify-content-between align-items-start mb-4">
                            <div>
                                <h4 style={{ color: '#fff', margin: 0, fontFamily: "'Orbitron', sans-serif" }}>SELECT CHANNEL</h4>
                                <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.85rem', margin: 0 }}>Encryption Level: High</p>
                            </div>
                            <button onClick={closePortal} style={{ background: 'transparent', border: 'none', color: 'rgba(255,255,255,0.5)', fontSize: '1.2rem' }}>
                                <i className="fas fa-times"></i>
                            </button>
                        </div>

                        <div className="row g-3 mb-4">
                            {Object.entries(CARRIERS).map(([key, data]) => (
                                <div key={key} className="col-6">
                                    <div onClick={() => setProvider(key)}
                                        style={tileStyle(provider === key, data.color)}
                                    >
                                        <div style={{
                                            width: '40px', height: '40px', borderRadius: '50%', background: '#fff',
                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            fontWeight: '800', color: data.color
                                        }}>
                                            {data.name[0]}
                                        </div>
                                        <span style={{ fontSize: '0.9rem', fontWeight: '600' }}>{data.name}</span>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {provider && (
                            <div className="p-4 mb-4" style={{ background: 'rgba(255,255,255,0.03)', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.05)' }}>
                                <label style={{ display: 'block', color: 'rgba(255,255,255,0.6)', fontSize: '0.8rem', marginBottom: '5px' }}>TARGET FREQUENCY (NUMBER)</label>
                                <div className="d-flex align-items-center justify-content-between mb-4" style={{ background: 'rgba(0,0,0,0.3)', padding: '10px 15px', borderRadius: '10px' }}>
                                    <span style={{ color: '#fff', fontFamily: "'Orbitron', monospace", fontSize: '1.2rem', letterSpacing: '2px' }}>{CARRIERS[provider].number}</span>
                                    <button onClick={() => copyToClipboard(CARRIERS[provider].number)} style={{ background: 'transparent', border: 'none', color: '#818cf8' }}>
                                        <i className="fas fa-copy"></i>
                                    </button>
                                </div>

                                <label style={{ display: 'block', color: 'rgba(255,255,255,0.6)', fontSize: '0.8rem', marginBottom: '8px' }}>TRANSACTION HASH (TrxID)</label>
                                <input
                                    type="text"
                                    value={txnId}
                                    onChange={(e) => setTxnId(e.target.value)}
                                    placeholder="ENTER ID..."
                                    style={inputStyle}
                                />
                            </div>
                        )}

                        <div className="d-flex gap-3">
                            <button onClick={closePortal} style={{ flex: 1, padding: '14px', borderRadius: '12px', background: 'transparent', border: '1px solid rgba(255,255,255,0.2)', color: '#fff' }}>
                                ABORT
                            </button>
                            <button
                                onClick={() => {
                                    if (!txnId.trim()) {
                                        showToast("Transaction ID required for verification.", "warning");
                                        return;
                                    }
                                    if (onFinalConfirm) onFinalConfirm({ amount: Number(amount), method: 'online', provider, total, txnId });
                                    closePortal();
                                }}
                                disabled={!provider || !txnId.trim()}
                                style={{
                                    flex: 2, padding: '14px', borderRadius: '12px',
                                    background: provider && txnId.trim() ? '#818cf8' : 'rgba(129, 140, 248, 0.2)',
                                    color: provider && txnId.trim() ? '#fff' : 'rgba(255,255,255,0.3)',
                                    border: 'none', fontWeight: '600',
                                    cursor: provider && txnId.trim() ? 'pointer' : 'not-allowed',
                                    transition: 'all 0.3s'
                                }}
                            >
                                VERIFY & PROCEED
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default PaymentSystem;
