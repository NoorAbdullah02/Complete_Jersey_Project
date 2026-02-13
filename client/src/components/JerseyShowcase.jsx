import React from 'react';
import jerseyImage from '../assets/images/latest.webp';


export default function JerseyShowcase({ price }) {
    return (
        <section className="jersey-showcase">
            <div className="jersey-content">
                <h2 className="jersey-title">OFFICIAL JERSEY OF ICE DEPARTMENT</h2>

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
