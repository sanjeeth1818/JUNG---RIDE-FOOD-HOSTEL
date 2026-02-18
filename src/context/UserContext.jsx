import React, { createContext, useContext, useState, useEffect } from 'react';

const UserContext = createContext();
const API_URL = 'http://localhost:5000/api';

export const UserProvider = ({ children }) => {
    // Global Loading State (avoids flicker)
    const [loading, setLoading] = useState(true);

    // User State
    const [userType, setUserType] = useState(() => localStorage.getItem('JUNG_user_type') || null);

    // Data States (Initialize from LocalStorage for immediate UI)
    const [partnerData, setPartnerData] = useState(() => {
        const saved = localStorage.getItem('JUNG_partner_data');
        return saved ? JSON.parse(saved) : null;
    });

    const [location, setLocation] = useState(() => {
        const saved = localStorage.getItem('JUNG_location');
        return saved ? JSON.parse(saved) : null;
    });

    const [profile, setProfile] = useState(() => {
        const saved = localStorage.getItem('JUNG_profile');
        return saved ? JSON.parse(saved) : {
            id: null,
            name: '',
            email: '',
            phone: '',
            avatar: null
        };
    });

    // 1. Check Session on Mount
    useEffect(() => {
        const checkSession = async () => {
            // New logic: If we are a partner, we trust LocalStorage entirely.
            const stashedType = localStorage.getItem('JUNG_user_type');
            if (stashedType === 'partner') {
                console.log('🛡️ Partner mode: Skipping server session check, relying on LocalStorage.');
                setLoading(false);
                return;
            }

            try {
                // If we have data in localStorage, we can show it immediately, but we still verify with server
                const response = await fetch(`${API_URL}/auth/me`, { credentials: 'include' });
                const data = await response.json();

                if (data.authenticated) {
                    if (data.type === 'partner' && data.partner) {
                        console.log('✅ Partner Session Restored:', data.partner.business_name);
                        setUserType('partner');
                        setPartnerData(data.partner); // Validates/Updates localStorage
                        setProfile({
                            name: data.partner.name,
                            email: data.partner.email,
                            phone: data.partner.phone,
                            avatar: data.partner.avatar_url
                        });
                    } else if (data.type === 'user' && data.user) {
                        console.log('✅ User Session Restored:', data.user.name);
                        setUserType(data.user.user_type);
                        setProfile({
                            id: data.user.id,
                            name: data.user.name,
                            email: data.user.email,
                            phone: data.user.phone,
                            avatar: data.user.avatar_url
                        });
                        // Basic location sync
                        if (data.user.location_type) {
                            setLocation({
                                type: data.user.location_type,
                                name: data.user.location_name,
                                coords: { lat: data.user.lat, lng: data.user.lng }
                            });
                        }
                    }
                } else {
                    // Silently fall back to LocalStorage if unauthenticated
                }
            } catch (err) {
                console.error('Session check error:', err);
            } finally {
                setLoading(false);
            }
        };

        checkSession();
    }, []);

    // 2. Persist to LocalStorage
    useEffect(() => {
        if (userType) localStorage.setItem('JUNG_user_type', userType);
        else localStorage.removeItem('JUNG_user_type');
    }, [userType]);

    useEffect(() => {
        if (partnerData) localStorage.setItem('JUNG_partner_data', JSON.stringify(partnerData));
        else localStorage.removeItem('JUNG_partner_data');
    }, [partnerData]);

    useEffect(() => {
        if (location) localStorage.setItem('JUNG_location', JSON.stringify(location));
        else localStorage.removeItem('JUNG_location');
    }, [location]);

    useEffect(() => {
        if (profile && (profile.name || profile.email)) localStorage.setItem('JUNG_profile', JSON.stringify(profile));
        else localStorage.removeItem('JUNG_profile');
    }, [profile]);


    // --- Actions ---

    const loginAsPartner = (data) => {
        console.log('🔑 Logging in as Partner:', data);
        setUserType('partner');
        setPartnerData(data);
        setProfile({
            name: data.name,
            email: data.email,
            phone: data.phone,
            avatar: data.avatar_url
        });
    };

    const login = (userData) => {
        console.log('🔑 Logging in as User:', userData);
        setUserType(userData.user_type || userData.type || 'student');
        setProfile({
            id: userData.id || userData.user_id || null,
            name: userData.name,
            email: userData.email,
            phone: userData.phone || '',
            avatar: userData.avatar_url || null
        });
        if (userData.location_type) {
            setLocation({
                type: userData.location_type,
                name: userData.location_name,
                coords: { lat: userData.lat, lng: userData.lng }
            });
        }
    };

    const loginAsStudent = (universityName) => {
        setUserType('student');
        setLocation({ type: 'university', name: universityName });
    };

    const loginAsWorker = (cityData) => {
        setUserType('worker');
        setLocation({ type: 'city', ...cityData });
    };

    const logout = async () => {
        console.log('👋 Logging out...');
        try {
            await fetch(`${API_URL}/auth/logout`, { method: 'POST', credentials: 'include' });
        } catch (err) {
            console.error('Logout failed:', err);
        }

        // Clear State
        setUserType(null);
        setPartnerData(null);
        setLocation(null);
        setProfile({ id: null, name: '', email: '', phone: '', avatar: null });

        // Clear Storage
        localStorage.removeItem('JUNG_user_type');
        localStorage.removeItem('JUNG_partner_data');
        localStorage.removeItem('JUNG_location');
        localStorage.removeItem('JUNG_profile');
        // Or clear everything: localStorage.clear();
    };

    const updateLocation = (locData) => setLocation(prev => ({ ...prev, ...locData }));

    const updateProfile = async (newData) => {
        if (!profile.id && userType !== 'partner') {
            console.error('Update profile failed: No user ID found');
            setProfile(prev => ({ ...prev, ...newData })); // Fallback to local only
            return;
        }

        try {
            const endpoint = userType === 'partner' ? `/partners/${profile.id || partnerData.id}` : `/users/${profile.id}`;
            const res = await fetch(`${API_URL}${endpoint}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newData)
            });

            if (res.ok) {
                const data = await res.json();
                if (userType === 'partner') {
                    updatePartnerProfile(data.partner);
                } else {
                    setProfile(prev => ({ ...prev, ...data.user }));
                }
                return { success: true };
            } else {
                const error = await res.json();
                console.error('Update profile error:', error);
                return { success: false, error: error.message };
            }
        } catch (err) {
            console.error('Update profile failed:', err);
            return { success: false, error: err.message };
        }
    };

    const togglePartnerStatus = async () => {
        if (!partnerData) return;
        const newStatus = !partnerData.is_active;
        try {
            const res = await fetch(`${API_URL}/partners/${partnerData.id}/status`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ is_active: newStatus })
            });
            if (res.ok) {
                setPartnerData(prev => ({ ...prev, is_active: newStatus }));
            }
        } catch (err) {
            console.error('Failed to toggle partner status:', err);
        }
    };

    const updatePartnerProfile = (newData) => {
        setPartnerData(prev => {
            const updated = { ...prev, ...newData };
            localStorage.setItem('JUNG_partner_data', JSON.stringify(updated));
            return updated;
        });

        // Also update the 'profile' state for consistency as it's used in Navbar and other places
        setProfile(prev => {
            const updated = {
                ...prev,
                name: newData.business_name || newData.name || prev.name,
                email: newData.email || prev.email,
                phone: newData.phone || prev.phone,
                avatar: newData.avatar_url || (newData.avatar ? newData.avatar : prev.avatar)
            };
            localStorage.setItem('JUNG_profile', JSON.stringify(updated));
            return updated;
        });
    };


    return (
        <UserContext.Provider value={{
            loading,
            userType,
            location,
            profile,
            user: profile, // Alias for compatibility
            partnerData,
            login,
            loginAsStudent,
            loginAsWorker,
            loginAsPartner,
            logout,
            updateLocation,
            updateProfile,
            updateProfileLocal: (newData) => {
                setProfile(prev => ({ ...prev, ...newData }));
                if (userType === 'partner') {
                    setPartnerData(prev => ({ ...prev, ...newData }));
                }
            },
            updatePartnerProfile,
            togglePartnerStatus
        }}>
            {children}
        </UserContext.Provider>
    );
};

export const useUser = () => useContext(UserContext);
