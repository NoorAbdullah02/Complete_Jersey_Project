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

    useEffect(() => {
        setAmount(initialAmount);
    }, [initialAmount]);

    useEffect(() => {
        const charge = method === "online" ? getExtraCharge(Number(amount)) : 0;
        setExtraCharge(charge);
        setTotal(Number(amount) + charge);
    }, [amount, method]);

    useLayoutEffect(() => {
        const ctx = gsap.context(() => {
            gsap.fromTo('.ps-entrance',
                { y: 20, opacity: 0 },
                { y: 0, opacity: 1, duration: 0.6, stagger: 0.1, ease: 'power2.out' }
            );
        }, containerRef);
        return () => ctx.revert();
    }, []);

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
        bkash: { name: "bKash", number: "01748269350", color: "#e2136e" },
        nagad: { name: "Nagad", number: "01748269351", color: "#f79c1e" },
    };

    // --- Premium ICE Theme Styles ---
    const primaryICE = '#00f2fe';
    const emeraldTeal = '#4facfe';
    
    // Smooth Glass Theme for the panels
    const glassPanelStyle = {
        background: 'rgba(255, 255, 255, 0.02)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        border: '1px solid rgba(255, 255, 255, 0.05)',
        borderRadius: '24px',
        boxShadow: '0 10px 40px rgba(0, 0, 0, 0.4)',
    };
    
    // Style for the selection cards
    const tileStyle = (isActive, activeColor = primaryGold) => ({
        background: isActive ? `rgba(${activeColor === emeraldTeal ? '0, 212, 170' : '240, 165, 0'}, 0.08)` : 'rgba(255, 255, 255, 0.02)',
        backdropFilter: 'blur(10px)',
        borderRadius: '20px',
        padding: '24px',
        cursor: 'pointer',
        transition: 'all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
        border: isActive ? `1px solid rgba(${activeColor === emeraldTeal ? '0, 212, 170' : '240, 165, 0'}, 0.5)` : '1px solid rgba(255, 255, 255, 0.06)',
        boxShadow: isActive ? `0 10px 30px rgba(${activeColor === emeraldTeal ? '79, 172, 254' : '0, 242, 254'}, 0.15)` : 'none',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        textAlign: 'center',
        color: '#fff',
        height: '100%',
        position: 'relative',
        overflow: 'hidden'
    });

    const formatCurrency = (val) => {
        return val.toLocaleString('en-US');
    };

    return (
        <div ref={containerRef} className="ps-container pt-2">
            
            {/* Header */}
            <div className="ps-entrance d-flex justify-content-between align-items-center mb-4 pb-2">
                <div className="d-flex align-items-center gap-3">
                    <div style={{
                        width: '45px', height: '45px', borderRadius: '14px',
                        background: 'linear-gradient(135deg, #00f2fe, #4facfe)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        color: '#0a0e1a', fontSize: '1.2rem', boxShadow: '0 5px 15px rgba(0, 242, 254, 0.3)'
                    }}>
                        <i className="fas fa-gem"></i>
                    </div>
                    <div>
                        <h2 style={{ fontFamily: "'Orbitron', sans-serif", fontWeight: '800', color: '#fff', fontSize: '1.3rem', margin: '0 0 -2px 0', letterSpacing: '1px' }}>
                            SECURE PAY
                        </h2>
                        <span style={{ color: primaryICE, fontSize: '0.7rem', fontWeight: '600', letterSpacing: '2px', textTransform: 'uppercase' }}>
                            Gateway Portal
                        </span>
                    </div>
                </div>
                <div style={{ 
                    background: 'rgba(0, 212, 170, 0.1)', border: '1px solid rgba(0, 212, 170, 0.3)', 
                    color: emeraldTeal, padding: '6px 14px', borderRadius: '30px', 
                    fontSize: '0.8rem', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '8px',
                    fontFamily: "'Space Grotesk', sans-serif"
                }}>
                    <i className="fas fa-shield-alt"></i>
                    SSL Secured
                </div>
            </div>

            {/* Total Payable Display */}
            <div className="ps-entrance mb-4 position-relative" style={{ 
                ...glassPanelStyle, padding: '35px 30px', overflow: 'hidden'
            }}>
                {/* Decorative Glowing Shape */}
                <div style={{ 
                    position: 'absolute', top: '-40%', right: '-10%', width: '200px', height: '200px', 
                    background: 'radial-gradient(circle, rgba(0,242,254,0.15) 0%, rgba(0,242,254,0) 70%)', 
                    borderRadius: '50%', zIndex: 0
                }}></div>
                
                <div style={{ position: 'relative', zIndex: 1 }}>
                    <label style={{ display: 'block', color: 'rgba(255,255,255,0.6)', fontSize: '0.85rem', fontWeight: '700', letterSpacing: '2px', textTransform: 'uppercase', marginBottom: '15px' }}>
                        TOTAL PAYABLE
                    </label>
                    <div style={{ fontSize: '3.5rem', fontFamily: "'Orbitron', monospace", fontWeight: '800', color: primaryICE, marginBottom: '5px', letterSpacing: '1px', textShadow: '0 0 30px rgba(0, 242, 254, 0.4)' }}>
                        {formatCurrency(amount)} TK
                    </div>
                    <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.9rem', fontWeight: '500', fontFamily: "'Space Grotesk', sans-serif" }}>
                        Select your preferred gateway method
                    </div>
                </div>
            </div>

            {/* Method Selection Title */}
            <div className="ps-entrance mb-4 text-center">
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <span style={{ color: '#fff', fontSize: '0.9rem', fontWeight: '800', letterSpacing: '3px', textTransform: 'uppercase', textShadow: '0 0 10px rgba(255, 255, 255, 0.3)' }}>
                            PAYMENT METHOD
                        </span>
                        <span style={{ 
                            background: 'rgba(239, 68, 68, 0.25)', 
                            color: '#ef4444', 
                            fontSize: '0.65rem', 
                            padding: '4px 12px', 
                            borderRadius: '12px', 
                            border: '1px solid rgba(239, 68, 68, 0.5)',
                            fontWeight: '900',
                            letterSpacing: '1px',
                            boxShadow: '0 0 15px rgba(239, 68, 68, 0.4)',
                            animation: 'ps-glow-red 2s infinite ease-in-out'
                        }}>
                            REQUIRED
                        </span>
                    </div>
                    {!method && (
                        <span className="ps-method-prompt" style={{ color: primaryICE, fontSize: '0.75rem', fontWeight: '600', letterSpacing: '1px', opacity: 0.8 }}>
                            <i className="fas fa-arrow-down me-2"></i>
                            PLEASE SELECT A METHOD BELOW
                            <i className="fas fa-arrow-down ms-2"></i>
                        </span>
                    )}
                </div>
            </div>

            {/* Method Cards */}
            <div className="ps-entrance row g-3 mb-5">
                <div className="col-sm-6">
                    <div onClick={handleOnlinePayment} 
                         style={{
                             ...tileStyle(method === 'online', primaryICE),
                             border: method === 'online' ? `2px solid ${primaryICE}` : (!method ? '1px dashed rgba(0, 242, 254, 0.4)' : '1px solid rgba(255, 255, 255, 0.06)'),
                             boxShadow: method === 'online' ? `0 0 25px rgba(0, 242, 254, 0.3)` : (method ? 'none' : '0 0 10px rgba(0, 242, 254, 0.1)')
                         }}
                         className={!method ? "ps-pulse-card-ice" : ""}
                         onMouseOver={(e) => { if(method !== 'online') { e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; e.currentTarget.style.boxShadow = `0 0 20px rgba(0, 242, 254, 0.2)`; } }}
                         onMouseOut={(e) => { if(method !== 'online') { e.currentTarget.style.background = 'rgba(255,255,255,0.02)'; e.currentTarget.style.boxShadow = !method ? '0 0 10px rgba(0, 242, 254, 0.1)' : 'none'; } }}>
                        <div style={{
                            width: '50px', height: '50px', borderRadius: '14px',
                            background: method === 'online' ? `rgba(0, 242, 254, 0.3)` : 'rgba(0, 242, 254, 0.1)', color: primaryICE,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: '1.4rem', marginBottom: '15px', border: '1px solid rgba(0,242,254,0.3)',
                            boxShadow: method === 'online' ? `0 0 15px rgba(0, 242, 254, 0.4)` : 'none'
                        }}>
                            <i className="fas fa-globe"></i>
                        </div>
                        <h4 style={{ color: '#fff', fontSize: '1.2rem', fontWeight: '700', margin: '0 0 5px 0', fontFamily: "'Space Grotesk', sans-serif" }}>Mobile Banking</h4>
                        <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.85rem', fontWeight: '500' }}>bKash / Nagad</span>
                        {method === 'online' && <div style={{ position: 'absolute', top: '10px', right: '10px', color: primaryICE, textShadow: `0 0 10px ${primaryICE}` }}><i className="fas fa-check-circle"></i></div>}
                    </div>
                </div>
                <div className="col-sm-6">
                    <div onClick={handleHandCash} 
                         style={{ 
                             ...tileStyle(method === 'hand', emeraldTeal),
                             border: method === 'hand' ? `2px solid ${emeraldTeal}` : (!method ? '1px dashed rgba(79, 172, 254, 0.4)' : '1px solid rgba(255, 255, 255, 0.06)'),
                             boxShadow: method === 'hand' ? `0 0 25px rgba(79, 172, 254, 0.3)` : (method ? 'none' : '0 0 10px rgba(79, 172, 254, 0.1)')
                         }}
                         className={!method ? "ps-pulse-card-teal" : ""}
                         onMouseOver={(e) => { if(method !== 'hand') { e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; e.currentTarget.style.boxShadow = `0 0 20px rgba(79, 172, 254, 0.2)`; } }}
                         onMouseOut={(e) => { if(method !== 'hand') { e.currentTarget.style.background = 'rgba(255,255,255,0.02)'; e.currentTarget.style.boxShadow = !method ? '0 0 10px rgba(79, 172, 254, 0.1)' : 'none'; } }}>
                        <div style={{
                            width: '50px', height: '50px', borderRadius: '14px',
                            background: method === 'hand' ? `rgba(0, 212, 170, 0.3)` : 'rgba(0, 212, 170, 0.1)', color: emeraldTeal,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: '1.4rem', marginBottom: '15px', border: '1px solid rgba(0,212,170,0.3)',
                            boxShadow: method === 'hand' ? `0 0 15px rgba(0, 212, 170, 0.4)` : 'none'
                        }}>
                            <i className="fas fa-wallet"></i>
                        </div>
                        <h4 style={{ color: '#fff', fontSize: '1.2rem', fontWeight: '700', margin: '0 0 5px 0', fontFamily: "'Space Grotesk', sans-serif" }}>Cash / CR</h4>
                        <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.85rem', fontWeight: '500' }}>Direct transfer</span>
                        {method === 'hand' && <div style={{ position: 'absolute', top: '10px', right: '10px', color: emeraldTeal, textShadow: `0 0 10px ${emeraldTeal}` }}><i className="fas fa-check-circle"></i></div>}
                    </div>
                </div>
            </div>

            <style>
                {`
                    @keyframes ps-pulse {
                        0% { opacity: 1; transform: scale(1); }
                        50% { opacity: 0.8; transform: scale(0.99); }
                        100% { opacity: 1; transform: scale(1); }
                    }
                    @keyframes ps-glow-ice {
                        0% { box-shadow: 0 0 10px rgba(0, 242, 254, 0.1); }
                        50% { box-shadow: 0 0 25px rgba(0, 242, 254, 0.4); }
                        100% { box-shadow: 0 0 10px rgba(0, 242, 254, 0.1); }
                    }
                    @keyframes ps-glow-teal {
                        0% { box-shadow: 0 0 10px rgba(79, 172, 254, 0.1); }
                        50% { box-shadow: 0 0 25px rgba(79, 172, 254, 0.4); }
                        100% { box-shadow: 0 0 10px rgba(79, 172, 254, 0.1); }
                    }
                    @keyframes ps-glow-red {
                        0% { box-shadow: 0 0 5px rgba(239, 68, 68, 0.2); }
                        50% { box-shadow: 0 0 20px rgba(239, 68, 68, 0.6); }
                        100% { box-shadow: 0 0 5px rgba(239, 68, 68, 0.2); }
                    }
                    .ps-pulse-card-ice {
                        animation: ps-pulse 2s infinite ease-in-out, ps-glow-ice 3s infinite ease-in-out;
                    }
                    .ps-pulse-card-teal {
                        animation: ps-pulse 2s infinite ease-in-out, ps-glow-teal 3s infinite ease-in-out;
                    }
                    .ps-method-prompt {
                        animation: ps-pulse 1.5s infinite ease-in-out;
                    }
                `}
            </style>

            {/* Receipt Summary */}
            <div className="ps-entrance" style={{ ...glassPanelStyle, padding: '30px' }}>
                <div className="d-flex justify-content-between align-items-center mb-3">
                    <span style={{ color: 'rgba(255,255,255,0.6)', fontSize: '1rem', fontWeight: '500', fontFamily: "'Space Grotesk', sans-serif" }}>Jersey Price</span>
                    <span style={{ color: '#fff', fontSize: '1.05rem', fontWeight: '600', fontFamily: "'Orbitron', monospace" }}>{formatCurrency(amount)} TK</span>
                </div>
                
                <div style={{ background: 'rgba(255,255,255,0.03)', padding: '15px', borderRadius: '12px', marginBottom: '20px' }}>
                    <div className="d-flex justify-content-between align-items-center">
                        <span style={{ color: 'rgba(255,255,255,0.6)', fontSize: '1rem', fontWeight: '500', fontFamily: "'Space Grotesk', sans-serif" }}>
                            Gateway Processing Fee
                        </span>
                        <span style={{ color: extraCharge > 0 ? primaryICE : '#34d399', fontSize: '1.05rem', fontWeight: '600', fontFamily: "'Orbitron', monospace" }}>
                            + {formatCurrency(extraCharge)} TK
                        </span>
                    </div>
                </div>
                
                <div style={{ height: '1px', background: 'rgba(255,255,255,0.1)', margin: '20px 0' }}></div>
                
                <div className="d-flex justify-content-between align-items-center">
                    <span style={{ color: '#fff', fontSize: '1.1rem', fontWeight: '700', letterSpacing: '1px' }}>Total Price</span>
                    <span style={{ color: '#fff', fontWeight: '800', fontSize: '1.8rem', fontFamily: "'Orbitron', sans-serif", textShadow: '0 0 15px rgba(255,255,255,0.2)' }}>
                        {formatCurrency(total)} TK
                    </span>
                </div>
            </div>

            {/* Hand Cash Details Alert */}
            {method === "hand" && (
                <div className="ps-entrance mt-4" style={{ 
                    background: 'rgba(0, 212, 170, 0.05)', border: '1px solid rgba(0, 212, 170, 0.2)', 
                    borderRadius: '16px', padding: '20px', display: 'flex', gap: '20px', alignItems: 'flex-start'
                }}>
                    <div style={{ fontSize: '1.5rem', color: emeraldTeal }}>
                        <i className="fas fa-info-circle"></i>
                    </div>
                    <div>
                        <h5 style={{ color: '#fff', fontFamily: "'Space Grotesk', sans-serif", fontWeight: '700', margin: '0 0 8px 0', fontSize: '1.1rem' }}>Cash Payment Selected</h5>
                        <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.9rem', margin: '0 0 15px 0', lineHeight: 1.5 }}>
                            You will hand over the cash directly to your respective Class Representative (CR) after placing the order. Verification will be done offline.
                        </p>
                        <div style={{ background: 'rgba(255,255,255,0.05)', padding: '12px 18px', borderRadius: '12px', display: 'inline-flex', alignItems: 'center', gap: '15px' }}>
                            <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.8rem', fontWeight: '600', textTransform: 'uppercase' }}>Total Amount</span>
                            <span style={{ color: '#fff', fontSize: '1.2rem', fontWeight: '800', fontFamily: "'Orbitron', sans-serif" }}>{formatCurrency(total)} TK</span>
                        </div>
                        <button 
                            onClick={(e) => {
                                e.stopPropagation();
                                const uniqueHandId = `HAND-${Date.now()}-${Math.random().toString(36).substring(2, 7).toUpperCase()}`;
                                onFinalConfirm({ amount: Number(amount), method: 'hand', total, txnId: uniqueHandId });
                            }}
                            style={{
                                marginTop: '20px', width: '100%', padding: '14px', borderRadius: '12px',
                                background: emeraldTeal, color: '#0a0e1a', border: 'none', fontWeight: '800',
                                fontFamily: "'Orbitron', sans-serif", cursor: 'pointer', transition: 'all 0.3s ease',
                                boxShadow: '0 5px 15px rgba(0, 212, 170, 0.3)'
                            }}
                            onMouseOver={e=>e.currentTarget.style.transform='scale(1.02)'}
                            onMouseOut={e=>e.currentTarget.style.transform='scale(1)'}
                        >
                            CONFIRM CASH ORDER
                        </button>
                    </div>
                </div>
            )}

            {/* Premium Glass Modal */}
            {showModal && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
                    background: 'rgba(10, 14, 26, 0.85)', backdropFilter: 'blur(12px)', zIndex: 1000,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px'
                }}>
                    <div ref={modalRef} style={{ ...glassPanelStyle, width: '100%', maxWidth: '480px', padding: '35px', border: '1px solid rgba(240,165,0,0.2)' }}>
                        <div className="d-flex justify-content-between align-items-start mb-4">
                            <div>
                                <h4 style={{ color: '#fff', margin: 0, fontFamily: "'Orbitron', sans-serif", fontWeight: '700', letterSpacing: '1px' }}>SELECT GATEWAY</h4>
                                <p style={{ color: primaryICE, fontSize: '0.85rem', fontWeight: '600', margin: '5px 0 0 0', textTransform: 'uppercase', letterSpacing: '1px' }}>Encrypted Channel</p>
                            </div>
                            <button onClick={closePortal} style={{ background: 'transparent', border: 'none', color: 'rgba(255,255,255,0.4)', fontSize: '1.4rem', padding: '0', transition: 'color 0.2s' }}
                                    onMouseOver={e=>e.currentTarget.style.color='#fff'} onMouseOut={e=>e.currentTarget.style.color='rgba(255,255,255,0.4)'}>
                                <i className="fas fa-times"></i>
                            </button>
                        </div>

                        <div className="row g-3 mb-4">
                            {Object.entries(CARRIERS).map(([key, data]) => (
                                <div key={key} className="col-6">
                                    <div onClick={() => setProvider(key)}
                                        style={{
                                            ...tileStyle(provider === key, data.color),
                                            padding: '24px 20px',
                                            alignItems: 'center',
                                            textAlign: 'center'
                                        }}
                                    >
                                        <div style={{
                                            width: '50px', height: '50px', borderRadius: '50%', background: 'rgba(255,255,255,0.1)',
                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            fontWeight: '800', color: data.color, marginBottom: '15px', fontSize: '1.3rem'
                                        }}>
                                            {data.name[0]}
                                        </div>
                                        <span style={{ fontSize: '1.05rem', fontWeight: '700', color: '#fff' }}>{data.name}</span>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {provider && (
                            <div className="p-4 mb-4" style={{ background: 'rgba(0,0,0,0.2)', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.05)' }}>
                                <label style={{ display: 'block', color: 'rgba(255,255,255,0.5)', fontSize: '0.8rem', fontWeight: '600', marginBottom: '10px', textTransform: 'uppercase', letterSpacing: '1px' }}>SEND MONEY TO</label>
                                <div className="d-flex align-items-center justify-content-between mb-4" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)', padding: '14px 20px', borderRadius: '12px' }}>
                                    <span style={{ color: '#fff', fontFamily: "'Orbitron', monospace", fontSize: '1.3rem', fontWeight: '700', letterSpacing: '2px' }}>{CARRIERS[provider].number}</span>
                                    <button onClick={() => copyToClipboard(CARRIERS[provider].number)} style={{ background: 'transparent', border: 'none', color: CARRIERS[provider].color, fontSize: '1.2rem', transition: 'transform 0.2s' }}
                                            onMouseOver={e=>e.currentTarget.style.transform='scale(1.1)'} onMouseOut={e=>e.currentTarget.style.transform='scale(1)'}>
                                        <i className="fas fa-copy"></i>
                                    </button>
                                </div>

                                <label style={{ display: 'block', color: 'rgba(255,255,255,0.5)', fontSize: '0.8rem', fontWeight: '600', marginBottom: '10px', textTransform: 'uppercase', letterSpacing: '1px' }}>TRANSACTION HASH (TrxID)</label>
                                <input
                                    type="text"
                                    value={txnId}
                                    onChange={(e) => setTxnId(e.target.value)}
                                    placeholder="Enter TrxID..."
                                    style={{
                                        background: 'rgba(0, 0, 0, 0.4)', border: '1px solid rgba(255, 255, 255, 0.1)',
                                        borderRadius: '12px', padding: '16px 20px', color: '#fff', width: '100%',
                                        outline: 'none', fontFamily: "'Space Grotesk', monospace", fontSize: '1.1rem',
                                        transition: 'all 0.3s'
                                    }}
                                    onFocus={(e) => { e.target.style.borderColor = primaryICE; e.target.style.boxShadow = `0 0 15px rgba(0, 242, 254, 0.2)` }}
                                    onBlur={(e) => { e.target.style.borderColor = 'rgba(255, 255, 255, 0.1)'; e.target.style.boxShadow = 'none' }}
                                />

                                <div style={{ marginTop: '25px', paddingTop: '20px', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                                    <div className="d-flex justify-content-between mb-2">
                                        <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.85rem' }}>Base Price</span>
                                        <span style={{ color: '#fff', fontWeight: '600' }}>{formatCurrency(amount)} TK</span>
                                    </div>
                                    <div className="d-flex justify-content-between mb-3">
                                        <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.85rem' }}>Gateway Fee</span>
                                        <span style={{ color: primaryICE, fontWeight: '600' }}>+ {formatCurrency(extraCharge)} TK</span>
                                    </div>
                                    <div className="d-flex justify-content-between align-items-center" style={{ background: 'rgba(0, 242, 254, 0.05)', padding: '12px 15px', borderRadius: '10px' }}>
                                        <span style={{ color: '#fff', fontWeight: '700', fontSize: '0.9rem' }}>TOTAL TO PAY</span>
                                        <span style={{ color: primaryICE, fontWeight: '800', fontSize: '1.2rem', fontFamily: "'Orbitron', sans-serif" }}>{formatCurrency(total)} TK</span>
                                    </div>
                                </div>
                            </div>
                        )}

                        <div className="d-flex gap-3 mt-5">
                            <button onClick={closePortal} style={{ flex: 1, padding: '16px', borderRadius: '50px', background: 'transparent', border: '1px solid rgba(255,255,255,0.2)', color: '#fff', fontWeight: '600', letterSpacing: '1px', transition: 'all 0.2s' }}
                                    onMouseOver={e=>e.currentTarget.style.background='rgba(255,255,255,0.05)'} onMouseOut={e=>e.currentTarget.style.background='transparent'}>
                                CANCEL
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
                                    flex: 2, padding: '16px', borderRadius: '50px',
                                    background: provider && txnId.trim() ? primaryICE : 'rgba(255,255,255,0.05)',
                                    color: provider && txnId.trim() ? '#0a0e1a' : 'rgba(255,255,255,0.3)',
                                    border: 'none', fontWeight: '800', fontFamily: "'Orbitron', sans-serif", letterSpacing: '1px',
                                    cursor: provider && txnId.trim() ? 'pointer' : 'not-allowed',
                                    transition: 'all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
                                    boxShadow: provider && txnId.trim() ? '0 10px 20px rgba(0, 242, 254, 0.3)' : 'none'
                                }}
                                onMouseOver={e => { if(provider && txnId.trim()) e.currentTarget.style.transform='scale(1.03)' }}
                                onMouseOut={e => { if(provider && txnId.trim()) e.currentTarget.style.transform='scale(1)' }}
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
