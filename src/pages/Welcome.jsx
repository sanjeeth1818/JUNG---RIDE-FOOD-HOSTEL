import React from 'react';
import { useNavigate } from 'react-router-dom';
import { GraduationCap, Briefcase } from 'lucide-react';

const Welcome = () => {
    const navigate = useNavigate();

    return (
        <div style={{ padding: '24px', height: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, #E8F5E9 0%, #FFFFFF 100%)' }}>

            <div style={{ marginBottom: '60px', textAlign: 'center' }} className="animate-scale-in">
                <img src="/logo.png" alt="JUNG" style={{ height: '100px', objectFit: 'contain', marginBottom: '16px' }} />
                <p style={{ color: '#666', fontSize: '16px' }}>One App. All Sri Lanka.</p>
            </div>

            <div style={{ width: '100%' }} className="animate-slide-up delay-100">
                <h2 style={{ fontSize: '20px', fontWeight: '600', marginBottom: '24px', textAlign: 'center' }}>Who are you?</h2>

                <button
                    onClick={() => navigate('/student/university')}
                    className="hover-scale"
                    style={{
                        width: '100%',
                        padding: '24px',
                        borderRadius: '24px',
                        backgroundColor: 'white',
                        boxShadow: '0 4px 15px rgba(0,0,0,0.05)',
                        marginBottom: '16px',
                        display: 'flex',
                        alignItems: 'center',
                        transition: 'transform 0.2s',
                        border: '2px solid transparent'
                    }}
                    onMouseOver={(e) => { e.currentTarget.style.borderColor = '#2E7D32'; }}
                    onMouseOut={(e) => { e.currentTarget.style.borderColor = 'transparent'; }}
                >
                    <div style={{ width: '56px', height: '56px', borderRadius: '16px', background: '#E8F5E9', display: 'flex', alignItems: 'center', justifyContent: 'center', marginRight: '20px' }}>
                        <GraduationCap size={28} color="#2E7D32" />
                    </div>
                    <div style={{ textAlign: 'left' }}>
                        <h3 style={{ fontSize: '18px', fontWeight: '700', color: '#1A1A1A', marginBottom: '4px' }}>I am a Student</h3>
                        <p style={{ fontSize: '13px', color: '#757575' }}>Find rooms, food & rides around campus</p>
                    </div>
                </button>

                <button
                    onClick={() => navigate('/worker/location')}
                    className="hover-scale"
                    style={{
                        width: '100%',
                        padding: '24px',
                        borderRadius: '24px',
                        backgroundColor: 'white',
                        boxShadow: '0 4px 15px rgba(0,0,0,0.05)',
                        display: 'flex',
                        alignItems: 'center',
                        transition: 'transform 0.2s',
                        border: '2px solid transparent'
                    }}
                    onMouseOver={(e) => { e.currentTarget.style.borderColor = '#2E7D32'; }}
                    onMouseOut={(e) => { e.currentTarget.style.borderColor = 'transparent'; }}
                >
                    <div style={{ width: '56px', height: '56px', borderRadius: '16px', background: '#E3F2FD', display: 'flex', alignItems: 'center', justifyContent: 'center', marginRight: '20px' }}>
                        <Briefcase size={28} color="#1565C0" />
                    </div>
                    <div style={{ textAlign: 'left' }}>
                        <h3 style={{ fontSize: '18px', fontWeight: '700', color: '#1A1A1A', marginBottom: '4px' }}>I am a Worker</h3>
                        <p style={{ fontSize: '13px', color: '#757575' }}>Services based on your city location</p>
                    </div>
                </button>

                <div style={{ textAlign: 'center', marginTop: '24px' }}>
                    <button
                        onClick={() => navigate('/partner-select')}
                        className="hover-scale"
                        style={{ background: 'none', border: 'none', color: '#2E7D32', fontWeight: '600', fontSize: '14px', cursor: 'pointer', textDecoration: 'underline' }}
                    >
                        Want to become a Partner?
                    </button>
                </div>
            </div>

            <div style={{ marginTop: 'auto', marginBottom: '24px' }} className="animate-fade-in delay-300">
                <p style={{ fontSize: '12px', color: '#AAA' }}>Version 1.0.0 • Made for Sri Lanka 🇱🇰</p>
            </div>
        </div>
    );
};

export default Welcome;
