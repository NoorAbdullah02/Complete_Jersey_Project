import React, { useEffect, useRef } from 'react';

export default function Particles() {
    const containerRef = useRef(null);

    useEffect(() => {
        const container = containerRef.current;
        if (!container) return;

        // More aggressive performance checks
        const isMobile = window.innerWidth <= 768;
        const isLowEnd = (navigator.hardwareConcurrency && navigator.hardwareConcurrency <= 4) || window.innerWidth <= 480;

        let particleCount;
        if (isLowEnd) {
            particleCount = 5; // Minimal particles for low end instead of 0 for some life
        } else if (isMobile) {
            particleCount = 12;
        } else {
            particleCount = 30; // Reduced from 40 for better performance
        }

        const fragment = document.createDocumentFragment();
        const particleTypes = ['particle-1', 'particle-2', 'particle-3'];

        for (let i = 0; i < particleCount; i++) {
            const particle = document.createElement('div');
            const randomType = particleTypes[Math.floor(Math.random() * particleTypes.length)];
            particle.className = `particle ${randomType}`;
            particle.style.left = Math.random() * 100 + '%';
            particle.style.animationDelay = (Math.random() * 10) + 's';
            particle.style.animationDuration = (Math.random() * 7 + 10) + 's'; // Slightly slower for less CPU load
            fragment.appendChild(particle);
        }

        container.appendChild(fragment);

        return () => {
            if (container) container.innerHTML = '';
        };
    }, []);

    return <div className="particles" ref={containerRef} style={{ pointerEvents: 'none' }}></div>;
}
