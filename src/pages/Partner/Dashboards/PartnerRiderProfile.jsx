import React, { useState, useEffect } from 'react';
import { useUser } from '../../../context/UserContext';
import {
    User, Briefcase, Star, MapPin, Edit2, Save,
    Shield, Mail, Phone, Lock, X,
    Navigation, CreditCard, AlertCircle, Camera
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import StatusToggle from '../../../components/common/StatusToggle';

const PartnerRiderProfile = () => {
    const { partnerData, togglePartnerStatus, updatePartnerProfile } = useUser();

    const [isEditing, setIsEditing] = useState(false);
    const [showPasswordModal, setShowPasswordModal] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const fileInputRef = React.useRef(null);

    const [formData, setFormData] = useState({
        business_name: '',
        email: '',
        phone: '',
        location: '',
        vehicle_number: ''
    });

    const [passwordData, setPasswordData] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
    });

    const [stats, setStats] = useState({
        totalRides: 0,
        rating: 4.9,
        memberSince: new Date().getFullYear(),
        completionRate: '98%'
    });

    const [isLoading, setIsLoading] = useState(false);
    const [locations, setLocations] = useState([]);

    useEffect(() => {
        if (partnerData) {
            setFormData({
                business_name: partnerData.business_name || partnerData.name || '',
                email: partnerData.email || '',
                phone: partnerData.phone || '',
                location: partnerData.locationName || partnerData.location || '',
                vehicle_number: partnerData.plate_number || partnerData.vehicle_number || ''
            });
        }
    }, [partnerData]);

    useEffect(() => {
        const controller = new AbortController();
        const { signal } = controller;

        const loadData = async () => {
            try {
                const locRes = await fetch('http://localhost:5000/api/locations', { signal });
                const locData = await locRes.json();
                setLocations(locData);

                if (partnerData?.id) {
                    const statsRes = await fetch(`http://localhost:5000/api/riders/${partnerData.id}/stats`, { signal });
                    const statsData = await statsRes.json();
                    setStats(prev => ({
                        ...prev,
                        totalRides: statsData.today?.total_rides || 0
                    }));
                }
            } catch (err) {
                if (err.name === 'AbortError') return;
                console.error('Profile data load error:', err);
            }
        };

        loadData();

        return () => controller.abort();
    }, [partnerData?.id]);

    const handleProfileUpdate = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        try {
            const res = await fetch(`http://localhost:5000/api/partners/${partnerData.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...formData
                })
            });

            if (res.ok) {
                const data = await res.json();
                alert('Profile updated successfully!');
                setIsEditing(false);
                if (data.partner) {
                    updatePartnerProfile(data.partner);
                }
            } else {
                const data = await res.json();
                alert(data.error || 'Failed to update profile');
            }
        } catch (err) {
            alert('Network error. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    const handlePasswordChange = async (e) => {
        e.preventDefault();
        if (passwordData.newPassword !== passwordData.confirmPassword) {
            alert("New passwords don't match!");
            return;
        }
        setIsLoading(true);
        try {
            const res = await fetch(`http://localhost:5000/api/partners/${partnerData.id}/password`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    currentPassword: passwordData.currentPassword,
                    newPassword: passwordData.newPassword
                })
            });
            if (res.ok) {
                alert('Password updated successfully!');
                setShowPasswordModal(false);
                setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
            } else {
                const data = await res.json();
                alert(data.error || 'Failed to update password');
            }
        } catch (err) {
            alert('Network error. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleImageUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const formData = new FormData();
        formData.append('avatar', file);

        setIsLoading(true);
        try {
            const res = await fetch(`http://localhost:5000/api/partners/${partnerData.id}/avatar`, {
                method: 'POST',
                body: formData
            });

            if (res.ok) {
                const data = await res.json();
                updatePartnerProfile({ ...partnerData, avatar_url: data.avatar_url });
                alert('Profile picture updated!');
            } else {
                alert('Failed to upload image');
            }
        } catch (err) {
            console.error('Upload error:', err);
            alert('Upload failed');
        } finally {
            setIsLoading(false);
        }
    };

    if (!partnerData) return <div className="loading-profile">Loading...</div>;

    return (
        <div className="rider-profile-page">
            <style>{`
                .rider-profile-page {
                    min-height: 100vh;
                    background-color: #f0fdf4;
                    font-family: 'Plus Jakarta Sans', sans-serif;
                    color: #1e293b;
                    padding-bottom: 80px;
                }

                .rider-profile-header {
                    background: linear-gradient(135deg, #00C853 0%, #009624 100%);
                    padding: 60px 0 120px 0;
                    color: white;
                    position: relative;
                    overflow: hidden;
                    box-shadow: 0 10px 30px rgba(0, 200, 83, 0.2);
                }

                .header-accent-green {
                    position: absolute;
                    top: -100px;
                    right: -100px;
                    width: 400px;
                    height: 400px;
                    background: radial-gradient(circle, rgba(255,255,255,0.15) 0%, transparent 70%);
                    border-radius: 50%;
                }

                .container {
                    max-width: 1100px;
                    margin: 0 auto;
                    padding: 0 24px;
                }

                .header-flex {
                    display: flex;
                    justify-content: space-between;
                    align-items: flex-end;
                    position: relative;
                    z-index: 1;
                }

                .rider-main-title h1 {
                    font-size: 36px;
                    font-weight: 800;
                    margin: 0;
                    letter-spacing: -0.02em;
                }

                .verified-badge {
                    display: flex;
                    align-items: center;
                    gap: 6px;
                    font-size: 14px;
                    background: rgba(255,255,255,0.2);
                    backdrop-filter: blur(8px);
                    padding: 6px 16px;
                    border-radius: 30px;
                    margin-top: 12px;
                    width: fit-content;
                    border: 1px solid rgba(255,255,255,0.3);
                }

                .content-grid {
                    margin-top: -80px;
                    display: grid;
                    grid-template-columns: 350px 1fr;
                    gap: 32px;
                    position: relative;
                    z-index: 10;
                }

                .glass-profile-card {
                    background: rgba(255, 255, 255, 0.9);
                    backdrop-filter: blur(12px);
                    border: 1px solid rgba(255, 255, 255, 0.5);
                    border-radius: 32px;
                    padding: 40px;
                    box-shadow: 0 20px 50px rgba(0,0,0,0.05);
                }

                .rider-avatar-large {
                    width: 160px;
                    height: 160px;
                    border-radius: 50%;
                    background: #f0fdf4;
                    margin: 0 auto 24px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    border: 8px solid white;
                    box-shadow: 0 10px 25px rgba(0,0,0,0.1);
                    color: #00C853;
                }

                .rider-stats-grid {
                    display: grid;
                    grid-template-columns: repeat(3, 1fr);
                    gap: 16px;
                    margin-bottom: 24px;
                }

                .rider-stat-card {
                    background: white;
                    padding: 20px;
                    border-radius: 24px;
                    text-align: center;
                    border: 1px solid #e2e8f0;
                    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
                }

                .rider-stat-icon {
                    width: 44px;
                    height: 44px;
                    border-radius: 12px;
                    margin: 0 auto 12px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }

                .section-card {
                    background: white;
                    border-radius: 32px;
                    padding: 32px;
                    box-shadow: 0 10px 25px rgba(0,0,0,0.03);
                    border: 1px solid #eef2f6;
                }

                .section-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 24px;
                }

                .section-header h3 {
                    font-size: 20px;
                    font-weight: 700;
                    margin: 0;
                    color: #0f172a;
                    display: flex;
                    align-items: center;
                    gap: 10px;
                }

                .field-list {
                    display: flex;
                    flex-direction: column;
                    gap: 20px;
                }

                .field-item {
                    display: flex;
                    align-items: center;
                    gap: 16px;
                    padding-bottom: 16px;
                    border-bottom: 1px solid #f1f5f9;
                }

                .field-icon {
                    color: #94a3b8;
                }

                .field-info label {
                    display: block;
                    font-size: 13px;
                    color: #64748b;
                    margin-bottom: 2px;
                }

                .field-info span {
                    font-size: 16px;
                    font-weight: 600;
                    color: #1e293b;
                }

                .rider-btn-primary {
                    background: #00C853;
                    color: white;
                    padding: 14px 28px;
                    border-radius: 16px;
                    border: none;
                    font-weight: 700;
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 8px;
                    transition: all 0.2s;
                    box-shadow: 0 8px 16px rgba(0, 200, 83, 0.2);
                }

                .rider-btn-primary:hover {
                    background: #009624;
                    transform: translateY(-2px);
                    box-shadow: 0 12px 20px rgba(0, 200, 83, 0.3);
                }

                .rider-btn-outline {
                    background: transparent;
                    border: 2px solid #e2e8f0;
                    color: #64748b;
                    padding: 12px 24px;
                    border-radius: 16px;
                    font-weight: 600;
                    cursor: pointer;
                    transition: all 0.2s;
                    width: 100%;
                }

                .rider-btn-outline:hover {
                    border-color: #00C853;
                    color: #00C853;
                    background: #f0fdf4;
                }

                .form-input-green {
                    width: 100%;
                    padding: 14px 18px;
                    border-radius: 14px;
                    border: 2px solid #e2e8f0;
                    background: #f8fafc;
                    font-family: inherit;
                    transition: all 0.2s;
                    box-sizing: border-box;
                }

                .form-input-green:focus {
                    border-color: #00C853;
                    outline: none;
                    background: white;
                    box-shadow: 0 0 0 4px rgba(0, 200, 83, 0.1);
                }

                .emergency-tag {
                    background: #fee2e2;
                    color: #ef4444;
                    font-size: 12px;
                    font-weight: 700;
                    padding: 4px 10px;
                    border-radius: 8px;
                    text-transform: uppercase;
                }

                @media (max-width: 900px) {
                    .content-grid { grid-template-columns: 1fr; }
                    .rider-profile-header { padding: 40px 0 100px 0; }
                }
            `}</style>

            <header className="rider-profile-header">
                <div className="header-accent-green" />
                <div className="container">
                    <div className="header-flex">
                        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
                            <div className="rider-main-title">
                                <h1>Rider Profile</h1>
                                <div className="verified-badge">
                                    <Shield size={16} />
                                    <span>Verified JUNG Rider</span>
                                </div>
                            </div>
                        </motion.div>
                        <div style={{ paddingBottom: '10px' }}>
                            <StatusToggle isActive={partnerData.is_active} onToggle={togglePartnerStatus} />
                        </div>
                    </div>
                </div>
            </header>

            <div className="container">
                <motion.div
                    className="content-grid"
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                >
                    {/* Left Column: Summary Card */}
                    <div className="glass-profile-card">
                        <div
                            className="rider-avatar-large"
                            style={{
                                overflow: 'hidden',
                                position: 'relative',
                                cursor: 'pointer'
                            }}
                            onClick={() => fileInputRef.current?.click()}
                        >
                            {partnerData.avatar_url || partnerData.profile_picture ? (
                                <img
                                    src={partnerData.avatar_url || partnerData.profile_picture}
                                    alt="Profile"
                                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                />
                            ) : (
                                <Navigation size={80} strokeWidth={1.5} />
                            )}

                            <div style={{
                                position: 'absolute',
                                inset: 0,
                                background: 'rgba(0,0,0,0.3)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                opacity: 0,
                                transition: 'opacity 0.2s',
                            }} className="avatar-hover-overlay">
                                <Camera color="white" size={32} />
                            </div>

                            <input
                                type="file"
                                ref={fileInputRef}
                                style={{ display: 'none' }}
                                accept="image/*"
                                onChange={handleImageUpload}
                            />
                        </div>
                        <style>{`
                            .rider-avatar-large:hover .avatar-hover-overlay {
                                opacity: 1 !important;
                            }
                        `}</style>
                        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
                            <h2 style={{ fontSize: '24px', fontWeight: '800', marginBottom: '8px' }}>{formData.business_name || partnerData.business_name || partnerData.name}</h2>
                            <p style={{ color: '#64748b', fontWeight: '500' }}>Vehicle: {partnerData.vehicle_type || partnerData.type}</p>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                            <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '20px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                                <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: partnerData.is_active ? '#00C853' : '#94a3b8' }} />
                                <span style={{ fontWeight: '700', color: partnerData.is_active ? '#00C853' : '#64748b' }}>
                                    Status: {partnerData.is_active ? 'Active' : 'Offline'}
                                </span>
                            </div>

                            <button className="rider-btn-outline" onClick={() => setShowPasswordModal(true)}>
                                <Lock size={16} style={{ marginRight: '8px' }} /> Change Password
                            </button>
                        </div>

                        <div style={{ marginTop: '40px' }}>
                            <p style={{ fontSize: '12px', color: '#94a3b8', textAlign: 'center' }}>
                                Member since {stats.memberSince}
                            </p>
                        </div>
                    </div>

                    {/* Right Column: Detailed Info & Stats */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>

                        {/* Highlights Grid */}
                        <div className="rider-stats-grid">
                            <div className="rider-stat-card">
                                <div className="rider-stat-icon" style={{ background: '#f0fdf4', color: '#00C853' }}>
                                    <Navigation size={22} />
                                </div>
                                <div style={{ fontSize: '24px', fontWeight: '800' }}>{stats.totalRides}</div>
                                <div style={{ fontSize: '13px', color: '#64748b', fontWeight: '500' }}>Today's Rides</div>
                            </div>
                            <div className="rider-stat-card">
                                <div className="rider-stat-icon" style={{ background: '#fffbeb', color: '#f59e0b' }}>
                                    <Star size={22} />
                                </div>
                                <div style={{ fontSize: '24px', fontWeight: '800' }}>{stats.rating}</div>
                                <div style={{ fontSize: '13px', color: '#64748b', fontWeight: '500' }}>Rider Rating</div>
                            </div>
                            <div className="rider-stat-card">
                                <div className="rider-stat-icon" style={{ background: '#eff6ff', color: '#3b82f6' }}>
                                    <CreditCard size={22} />
                                </div>
                                <div style={{ fontSize: '24px', fontWeight: '800' }}>{stats.completionRate}</div>
                                <div style={{ fontSize: '13px', color: '#64748b', fontWeight: '500' }}>Success Rate</div>
                            </div>
                        </div>

                        {/* Profile Info Section */}
                        <div className="section-card">
                            <div className="section-header">
                                <h3><User size={20} color="#00C853" /> Profile Information</h3>
                                {!isEditing && (
                                    <button className="rider-btn-outline" style={{ width: 'auto' }} onClick={() => setIsEditing(true)}>
                                        <Edit2 size={16} style={{ marginRight: '8px' }} /> Edit
                                    </button>
                                )}
                            </div>

                            {isEditing ? (
                                <form onSubmit={handleProfileUpdate} className="field-list">
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                                        <div>
                                            <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '8px' }}>Display Name</label>
                                            <input className="form-input-green" value={formData.business_name} onChange={e => setFormData({ ...formData, business_name: e.target.value })} />
                                        </div>
                                        <div>
                                            <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '8px' }}>Phone Number</label>
                                            <input className="form-input-green" value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value })} />
                                        </div>
                                    </div>
                                    <div>
                                        <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '8px' }}>Email Address</label>
                                        <input className="form-input-green" type="email" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} />
                                    </div>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                                        <div>
                                            <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '8px' }}>
                                                Vehicle Plate Number <span style={{ fontSize: '11px', fontWeight: 'normal', color: '#94a3b8' }}>(Restricted)</span>
                                            </label>
                                            <input
                                                className="form-input-green"
                                                value={formData.vehicle_number}
                                                readOnly
                                                style={{ cursor: 'not-allowed', background: '#f1f5f9', color: '#64748b' }}
                                            />
                                        </div>
                                        <div>
                                            <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '8px' }}>Base Location</label>
                                            <select className="form-input-green" value={formData.location} onChange={e => setFormData({ ...formData, location: e.target.value })}>
                                                {locations.map(l => <option key={l.id} value={l.name}>{l.name}</option>)}
                                            </select>
                                        </div>
                                    </div>

                                    <div style={{ display: 'flex', gap: '16px', marginTop: '12px' }}>
                                        <button type="button" className="rider-btn-outline" style={{ flex: 1 }} onClick={() => setIsEditing(false)}>Cancel</button>
                                        <button type="submit" className="rider-btn-primary" style={{ flex: 2 }} disabled={isLoading}>
                                            <Save size={18} /> {isLoading ? 'Saving...' : 'Save Changes'}
                                        </button>
                                    </div>
                                </form>
                            ) : (
                                <div className="field-list">
                                    <Field icon={<Mail />} label="Email Address" value={formData.email} />
                                    <Field icon={<Phone />} label="Phone Number" value={formData.phone} />
                                    <Field icon={<CreditCard />} label="Vehicle Plate" value={formData.vehicle_number} />
                                    <Field icon={<MapPin />} label="Base Location" value={formData.location || 'Not set'} />
                                </div>
                            )}
                        </div>
                    </div>
                </motion.div>
            </div>

            {/* Password Modal */}
            <AnimatePresence>
                {showPasswordModal && (
                    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(5px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000 }}>
                        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="section-card" style={{ width: '100%', maxWidth: '450px' }}>
                            <div className="section-header">
                                <h3>Change Password</h3>
                                <button onClick={() => setShowPasswordModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><X /></button>
                            </div>
                            <form onSubmit={handlePasswordChange} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                                <input className="form-input-green" type="password" placeholder="Current Password" required onChange={e => setPasswordData({ ...passwordData, currentPassword: e.target.value })} />
                                <input className="form-input-green" type="password" placeholder="New Password" required minLength={6} onChange={e => setPasswordData({ ...passwordData, newPassword: e.target.value })} />
                                <input className="form-input-green" type="password" placeholder="Confirm New Password" required onChange={e => setPasswordData({ ...passwordData, confirmPassword: e.target.value })} />
                                <button type="submit" className="rider-btn-primary" disabled={isLoading}>{isLoading ? 'Updating...' : 'Update Password'}</button>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

const Field = ({ icon, label, value }) => (
    <div className="field-item">
        <div className="field-icon">{React.cloneElement(icon, { size: 18 })}</div>
        <div className="field-info">
            <label>{label}</label>
            <span>{value || 'Not Provided'}</span>
        </div>
    </div>
);

export default PartnerRiderProfile;
