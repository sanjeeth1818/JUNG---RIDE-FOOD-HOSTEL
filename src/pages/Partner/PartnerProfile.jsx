import React, { useState, useEffect } from 'react';
import { useUser } from '../../context/UserContext';
import {
    User, Briefcase, Star, Clock, MapPin, Edit2, Save,
    Shield, LayoutDashboard, CheckCircle, Mail, Phone, Lock, X, Eye, EyeOff
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import StatusToggle from '../../components/common/StatusToggle';
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet';

console.log('PartnerProfile React-Leaflet imports:', { MapContainer, useMap });
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

// Fix for default marker icon in React Leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: markerIcon2x,
    iconUrl: markerIcon,
    shadowUrl: markerShadow,
});

// Helper to move map view
const MapUpdater = ({ center }) => {
    const map = useMap();
    useEffect(() => {
        if (center && center.lat && center.lng) {
            map.flyTo([center.lat, center.lng], 13);
        }
    }, [center, map]);
    return null;
};

const LocationPicker = ({ coordinates, setCoordinates }) => {
    useMapEvents({
        click(e) {
            setCoordinates(e.latlng);
        },
    });
    return coordinates ? <Marker position={coordinates} /> : null;
};

const PartnerProfile = () => {
    // 1. Context & State
    const { profile, partnerData, togglePartnerStatus, updatePartnerProfile } = useUser();

    // Form States
    const [isEditing, setIsEditing] = useState(false);
    const [isChangingPassword, setIsChangingPassword] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [uploadingAvatar, setUploadingAvatar] = useState(false);

    // Data States
    const [formData, setFormData] = useState({
        business_name: '',
        email: '',
        phone: '',
        location: ''
    });

    const [passwordData, setPasswordData] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
    });

    const [stats, setStats] = useState({
        totalBookings: 0,
        rating: 0,
        memberSince: new Date().getFullYear()
    });

    const [isLoading, setIsLoading] = useState(false);
    const [loadingStats, setLoadingStats] = useState(true);

    // Map State
    const [locations, setLocations] = useState([]);
    const [coordinates, setCoordinates] = useState({ lat: 6.9271, lng: 79.8612 }); // Default Colombo
    const fileInputRef = React.useRef(null);

    // 2. Initialize Data
    useEffect(() => {
        if (partnerData) {
            setFormData({
                business_name: partnerData.business_name || '',
                email: partnerData.email || '',
                phone: partnerData.phone || '',
                location: partnerData.locationName || partnerData.location || ''
            });

            // Parse Member Since
            const created = new Date(partnerData.created_at || Date.now());

            // Initial stats (fetch real ones in next effect)
            setStats(prev => ({
                ...prev,
                memberSince: created.getFullYear()
            }));

            // Initialize coordinates if available
            if (partnerData.latitude && partnerData.longitude) {
                setCoordinates({
                    lat: parseFloat(partnerData.latitude),
                    lng: parseFloat(partnerData.longitude)
                });
            }
        }
    }, [partnerData]);

    // Fetch Locations for Dropdown
    useEffect(() => {
        fetch('http://localhost:5000/api/locations')
            .then(res => res.json())
            .then(data => setLocations(data))
            .catch(err => console.error('Failed to load locations', err));
    }, []);

    // Update coordinates when location dropdown changes
    useEffect(() => {
        if (formData.location && locations.length > 0) {
            const locObj = locations.find(l => l.name === formData.location);
            console.log('Profile Location change detected:', { selected: formData.location, locObj });
            if (locObj && locObj.latitude && locObj.longitude) {
                const newCoords = { lat: parseFloat(locObj.latitude), lng: parseFloat(locObj.longitude) };
                console.log('Setting Profile coordinates:', newCoords);
                setCoordinates(newCoords);
            }
        }
    }, [formData.location, locations]);

    // 3. Fetch Real Stats
    useEffect(() => {
        const fetchStats = async () => {
            if (!partnerData?.id) return;
            try {
                // Fetch bookings to count them
                const res = await fetch(`http://localhost:5000/api/partners/bookings/${partnerData.id}`);
                if (res.ok) {
                    const bookings = await res.json();
                    setStats(prev => ({
                        ...prev,
                        totalBookings: bookings.length,
                        // If we had reviews, we'd fetch them here too. 
                        // For now, keeping Rating static or N/A as per schema review (reviews table exists but maybe no data yet)
                        // Let's verify schema: YES, reviews table exists.
                        // Future: Fetch avg rating. defaulting to 'New' or 5.0 for now for better UX.
                        rating: 5.0
                    }));
                }
            } catch (err) {
                console.error('Failed to fetch stats', err);
            } finally {
                setLoadingStats(false);
            }
        };
        fetchStats();
    }, [partnerData?.id]);


    // 4. Handlers
    const handleProfileUpdate = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        try {
            const res = await fetch(`http://localhost:5000/api/partners/${partnerData.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...formData,
                    latitude: coordinates.lat,
                    longitude: coordinates.lng
                })
            });

            const data = await res.json();

            if (res.ok) {
                alert('Profile updated successfully!');
                setIsEditing(false);
                updatePartnerProfile({
                    ...partnerData,
                    ...formData,
                    latitude: coordinates.lat,
                    longitude: coordinates.lng
                });
            } else {
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
            const res = await fetch(`http://localhost:5000/api/auth/change-password`, {
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
                alert('Password updated successfully!');
                setIsChangingPassword(false);
                setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
            } else {
                alert(data.error || 'Failed to update password');
            }
        } catch (err) {
            alert('Network error. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleAvatarUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const formDataData = new FormData();
        formDataData.append('avatar', file);

        setUploadingAvatar(true);
        try {
            const res = await fetch(`http://localhost:5000/api/partners/${partnerData.id}/avatar`, {
                method: 'POST',
                body: formDataData
            });

            const data = await res.json();
            if (res.ok) {
                updatePartnerProfile({ avatar_url: data.avatar_url });
                alert('Profile picture updated!');
            } else {
                alert(data.error || 'Upload failed');
            }
        } catch (err) {
            alert('Upload error. Please try again.');
        } finally {
            setUploadingAvatar(false);
        }
    };

    // 5. Render Helpers
    const displayData = {
        name: formData.business_name || partnerData?.business_name,
        email: formData.email || partnerData?.email,
        phone: formData.phone || partnerData?.phone,
        location: formData.location || partnerData?.location,
        type: partnerData?.type,
        status: partnerData?.is_active ? 'Active' : 'Offline'
    };

    const partnerStatsList = [
        { label: 'Rating', value: stats.rating, icon: <Star size={20} color="#F59E0B" />, bg: '#FFFBEB' },
        { label: 'Total Bookings', value: loadingStats ? '...' : stats.totalBookings, icon: <Briefcase size={20} color="#3B82F6" />, bg: '#EFF6FF' },
        { label: 'Member Since', value: stats.memberSince, icon: <Clock size={20} color="#8B5CF6" />, bg: '#F5F3FF' },
    ];

    if (!partnerData) return <div className="p-8 text-center">Loading Profile...</div>;

    return (
        <div className="dashboard-wrapper">
            <style>{`
                .dashboard-wrapper {
                    min-height: 100vh;
                    background-color: #f8fafc;
                    font-family: 'Inter', sans-serif;
                    color: #1e293b;
                    padding-bottom: 60px;
                }

                .premium-header {
                    background: linear-gradient(135deg, #16a34a 0%, #22c55e 100%);
                    padding: 40px 0 100px 0;
                    color: white;
                    position: relative;
                    overflow: hidden;
                }

                .header-bg-accent {
                    position: absolute;
                    top: -50px;
                    right: -50px;
                    width: 300px;
                    height: 300px;
                    background: radial-gradient(circle, rgba(255,255,255,0.1) 0%, transparent 70%);
                    border-radius: 50%;
                }

                .container {
                    max-width: 1000px;
                    margin: 0 auto;
                    padding: 0 24px;
                }

                .header-content {
                    display: flex;
                    justify-content: space-between;
                    align-items: flex-start;
                    position: relative;
                    z-index: 1;
                }

                .business-info h1 {
                    font-size: 32px;
                    font-weight: 800;
                    margin: 0;
                    letter-spacing: -0.02em;
                }

                .location-tag {
                    display: flex;
                    align-items: center;
                    gap: 6px;
                    font-size: 14px;
                    opacity: 0.9;
                    margin-top: 8px;
                    background: rgba(255,255,255,0.1);
                    padding: 4px 12px;
                    border-radius: 20px;
                    width: fit-content;
                }

                .main-content {
                    margin-top: -60px;
                    position: relative;
                    z-index: 10;
                    display: grid;
                    grid-template-columns: 1fr 2fr;
                    gap: 24px;
                }

                .glass-card {
                    background: white;
                    border: 1px solid #e2e8f0;
                    border-radius: 24px;
                    padding: 32px;
                    box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.05);
                }

                .profile-avatar {
                    width: 120px;
                    height: 120px;
                    border-radius: 50%;
                    background: #dcfce7;
                    margin: 0 auto 20px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    border: 4px solid white;
                    box-shadow: 0 4px 12px rgba(0,0,0,0.1);
                    color: #16a34a;
                    overflow: hidden;
                }

                .stat-box {
                    background: #f8fafc;
                    padding: 16px;
                    border-radius: 16px;
                    text-align: center;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    gap: 8px;
                    transition: transform 0.2s;
                }
                .stat-box:hover { transform: translateY(-2px); }

                .info-row {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    padding: 16px 0;
                    border-bottom: 1px solid #f1f5f9;
                }
                .info-row:last-child { border-bottom: none; }

                .info-label { display: flex; alignItems: center; gap: 10px; color: #64748b; font-size: 14px; font-weight: 500; }
                .info-value { font-weight: 600; color: #0f172a; font-size: 15px; }

                .action-btn {
                    width: 100%;
                    padding: 12px;
                    border-radius: 12px;
                    border: none;
                    background: #16a34a;
                    color: white;
                    font-weight: 600;
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 8px;
                    margin-top: 24px;
                    transition: all 0.2s;
                }
                .action-btn:hover { background: #15803d; }
                .action-btn:disabled { opacity: 0.7; cursor: not-allowed; }

                .outline-btn {
                    padding: 8px 16px;
                    border-radius: 10px;
                    border: 1px solid #e2e8f0;
                    background: white;
                    color: #64748b;
                    font-weight: 600;
                    font-size: 13px;
                    cursor: pointer;
                    transition: all 0.2s;
                }
                .outline-btn:hover { background: #f8fafc; color: #0f172a; border-color: #cbd5e1; }

                .form-group { margin-bottom: 20px; }
                .form-label { display: block; font-size: 13px; font-weight: 600; color: #64748b; margin-bottom: 8px; }
                .form-input { 
                    width: 100%; padding: 12px 16px; 
                    border-radius: 12px; border: 1px solid #e2e8f0; 
                    background: #f8fafc; font-size: 14px; 
                    transition: all 0.2s;
                    box-sizing: border-box;
                }
                .form-input:focus { 
                    border-color: #16a34a; outline: none; background: white; 
                    box-shadow: 0 0 0 4px rgba(22, 163, 74, 0.1); 
                }

                .modal-overlay {
                    position: fixed; inset: 0;
                    background: rgba(15, 23, 42, 0.5);
                    backdrop-filter: blur(4px);
                    display: flex; alignItems: center; justify-content: center;
                    z-index: 1000;
                    padding: 24px;
                }
                
                @media (max-width: 768px) {
                    .main-content { grid-template-columns: 1fr; }
                }
            `}</style>

            <header className="premium-header">
                <div className="header-bg-accent" />
                <div className="container">
                    <div className="header-content">
                        <motion.div
                            className="business-info"
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                        >
                            <LayoutDashboard size={20} style={{ opacity: 0.8, marginBottom: '8px' }} />
                            <h1>Partner Profile</h1>
                            <div className="location-tag">
                                <Shield size={14} />
                                <span>Verified Partner Account</span>
                            </div>
                        </motion.div>

                        <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                            {partnerData && (
                                <StatusToggle
                                    isActive={partnerData.is_active}
                                    onToggle={togglePartnerStatus}
                                />
                            )}
                        </div>
                    </div>
                </div>
            </header>

            <div className="container">
                <motion.div
                    className="main-content"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                >
                    {/* Left Column */}
                    <div className="glass-card" style={{ textAlign: 'center' }}>
                        <div className="profile-avatar" style={{ position: 'relative', cursor: isEditing ? 'pointer' : 'default' }} onClick={() => isEditing && fileInputRef.current?.click()}>
                            {(partnerData?.avatar_url || profile?.avatar) ? (
                                <img
                                    src={partnerData?.avatar_url || profile?.avatar}
                                    alt="Profile"
                                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                />
                            ) : (
                                <User size={60} strokeWidth={1.5} />
                            )}
                            {isEditing && (
                                <div style={{
                                    position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.3)',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    color: 'white', borderRadius: '50%', opacity: uploadingAvatar ? 1 : 0,
                                    transition: 'opacity 0.2s'
                                }} className="avatar-overlay">
                                    <Edit2 size={24} />
                                </div>
                            )}
                            <input
                                type="file"
                                ref={fileInputRef}
                                onChange={handleAvatarUpload}
                                style={{ display: 'none' }}
                                accept="image/*"
                            />
                        </div>
                        <h2 style={{ fontSize: '24px', fontWeight: '800', color: '#0f172a' }}>{displayData.name}</h2>
                        <p style={{ color: '#64748b', marginTop: '4px', fontSize: '15px' }}>{displayData.type} Partner</p>

                        <div style={{ marginTop: '24px', paddingTop: '24px', borderTop: '1px solid #e2e8f0' }}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginBottom: '24px' }}>
                                <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: partnerData?.is_active ? '#10b981' : '#94a3b8' }} />
                                <span style={{ fontSize: '14px', fontWeight: '600', color: partnerData?.is_active ? '#10b981' : '#64748b' }}>
                                    Current Status: {displayData.status}
                                </span>
                            </div>

                            <button
                                onClick={() => setIsChangingPassword(!isChangingPassword)}
                                className="outline-btn" style={{ width: '100%', backgroundColor: isChangingPassword ? '#f8fafc' : 'white' }}
                            >
                                <Lock size={14} style={{ marginRight: '6px' }} /> {isChangingPassword ? 'Cancel Update' : 'Change Password'}
                            </button>
                        </div>
                    </div>

                    <AnimatePresence>
                        {isChangingPassword && (
                            <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                style={{ overflow: 'hidden', gridColumn: '1 / -1' }}
                            >
                                <div className="glass-card" style={{ marginTop: '-12px', marginBottom: '12px' }}>
                                    <h3 style={{ fontSize: '18px', fontWeight: '700', marginBottom: '20px' }}>Update Your Password</h3>
                                    <form onSubmit={handlePasswordChange} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                                        <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                                            <label className="form-label">Current Password</label>
                                            <div style={{ position: 'relative' }}>
                                                <input
                                                    type={showPassword ? "text" : "password"}
                                                    className="form-input" required
                                                    value={passwordData.currentPassword}
                                                    onChange={e => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                                                    style={{ paddingLeft: '40px', paddingRight: '40px' }}
                                                />
                                                <Lock size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                                                <button
                                                    type="button"
                                                    onClick={() => setShowPassword(!showPassword)}
                                                    style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8' }}
                                                >
                                                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                                </button>
                                            </div>
                                        </div>
                                        <div className="form-group">
                                            <label className="form-label">New Password</label>
                                            <div style={{ position: 'relative' }}>
                                                <input
                                                    type={showPassword ? "text" : "password"}
                                                    className="form-input" required minLength={6}
                                                    value={passwordData.newPassword}
                                                    onChange={e => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                                                    style={{ paddingLeft: '40px', paddingRight: '40px' }}
                                                />
                                                <Lock size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                                                <button
                                                    type="button"
                                                    onClick={() => setShowPassword(!showPassword)}
                                                    style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8' }}
                                                >
                                                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                                </button>
                                            </div>
                                        </div>
                                        <div className="form-group">
                                            <label className="form-label">Confirm New Password</label>
                                            <div style={{ position: 'relative' }}>
                                                <input
                                                    type={showPassword ? "text" : "password"}
                                                    className="form-input" required
                                                    value={passwordData.confirmPassword}
                                                    onChange={e => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                                                    style={{ paddingLeft: '40px', paddingRight: '40px' }}
                                                />
                                                <Lock size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                                                <button
                                                    type="button"
                                                    onClick={() => setShowPassword(!showPassword)}
                                                    style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8' }}
                                                >
                                                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                                </button>
                                            </div>
                                        </div>
                                        <div style={{ gridColumn: '1 / -1', display: 'flex', justifyContent: 'flex-end' }}>
                                            <button type="submit" className="action-btn" style={{ marginTop: 0, width: '200px' }} disabled={isLoading}>
                                                {isLoading ? 'Updating...' : 'Update Password'}
                                            </button>
                                        </div>
                                    </form>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Right Column */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                        {/* Stats Row */}
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
                            {partnerStatsList.map((stat, i) => (
                                <div key={i} className="stat-box" style={{ background: 'white', border: '1px solid #e2e8f0' }}>
                                    <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: stat.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        {stat.icon}
                                    </div>
                                    <div>
                                        <div style={{ fontSize: '20px', fontWeight: '800', color: '#0f172a' }}>{stat.value}</div>
                                        <div style={{ fontSize: '13px', color: '#64748b', fontWeight: '500' }}>{stat.label}</div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Details Card */}
                        <div className="glass-card">
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                                <h3 style={{ fontSize: '18px', fontWeight: '700', margin: 0 }}>Business Information</h3>
                                {!isEditing && (
                                    <button
                                        onClick={() => setIsEditing(true)}
                                        style={{ background: 'none', border: 'none', color: '#E65100', fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
                                    >
                                        <Edit2 size={16} /> Edit Details
                                    </button>
                                )}
                            </div>

                            {isEditing ? (
                                <form onSubmit={handleProfileUpdate}>
                                    <div className="form-group">
                                        <label className="form-label">Business / Display Name</label>
                                        <input
                                            type="text" className="form-input" required
                                            value={formData.business_name}
                                            onChange={e => setFormData({ ...formData, business_name: e.target.value })}
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">Email Address</label>
                                        <input
                                            type="email" className="form-input" required
                                            value={formData.email}
                                            onChange={e => setFormData({ ...formData, email: e.target.value })}
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">Phone Number</label>
                                        <input
                                            type="tel" className="form-input" required
                                            value={formData.phone}
                                            onChange={e => setFormData({ ...formData, phone: e.target.value })}
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">Base Location Name</label>
                                        <select
                                            className="form-input"
                                            required
                                            value={formData.location}
                                            onChange={e => {
                                                const newLoc = e.target.value;
                                                setFormData({ ...formData, location: newLoc });
                                                // Find coords and fly
                                                const locObj = locations.find(l => l.name === newLoc);
                                                if (locObj && locObj.latitude && locObj.longitude) {
                                                    setCoordinates({ lat: parseFloat(locObj.latitude), lng: parseFloat(locObj.longitude) });
                                                }
                                            }}
                                        >
                                            <option value="">Select Location</option>
                                            {locations.map(loc => (
                                                <option key={loc.id} value={loc.name}>{loc.name}</option>
                                            ))}
                                        </select>
                                    </div>

                                    {partnerData?.type !== 'Food' && (
                                        <div className="form-group">
                                            <label className="form-label">
                                                Pin Exact Location <span style={{ fontSize: '12px', fontWeight: 'normal', color: '#666' }}>(Click on map)</span>
                                            </label>
                                            <div style={{ height: '250px', borderRadius: '12px', overflow: 'hidden', border: '1px solid #e2e8f0' }}>
                                                <MapContainer center={[coordinates.lat, coordinates.lng]} zoom={13} style={{ height: '100%', width: '100%' }}>
                                                    <TileLayer
                                                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                                                        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                                                    />
                                                    <MapUpdater center={coordinates} />
                                                    <LocationPicker coordinates={coordinates} setCoordinates={setCoordinates} />
                                                </MapContainer>
                                            </div>
                                        </div>
                                    )}

                                    <div style={{ display: 'flex', gap: '12px' }}>
                                        <button
                                            type="button"
                                            className="outline-btn" style={{ flex: 1 }}
                                            onClick={() => setIsEditing(false)}
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            type="submit"
                                            className="action-btn" style={{ marginTop: 0, flex: 1 }}
                                            disabled={isLoading}
                                        >
                                            <Save size={18} /> {isLoading ? 'Saving...' : 'Save Changes'}
                                        </button>
                                    </div>
                                </form>
                            ) : (
                                <div className="info-list">
                                    <InfoItem icon={<Mail size={18} />} label="Email Address" value={displayData.email} />
                                    <InfoItem icon={<Phone size={18} />} label="Phone Number" value={displayData.phone || 'Not provided'} />
                                    <InfoItem icon={<MapPin size={18} />} label="Base Location" value={displayData.location} />
                                    <InfoItem icon={<Shield size={18} />} label="Account Type" value="Verified Business Account" />
                                </div>
                            )}
                        </div>
                    </div>
                </motion.div>
            </div>


        </div>
    );
};

const InfoItem = ({ icon, label, value }) => (
    <div className="info-row">
        <div className="info-label">
            <div style={{ color: '#94a3b8' }}>{icon}</div>
            {label}
        </div>
        <div className="info-value">{value}</div>
    </div>
);

export default PartnerProfile;
