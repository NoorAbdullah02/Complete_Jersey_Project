import { Modal } from 'bootstrap';
import React, { useEffect, useRef, useState } from 'react';
import ApiService from '../services/api';
import { useToast } from '../context/ToastContext';

const PaymentModal = ({ show, onHide, orderData, onConfirm }) => {
    const { showToast } = useToast();
    const modalRef = useRef(null);
    const bsModalRef = useRef(null);
    const [step, setStep] = useState(1);
    const [txnId, setTxnId] = useState('');
    const [submitting, setSubmitting] = useState(false);

    // Parse items from orderData (it mirrors the structure passed from OrderForm)
    const items = orderData?.items || [];
    const totalBasePrice = items.reduce((sum, item) => sum + (item.price || 0), 0);
    const onlineFee = 10;
    const finalAmount = orderData?.preSelectedMethod === 'hand' ? totalBasePrice : totalBasePrice + onlineFee;

    useEffect(() => {
        if (modalRef.current) {
            bsModalRef.current = new Modal(modalRef.current, { backdrop: 'static' });
        }
        return () => bsModalRef.current?.dispose();
    }, []);

    useEffect(() => {
        if (show && bsModalRef.current) {
            bsModalRef.current.show();
            setStep(1);
            // Pre-fill txnId if it was already entered in the PaymentSystem
            setTxnId(orderData?.txnId || '');
        } else if (!show && bsModalRef.current) {
            bsModalRef.current.hide();
        }
    }, [show, orderData]);

    const handleConfirm = async () => {
        if (orderData.preSelectedMethod !== 'hand' && !txnId.trim()) {
            showToast('Please enter transaction ID', 'warning');
            return;
        }

        setSubmitting(true);
        showToast('Initiating secure verification...', 'info');

        // Dynamic "Verification" simulated delay for UX
        await new Promise(r => setTimeout(r, 1500));
        // Prepare final payload
        const finalPayload = {
            ...orderData,
            transactionId: txnId,
            finalPrice: finalAmount
        };

        await onConfirm(finalPayload);
        setSubmitting(false);
        onHide();
    };

    if (!orderData) return null;

    return (
        <div className="modal fade" id="paymentModal" tabIndex="-1" ref={modalRef} style={{ backdropFilter: 'blur(10px)' }}>
            <div className="modal-dialog modal-dialog-centered">
                <div className="modal-content glass-morphism border-0" style={{ background: 'rgba(15, 23, 42, 0.95)', borderRadius: '30px', boxShadow: '0 25px 70px rgba(0,0,0,0.6)' }}>
                    <div className="modal-header border-0 pb-0" style={{ padding: '30px 30px 10px 30px' }}>
                        <h5 className="modal-title" style={{ fontFamily: "'Orbitron', sans-serif", fontWeight: '800', fontSize: '1.4rem' }}>
                            <i className="fas fa-shield-alt me-3" style={{ color: 'var(--primary)' }}></i>
                            <span style={{ color: '#fff' }}>PAYMENT SECURE</span>
                        </h5>
                        <button type="button" className="btn-close btn-close-white" onClick={onHide}></button>
                    </div>

                    <div className="modal-body" style={{ padding: '30px' }}>
                        {/* Order Summary Card */}
                        <div className="order-summary-card mb-4"
                            style={{ background: 'var(--card-bg)', border: '1px solid var(--glass-border)', borderRadius: '20px', padding: '20px' }}>
                            <div className="d-flex justify-content-between align-items-center mb-3">
                                <h6 style={{ color: 'var(--text-muted)', margin: 0, fontSize: '0.8rem', letterSpacing: '2px', textTransform: 'uppercase' }}>
                                    <i className="fas fa-receipt me-2"></i>Live Statement
                                </h6>
                                <span className="badge rounded-pill" style={{ background: 'rgba(102, 126, 234, 0.2)', color: 'var(--primary)', border: '1px solid var(--primary)' }}>Processing</span>
                            </div>

                            <div className="summary-items">
                                {items.map((item, idx) => (
                                    <div key={item.id} className="summary-item d-flex justify-content-between mb-2" style={{ fontSize: '0.9rem' }}>
                                        <span style={{ color: 'rgba(255,255,255,0.6)' }}>Jersey #{item.jerseyNumber} ({item.size})</span>
                                        <span style={{ color: '#fff', fontWeight: '600' }}>৳{item.price}</span>
                                    </div>
                                ))}
                                {orderData.preSelectedMethod !== 'hand' && (
                                    <div className="summary-item d-flex justify-content-between mt-2 pt-2 border-top" style={{ borderTopStyle: 'dashed !important', borderColor: 'rgba(255,255,255,0.1) !important' }}>
                                        <span style={{ color: 'var(--accent)', fontSize: '0.85rem' }}><i className="fas fa-bolt me-2"></i>Online Service Fee</span>
                                        <span style={{ color: 'var(--accent)', fontWeight: '600' }}>+৳{onlineFee}</span>
                                    </div>
                                )}
                            </div>

                            <div className="summary-total mt-4 pt-4 border-top" style={{ borderColor: 'rgba(255,255,255,0.1) !important' }}>
                                <div className="d-flex justify-content-between align-items-center">
                                    <span style={{ fontFamily: "'Orbitron', sans-serif", fontSize: '1rem', fontWeight: '700', color: '#fff' }}>Grand Total</span>
                                    <span style={{ fontSize: '1.8rem', fontWeight: '900', color: 'var(--primary)', fontFamily: "'Orbitron', sans-serif" }}>৳{finalAmount}</span>
                                </div>
                            </div>
                        </div>

                        {orderData.preSelectedMethod === 'hand' ? (
                            <div className="text-center p-3" style={{ background: 'rgba(102, 126, 234, 0.05)', borderRadius: '20px', border: '1px dashed var(--primary)' }}>
                                <div className="mb-3" style={{ fontSize: '2.5rem', color: 'var(--primary)' }}>
                                    <i className="fas fa-hand-holding-usd"></i>
                                </div>
                                <h6 style={{ color: '#fff', fontWeight: '700' }}>Cash Settlement</h6>
                                <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', lineHeight: '1.6' }}>
                                    Please pay <strong>৳{finalAmount}</strong> to your designated <strong>Class Representative (CR)</strong> once the order is launched.
                                </p>
                                <button className="btn btn-primary w-100 mt-3"
                                    onClick={handleConfirm}
                                    disabled={submitting}
                                    style={{ background: 'var(--primary)', border: 'none', padding: '15px', borderRadius: '15px', fontWeight: '800', letterSpacing: '1px' }}>
                                    {submitting ? 'PROCESSING...' : 'CONFIRM ORDER'}
                                </button>
                            </div>
                        ) : (
                            <div>
                                <div className="payment-instructions mb-4" style={{ background: 'rgba(102, 126, 234, 0.05)', borderRadius: '20px', padding: '20px', border: '1px solid var(--glass-border)' }}>
                                    <div className="d-flex justify-content-between align-items-center mb-3">
                                        <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>Transfer via {orderData.preSelectedProvider || 'Online Payment'}</span>
                                        <span className="badge" style={{ background: 'var(--primary)' }}>Personal</span>
                                    </div>
                                    <div className="d-flex justify-content-between align-items-center mb-2">
                                        <span style={{ fontSize: '1.2rem', fontWeight: '800', color: '#fff', letterSpacing: '1px' }}>
                                            {orderData.preSelectedProvider === 'Nagad' ? '01748269351' : '01748269350'}
                                        </span>
                                        <button className="btn btn-sm btn-outline-light border-0" onClick={() => {
                                            const num = orderData.preSelectedProvider === 'Nagad' ? '01748269351' : '01748269350';
                                            navigator.clipboard.writeText(num);
                                            showToast('Number Copied to Clipboard!', 'success');
                                        }}>
                                            <i className="fas fa-copy"></i>
                                        </button>
                                    </div>
                                    <div className="small" style={{ color: 'var(--accent)', fontWeight: '700' }}>Confirm Settlement of ৳{finalAmount}</div>
                                </div>

                                <div className="form-group mb-4">
                                    <label style={{ color: 'var(--text-muted)', fontSize: '0.8rem', textTransform: 'uppercase', marginBottom: '10px', display: 'block' }}>
                                        Transaction Hash (TrxID)
                                    </label>
                                    <input
                                        type="text"
                                        className="form-control"
                                        placeholder="e.g. 8H3K9L2M"
                                        value={txnId}
                                        onChange={(e) => setTxnId(e.target.value)}
                                        style={{ background: 'rgba(255,255,255,0.02)', borderColor: 'var(--glass-border)', color: '#fff', padding: '15px', borderRadius: '12px' }}
                                    />
                                    <small className="mt-2 d-block" style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.75rem' }}>Paste the unique ID from your payment confirmation SMS</small>
                                </div>
                                <button className="btn w-100"
                                    onClick={handleConfirm}
                                    disabled={submitting}
                                    style={{ background: 'linear-gradient(135deg, var(--primary), var(--secondary))', color: '#fff', padding: '18px', borderRadius: '15px', fontWeight: '800', border: 'none', boxShadow: '0 10px 30px rgba(102, 126, 234, 0.3)' }}>
                                    {submitting ? 'VERIFYING...' : 'VERIFY & CHECKOUT'}
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PaymentModal;
