import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Menu, X, ChevronDown, Search, LogOut, User, LayoutDashboard } from 'lucide-react';
import { useUser } from '../../context/UserContext';

import MegaMenu from './MegaMenu';
import GlobalSearch from '../common/GlobalSearch';

const Navbar = () => {
    const { userType, profile, logout, partnerData } = useUser();
    const navigate = useNavigate();
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isSearchOpen, setIsSearchOpen] = useState(false);
    const [isProfileOpen, setIsProfileOpen] = useState(false);

    const profileRef = useRef(null);

    // Close profile dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (profileRef.current && !profileRef.current.contains(event.target)) {
                setIsProfileOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleLogout = () => {
        logout();
        setIsProfileOpen(false);
        navigate('/');
    };

    return (
        <>
            <nav style={{
                position: 'sticky',
                top: 0,
                zIndex: 1000,
                backgroundColor: 'white',
                borderBottom: '1px solid #f0f0f0',
                height: '80px',
                display: 'flex',
                alignItems: 'center'
            }}>
                <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    width: '100%',
                    padding: '0 16px'
                }}>
                    {/* Left: Menu & Logo */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
                        <button
                            onClick={() => setIsMenuOpen(!isMenuOpen)}
                            style={{
                                background: 'none',
                                border: 'none',
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                gap: '4px',
                                cursor: 'pointer',
                                padding: '8px'
                            }}
                        >
                            {isMenuOpen ? <X size={24} color="#333" /> : <Menu size={24} color="#333" />}
                            <span style={{ fontSize: '12px', color: '#666', fontWeight: '500' }}>Menu</span>
                        </button>

                        <Link to="/" style={{ display: 'flex', alignItems: 'center' }}>
                            <img src="/logo.png" alt="JUNG" style={{ height: '40px', objectFit: 'contain' }} />
                        </Link>
                    </div>

                    {/* Right: Corporate Links & Profile */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>

                        {userType ? (
                            <div style={{ position: 'relative' }} ref={profileRef}>
                                <button
                                    onClick={() => setIsProfileOpen(!isProfileOpen)}
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '12px',
                                        background: 'none',
                                        border: 'none',
                                        cursor: 'pointer',
                                        padding: '4px'
                                    }}
                                >
                                    <div style={{ textAlign: 'right', display: 'none', md: { display: 'block' } }}>
                                        <p style={{ fontSize: '14px', fontWeight: '600', color: '#1A1A1A', margin: 0 }}>
                                            {profile?.name || 'User'}
                                        </p>
                                        <p style={{
                                            fontSize: '12px',
                                            color: '#666',
                                            margin: 0,
                                            textTransform: 'capitalize',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'flex-end',
                                            gap: '6px'
                                        }}>
                                            {userType === 'partner' && (
                                                <span style={{
                                                    width: '8px',
                                                    height: '8px',
                                                    borderRadius: '50%',
                                                    backgroundColor: partnerData?.is_active ? '#00B14F' : '#94a3b8',
                                                    boxShadow: partnerData?.is_active ? '0 0 5px #00B14F' : 'none'
                                                }}></span>
                                            )}
                                            {userType === 'partner' ? (partnerData?.is_active ? 'Active Partner' : 'Offline Partner') : userType}
                                        </p>
                                    </div>
                                    <div style={{
                                        width: '40px',
                                        height: '40px',
                                        borderRadius: '50%',
                                        backgroundColor: '#E8F5E9',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        border: '2px solid #00B14F',
                                        overflow: 'hidden'
                                    }}>
                                        {profile?.avatar ? (
                                            <img src={profile.avatar} alt="Profile" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                        ) : (
                                            <span style={{ fontSize: '18px', fontWeight: 'bold', color: '#00B14F' }}>
                                                {profile?.name?.charAt(0).toUpperCase() || 'U'}
                                            </span>
                                        )}
                                    </div>
                                    <ChevronDown size={16} color="#666" />
                                </button>

                                {/* Profile Dropdown */}
                                {isProfileOpen && (
                                    <div style={{
                                        position: 'absolute',
                                        top: '120%',
                                        right: 0,
                                        width: '240px',
                                        backgroundColor: 'white',
                                        borderRadius: '16px',
                                        boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
                                        padding: '8px',
                                        zIndex: 1000,
                                        border: '1px solid #f0f0f0'
                                    }} className="animate-scale-in">

                                        <div style={{ padding: '12px 16px', borderBottom: '1px solid #f0f0f0', marginBottom: '8px' }}>
                                            <p style={{ fontSize: '14px', fontWeight: '600', color: '#333' }}>Signed in as</p>
                                            <p style={{ fontSize: '14px', color: '#00B14F', fontWeight: '500', textTransform: 'truncate', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                {userType === 'partner' && (
                                                    <span style={{
                                                        width: '8px',
                                                        height: '8px',
                                                        borderRadius: '50%',
                                                        backgroundColor: partnerData?.is_active ? '#00B14F' : '#94a3b8'
                                                    }}></span>
                                                )}
                                                {profile?.email}
                                            </p>
                                        </div>

                                        <Link
                                            to={userType === 'partner' ? `/partner/dashboard/${partnerData?.type?.toLowerCase() || 'room'}/profile` : '/profile'}
                                            onClick={() => setIsProfileOpen(false)}
                                            style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px', textDecoration: 'none', color: '#333', fontSize: '14px', borderRadius: '8px', transition: 'background 0.2s' }}
                                            onMouseEnter={(e) => e.target.style.background = '#f5f5f5'}
                                            onMouseLeave={(e) => e.target.style.background = 'transparent'}
                                        >
                                            <User size={18} /> My Profile
                                        </Link>

                                        <Link
                                            to={userType === 'partner' ? `/partner/dashboard/${partnerData?.type?.toLowerCase() || 'rider'}` : '/student/university'}
                                            onClick={() => setIsProfileOpen(false)}
                                            style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px', textDecoration: 'none', color: '#333', fontSize: '14px', borderRadius: '8px', transition: 'background 0.2s' }}
                                            onMouseEnter={(e) => e.target.style.background = '#f5f5f5'}
                                            onMouseLeave={(e) => e.target.style.background = 'transparent'}
                                        >
                                            <LayoutDashboard size={18} /> Dashboard
                                        </Link>

                                        <div style={{ borderTop: '1px solid #f0f0f0', margin: '8px 0' }}></div>

                                        <button
                                            onClick={handleLogout}
                                            style={{
                                                display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px',
                                                width: '100%', background: 'none', border: 'none', cursor: 'pointer',
                                                color: '#EF5350', fontSize: '14px', borderRadius: '8px', textAlign: 'left'
                                            }}
                                            onMouseEnter={(e) => e.target.style.background = '#FFEBEE'}
                                            onMouseLeave={(e) => e.target.style.background = 'transparent'}
                                        >
                                            <LogOut size={18} /> Sign Out
                                        </button>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="desktop-only" style={{ display: 'flex', alignItems: 'center', gap: '32px' }}>
                                <Link to="/partner-select" style={{ fontSize: '14px', fontWeight: 'bold', color: '#1A1A1A', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                    Be Our Partner <ChevronDown size={14} />
                                </Link>
                                <Link to="/help" style={{ fontSize: '14px', fontWeight: 'bold', color: '#1A1A1A', textDecoration: 'none' }}>Help Centre</Link>
                            </div>
                        )}

                        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', borderLeft: '1px solid #eee', paddingLeft: '16px' }}>
                            <Search
                                size={20}
                                color="#333"
                                style={{ cursor: 'pointer' }}
                                onClick={() => setIsSearchOpen(true)}
                            />
                        </div>
                    </div>
                </div>

                {/* Inline CSS for responsiveness */}
                <style>{`
                    @media (max-width: 900px) {
                        .desktop-only { display: none !important; }
                    }
                `}</style>
            </nav>
            <MegaMenu isOpen={isMenuOpen} onClose={() => setIsMenuOpen(false)} />
            <GlobalSearch isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />
        </>
    );
};

export default Navbar;
