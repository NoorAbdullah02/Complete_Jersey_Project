import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import AOS from 'aos';
import 'aos/dist/aos.css';

import Particles from '../components/Particles';
import ThreeBackground from '../components/ThreeBackground'; // NEW 3D Background
import NetworkStatus from '../components/NetworkStatus';
import LoadingOverlay from '../components/LoadingOverlay';
import HeroHeader from '../components/HeroHeader';
import JerseyShowcase from '../components/JerseyShowcase';
import OrderForm from '../components/OrderForm';
import PaymentModal from '../components/PaymentModal';
import SizeChartModal from '../components/SizeChartModal';
import AlertMessages from '../components/AlertMessages';
import Footer from '../components/Footer';
import ErrorBoundary from '../components/ErrorBoundary'; // Added for stability

import { healthCheck, submitOrder } from '../services/api';

export default function OrderPage() {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [loadingMsg, setLoadingMsg] = useState('Processing Your Order...');
    const [price, setPrice] = useState(360);
    const [alert, setAlert] = useState({ type: '', title: '', text: '', orderId: '' });
    const [showPaymentModal, setShowPaymentModal] = useState(false);
    const [pendingOrderData, setPendingOrderData] = useState(null);

    useEffect(() => {
        const isMobile = window.innerWidth <= 768;
        AOS.init({
            duration: isMobile ? 400 : 1000,
            once: true,
            offset: isMobile ? 20 : 100,
            disable: window.innerWidth < 400,
            startEvent: 'DOMContentLoaded',
        });

        healthCheck()
            .then(() => console.log('Backend connected'))
            .catch(() => {
                setAlert({
                    type: 'warning',
                    title: 'Backend Connection Issue',
                    text: 'Unable to connect to server. Some features may not work properly.',
                });
                setTimeout(() => setAlert({ type: '', title: '', text: '' }), 5000);
            });
    }, []);

    const handleFinalConfirm = useCallback(async (finalPayload) => {
        try {
            console.log('Final confirmation received. Payload:', finalPayload);
            setLoading(true);
            setLoadingMsg('Connecting to secure server...');

            const res = await submitOrder(finalPayload);
            console.log('Server response:', res.data);
            const result = res.data;

            if (result.success || result.orderId) {
                const payload = {
                    orderId: result.orderId || 'N/A',
                    ...finalPayload
                };
                try {
                    sessionStorage.setItem('lastOrder', JSON.stringify(payload));
                } catch (e) {
                    // ignore storage failures
                }
                navigate('/success', { state: payload });
            } else {
                throw new Error('Server returned unsuccessful response');
            }
        } catch (error) {
            console.error('Submission error details:', error);
            const msg = error.response?.data?.error || error.response?.data?.message || error.message || 'Check your internet or try again later';
            setAlert({ type: 'error', title: 'Order Failed', text: msg });
        } finally {
            setLoading(false);
        }
    }, [navigate]);

    const handleFormSubmit = useCallback((formData) => {
        if (formData.skipModal) {
            console.log('Direct submission from PaymentSystem (skipModal).');
            const finalPayload = {
                ...formData,
                transactionId: formData.txnId || '',
                finalPrice: formData.confirmedTotal || formData.totalPrice
            };
            handleFinalConfirm(finalPayload);
            return;
        }

        setPendingOrderData(formData);
        setShowPaymentModal(true);
    }, [handleFinalConfirm]);

    return (
        <>
            <ErrorBoundary>
                <ThreeBackground />
            </ErrorBoundary>
            {/* <Particles />  -- Removed legacy 2D particles in favor of Three.js */}
            <NetworkStatus />
            <LoadingOverlay show={loading} message={loadingMsg} />

            <ErrorBoundary>
                <HeroHeader />

                <div className="main-container container-fluid" data-aos="fade-up" style={{ position: 'relative', zIndex: 10 }}>
                    <JerseyShowcase price={price} />
                    <OrderForm onSubmit={handleFormSubmit} onPriceChange={setPrice} />
                </div>
            </ErrorBoundary>

            <AlertMessages
                type={alert.type}
                title={alert.title}
                text={alert.text}
                orderId={alert.orderId}
                onRetry={() => setAlert({ type: '', title: '', text: '', orderId: '' })}
            />

            <SizeChartModal />
            <PaymentModal
                show={showPaymentModal}
                orderData={pendingOrderData}
                onConfirm={handleFinalConfirm}
                onHide={() => setShowPaymentModal(false)}
            />

            <Footer />
        </>
    );
}
