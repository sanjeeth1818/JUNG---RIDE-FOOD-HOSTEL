import React from 'react';
import { ArrowRight, Globe, Shield, Users } from 'lucide-react';

const About = () => {
    return (
        <div style={{ paddingBottom: '80px' }}>
            {/* Hero Section */}
            <section style={{
                backgroundColor: '#1B5E20',
                color: 'white',
                padding: '80px 24px',
                textAlign: 'center',
                borderRadius: '0 0 40px 40px'
            }}>
                <h1 style={{ fontSize: '40px', fontWeight: '800', marginBottom: '16px' }}>
                    Driving Sri Lanka Forward
                </h1>
                <p style={{ fontSize: '18px', opacity: 0.9, maxWidth: '600px', margin: '0 auto' }}>
                    We are JUNG. The everyday everything app that brings meals, mobility, and money solutions to millions of Sri Lankans.
                </p>
            </section>

            {/* Application Grid */}
            <div className="container" style={{ marginTop: '64px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '48px' }}>

                    <div style={{ textAlign: 'center' }}>
                        <div style={{ width: '64px', height: '64px', background: '#E8F5E9', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px' }}>
                            <Globe size={32} color="#2E7D32" />
                        </div>
                        <h3 style={{ fontSize: '24px', fontWeight: '700', marginBottom: '12px' }}>Economic Empowerment</h3>
                        <p style={{ color: '#666', lineHeight: '1.6' }}>
                            We create income opportunities for student riders, drivers, and merchant partners, helping everyone grow.
                        </p>
                    </div>

                    <div style={{ textAlign: 'center' }}>
                        <div style={{ width: '64px', height: '64px', background: '#E3F2FD', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px' }}>
                            <Shield size={32} color="#1565C0" />
                        </div>
                        <h3 style={{ fontSize: '24px', fontWeight: '700', marginBottom: '12px' }}>Safer Everyday</h3>
                        <p style={{ color: '#666', lineHeight: '1.6' }}>
                            Safety is our top priority. We use technology to track every ride and ensure quality in every order.
                        </p>
                    </div>

                    <div style={{ textAlign: 'center' }}>
                        <div style={{ width: '64px', height: '64px', background: '#FFF3E0', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px' }}>
                            <Users size={32} color="#EF6C00" />
                        </div>
                        <h3 style={{ fontSize: '24px', fontWeight: '700', marginBottom: '12px' }}>For Everyone</h3>
                        <p style={{ color: '#666', lineHeight: '1.6' }}>
                            Whether you are a student attending lectures or a professional working late, JUNG is built for you.
                        </p>
                    </div>

                </div>
            </div>

            {/* Mission Statement */}
            <section style={{ backgroundColor: '#F5F5F5', marginTop: '80px', padding: '100px 24px', textAlign: 'center' }}>
                <div className="container">
                    <h2 style={{ fontSize: '32px', fontWeight: '700', marginBottom: '32px' }}>Our Mission</h2>
                    <blockquote style={{ fontSize: '28px', fontStyle: 'italic', maxWidth: '800px', margin: '0 auto', color: '#1B5E20', fontWeight: '600', lineHeight: '1.4' }}>
                        "To drive Sri Lanka forward by creating economic empowerment for everyone, everywhere."
                    </blockquote>
                    <p style={{ marginTop: '24px', fontSize: '18px', color: '#666', maxWidth: '600px', margin: '32px auto 0' }}>
                        We believe that by leveraging technology, we can solve the daily challenges of millions while creating a more inclusive economy.
                    </p>
                </div>
            </section>

            {/* Rich Content Sections */}
            <section style={{ padding: '100px 0' }}>
                <div className="container" style={{ display: 'flex', flexDirection: 'column', gap: '100px' }}>

                    {/* Our Story */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '80px', alignItems: 'center' }}>
                        <div>
                            <span style={{ color: 'var(--color-primary)', fontWeight: '700', fontSize: '14px', textTransform: 'uppercase', letterSpacing: '2px' }}>The Beginning</span>
                            <h2 style={{ fontSize: '36px', fontWeight: '800', margin: '16px 0 24px' }}>From a Startup to a Solution.</h2>
                            <p style={{ fontSize: '18px', color: '#555', lineHeight: '1.8' }}>
                                JUNG started with a simple observation: students and workers in Sri Lanka needed a more reliable way to connect with essential services. What began as a small hostel-finding tool soon evolved into an "Everyday Everything App."
                                <br /><br />
                                Today, we are proud to be the pulse of the streets, connecting thousands of riders, vendors, and consumers every single minute.
                            </p>
                        </div>
                        <div style={{ backgroundColor: '#002E27', borderRadius: '40px', height: '400px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', padding: '40px' }}>
                            <div style={{ textAlign: 'center' }}>
                                <h3 style={{ fontSize: '64px', fontWeight: '800' }}>2024</h3>
                                <p style={{ fontSize: '20px', opacity: 0.8 }}>Founded in Colombo</p>
                            </div>
                        </div>
                    </div>

                    {/* Our Technology */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '80px', alignItems: 'center' }}>
                        <div style={{ backgroundColor: '#E8F5E9', borderRadius: '40px', height: '400px', overflow: 'hidden', position: 'relative' }}>
                            <div style={{ padding: '40px' }}>
                                <h3 style={{ fontSize: '24px', fontWeight: '800', color: '#1B5E20' }}>Smart Dispatching</h3>
                                <p style={{ color: '#2E7D32', marginTop: '12px' }}>AI-driven routing for faster deliveries.</p>
                            </div>
                        </div>
                        <div>
                            <span style={{ color: '#1565C0', fontWeight: '700', fontSize: '14px', textTransform: 'uppercase', letterSpacing: '2px' }}>Our Technology</span>
                            <h2 style={{ fontSize: '36px', fontWeight: '800', margin: '16px 0 24px' }}>Innovation in Every Line.</h2>
                            <p style={{ fontSize: '18px', color: '#555', lineHeight: '1.8' }}>
                                We don't just build apps; we solve complex logistics problems. Our hyper-local mapping technology ensures that even the hardest-to-find hostels are easily accessible to our riders.
                                <br /><br />
                                With real-time tracking and predictive demand analysis, we make sure that your food arrives hot and your rides arrive on time.
                            </p>
                        </div>
                    </div>

                    {/* Social Impact */}
                    <div style={{ textAlign: 'center', maxWidth: '800px', margin: '0 auto' }}>
                        <span style={{ color: '#EF6C00', fontWeight: '700', fontSize: '14px', textTransform: 'uppercase', letterSpacing: '2px' }}>Social Impact</span>
                        <h2 style={{ fontSize: '36px', fontWeight: '800', margin: '16px 0 24px' }}>Building a Better Future Together.</h2>
                        <p style={{ fontSize: '18px', color: '#555', lineHeight: '1.8' }}>
                            At JUNG, we measure success not just by revenue, but by the impact we have on our community. We have empowered over 5,000 student riders to earn a living while pursuing their degrees, and helped hundreds of local small businesses digitize their operations.
                        </p>
                        <div style={{ display: 'flex', justifyContent: 'center', gap: '40px', marginTop: '48px' }}>
                            <div>
                                <h4 style={{ fontSize: '32px', fontWeight: '800', color: 'var(--color-primary)' }}>10K+</h4>
                                <p style={{ color: '#666' }}>Active Users</p>
                            </div>
                            <div>
                                <h4 style={{ fontSize: '32px', fontWeight: '800', color: 'var(--color-primary)' }}>500+</h4>
                                <p style={{ color: '#666' }}>Local Shops</p>
                            </div>
                            <div>
                                <h4 style={{ fontSize: '32px', fontWeight: '800', color: 'var(--color-primary)' }}>LKR 50M+</h4>
                                <p style={{ color: '#666' }}>Partner Earnings</p>
                            </div>
                        </div>
                    </div>

                </div>
            </section>
        </div>
    );
};

export default About;
