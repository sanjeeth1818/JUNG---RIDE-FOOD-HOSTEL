import React, { useState } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { User, Lock, Mail, ArrowRight, ArrowLeft } from 'lucide-react';
import { useUser } from '../context/UserContext';

const SignUp = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const { login } = useUser(); // Using login for now to simulate auth

    // Default to student/university flow if no state provided
    const { type = 'student', redirectAfter = '/student/university' } = location.state || {};

    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        confirmPassword: ''
    });
    const [showApprovalMessage, setShowApprovalMessage] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);

        if (formData.password !== formData.confirmPassword) {
            alert("Passwords do not match!");
            setIsLoading(false);
            return;
        }

        try {
            const response = await fetch('http://localhost:5000/api/auth/register', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    name: formData.name,
                    email: formData.email,
                    password: formData.password,
                    user_type: type
                }),
            });


            const data = await response.json();

            if (response.ok) {
                if (type !== 'student') {
                    setShowApprovalMessage(true);
                } else {
                    navigate('/login', { state: { type, redirectAfter } });
                }
            } else {
                alert(data.error || 'Registration failed');
            }
        } catch (error) {
            console.error('Registration error:', error);
            alert('Something went wrong. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    if (showApprovalMessage) {
        return (
            <div style={{
                height: '100vh',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'radial-gradient(circle at top right, #00B14F 0%, #002E27 100%)',
                padding: '24px'
            }}>
                <div style={{
                    backgroundColor: 'white',
                    padding: '40px',
                    borderRadius: '24px',
                    boxShadow: '0 20px 50px rgba(0,0,0,0.3)',
                    textAlign: 'center',
                    maxWidth: '450px',
                    width: '100%'
                }} className="animate-scale-in">
                    <div style={{
                        width: '80px',
                        height: '80px',
                        borderRadius: '50%',
                        backgroundColor: '#dcfce7',
                        color: '#16a34a',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        margin: '0 auto 24px'
                    }}>
                        <Mail size={40} />
                    </div>
                    <h2 style={{ fontSize: '24px', fontWeight: '800', color: '#1E293B', marginBottom: '16px' }}>Registration Successful!</h2>
                    <p style={{ color: '#64748B', lineHeight: '1.6', marginBottom: '32px' }}>
                        Your partner account has been created and is currently <strong>pending admin approval</strong>.
                        <br /><br />
                        You will receive an email once your account has been verified and activated. Please wait for approval before logging in.
                    </p>
                    <button
                        onClick={() => navigate('/')}
                        style={{
                            padding: '14px 32px',
                            backgroundColor: '#16a34a',
                            color: 'white',
                            borderRadius: '12px',
                            border: 'none',
                            fontWeight: '700',
                            fontSize: '16px',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            margin: '0 auto'
                        }}
                    >
                        Return Home <ArrowRight size={20} />
                    </button>
                </div>
            </div>
        );
    }

    return (
        <>
            {/* Fixed Background Layer */}
            <div style={{
                position: 'fixed',
                top: 0,
                left: 0,
                width: '100vw',
                height: '100vh',
                background: 'radial-gradient(circle at top right, #00B14F 0%, #002E27 100%)',
                zIndex: 0,
                overflow: 'hidden'
            }}>
                {/* Ambient Background Elements */}
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
            </div>

            {/* Scrollable Content Layer */}
            <div style={{
                minHeight: '100vh',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '24px',
                position: 'relative',
                zIndex: 1
            }}>
                <div style={{
                    backgroundColor: 'white',
                    padding: '40px',
                    borderRadius: '24px',
                    boxShadow: 'var(--shadow-lg)',
                    width: '100%',
                    maxWidth: '480px',
                    position: 'relative',
                    zIndex: 1
                }} className="animate-scale-in">

                    <button
                        onClick={() => navigate('/')}
                        style={{
                            position: 'absolute',
                            top: '24px',
                            left: '24px',
                            color: '#666',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px',
                            fontSize: '14px',
                            fontWeight: '500'
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
                            <User size={32} />
                        </div>
                        <h1 style={{ fontSize: '24px', fontWeight: 'bold', color: 'var(--color-text-main)', marginBottom: '8px' }}>
                            Create Account
                        </h1>
                        <p style={{ color: 'var(--color-text-secondary)', fontSize: '14px' }}>
                            Join as <span style={{ textTransform: 'capitalize', fontWeight: '600', color: 'var(--color-primary)' }}>{type}</span>
                        </p>
                    </div>

                    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

                        <div>
                            <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500', color: '#333' }}>Full Name</label>
                            <div style={{ position: 'relative' }}>
                                <User size={20} color="#999" style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)' }} />
                                <input
                                    type="text"
                                    required
                                    placeholder="John Doe"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
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
                            <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500', color: '#333' }}>Email Address</label>
                            <div style={{ position: 'relative' }}>
                                <Mail size={20} color="#999" style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)' }} />
                                <input
                                    type="email"
                                    required
                                    placeholder="name@example.com"
                                    value={formData.email}
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
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
                            <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500', color: '#333' }}>Password</label>
                            <div style={{ position: 'relative' }}>
                                <Lock size={20} color="#999" style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)' }} />
                                <input
                                    type="password"
                                    required
                                    placeholder="Create a password"
                                    value={formData.password}
                                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
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
                            <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500', color: '#333' }}>Confirm Password</label>
                            <div style={{ position: 'relative' }}>
                                <Lock size={20} color="#999" style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)' }} />
                                <input
                                    type="password"
                                    required
                                    placeholder="Confirm your password"
                                    value={formData.confirmPassword}
                                    onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
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
                            disabled={isLoading}
                            style={{
                                width: '100%',
                                padding: '16px',
                                backgroundColor: 'var(--color-primary)',
                                color: 'white',
                                border: 'none',
                                borderRadius: '12px',
                                fontSize: '16px',
                                fontWeight: '600',
                                cursor: isLoading ? 'not-allowed' : 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '8px',
                                marginTop: '8px',
                                opacity: isLoading ? 0.7 : 1,
                                transition: 'opacity 0.2s'
                            }}
                        >
                            {isLoading ? 'Creating Account...' : (
                                <>
                                    Sign Up <ArrowRight size={20} />
                                </>
                            )}
                        </button>
                    </form>

                    <div style={{ textAlign: 'center', marginTop: '24px', paddingTop: '24px', borderTop: '1px solid #f0f0f0' }}>
                        <p style={{ fontSize: '14px', color: '#666' }}>
                            Already have an account?{' '}
                            <Link to="/login" state={{ type, redirectAfter }} style={{ color: 'var(--color-primary)', fontWeight: '600' }}>Login</Link>
                        </p>
                    </div>
                </div>
            </div>
        </>
    );
};

export default SignUp;
