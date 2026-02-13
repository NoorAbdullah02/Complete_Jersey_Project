import React from 'react';


export default function HeroHeader() {
    return (
        <section className="hero-header" data-aos="fade-down">
            <div className="hero-content">
                <h1 className="hero-title" data-aos="fade-up" data-aos-delay="200">
                    <i className="fas fa-tshirt"></i> ICE JERSEY
                </h1>
                <p className="hero-subtitle" data-aos="fade-up" data-aos-delay="400">
                    Department of BAUET • Premium Collection 2025
                </p>
                <div className="hero-badges" data-aos="fade-up" data-aos-delay="600">
                    <div className="hero-badge">
                        <i className="fas fa-star"></i> Limited Edition
                    </div>
                    <div className="hero-badge">
                        <i className="fas fa-shield-alt"></i> Premium Quality
                    </div>
                    <div className="hero-badge">
                        <i className="fas fa-graduation-cap"></i> Official Department
                    </div>
                </div>
            </div>
        </section>
    );
}
