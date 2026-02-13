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
                            <p>Empowering Future Tech Leaders | Building Tomorrow's Digital World</p>
                            <p className="ice-gradient" onClick={() => navigate('/admin')} style={{ cursor: 'pointer' }}>
                                ICE-14th
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </footer>
    );
}
