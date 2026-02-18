import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Lock, ArrowRight, ArrowLeft } from 'lucide-react';
import { useUser } from '../../context/UserContext';

const PartnerLogin = () => {
    const { loginAsPartner } = useUser();
    const navigate = useNavigate();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [partnerType, setPartnerType] = useState('Food'); // Default
    const [error, setError] = useState('');

    const handleLogin = async (e) => {
        e.preventDefault();
        setError('');

        try {
            const response = await fetch('http://localhost:5000/api/partners/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password, type: partnerType })
            });

            const data = await response.json();

            if (response.ok) {
                loginAsPartner(data.partner);
                // Proceed
                if (partnerType === 'Rider') navigate('/partner/dashboard/rider');
                else if (partnerType === 'Food') navigate('/partner/dashboard/food');
                else if (partnerType === 'Room') navigate('/partner/dashboard/room');
            } else {
                setError(data.error || 'Login failed');
            }
        } catch (err) {
            console.error(err);
            setError('Connection failed. Please try again.');
        }
    };

    return (
        <div style={{
            height: '100vh',
            overflow: 'hidden',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'radial-gradient(circle at top right, #00B14F 0%, #002E27 100%)',
            padding: '24px',
            position: 'relative'
        }}>
            {/* Ambient Background Elements (Same as Student Login) */}
            <div style={{
                position: 'absolute',
                top: '-10%',
                right: '-5%',
                width: '400px',
                height: '400px',
                background: 'rgba(0, 177, 79, 0.1)',
                borderRadius: '50%',
                filter: 'blur(80px)'
            }} />
            <div style={{
                position: 'absolute',
                bottom: '-10%',
                left: '-5%',
                width: '300px',
                height: '300px',
                background: 'rgba(255, 255, 255, 0.05)',
                borderRadius: '50%',
                filter: 'blur(60px)'
            }} />

            <div style={{
                width: '100%',
                maxWidth: '480px',
                backgroundColor: 'white',
                padding: '40px',
                borderRadius: '24px',
                boxShadow: 'var(--shadow-lg)',
                position: 'relative'
            }} className="animate-scale-in">

                {/* Back Button matching Student Login position */}
                <button
                    onClick={() => navigate('/partner-select')}
                    style={{
                        position: 'absolute',
                        top: '24px',
                        left: '24px',
                        display: 'flex', alignItems: 'center', gap: '4px', border: 'none', background: 'none', cursor: 'pointer', color: '#666', fontWeight: '500', fontSize: '14px'
                    }}
                >
                    <ArrowLeft size={16} /> Back
                </button>

                <div style={{ textAlign: 'center', marginBottom: '32px', marginTop: '16px' }}>
                    <div style={{
                        width: '64px',
                        height: '64px',
                        borderRadius: '50%',
                        backgroundColor: 'var(--color-bg-light)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        margin: '0 auto 16px',
                        color: 'var(--color-primary)'
                    }}>
                        {/* Slightly different icon to distinguish? Or keep generic? User said "similer to system theme" */}
                        <User size={32} />
                    </div>
                    <h1 style={{ fontSize: '24px', fontWeight: 'bold', color: 'var(--color-text-main)', marginBottom: '8px' }}>Partner Login</h1>
                    <p style={{ color: 'var(--color-text-secondary)', fontSize: '14px' }}>Access your business dashboard</p>
                </div>

                {error && (
                    <div style={{ backgroundColor: '#FEE2E2', border: '1px solid #FECACA', color: '#DC2626', padding: '12px', borderRadius: '8px', marginBottom: '20px', fontSize: '14px', textAlign: 'center' }}>
                        {error}
                    </div>
                )}

                <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    <div>
                        <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', fontSize: '14px', color: '#333' }}>Account Type</label>
                        <select
                            value={partnerType}
                            onChange={(e) => setPartnerType(e.target.value)}
                            style={{
                                width: '100%',
                                padding: '14px',
                                borderRadius: '12px',
                                border: '1px solid var(--color-border)',
                                fontSize: '15px',
                                outline: 'none',
                                backgroundColor: 'white'
                            }}
                        >
                            <option value="Rider">JUNG Rider</option>
                            <option value="Food">JUNG Food</option>
                            <option value="Room">JUNG Rooms</option>
                        </select>
                    </div>

                    <div>
                        <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', fontSize: '14px', color: '#333' }}>Email Address</label>
                        <div style={{ position: 'relative' }}>
                            <User size={20} color="#999" style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)' }} />
                            <input
                                type="email"
                                required
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="name@business.com"
                                style={{
                                    width: '100%',
                                    padding: '14px 16px 14px 48px',
                                    borderRadius: '12px',
                                    border: '1px solid var(--color-border)',
                                    fontSize: '15px',
                                    outline: 'none',
                                    transition: 'border-color 0.2s'
                                }}
                                onFocus={(e) => e.target.style.borderColor = 'var(--color-primary)'}
                                onBlur={(e) => e.target.style.borderColor = 'var(--color-border)'}
                            />
                        </div>
                    </div>

                    <div>
                        <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', fontSize: '14px', color: '#333' }}>Password</label>
                        <div style={{ position: 'relative' }}>
                            <Lock size={20} color="#999" style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)' }} />
                            <input
                                type="password"
                                required
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="••••••••"
                                style={{
                                    width: '100%',
                                    padding: '14px 16px 14px 48px',
                                    borderRadius: '12px',
                                    border: '1px solid var(--color-border)',
                                    fontSize: '15px',
                                    outline: 'none',
                                    transition: 'border-color 0.2s'
                                }}
                                onFocus={(e) => e.target.style.borderColor = 'var(--color-primary)'}
                                onBlur={(e) => e.target.style.borderColor = 'var(--color-border)'}
                            />
                        </div>
                    </div>

                    <button
                        type="submit"
                        style={{
                            marginTop: '8px',
                            padding: '16px',
                            borderRadius: '12px',
                            backgroundColor: 'var(--color-primary)', // Green brand color
                            color: 'white',
                            fontWeight: '600',
                            fontSize: '16px',
                            border: 'none',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '8px',
                            transition: 'opacity 0.2s'
                        }}
                    >
                        Login <ArrowRight size={20} />
                    </button>
                </form>

                <div style={{ textAlign: 'center', marginTop: '24px', paddingTop: '24px', borderTop: '1px solid #f0f0f0' }}>
                    <p style={{ fontSize: '14px', color: '#666' }}>
                        Don't have a partner account?  <span onClick={() => navigate('/partner-select')} style={{ color: 'var(--color-primary)', fontWeight: '600', cursor: 'pointer' }}>Register Now</span>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default PartnerLogin;
