import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Lock, User, Eye, EyeOff, ShieldCheck, ArrowRight } from 'lucide-react';

const AdminLogin = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const handleLogin = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const res = await fetch('http://localhost:5000/api/admin/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password }),
                credentials: 'include'
            });

            const data = await res.json();
            if (res.ok) {
                // In a real app, we'd use a context or state manager
                localStorage.setItem('admin_user', JSON.stringify(data.admin));
                navigate('/admin/dashboard');
            } else {
                setError(data.error || 'Login failed');
            }
        } catch (err) {
            setError('Network error. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: '#f0fdf4',
            backgroundImage: 'radial-gradient(at 0% 0%, #dcfce7 0, transparent 50%), radial-gradient(at 100% 100%, #86efac 0, transparent 50%)',
            fontFamily: "'Inter', sans-serif",
            padding: '20px'
        }}>
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                style={{
                    width: '100%',
                    maxWidth: '440px',
                    backgroundColor: 'rgba(255, 255, 255, 0.8)',
                    backdropFilter: 'blur(20px)',
                    borderRadius: '32px',
                    padding: '48px',
                    boxShadow: '0 25px 50px -12px rgba(21, 128, 61, 0.15)',
                    border: '1px solid rgba(255, 255, 255, 0.5)'
                }}
            >
                <div style={{ textAlign: 'center', marginBottom: '40px' }}>
                    <div style={{
                        width: '72px',
                        height: '72px',
                        backgroundColor: '#16a34a',
                        borderRadius: '20px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        margin: '0 auto 24px',
                        boxShadow: '0 10px 20px -5px rgba(22, 163, 74, 0.4)'
                    }}>
                        <ShieldCheck color="white" size={36} strokeWidth={2.5} />
                    </div>
                    <h1 style={{ fontSize: '28px', fontWeight: '800', color: '#14532d', margin: '0 0 8px' }}>Admin Portal</h1>
                    <p style={{ color: '#166534', fontSize: '15px', fontWeight: '500', opacity: 0.8 }}>Secure access to system management</p>
                </div>

                {error && (
                    <motion.div
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        style={{
                            padding: '14px 18px',
                            backgroundColor: '#fee2e2',
                            color: '#b91c1c',
                            borderRadius: '16px',
                            marginBottom: '24px',
                            fontSize: '14px',
                            fontWeight: '600',
                            textAlign: 'center',
                            border: '1px solid #fecaca'
                        }}
                    >
                        {error}
                    </motion.div>
                )}

                <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        <label style={{ fontSize: '13px', fontWeight: '700', color: '#166534', marginLeft: '4px' }}>USERNAME</label>
                        <div style={{ position: 'relative' }}>
                            <User size={18} style={{ position: 'absolute', left: '18px', top: '50%', transform: 'translateY(-50%)', color: '#16a34a' }} />
                            <input
                                type="text"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                placeholder="Enter admin username"
                                required
                                style={{
                                    width: '100%',
                                    padding: '16px 16px 16px 52px',
                                    borderRadius: '16px',
                                    border: '2px solid #dcfce7',
                                    backgroundColor: 'white',
                                    fontSize: '15px',
                                    color: '#14532d',
                                    fontWeight: '500',
                                    outline: 'none',
                                    transition: 'all 0.2s'
                                }}
                            />
                        </div>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        <label style={{ fontSize: '13px', fontWeight: '700', color: '#166534', marginLeft: '4px' }}>PASSWORD</label>
                        <div style={{ position: 'relative' }}>
                            <Lock size={18} style={{ position: 'absolute', left: '18px', top: '50%', transform: 'translateY(-50%)', color: '#16a34a' }} />
                            <input
                                type={showPassword ? 'text' : 'password'}
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="Enter your password"
                                required
                                style={{
                                    width: '100%',
                                    padding: '16px 48px 16px 52px',
                                    borderRadius: '16px',
                                    border: '2px solid #dcfce7',
                                    backgroundColor: 'white',
                                    fontSize: '15px',
                                    color: '#14532d',
                                    fontWeight: '500',
                                    outline: 'none',
                                    transition: 'all 0.2s'
                                }}
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                style={{
                                    position: 'absolute',
                                    right: '16px',
                                    top: '50%',
                                    transform: 'translateY(-50%)',
                                    background: 'none',
                                    border: 'none',
                                    cursor: 'pointer',
                                    color: '#16a34a',
                                    display: 'flex',
                                    alignItems: 'center'
                                }}
                            >
                                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                            </button>
                        </div>
                    </div>

                    <motion.button
                        whileHover={{ scale: 1.02, backgroundColor: '#15803d' }}
                        whileTap={{ scale: 0.98 }}
                        disabled={loading}
                        style={{
                            marginTop: '12px',
                            padding: '18px',
                            borderRadius: '18px',
                            backgroundColor: '#16a34a',
                            color: 'white',
                            border: 'none',
                            fontSize: '16px',
                            fontWeight: '700',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '12px',
                            boxShadow: '0 10px 25px -5px rgba(22, 163, 74, 0.3)',
                            transition: 'all 0.3s'
                        }}
                    >
                        {loading ? 'Authenticating...' : (
                            <>
                                Sign In to Admin <ArrowRight size={18} />
                            </>
                        )}
                    </motion.button>
                </form>
            </motion.div>
        </div>
    );
};

export default AdminLogin;
