import React from 'react';

export default function LoadingOverlay({ show, message = 'Processing Your Order...' }) {
    return (
        <div className={`loading-overlay ${show ? 'show' : ''}`}>
            <div className="loading-content">
                <div className="spinner"></div>
                <h3>{message}</h3>
                <p>Please wait while we submit your jersey order</p>
            </div>
        </div>
    );
}
