import React from 'react';

export default function AlertMessages({ type, title, text, orderId, onRetry }) {
    if (!type) return null;

    const alertClass = {
        success: 'alert-success',
        error: 'alert-danger',
        warning: 'alert-warning',
        info: 'alert-info',
    }[type];

    const iconClass = {
        success: 'fa-check-circle',
        error: 'fa-exclamation-triangle',
        warning: 'fa-exclamation-circle',
        info: 'fa-info-circle',
    }[type];

    return (
        <div className={`alert ${alertClass}`} style={{ display: 'block' }}>
            <div className="text-center">
                <i className={`fas ${iconClass} fa-3x mb-3`}></i>
                <h4>{title}</h4>
                {type === 'success' ? (
                    <>
                        <p>
                            Your jersey order has been received and a confirmation email has been sent to your email
                            address. Our team will contact you soon for final confirmation and delivery details.
                        </p>
                        <hr />
                        <small>Order ID: #ICE-{orderId}</small>
                    </>
                ) : (
                    <p>{text}</p>
                )}
                {type === 'error' && onRetry && (
                    <button type="button" className="btn btn-outline-light mt-3" onClick={onRetry}>
                        <i className="fas fa-redo"></i> Try Again
                    </button>
                )}
            </div>
        </div>
    );
}
