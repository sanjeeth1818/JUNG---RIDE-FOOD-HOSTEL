import React, { useState, useEffect } from 'react';
import { useUser } from '../context/UserContext';
import { User, Mail, Phone, MapPin, Edit2, Save, X, Camera, LogOut, Calendar, ShoppingBag, Car, ChevronRight, Shield, Lock, Eye, EyeOff } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import UserBookingsModal from './Rooms/UserBookingsModal';

const UserProfile = () => {
    const { profile, updateProfile, updateProfileLocal, userType, location, logout } = useUser();
    const [isEditing, setIsEditing] = useState(false);
    const [showBookingsModal, setShowBookingsModal] = useState(false);
    const [formData, setFormData] = useState({ ...profile });
    const [isUploading, setIsUploading] = useState(false);
    const [isChangingPassword, setIsChangingPassword] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [passwordData, setPasswordData] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
    });
    const [passwordStatus, setPasswordStatus] = useState({ loading: false, error: '', success: false });
    const fileInputRef = React.useRef(null);

    // Sync local form state
    useEffect(() => {
        if (!isEditing) {
            setFormData({ ...profile });
        }
    }, [profile, isEditing]);

    const handleSave = async () => {
        const result = await updateProfile(formData);
        if (result?.success) {
            setIsEditing(false);
        } else {
            alert('Failed to update profile: ' + (result?.error || 'Unknown error'));
        }
    };

    const handleAvatarChange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        setIsUploading(true);
        const uploadData = new FormData();
        uploadData.append('avatar', file);

        try {
            const endpoint = userType === 'partner' ? `/partners/${profile.id}/avatar` : `/users/${profile.id}/avatar`;
            const res = await fetch(`http://localhost:5000/api${endpoint}`, {
                method: 'POST',
                body: uploadData,
            });

            if (res.ok) {
                const data = await res.json();
                // Use local update to avoid triggering a destructive PUT request
                updateProfileLocal({ avatar: data.avatar_url });
                setFormData(prev => ({ ...prev, avatar: data.avatar_url }));
            } else {
                console.error('Avatar upload failed');
            }
        } catch (err) {
            console.error('Error uploading avatar:', err);
        } finally {
            setIsUploading(false);
        }
    };

    const handleChangePassword = async (e) => {
        e.preventDefault();
        if (passwordData.newPassword !== passwordData.confirmPassword) {
            setPasswordStatus({ ...passwordStatus, error: 'New passwords do not match' });
            return;
        }
        if (passwordData.newPassword.length < 6) {
            setPasswordStatus({ ...passwordStatus, error: 'Password must be at least 6 characters' });
            return;
        }

        setPasswordStatus({ loading: true, error: '', success: false });

        try {
            const res = await fetch('http://localhost:5000/api/auth/change-password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    currentPassword: passwordData.currentPassword,
                    newPassword: passwordData.newPassword
                }),
                credentials: 'include'
            });

            const data = await res.json();
            if (res.ok) {
                setPasswordStatus({ loading: false, error: '', success: true });
                setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
                setTimeout(() => {
                    setIsChangingPassword(false);
                    setPasswordStatus(prev => ({ ...prev, success: false }));
                }, 2000);
            } else {
                setPasswordStatus({ loading: false, error: data.error || 'Failed to change password', success: false });
            }
        } catch (err) {
            setPasswordStatus({ loading: false, error: 'Service error. Try again.', success: false });
        }
    };

    const containerVariants = {
        hidden: { opacity: 0, y: 20 },
        visible: { opacity: 1, y: 0, transition: { duration: 0.5 } }
    };

    const ActionCard = ({ icon: Icon, title, subtitle, color, onClick }) => (
        <motion.div
            whileHover={{ y: -4, boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)' }}
            whileTap={{ scale: 0.98 }}
            onClick={onClick}
            style={{
                backgroundColor: 'white',
                padding: '20px',
                borderRadius: '20px',
                border: '1px solid #f0f0f0',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '16px',
                transition: 'all 0.2s'
            }}
        >
            <div style={{
                width: '50px', height: '50px',
                borderRadius: '14px',
                backgroundColor: `${color}15`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: color
            }}>
                <Icon size={24} />
            </div>
            <div style={{ flex: 1 }}>
                <h3 style={{ fontSize: '16px', fontWeight: '700', color: '#1A1A1A', margin: '0 0 4px 0' }}>{title}</h3>
                <p style={{ fontSize: '13px', color: '#666', margin: 0 }}>{subtitle}</p>
            </div>
            <ChevronRight size={20} color="#ccc" />
        </motion.div>
    );

    return (
        <div style={{ backgroundColor: '#F8FAFC', minHeight: '100vh', padding: '100px 24px 40px' }}>
            {showBookingsModal && <UserBookingsModal onClose={() => setShowBookingsModal(false)} />}

            <motion.div
                className="container"
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                style={{ maxWidth: '1000px', margin: '0 auto', display: 'grid', gridTemplateColumns: '1fr 340px', gap: '32px' }}
            >
                {/* Left Column: Profile Info */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>

                    {/* Main Profile Card */}
                    <div style={{
                        backgroundColor: 'white', borderRadius: '24px', overflow: 'hidden',
                        boxShadow: '0 4px 20px rgba(0,0,0,0.04)', border: '1px solid #eee'
                    }}>
                        <div style={{
                            height: '140px',
                            background: 'linear-gradient(135deg, #00B14F 0%, #002E27 100%)',
                            position: 'relative'
                        }}></div>

                        <div style={{ padding: '0 40px 40px', marginTop: '-60px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '32px' }}>
                                <div style={{ position: 'relative' }}>
                                    <div style={{
                                        width: '120px', height: '120px', borderRadius: '50%',
                                        backgroundColor: 'white', padding: '4px',
                                        boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                                    }}>
                                        <div style={{
                                            width: '100%', height: '100%', borderRadius: '50%',
                                            backgroundColor: '#F3F4F6', display: 'flex',
                                            alignItems: 'center', justifyContent: 'center', overflow: 'hidden',
                                            opacity: isUploading ? 0.5 : 1
                                        }}>
                                            {profile.avatar ? (
                                                <img src={profile.avatar} alt="Profile" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                            ) : (
                                                <User size={48} color="#9CA3AF" />
                                            )}
                                        </div>
                                    </div>

                                    {/* Profile Image Upload Input */}
                                    <input
                                        type="file"
                                        ref={fileInputRef}
                                        onChange={handleAvatarChange}
                                        accept="image/*"
                                        style={{ display: 'none' }}
                                    />

                                    <button
                                        onClick={() => fileInputRef.current?.click()}
                                        disabled={isUploading}
                                        style={{
                                            position: 'absolute', bottom: '0', right: '0',
                                            width: '36px', height: '36px', borderRadius: '50%',
                                            backgroundColor: '#1A1A1A', color: 'white', border: 'none',
                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            cursor: 'pointer', boxShadow: '0 4px 10px rgba(0,0,0,0.2)',
                                            zIndex: 2
                                        }}
                                    >
                                        <Camera size={16} />
                                    </button>
                                </div>

                                <button
                                    onClick={() => isEditing ? handleSave() : setIsEditing(true)}
                                    style={{
                                        display: 'flex', alignItems: 'center', gap: '8px',
                                        backgroundColor: isEditing ? '#00B14F' : '#F3F4F6',
                                        color: isEditing ? 'white' : '#374151',
                                        padding: '10px 20px', borderRadius: '12px',
                                        fontWeight: '600', fontSize: '14px', border: 'none', cursor: 'pointer',
                                        transition: 'all 0.2s', marginBottom: '10px'
                                    }}
                                >
                                    {isEditing ? <><Save size={18} /> Save Changes</> : <><Edit2 size={18} /> Edit Profile</>}
                                </button>
                            </div>

                            <div>
                                <h1 style={{ fontSize: '32px', fontWeight: '800', color: '#111827', marginBottom: '8px' }}>
                                    {profile.name || 'Student Name'}
                                </h1>
                                <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                                    <span style={{
                                        backgroundColor: '#E6FFFA', color: '#00B14F',
                                        padding: '4px 12px', borderRadius: '20px',
                                        fontSize: '13px', fontWeight: '700', textTransform: 'capitalize'
                                    }}>
                                        {userType} Account
                                    </span>
                                    <span style={{ fontSize: '14px', color: '#6B7280', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                        <MapPin size={14} />
                                        {location?.name || location || 'Location not set'}
                                    </span>
                                </div>
                            </div>
                        </div>

                        <div style={{ padding: '0 40px 40px', borderTop: '1px solid #f0f0f0' }}>
                            <h3 style={{ fontSize: '18px', fontWeight: '700', color: '#374151', margin: '32px 0 24px' }}>Personal Information</h3>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
                                <ProfileField
                                    label="Full Name"
                                    value={formData.name}
                                    icon={<User size={18} />}
                                    isEditing={isEditing}
                                    onChange={(val) => setFormData(prev => ({ ...prev, name: val }))}
                                />
                                <ProfileField
                                    label="Email Address"
                                    value={formData.email}
                                    icon={<Mail size={18} />}
                                    isEditing={isEditing}
                                    onChange={(val) => setFormData(prev => ({ ...prev, email: val }))}
                                />
                                <ProfileField
                                    label="Phone Number"
                                    value={formData.phone}
                                    icon={<Phone size={18} />}
                                    isEditing={isEditing}
                                    onChange={(val) => setFormData(prev => ({ ...prev, phone: val }))}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Security Wrapper (Placeholder) */}
                    <div style={{
                        backgroundColor: 'white', borderRadius: '24px', padding: '32px',
                        boxShadow: '0 4px 20px rgba(0,0,0,0.04)', border: '1px solid #eee',
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between'
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                            <div style={{ width: '48px', height: '48px', borderRadius: '12px', backgroundColor: '#EFF6FF', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <Shield size={24} color="#3B82F6" />
                            </div>
                            <div>
                                <h3 style={{ fontSize: '16px', fontWeight: '700', margin: '0 0 4px' }}>Password & Security</h3>
                                <p style={{ fontSize: '13px', color: '#6B7280', margin: 0 }}>Manage your password and account security</p>
                            </div>
                        </div>
                        <button
                            onClick={() => setIsChangingPassword(!isChangingPassword)}
                            style={{ padding: '10px 20px', borderRadius: '10px', border: '1px solid #E5E7EB', backgroundColor: isChangingPassword ? '#F3F4F6' : 'white', fontWeight: '600', color: '#374151', cursor: 'pointer' }}>
                            {isChangingPassword ? 'Cancel' : 'Update'}
                        </button>
                    </div>

                    <AnimatePresence>
                        {isChangingPassword && (
                            <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                style={{ overflow: 'hidden' }}
                            >
                                <div style={{
                                    backgroundColor: 'white', borderRadius: '24px', padding: '32px',
                                    boxShadow: '0 4px 20px rgba(0,0,0,0.04)', border: '1px solid #eee',
                                    marginTop: '-16px'
                                }}>
                                    <form onSubmit={handleChangePassword} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
                                        <div style={{ gridColumn: '1 / -1' }}>
                                            <PasswordInput
                                                label="Current Password"
                                                value={passwordData.currentPassword}
                                                onChange={val => setPasswordData({ ...passwordData, currentPassword: val })}
                                                showPassword={showPassword}
                                                toggleShow={() => setShowPassword(!showPassword)}
                                            />
                                        </div>
                                        <PasswordInput
                                            label="New Password"
                                            value={passwordData.newPassword}
                                            onChange={val => setPasswordData({ ...passwordData, newPassword: val })}
                                            showPassword={showPassword}
                                            toggleShow={() => setShowPassword(!showPassword)}
                                            placeholder="Min. 6 characters"
                                        />
                                        <PasswordInput
                                            label="Confirm New Password"
                                            value={passwordData.confirmPassword}
                                            onChange={val => setPasswordData({ ...passwordData, confirmPassword: val })}
                                            showPassword={showPassword}
                                            toggleShow={() => setShowPassword(!showPassword)}
                                        />

                                        <div style={{ gridColumn: '1 / -1', display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '8px' }}>
                                            <div style={{ flex: 1 }}>
                                                {passwordStatus.error && (
                                                    <p style={{ color: '#EF4444', fontSize: '13px', margin: 0 }}>{passwordStatus.error}</p>
                                                )}
                                                {passwordStatus.success && (
                                                    <p style={{ color: '#00B14F', fontSize: '13px', margin: 0, fontWeight: '600' }}>✅ Password Updated Successfully!</p>
                                                )}
                                            </div>
                                            <button
                                                type="submit"
                                                disabled={passwordStatus.loading || passwordStatus.success}
                                                style={{
                                                    padding: '12px 32px', borderRadius: '12px', border: 'none',
                                                    backgroundColor: passwordStatus.success ? '#00B14F' : '#1A1A1A',
                                                    color: 'white', fontWeight: '700', fontSize: '14px', cursor: 'pointer',
                                                    opacity: passwordStatus.loading ? 0.7 : 1, transition: 'all 0.3s'
                                                }}
                                            >
                                                {passwordStatus.loading ? 'Updating...' : passwordStatus.success ? 'Success!' : 'Update Password'}
                                            </button>
                                        </div>
                                    </form>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>


                </div>

                {/* Right Column: Actions & Stats */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        <h3 style={{ fontSize: '18px', fontWeight: '700', color: '#374151', margin: '0 0 8px' }}>My Activity</h3>
                        <ActionCard
                            icon={Calendar}
                            title="My Room Bookings"
                            subtitle="View past & upcoming stays"
                            color="#00B14F"
                            onClick={() => setShowBookingsModal(true)}
                        />
                        <ActionCard
                            icon={ShoppingBag}
                            title="Food Orders"
                            subtitle="Track your meals"
                            color="#F59E0B"
                            onClick={() => { }} // Placeholder
                        />
                        <ActionCard
                            icon={Car}
                            title="Ride History"
                            subtitle="Your travel logs"
                            color="#3B82F6"
                            onClick={() => { }} // Placeholder
                        />
                    </div>

                    <motion.button
                        whileHover={{ scale: 1.02, backgroundColor: '#FEF2F2' }}
                        whileTap={{ scale: 0.98 }}
                        onClick={logout}
                        style={{
                            marginTop: 'auto',
                            width: '100%',
                            padding: '16px',
                            backgroundColor: 'white',
                            color: '#EF4444',
                            border: '1px solid #FECACA',
                            borderRadius: '16px',
                            fontWeight: '700',
                            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px',
                            cursor: 'pointer',
                            fontSize: '15px'
                        }}
                    >
                        <LogOut size={20} />
                        Sign Out
                    </motion.button>
                </div>

            </motion.div>
        </div>
    );
};

const PasswordInput = ({ label, value, onChange, showPassword, toggleShow, placeholder }) => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <p style={{ fontSize: '13px', color: '#6B7280', fontWeight: '600' }}>{label}</p>
        <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            backgroundColor: '#F9FAFB',
            border: '1px solid #E5E7EB',
            padding: '14px 16px',
            borderRadius: '14px',
            height: '56px',
            position: 'relative'
        }}>
            <Lock size={18} color="#9CA3AF" />
            <input
                type={showPassword ? "text" : "password"}
                value={value}
                onChange={e => onChange(e.target.value)}
                placeholder={placeholder}
                style={{ border: 'none', outline: 'none', width: '100%', fontSize: '15px', fontWeight: '500', color: '#111827', background: 'transparent' }}
            />
            <button
                type="button"
                onClick={toggleShow}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9CA3AF', display: 'flex', alignItems: 'center' }}
            >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
        </div>
    </div>
);

const ProfileField = ({ label, value, icon, isEditing, onChange }) => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <p style={{ fontSize: '13px', color: '#6B7280', fontWeight: '600' }}>{label}</p>
        <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            backgroundColor: isEditing ? 'white' : '#F9FAFB',
            border: isEditing ? '2px solid #00B14F' : '1px solid #E5E7EB',
            padding: '14px 16px',
            borderRadius: '14px',
            transition: 'all 0.2s',
            height: '56px'
        }}>
            <div style={{ color: '#9CA3AF' }}>{icon}</div>
            {isEditing ? (
                <input
                    type="text"
                    value={value || ''}
                    onChange={(e) => onChange(e.target.value)}
                    style={{ border: 'none', outline: 'none', width: '100%', fontSize: '15px', fontWeight: '500', color: '#111827', background: 'transparent' }}
                />
            ) : (
                <p style={{ fontSize: '15px', fontWeight: '600', color: '#1F2937', margin: 0 }}>{value || 'Not set'}</p>
            )}
        </div>
    </div>
);

export default UserProfile;
