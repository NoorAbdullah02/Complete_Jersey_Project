import React from 'react';
import { useNavigate } from 'react-router-dom';

export default function Footer() {
    const navigate = useNavigate();

    return (
        <footer className="footer">
            <div className="footer-content">
                <div className="container">
                    <div className="dept-info">
                        <h2 className="dept-title">Department of Information &amp; Communication Engineering (ICE)</h2>
                        <p className="dept-description">
                            The Department of ICE (BAUET) stands as a beacon of technological innovation and
                            academic excellence. Established with the vision of nurturing future tech leaders,
                            ICE combines cutting-edge curriculum with hands-on practical experience.
                        </p>

                        <div className="dept-stats">
                            <div className="stat-item">
                                <div className="stat-number">500+</div>
                                <div className="stat-label">Active Students</div>
                            </div>
                            <div className="stat-item">
                                <div className="stat-number">50+</div>
                                <div className="stat-label">Expert Faculty</div>
                            </div>
                            <div className="stat-item">
                                <div className="stat-number">15+</div>
                                <div className="stat-label">Research Labs</div>
                            </div>
                            <div className="stat-item">
                                <div className="stat-number">95%</div>
                                <div className="stat-label">Job Placement</div>
                            </div>
                        </div>
                    </div>

                    <div className="social-section">
                        <h4 style={{ marginBottom: '25px', fontFamily: "'Orbitron', monospace" }}>Connect With ICE</h4>
                        <div className="social-links">
                            <a href="https://www.facebook.com/bauet.ice" className="social-link"><i className="fab fa-facebook-f"></i></a>
                            <a href="#" className="social-link"><i className="fab fa-linkedin-in"></i></a>
                            <a href="#" className="social-link"><i className="fab fa-twitter"></i></a>
                            <a href="#" className="social-link"><i className="fab fa-github"></i></a>
                            <a href="#" className="social-link"><i className="fab fa-instagram"></i></a>
                        </div>
                        <div className="copyright">
                            <p>&copy; 2025 Department of ICE (BAUET). All Rights Reserved.</p>
                            <div className="footer-buttons">
                                <button
                                    className="btn btn-secondary"
                                    onClick={() => navigate('/modify-order')}
                                >
                                    <span className="btn-text">Modify Order</span>
                                    <span className="btn-icon">↗</span>
                                </button>
                                <button
                                    className="btn btn-primary"
                                    onClick={() => navigate('/admin')}
                                >
                                    <span className="btn-text">ICE-14th</span>
                                    <span className="btn-icon">→</span>
                                </button>
                            </div>
                            <p className="mt-4 text-xs text-slate-500">Empowering Future Tech Leaders | Building Tomorrow's Digital World</p>
                        </div>
                    </div>
                </div>
            </div>

            <style>{`
                .footer-buttons {
                    display: flex;
                    gap: 16px;
                    justify-content: center;
                    flex-wrap: wrap;
                    margin: 20px 0;
                    width: 100%;
                    box-sizing: border-box;
                }

                .btn {
                    display: inline-flex;
                    align-items: center;
                    justify-content: center;
                    gap: 8px;
                    padding: 12px 28px;
                    border: none;
                    border-radius: 8px;
                    font-size: 14px;
                    font-weight: 600;
                    text-transform: uppercase;
                    letter-spacing: 0.5px;
                    cursor: pointer;
                    transition: all 0.3s ease;
                    position: relative;
                    overflow: hidden;
                    min-height: 48px;
                    -webkit-user-select: none;
                    user-select: none;
                    -webkit-tap-highlight-color: transparent;
                    -webkit-touch-callout: none;
                }

                .btn::before {
                    content: '';
                    position: absolute;
                    top: 0;
                    left: -100%;
                    width: 100%;
                    height: 100%;
                    background: rgba(255, 255, 255, 0.2);
                    transition: left 0.3s ease;
                    z-index: 0;
                }

                .btn:hover::before {
                    left: 100%;
                }

                .btn:active::before {
                    left: 0%;
                }

                .btn-text, .btn-icon {
                    position: relative;
                    z-index: 1;
                    white-space: nowrap;
                }

                .btn-icon {
                    font-size: 16px;
                    transition: transform 0.3s ease;
                    display: inline-block;
                }

                @media (hover: hover) and (pointer: fine) {
                    .btn:hover .btn-icon {
                        transform: translateX(4px);
                    }

                    .btn:hover {
                        transform: translateY(-2px);
                    }
                }

                @media (hover: none) and (pointer: coarse) {
                    .btn:active .btn-icon {
                        transform: translateX(4px);
                    }

                    .btn:active {
                        transform: scale(0.98);
                    }
                }

                /* Primary Button - Admin Login */
                .btn-primary {
                    background: linear-gradient(135deg, #00d4ff 0%, #0099ff 100%);
                    color: white;
                    box-shadow: 0 4px 15px rgba(0, 212, 255, 0.3);
                }

                @media (hover: hover) and (pointer: fine) {
                    .btn-primary:hover {
                        box-shadow: 0 6px 25px rgba(0, 212, 255, 0.5);
                    }
                }

                .btn-primary:active {
                    box-shadow: 0 2px 10px rgba(0, 212, 255, 0.3);
                }

                /* Secondary Button - Modify Order */
                .btn-secondary {
                    background: rgba(255, 255, 255, 0.15);
                    color: #00d4ff;
                    border: 1.5px solid #00d4ff;
                    backdrop-filter: blur(10px);
                    -webkit-backdrop-filter: blur(10px);
                }

                @media (hover: hover) and (pointer: fine) {
                    .btn-secondary:hover {
                        background: rgba(0, 212, 255, 0.1);
                        border-color: #00d4ff;
                        box-shadow: 0 4px 15px rgba(0, 212, 255, 0.2);
                    }
                }

                .btn-secondary:active {
                    background: rgba(0, 212, 255, 0.15);
                }

                /* Large Devices - Desktop (1024px and up) */
                @media (min-width: 1024px) {
                    .btn {
                        padding: 14px 32px;
                        font-size: 15px;
                    }
                }

                /* Tablets (769px - 1023px) */
                @media (min-width: 769px) and (max-width: 1023px) {
                    .btn {
                        padding: 12px 28px;
                        font-size: 14px;
                    }
                }

                /* Small Tablets & Large Phones (481px - 768px) */
                @media (max-width: 768px) {
                    .footer-buttons {
                        flex-direction: column;
                        gap: 12px;
                        padding: 0 12px;
                    }

                    .btn {
                        width: 100%;
                        padding: 14px 24px;
                        font-size: 14px;
                        min-height: 50px;
                    }
                }

                /* Mobile Phones (320px - 480px) */
                @media (max-width: 480px) {
                    .footer-buttons {
                        flex-direction: column;
                        gap: 10px;
                        padding: 0 8px;
                    }

                    .btn {
                        width: 100%;
                        padding: 12px 16px;
                        font-size: 13px;
                        min-height: 48px;
                        letter-spacing: 0px;
                    }

                    .btn-icon {
                        font-size: 14px;
                    }
                }

                /* Extra Small Devices (up to 320px) */
                @media (max-width: 319px) {
                    .footer-buttons {
                        flex-direction: column;
                        gap: 8px;
                        padding: 0 4px;
                    }

                    .btn {
                        width: 100%;
                        padding: 11px 12px;
                        font-size: 12px;
                        min-height: 44px;
                    }

                    .btn-text {
                        font-weight: 500;
                    }

                    .btn-icon {
                        font-size: 12px;
                        display: none;
                    }
                }

                /* Landscape Orientation - Mobile */
                @media (max-height: 500px) and (orientation: landscape) {
                    .btn {
                        padding: 10px 20px;
                        min-height: 44px;
                    }
                }

                /* High DPI / Retina Displays */
                @media (-webkit-min-device-pixel-ratio: 2), (min-resolution: 192dpi) {
                    .btn {
                        border-width: 0.5px;
                    }

                    .btn-secondary {
                        border-width: 0.75px;
                    }
                }

                /* Reduced Motion for Accessibility */
                @media (prefers-reduced-motion: reduce) {
                    .btn, .btn::before, .btn-icon {
                        transition: none;
                    }
                }

                /* Dark Mode Support */
                @media (prefers-color-scheme: dark) {
                    .btn-secondary {
                        background: rgba(0, 212, 255, 0.05);
                    }
                }

                /* Focus States for Accessibility */
                .btn:focus-visible {
                    outline: 2px solid #00d4ff;
                    outline-offset: 2px;
                }

                /* Print Styles */
                @media print {
                    .footer-buttons {
                        display: none;
                    }
                }
            `}</style>
        </footer>
    );
}