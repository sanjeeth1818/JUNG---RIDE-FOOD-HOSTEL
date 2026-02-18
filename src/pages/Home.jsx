import React from 'react';
import HeroSection from '../components/home/HeroSection';
import ServicesGrid from '../components/home/ServicesGrid';

const Home = () => {
    return (
        <div style={{ backgroundColor: 'white' }}>
            <HeroSection />
            <ServicesGrid />

            {/* Partner Section */}
            <div className="container" style={{ marginTop: '24px', marginBottom: '48px' }}>
                <div style={{
                    background: 'linear-gradient(135deg, #1B5E20 0%, #2E7D32 100%)',
                    borderRadius: '24px',
                    padding: '32px',
                    color: 'white',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    flexWrap: 'wrap',
                    gap: '24px'
                }}>
                    <div>
                        <h2 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '8px' }}>Partner with JUNG</h2>
                        <p style={{ opacity: 0.9 }}>Earn money by driving, delivering, or hosting.</p>
                    </div>
                    <a
                        href="/partner-select"
                        style={{
                            backgroundColor: 'white',
                            color: '#1B5E20',
                            padding: '16px 32px',
                            borderRadius: '16px',
                            fontWeight: 'bold',
                            textDecoration: 'none',
                            display: 'inline-block',
                            boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                        }}
                    >
                        Get Started
                    </a>
                </div>
            </div>


            {/* Additional content section for "Why JUNG" or Promotions could go here */}
            <section className="container" style={{ padding: '64px 24px', textAlign: 'center' }}>
                <h2 style={{ fontSize: '28px', fontWeight: 'bold', marginBottom: '16px' }}>
                    Why JUNG?
                </h2>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '48px', marginTop: '48px' }}>
                    <div>
                        <h3 style={{ fontSize: '20px', fontWeight: '600', marginBottom: '12px' }}>Safe & Secure</h3>
                        <p style={{ color: 'var(--color-text-secondary)' }}>Every order and trip is tracked for your safety.</p>
                    </div>
                    <div>
                        <h3 style={{ fontSize: '20px', fontWeight: '600', marginBottom: '12px' }}>Diverse Options</h3>
                        <p style={{ color: 'var(--color-text-secondary)' }}>From local street food to 5-star dining.</p>
                    </div>
                    <div>
                        <h3 style={{ fontSize: '20px', fontWeight: '600', marginBottom: '12px' }}>24/7 Support</h3>
                        <p style={{ color: 'var(--color-text-secondary)' }}>We are here for you, anytime, anywhere.</p>
                    </div>
                </div>
            </section>
        </div>
    );
};

export default Home;
