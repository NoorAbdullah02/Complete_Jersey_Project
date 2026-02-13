import React, { useState, useEffect } from 'react';

export default function NetworkStatus() {
    const [isOnline, setIsOnline] = useState(navigator.onLine);
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        const handleOnline = () => {
            setIsOnline(true);
            setVisible(true);
            setTimeout(() => setVisible(false), 3000);
        };

        const handleOffline = () => {
            setIsOnline(false);
            setVisible(true);
        };

        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);

        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, []);

    return (
        <div
            className={`network-status ${isOnline ? 'online' : 'offline'} ${visible ? 'show' : ''}`}
        >
            <i className="fas fa-wifi"></i>{' '}
            <span>{isOnline ? 'Connected' : 'Disconnected'}</span>
        </div>
    );
}
