import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
    LayoutDashboard, Lock, Shield,
    ChevronLeft, CheckCircle2, AlertCircle,
    Eye, EyeOff, Save
} from 'lucide-react';

const AdminSettings = () => {
    const [passwords, setPasswords] = useState({ current: '', next: '', confirm: '' });
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [status, setStatus] = useState({ type: '', message: '' });
    const navigate = useNavigate();

    const handleChangePassword = async (e) => {
        e.preventDefault();
        if (passwords.next !== passwords.confirm) {
            setStatus({ type: 'error', message: "New passwords don't match!" });
            return;
        }

        setLoading(true);
        setStatus({ type: '', message: '' });

        try {
            const res = await fetch('http://localhost:5000/api/admin/change-password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    currentPassword: passwords.current,
                    newPassword: passwords.next
                }),
                credentials: 'include'
            });

            const data = await res.json();
            if (res.ok) {
                setStatus({ type: 'success', message: 'Password updated successfully!' });
                setPasswords({ current: '', next: '', confirm: '' });
            } else {
                setStatus({ type: 'error', message: data.error || 'Update failed' });
            }
        } catch (err) {
            setStatus({ type: 'error', message: 'Network error. Please try again.' });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{ minHeight: '100vh', backgroundColor: '#F8FAFC', fontFamily: "'Inter', sans-serif", padding: '40px' }}>
            <div style={{ maxWidth: '800px', margin: '0 auto' }}>
                <button
                    onClick={() => navigate('/admin/dashboard')}
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        color: '#64748B',
                        fontWeight: '700',
                        fontSize: '14px',
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        marginBottom: '32px',
                        padding: '0'
                    }}
                >
                    <ChevronLeft size={20} /> Back to Dashboard
                </button>

                <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '40px' }}>
                    <div style={{ backgroundColor: '#16a34a', padding: '12px', borderRadius: '16px', boxShadow: '0 8px 16px -4px rgba(22, 163, 74, 0.3)' }}>
                        <Shield color="white" size={28} />
                    </div>
                    <div>
                        <h1 style={{ fontSize: '28px', fontWeight: '800', color: '#1E293B', margin: 0 }}>Security Settings</h1>
                        <p style={{ color: '#64748B', fontSize: '15px', marginTop: '4px' }}>Manage your administrator credentials and account security.</p>
                    </div>
                </div>

                <div style={{
                    backgroundColor: 'white',
                    borderRadius: '24px',
                    padding: '40px',
                    boxShadow: '0 4px 20px rgba(0,0,0,0.02)',
                    border: '1px solid #F1F5F9'
                }}>
                    <h3 style={{ fontSize: '18px', fontWeight: '700', color: '#1E293B', marginBottom: '24px', borderBottom: '1px solid #F1F5F9', paddingBottom: '16px' }}>Change Administrator Password</h3>

                    {status.message && (
                        <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '12px',
                                padding: '16px',
                                borderRadius: '12px',
                                marginBottom: '24px',
                                backgroundColor: status.type === 'success' ? '#DEF7EC' : '#FDE8E8',
                                color: status.type === 'success' ? '#03543F' : '#9B1C1C',
                                fontSize: '14px',
                                fontWeight: '600'
                            }}
                        >
                            {status.type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
                            {status.message}
                        </motion.div>
                    )}

                    <form onSubmit={handleChangePassword} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                        <SettingsField
                            label="Current Password"
                            value={passwords.current}
                            onChange={(val) => setPasswords({ ...passwords, current: val })}
                            showPassword={showPassword}
                            toggleShow={() => setShowPassword(!showPassword)}
                        />

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
                            <SettingsField
                                label="New Password"
                                value={passwords.next}
                                onChange={(val) => setPasswords({ ...passwords, next: val })}
                                showPassword={showPassword}
                                toggleShow={() => setShowPassword(!showPassword)}
                            />
                            <SettingsField
                                label="Confirm New Password"
                                value={passwords.confirm}
                                onChange={(val) => setPasswords({ ...passwords, confirm: val })}
                                showPassword={showPassword}
                                toggleShow={() => setShowPassword(!showPassword)}
                            />
                        </div>

                        <div style={{ marginTop: '12px', padding: '20px', backgroundColor: '#F9FAFB', borderRadius: '16px', border: '1px dashed #E2E8F0' }}>
                            <p style={{ margin: '0 0 8px', fontSize: '13px', fontWeight: '700', color: '#64748B' }}>PASSWORD REQUIREMENTS</p>
                            <ul style={{ margin: 0, paddingLeft: '20px', color: '#64748B', fontSize: '13px', lineHeight: '1.6' }}>
                                <li>Minimum 8 characters long</li>
                                <li>Include at least one special character</li>
                                <li>Include at least one number</li>
                            </ul>
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '12px' }}>
                            <motion.button
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                disabled={loading}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '12px',
                                    padding: '16px 32px',
                                    borderRadius: '16px',
                                    backgroundColor: '#16a34a',
                                    color: 'white',
                                    border: 'none',
                                    fontSize: '15px',
                                    fontWeight: '700',
                                    cursor: 'pointer',
                                    boxShadow: '0 10px 20px -5px rgba(22, 163, 74, 0.3)',
                                    transition: 'all 0.3s'
                                }}
                            >
                                {loading ? 'Saving Changes...' : (
                                    <>
                                        <Save size={18} /> Update Password
                                    </>
                                )}
                            </motion.button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

const SettingsField = ({ label, value, onChange, showPassword, toggleShow }) => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <label style={{ fontSize: '13px', fontWeight: '700', color: '#64748B', marginLeft: '4px' }}>{label.toUpperCase()}</label>
        <div style={{ position: 'relative' }}>
            <Lock size={18} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }} />
            <input
                type={showPassword ? 'text' : 'password'}
                value={value}
                onChange={(e) => onChange(e.target.value)}
                required
                style={{
                    width: '100%',
                    padding: '14px 14px 14px 48px',
                    borderRadius: '12px',
                    border: '1px solid #E2E8F0',
                    backgroundColor: '#F8FAFC',
                    fontSize: '15px',
                    color: '#1E293B',
                    fontWeight: '500',
                    outline: 'none',
                    transition: 'all 0.2s'
                }}
            />
            <button
                type="button"
                onClick={toggleShow}
                style={{
                    position: 'absolute',
                    right: '12px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    color: '#94A3B8'
                }}
            >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
        </div>
    </div>
);

export default AdminSettings;
