import React, { useState } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { User, Lock, ArrowRight, ArrowLeft } from 'lucide-react';
import { useUser } from '../context/UserContext';

const Login = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const { login } = useUser();

    // Default to student/university flow if no state provided (direct access)
    // type defaulting to 'student' means this page expects STUDENTS by default.
    const { type = 'student', redirectAfter = '/student/university' } = location.state || {};

    const [formData, setFormData] = useState({
        email: '',
        password: ''
    });
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);


    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');

        try {
            const response = await fetch('http://localhost:5000/api/auth/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include',
                body: JSON.stringify({
                    email: formData.email,
                    password: formData.password
                }),
            });

            // Handle non-JSON responses (e.g. 500 server error HTML)
            const contentType = response.headers.get("content-type");
            if (!contentType || !contentType.includes("application/json")) {
                throw new Error("Received non-JSON response from server");
            }

            const data = await response.json();

            if (response.ok) {
                // SUCCESSFUL LOGIN
                const loggedInUser = data.user;

                // Safety check: ensure user object exists
                if (!loggedInUser) {
                    setError('Login successful but user profile is missing. Please support.');
                    return;
                }

                // Strict Role Enforcement (Case Insensitive)
                // Use optional chaining and default to empty string to avoid crashes
                // Backend returns 'user_type', UserContext might use 'type'. Check both.
                const userType = data.user?.type || data.user?.user_type || "";

                if (!userType) {
                    setError('Login successful but user type is undefined. Please support.');
                    return;
                }

                const requiredType = type.toLowerCase();
                const actualType = userType.toLowerCase();

                if (actualType !== requiredType) {
                    setError(`Access denied. You are logged in as a "${userType}", but this login page is for "${type}s".`);
                    return;
                }

                // If we get here, everything is valid
                login(loggedInUser);
                navigate(redirectAfter);

            } else {
                // SERVER RETURNED ERROR (400, 401, etc)
                setError(data.error || 'Login failed. Please check your credentials.');
            }

        } catch (error) {
            console.error('Login error:', error);
            setError('Unable to connect to server. Please try again later.');
        } finally {
            setIsLoading(false);
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
            <div style={{
                backgroundColor: 'white',
                padding: '40px',
                borderRadius: '24px',
                boxShadow: 'var(--shadow-lg)',
                width: '100%',
                maxWidth: '420px',
                position: 'relative'
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
                        fontWeight: '500',
                        border: 'none',
                        background: 'none',
                        cursor: 'pointer'
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
                        Welcome Back
                    </h1>
                    <p style={{ color: 'var(--color-text-secondary)', fontSize: '14px' }}>
                        Login as <span style={{ textTransform: 'capitalize', fontWeight: '600', color: 'var(--color-primary)' }}>{type}</span>
                    </p>
                </div>

                {error && (
                    <div style={{
                        backgroundColor: '#FEE2E2',
                        color: '#DC2626',
                        padding: '12px',
                        borderRadius: '8px',
                        marginBottom: '20px',
                        fontSize: '14px',
                        textAlign: 'center',
                        border: '1px solid #FECACA'
                    }}>
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

                    <div>
                        <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500', color: '#333' }}>Email Address</label>
                        <div style={{ position: 'relative' }}>
                            <User size={20} color="#999" style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)' }} />
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
                                placeholder="Enter your password"
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

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '13px' }}>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#666', cursor: 'pointer' }}>
                            <input type="checkbox" style={{ accentColor: 'var(--color-primary)' }} /> Remember me
                        </label>
                        <a href="#" style={{ color: 'var(--color-primary)', fontWeight: '500' }}>Forgot password?</a>
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
                        {isLoading ? 'Logging in...' : (
                            <>
                                Login <ArrowRight size={20} />
                            </>
                        )}
                    </button>
                </form>

                <div style={{ textAlign: 'center', marginTop: '24px', paddingTop: '24px', borderTop: '1px solid #f0f0f0' }}>
                    <p style={{ fontSize: '14px', color: '#666' }}>
                        Don't have an account?{' '}
                        <Link to="/signup" state={{ type, redirectAfter }} style={{ color: 'var(--color-primary)', fontWeight: '600' }}>Sign up</Link>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default Login;
