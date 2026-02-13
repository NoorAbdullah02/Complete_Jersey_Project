import React, { createContext, useContext, useState, useCallback } from 'react';

const ToastContext = createContext();

export const useToast = () => useContext(ToastContext);

export const ToastProvider = ({ children }) => {
    const [toasts, setToasts] = useState([]);

    const showToast = useCallback((message, type = 'info') => {
        const id = Date.now();
        setToasts(prev => [...prev, { id, message, type }]);
        setTimeout(() => {
            setToasts(prev => prev.filter(t => t.id !== id));
        }, 4000);
    }, []);

    const removeToast = (id) => {
        setToasts(prev => prev.filter(t => t.id !== id));
    };

    return (
        <ToastContext.Provider value={{ showToast }}>
            {children}
            <div className="toast-container">
                {toasts.map(toast => (
                    <div key={toast.id} className={`cyber-toast ${toast.type}`} onClick={() => removeToast(toast.id)}>
                        <div className="toast-icon">
                            {toast.type === 'success' && <i className="fas fa-check-circle"></i>}
                            {toast.type === 'error' && <i className="fas fa-exclamation-triangle"></i>}
                            {toast.type === 'info' && <i className="fas fa-info-circle"></i>}
                            {toast.type === 'warning' && <i className="fas fa-exclamation-circle"></i>}
                        </div>
                        <div className="toast-content">{toast.message}</div>
                        <div className="toast-progress"></div>
                    </div>
                ))}
            </div>
        </ToastContext.Provider>
    );
};
