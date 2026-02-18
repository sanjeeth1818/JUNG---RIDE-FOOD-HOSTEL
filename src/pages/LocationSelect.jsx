import React from 'react';
import { MapPin, Navigation, Search } from 'lucide-react';
import { useNavigate, useLocation as useRouteLocation } from 'react-router-dom';
import { useUser } from '../context/UserContext';

const LocationSelect = () => {
    const navigate = useNavigate();
    const routeLocation = useRouteLocation();
    const { loginAsWorker, userType, updateLocation, updateProfile, location: userLocation, profile } = useUser();
    const redirectAfter = routeLocation.state?.redirectAfter;
    const [manualLocation, setManualLocation] = React.useState('');
    const [error, setError] = React.useState('');

    const validateAndProceed = (action) => {
        // if (!name.trim()) ... removed manual check

        // Ensure profile name is there (it should be from login)
        // updateProfile({ name }); // Not needed

        action();
    };


    const handleLocationSubmit = (locName) => {
        validateAndProceed(() => {
            const locationData = { name: locName, type: 'city' };
            if (userType === 'student') {
                updateLocation(locationData);
            } else {
                loginAsWorker(locationData);
            }

            if (redirectAfter) {
                navigate(redirectAfter);
            } else {
                navigate('/home');
            }
        });
    };

    const handleUseCurrentLocation = () => {
        validateAndProceed(() => {
            // Mock GPS location
            const gpsLocation = { name: 'Current Location (GPS)', coords: { lat: 6.9271, lng: 79.8612 } };

            if (userType === 'student') {
                updateLocation(gpsLocation);
            } else {
                loginAsWorker(gpsLocation);
            }

            if (redirectAfter) {
                navigate(redirectAfter);
            } else {
                navigate('/home');
            }
        });
    };

    return (
        <div style={{ padding: '24px' }}>
            <h1 style={{ fontSize: '24px', fontWeight: '700', color: '#1B5E20', marginBottom: '8px' }}>Where are you?</h1>
            <p style={{ color: '#757575', marginBottom: '24px', fontSize: '14px' }}>We'll show you services in your area.</p>

            {/* Name Input Section Removed */}
            <div style={{ marginBottom: '24px' }}>
                <p style={{ fontSize: '16px', color: '#1B5E20', fontWeight: '500' }}>
                    Hello, <span style={{ fontWeight: '700' }}>{profile?.name}</span>
                </p>
            </div>


            {userLocation && (
                <div style={{
                    marginBottom: '24px',
                    padding: '16px',
                    backgroundColor: '#fff',
                    borderRadius: '16px',
                    border: '1px solid var(--color-primary)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px'
                }}>
                    <MapPin size={20} color="var(--color-primary)" />
                    <div>
                        <p style={{ fontSize: '12px', color: '#666', fontWeight: '500' }}>YOUR CURRENT LOCATION</p>
                        <p style={{ fontSize: '16px', fontWeight: '700' }}>{userLocation.name || userLocation.city}</p>
                    </div>
                </div>
            )}

            <button
                onClick={handleUseCurrentLocation}
                style={{
                    width: '100%',
                    padding: '20px',
                    borderRadius: '16px',
                    backgroundColor: userLocation?.type === 'gps' ? 'var(--color-primary)' : '#E8F5E9',
                    color: userLocation?.type === 'gps' ? 'white' : '#2E7D32',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '16px',
                    border: 'none',
                    marginBottom: '24px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                }}
            >
                <Navigation size={24} />
                {userLocation?.type === 'gps' ? 'Current Location Active' : 'Use Current Location'}
            </button>

            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
                <div style={{ height: '1px', flex: 1, backgroundColor: '#E0E0E0' }}></div>
                <span style={{ color: '#9E9E9E', fontSize: '14px' }}>OR SELECT MANUALLY</span>
                <div style={{ height: '1px', flex: 1, backgroundColor: '#E0E0E0' }}></div>
            </div>

            <div style={{ position: 'relative', marginBottom: '24px' }}>
                <Search size={20} color="#9E9E9E" style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)' }} />
                <input
                    type="text"
                    placeholder="Search city, town..."
                    value={manualLocation}
                    onChange={(e) => setManualLocation(e.target.value)}
                    onKeyDown={(e) => {
                        if (e.key === 'Enter' && manualLocation.trim()) {
                            handleLocationSubmit(manualLocation.trim());
                        }
                    }}
                    style={{
                        width: '100%',
                        padding: '16px 16px 16px 48px',
                        borderRadius: '16px',
                        border: '1px solid #E0E0E0',
                        backgroundColor: '#F5F5F5',
                        fontSize: '16px',
                        outline: 'none'
                    }}
                />
            </div>
        </div>
    );
};

export default LocationSelect;
