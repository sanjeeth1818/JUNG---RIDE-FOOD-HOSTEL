import React from 'react';
import { Outlet, useLocation, Link } from 'react-router-dom';
import Navbar from './Navbar';

const MainLayout = () => {
    const { pathname } = useLocation();

    // Pages that should be full-screen without footer (usually map-centric or checkout flows)
    const hideFooter = pathname === '/student/rides' ||
        pathname === '/partner/dashboard/rider' ||
        pathname.startsWith('/food/');

    return (
        <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', backgroundColor: '#f8fafc' }}>
            <Navbar />
            <main style={{ flex: 1, width: '100%', display: 'flex', flexDirection: 'column' }}>
                <Outlet />
            </main>

            {!hideFooter && (
                <footer style={{
                    background: 'linear-gradient(180deg, #002E27 0%, #001A16 100%)',
                    color: 'white',
                    padding: '64px 0 32px',
                    marginTop: 'auto',
                    zIndex: 10
                }}>
                    <div className="container" style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 20px' }}>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '64px', marginBottom: '40px' }}>
                            {/* Brand Column */}
                            <div style={{ gridColumn: 'span 2' }}>
                                <h3 style={{ fontSize: '32px', fontWeight: '800', marginBottom: '24px', color: '#00B14F' }}>JUNG</h3>
                                <p style={{ opacity: 0.7, fontSize: '16px', lineHeight: '1.6', maxWidth: '300px', marginBottom: '32px' }}>
                                    Sri Lanka's leading everyday everything app. Delivering happiness and mobility since 2024.
                                </p>
                                <div style={{ display: 'flex', gap: '16px' }}>
                                    <SocialCircle icon="F" />
                                    <SocialCircle icon="I" />
                                    <SocialCircle icon="T" />
                                    <SocialCircle icon="L" />
                                </div>
                            </div>

                            {/* Links Columns */}
                            <div>
                                <h4 style={{ fontSize: '18px', fontWeight: '700', marginBottom: '24px' }}>Services</h4>
                                <FooterLink to="/food">Food Delivery</FooterLink>
                                <FooterLink to="/student/rides">Rides & Mobility</FooterLink>
                                <FooterLink to="/rooms">Student Rooms</FooterLink>
                                <FooterLink to="/mart">JUNG Mart</FooterLink>
                            </div>

                            <div>
                                <h4 style={{ fontSize: '18px', fontWeight: '700', marginBottom: '24px' }}>Support</h4>
                                <FooterLink to="/help">Help Centre</FooterLink>
                                <FooterLink to="/about">About Us</FooterLink>
                                <FooterLink to="#">Safety</FooterLink>
                                <FooterLink to="#">Contact</FooterLink>
                            </div>

                            {/* Newsletter */}
                            <div style={{ gridColumn: 'span 2' }}>
                                <h4 style={{ fontSize: '18px', fontWeight: '700', marginBottom: '24px' }}>Stay in the Loop</h4>
                                <p style={{ opacity: 0.7, marginBottom: '24px', fontSize: '14px' }}>Get the latest updates and offers directly in your inbox.</p>
                                <div style={{ display: 'flex', gap: '8px' }}>
                                    <input
                                        type="text"
                                        placeholder="Enter your email"
                                        style={{
                                            flex: 1,
                                            padding: '14px 20px',
                                            borderRadius: '12px',
                                            border: '1px solid rgba(255,255,255,0.1)',
                                            backgroundColor: 'rgba(255,255,255,0.05)',
                                            color: 'white',
                                            outline: 'none'
                                        }}
                                    />
                                    <button style={{
                                        backgroundColor: '#00B14F',
                                        color: 'white',
                                        padding: '14px 24px',
                                        borderRadius: '12px',
                                        fontWeight: '700',
                                        border: 'none',
                                        cursor: 'pointer'
                                    }}>Subscribe</button>
                                </div>
                            </div>
                        </div>

                        {/* Bottom Bar */}
                        <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '24px' }}>
                            <p style={{ fontSize: '14px', opacity: 0.5 }}>© {new Date().getFullYear()} JUNG Technologies. All rights reserved.</p>
                            <div style={{ display: 'flex', gap: '24px', fontSize: '14px', opacity: 0.5 }}>
                                <span style={{ cursor: 'pointer' }}>Terms of Service</span>
                                <span style={{ cursor: 'pointer' }}>Privacy Policy</span>
                            </div>
                        </div>
                    </div>
                </footer>
            )}
        </div>
    );
};

const FooterLink = ({ children, to }) => (
    <Link to={to} style={{
        display: 'block',
        fontSize: '15px',
        color: 'white',
        opacity: 0.6,
        textDecoration: 'none',
        marginBottom: '12px',
        transition: 'all 0.2s'
    }} className="footer-link">
        {children}
    </Link>
);

const SocialCircle = ({ icon }) => (
    <div style={{
        width: '36px',
        height: '36px',
        borderRadius: '50%',
        backgroundColor: 'rgba(255,255,255,0.05)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '14px',
        fontWeight: 'bold',
        cursor: 'pointer',
        transition: 'all 0.2s'
    }} className="social-circle">
        {icon}
    </div>
);

export default MainLayout;
