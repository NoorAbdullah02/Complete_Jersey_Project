import React from 'react';
import jerseyImage from '../assets/images/latest.webp';


export default function JerseyShowcase({ price }) {
    return (
        <section className="jersey-showcase">
            <div className="jersey-content" style={{ zIndex: 10, position: 'relative' }}>
                <h1 className="jersey-title" style={{ fontFamily: "'Orbitron', sans-serif", fontSize: 'clamp(2rem, 5vw, 3.5rem)', fontWeight: 800, textShadow: '0 0 20px rgba(0, 242, 254, 0.4)', background: 'linear-gradient(45deg, #00f2fe, #4facfe)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', marginBottom: '30px' }}>
                    OFFICIAL ICE DEPARTMENT JERSEY
                </h1>

                <div className="jersey-image-container">
                    <img src={jerseyImage} alt="ICE Department Jersey" className="jersey-image" />
                </div>

                <div className="price-display" id="priceDisplay">
                    <div className="price-text" id="priceText">৳{price}</div>
                    <div className="price-label">Starting Price</div>
                </div>

                <button
                    type="button"
                    className="btn size-chart-btn"
                    data-bs-toggle="modal"
                    data-bs-target="#sizeChartModal"
                >
                    <i className="fas fa-ruler"></i> View Size Chart
                </button>
            </div>
        </section>
    );
}
