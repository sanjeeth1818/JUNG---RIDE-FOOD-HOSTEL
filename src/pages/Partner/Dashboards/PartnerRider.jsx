import React, { useState, useEffect, useRef } from 'react';
import { Star, AlertCircle, Shield, X, Navigation, MapPin } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { MapContainer, TileLayer, Marker, Circle, Popup, Polyline, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { useUser } from '../../../context/UserContext';
import SlideToStart from '../../../components/common/SlideToStart';
import './PartnerRider.css';

// Custom symbols for markers
const riderIcon = L.divIcon({
    html: `<div style="background: #2563eb; width: 30px; height: 30px; border-radius: 50%; border: 3px solid white; box-shadow: 0 4px 10px rgba(0,0,0,0.3); display: flex; align-items: center; justify-content: center;">
            <div style="width: 10px; height: 10px; background: white; border-radius: 50%;"></div>
          </div>`,
    className: 'custom-rider-marker',
    iconSize: [30, 30],
    iconAnchor: [15, 15],
});

// Helper to get absolute icon URL
const getIconUrl = (filename) => `${window.location.origin}/${filename}`;

// Custom Vehicle Icons
const bikeIcon = L.icon({
    iconUrl: getIconUrl('bike.png'),
    iconSize: [45, 45],
    iconAnchor: [22, 22],
    popupAnchor: [0, -22],
    className: 'vehicle-marker'
});

const carIcon = L.icon({
    iconUrl: getIconUrl('car.png'),
    iconSize: [50, 50],
    iconAnchor: [25, 25],
    popupAnchor: [0, -25],
    className: 'vehicle-marker'
});

const tukIcon = L.icon({
    iconUrl: getIconUrl('tuktuk.png'),
    iconSize: [50, 50],
    iconAnchor: [25, 25],
    popupAnchor: [0, -25],
    className: 'vehicle-marker'
});

const vanIcon = L.icon({
    iconUrl: getIconUrl('van.png'),
    iconSize: [60, 40],
    iconAnchor: [30, 20],
    popupAnchor: [0, -20],
    className: 'vehicle-marker'
});

const getVehicleIcon = (type) => {
    if (!type) return riderIcon;
    const lowerType = String(type).toLowerCase();
    if (lowerType.includes('bike')) return bikeIcon;
    if (lowerType.includes('van')) return vanIcon;
    if (lowerType.includes('car')) return carIcon;
    if (lowerType.includes('tuk')) return tukIcon;
    return riderIcon;
};

const requestIcon = L.icon({
    iconUrl: 'https://cdn0.iconfinder.com/data/icons/small-n-flat/24/678111-map-marker-512.png',
    iconSize: [40, 40],
    iconAnchor: [20, 40],
    popupAnchor: [0, -40]
});

// Component to update map center with smooth animation
function MapUpdater({ center, zoom }) {
    const map = useMap();
    useEffect(() => {
        if (center) {
            map.flyTo([center.lat, center.lng], zoom || map.getZoom(), {
                animate: true,
                duration: 1.5
            });
        }
    }, [center, zoom, map]);
    return null;
}



export default function PartnerRider() {
    const { partnerData, loading: authLoading } = useUser();
    const [riderLocation, setRiderLocation] = useState({ lat: 6.9271, lng: 79.8612 }); // Default Colombo
    const [isOnline, setIsOnline] = useState(false);
    const [isAvailable, setIsAvailable] = useState(true);
    const [rideRequests, setRideRequests] = useState([]);
    const [currentRequest, setCurrentRequest] = useState(null);
    const [radius, setRadius] = useState(3);
    const [acceptedRide, setAcceptedRide] = useState(null);
    const [locationError, setLocationError] = useState(null);
    const [isLocating, setIsLocating] = useState(false);
    const [useHighAccuracy, setUseHighAccuracy] = useState(true); // Adaptive accuracy
    const [activeTab, setActiveTab] = useState('insights'); // 'insights' or 'history'
    const [mapZoom, setMapZoom] = useState(15); // Dynamic zoom level
    const [isManualMode, setIsManualMode] = useState(false); // If true, ignore watchPosition updates
    const [toastMessage, setToastMessage] = useState(null); // Toast for notifications { text, type: 'error'|'success' }
    const [routeCoordinates, setRouteCoordinates] = useState([]); // Route polyline
    const [tripStage, setTripStage] = useState(null); // 'accepted', 'arrived', 'picked_up'
    const isAcceptingRef = useRef(false); // Track acceptance in progress

    // Function to get current location with fallback
    const getCurrentLocation = () => {
        if (!navigator.geolocation) {
            setLocationError('Geolocation not supported');
            return;
        }

        setIsLocating(true);
        setLocationError(null);

        const successHandler = (position) => {
            const actualLocation = {
                lat: position.coords.latitude,
                lng: position.coords.longitude
            };
            setRiderLocation(actualLocation);
            console.log(`📍 GPS Location Found: ${actualLocation.lat}, ${actualLocation.lng} (Accuracy: ${position.coords.accuracy}m)`);
            setIsLocating(false);
            // If we got high accuracy successfully, keep it true
            if (position.coords.accuracy < 50) setUseHighAccuracy(true);
        };

        const errorHandler = (error) => {
            // Only warn if it's a real error, silence timeout warnings for smoother UX
            if (error.code !== 3) {
                console.warn('High accuracy location failed, switching to standard accuracy...', error.message);
            } else {
                console.log('⚡ High accuracy timed out (expected on PC), switching to standard accuracy.');
            }

            setUseHighAccuracy(false); // Switch to low accuracy

            // Fallback to low accuracy immediately
            navigator.geolocation.getCurrentPosition(
                successHandler,
                (finalError) => {
                    console.error('Standard location error:', finalError);
                    let errorMsg = 'Failed to get location.';
                    if (finalError.code === 1) errorMsg = 'Permission denied.';
                    if (finalError.code === 2) errorMsg = 'Location unavailable.';
                    if (finalError.code === 3) errorMsg = 'Location timed out.';

                    setLocationError(errorMsg);
                    setIsLocating(false);
                },
                { enableHighAccuracy: false, timeout: 10000, maximumAge: 0 }
            );
        };

        // Try high accuracy first, but FAIL FAST (5s) if not available
        // This prevents the user from waiting 30s just to see an error.
        navigator.geolocation.getCurrentPosition(
            successHandler,
            errorHandler,
            { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
        );
    };

    // Get user's actual location on mount with fallbacks
    useEffect(() => {
        const initializeLocation = async () => {
            // 1. Try to get last known location from server
            if (partnerData?.id) {
                try {
                    const res = await fetch(`http://localhost:5000/api/riders/${partnerData.id}/location`);
                    const data = await res.json();
                    if (data && data.current_lat && data.current_lng) {
                        setRiderLocation({ lat: data.current_lat, lng: data.current_lng });

                        // Restore online/available status
                        if (data.is_online !== undefined) {
                            setIsOnline(!!data.is_online);
                            console.log(`🔄 Restored Online Status: ${data.is_online}`);
                        }
                        if (data.is_available !== undefined) setIsAvailable(!!data.is_available);

                        console.log('📍 Initialized with Last Known Location');
                    } else if (partnerData.latitude && partnerData.longitude) {
                        // 2. Fallback to registered location
                        setRiderLocation({ lat: partnerData.latitude, lng: partnerData.longitude });
                        console.log('📍 Initialized with Registered Location');
                    }
                } catch (err) {
                    console.error('Failed to fetch last known location:', err);
                }
            }

            // 3. Finally, try browser Geolocation (might overwrite if successful)
            getCurrentLocation();
        };

        initializeLocation();
    }, [partnerData]);

    // Fetch route from OSRM
    const fetchRoute = async (start, end) => {
        try {
            const url = `https://router.project-osrm.org/route/v1/driving/${start.lng},${start.lat};${end.lng},${end.lat}?overview=full&geometries=geojson`;
            const res = await fetch(url);
            const data = await res.json();

            if (data.routes && data.routes.length > 0) {
                const coords = data.routes[0].geometry.coordinates.map(coord => [coord[1], coord[0]]);
                setRouteCoordinates(coords);
            }
        } catch (err) {
            console.error('Route fetching failed:', err);
            // Fallback to straight line
            setRouteCoordinates([[start.lat, start.lng], [end.lat, end.lng]]);
        }
    };

    // Get user's actual location on mount with fallbacks
    useEffect(() => {
        const initializeLocation = async () => {
            // 1. Try to get last known location from server
            if (partnerData?.id) {
                try {
                    const res = await fetch(`http://localhost:5000/api/riders/${partnerData.id}/location`);
                    const data = await res.json();
                    if (data && data.current_lat && data.current_lng) {
                        setRiderLocation({ lat: data.current_lat, lng: data.current_lng });

                        // Restore online/available status
                        if (data.is_online !== undefined) {
                            setIsOnline(!!data.is_online);
                            console.log(`🔄 Restored Online Status: ${data.is_online}`);
                        }
                        if (data.is_available !== undefined) setIsAvailable(!!data.is_available);

                        console.log('📍 Initialized with Last Known Location');
                    } else if (partnerData.latitude && partnerData.longitude) {
                        // 2. Fallback to registered location
                        setRiderLocation({ lat: partnerData.latitude, lng: partnerData.longitude });
                        console.log('📍 Initialized with Registered Location');
                    }
                } catch (err) {
                    console.error('Failed to fetch last known location:', err);
                }
            }

            // 3. Finally, try browser Geolocation (might overwrite if successful)
            getCurrentLocation();
        };

        if (partnerData) {
            initializeLocation();

            // Restore active ride if any
            fetch(`http://localhost:5000/api/riders/${partnerData.id}/active-ride`)
                .then(res => res.json())
                .then(data => {
                    if (data.active_ride) {
                        setAcceptedRide(data.active_ride);
                        setIsAvailable(false); // If in a ride, not available
                        console.log('🔄 Active ride restored:', data.active_ride);
                    }
                })
                .catch(err => console.error('Failed to restore active ride:', err));
        }
    }, [partnerData]);

    // Start GPS tracking
    // Audio Unlocker Ref
    const audioUnlockRef = useRef(null);

    // Toggle Online/Offline
    const toggleOnline = async () => {
        if (!partnerData?.id) return;

        // 🔓 Initialize Audio Context on User Gesture (satisfies browser requirement)
        try {
            const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
            if (audioCtx.state === 'suspended') {
                await audioCtx.resume();
            }
            // Store it globally so RideRequestTimer can use it
            window.riderAudioContext = audioCtx;
            console.log('🔊 Audio system initialized and ready');
        } catch (e) {
            console.warn('Audio initialization failed:', e);
        }

        // Unlock the hidden audio element as well
        if (!isOnline && audioUnlockRef.current) {
            audioUnlockRef.current.play().catch(() => { });
            audioUnlockRef.current.pause();
        }

        const newStatus = !isOnline;
        // Optimistic UI update
        setIsOnline(newStatus);

        try {
            await fetch(`http://localhost:5000/api/riders/${partnerData.id}/status`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    is_online: newStatus,
                    is_available: newStatus ? (acceptedRide ? false : true) : false
                })
            });
            console.log(newStatus ? '🟢 You are now ONLINE' : '🔴 You are now OFFLINE');
        } catch (err) {
            console.error('Status toggle error:', err);
            // Revert on error
            setIsOnline(!newStatus);
            alert('Failed to update status. Please try again.');
        }
    };

    // Watch location when online
    useEffect(() => {
        if (!isOnline) return;

        const successHandler = (pos) => {
            const { latitude, longitude } = pos.coords;
            setRiderLocation({ lat: latitude, lng: longitude });

            // Sync location to backend
            fetch(`http://localhost:5000/api/riders/${partnerData.id}/location`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ lat: latitude, lng: longitude })
            }).catch(err => console.error('Location update error:', err));
        };

        const errorHandler = (error) => {
            // Silent fallback during watch
            if (useHighAccuracy && error.code === 3) {
                console.log('📉 GPS Signal weak, using standard accuracy');
                setUseHighAccuracy(false);
            }
        };

        const watchId = navigator.geolocation.watchPosition(
            successHandler,
            errorHandler,
            {
                enableHighAccuracy: useHighAccuracy,
                timeout: useHighAccuracy ? 10000 : 20000,
                maximumAge: 5000
            }
        );

        return () => navigator.geolocation.clearWatch(watchId);
    }, [isOnline, partnerData, isAvailable, useHighAccuracy, isManualMode]);

    // Reset to high accuracy when manually clicking "My Location"
    const handleManualLocationRefresh = () => {
        setIsManualMode(false); // Reset manual mode when explicitly requested
        setUseHighAccuracy(true); // Force retry high accuracy
        setMapZoom(17); // Zoom in for exact location
        getCurrentLocation();
    };

    // Poll for nearby requests
    const prevRequestsRef = useRef([]);
    useEffect(() => {
        if (!isOnline || !partnerData?.id || acceptedRide) return;

        const controller = new AbortController();

        const pollNearby = async () => {
            try {
                const res = await fetch(`http://localhost:5000/api/riders/${partnerData.id}/nearby-requests?radius=${radius}`, {
                    signal: controller.signal
                });
                const data = await res.json();

                if (data.requests) {
                    setRideRequests(data.requests);
                    if (data.recommended_radius) setRadius(data.recommended_radius);

                    // 1. AUTO-OPEN: Show popup if we have requests and no current popup
                    if (!currentRequest && data.requests.length > 0) {
                        setCurrentRequest(data.requests[0]);
                    }
                    // 2. CANCELLATION CHECK: If we are viewing a request that is NO LONGER in the list
                    // AND we are not currently in the process of accepting it (race condition fix)
                    else if (currentRequest && !data.requests.find(r => r.id === currentRequest.id) && !isAcceptingRef.current) {
                        console.log('🚫 Current request was cancelled or timed out. Closing popup.');
                        setCurrentRequest(null);
                        setToastMessage({ text: 'User Cancelled Request', type: 'error' });
                        setTimeout(() => setToastMessage(null), 3000); // Hide after 3s
                    }
                } else if (currentRequest && !isAcceptingRef.current) {
                    // Edge case: requests array is empty/null but we have a currentRequest -> Cancel it
                    console.log('🚫 No active requests. Closing stale popup.');
                    setCurrentRequest(null);
                    setToastMessage({ text: 'User Cancelled Request', type: 'error' });
                    setTimeout(() => setToastMessage(null), 3000);
                }
            } catch (err) {
                if (err.name === 'AbortError') {
                    // Silent abort
                } else {
                    console.error('Poll error:', err);
                }
            }
        };

        const pollInterval = setInterval(pollNearby, 5000);
        pollNearby(); // Initial call

        return () => {
            clearInterval(pollInterval);
            controller.abort();
        };
    }, [isOnline, partnerData?.id, radius, currentRequest, acceptedRide]);
    // Removed !! casts to ensure object stability

    const handleAccept = async (requestId) => {
        isAcceptingRef.current = true; // Lock polling cancellation check
        try {
            const res = await fetch(`http://localhost:5000/api/riders/${partnerData.id}/requests/${requestId}/accept`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' }
            });
            const data = await res.json();

            if (data.success) {
                setAcceptedRide(data.ride);
                setCurrentRequest(null);
                setIsAvailable(false);
                setRideRequests([]);

                // Fetch route to pickup location
                fetchRoute(
                    { lat: riderLocation.lat, lng: riderLocation.lng },
                    { lat: data.ride.pickup_lat, lng: data.ride.pickup_lng }
                );
            }
        } catch (err) {
            console.error('Accept error:', err);
            alert('Failed to accept ride');
        } finally {
            // Slight delay to allow state updates to settle before unlocking polling
            setTimeout(() => {
                isAcceptingRef.current = false;
            }, 1000);
        }
    };

    const handleDecline = async (requestId) => {
        console.log('🚫 Decline called with requestId:', requestId);
        try {
            if (requestId && partnerData?.id) {
                console.log('📤 Sending decline request to backend...');
                await fetch(`http://localhost:5000/api/riders/${partnerData.id}/requests/${requestId}/decline`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' }
                });
                console.log('✅ Decline request sent successfully');
            } else {
                console.warn('⚠️ Missing requestId or partnerData.id:', { requestId, partnerId: partnerData?.id });
            }
            setCurrentRequest(null);
            setRideRequests(prev => prev.filter(r => r.id !== requestId));
            console.log('✅ Request cleared from UI');
        } catch (err) {
            console.error('❌ Decline error:', err);
        }
    };

    // Handle driver arrived at pickup location
    const handleArrivedAtPickup = async () => {
        try {
            const res = await fetch(
                `http://localhost:5000/api/ride-requests/${acceptedRide.id}/arrived`,
                { method: 'POST', headers: { 'Content-Type': 'application/json' } }
            );
            const data = await res.json();
            if (data.success) {
                // Update status to 'arrived'
                setAcceptedRide({ ...acceptedRide, status: 'arrived' });
                // Clear the pickup route since we've arrived
                setRouteCoordinates([]);
                // Show success notification
                setToastMessage({ text: '✅ Arrived at pickup! Waiting for passenger...', type: 'success' });
                setTimeout(() => setToastMessage(null), 3000);
            } else {
                alert('Failed to mark arrival: ' + (data.error || 'Server error'));
            }
        } catch (err) {
            console.error('Arrival error:', err);
            alert('Network error while marking arrival');
        }
    };

    // Handle start trip (passenger picked up)
    const handleStartTrip = async () => {
        try {
            const res = await fetch(
                `http://localhost:5000/api/ride-requests/${acceptedRide.id}/start-trip`,
                { method: 'POST', headers: { 'Content-Type': 'application/json' } }
            );
            const data = await res.json();
            if (data.success) {
                // Update status to 'picked_up'
                setAcceptedRide({ ...acceptedRide, status: 'picked_up' });
                // Fetch route from current location to dropoff
                fetchRoute(
                    { lat: riderLocation.lat, lng: riderLocation.lng },
                    { lat: acceptedRide.dropoff_lat, lng: acceptedRide.dropoff_lng }
                );
                // Show success notification
                setToastMessage({ text: '🚗 Trip started! Navigate to dropoff location.', type: 'success' });
                setTimeout(() => setToastMessage(null), 3000);
            } else {
                alert('Failed to start trip: ' + (data.error || 'Server error'));
            }
        } catch (err) {
            console.error('Start trip error:', err);
            alert('Network error while starting trip');
        }
    };



    const [showStats, setShowStats] = useState(false);
    const [stats, setStats] = useState({ today: { total_earnings: 0, total_rides: 0 }, weekly_earnings: 0 });
    const [history, setHistory] = useState([]);
    const [notifications, setNotifications] = useState([]);
    const [showNotifications, setShowNotifications] = useState(false);
    const [darkMode, setDarkMode] = useState(false); // Map Theme State

    // Helper to get map tile URL
    const getTileLayer = () => {
        return darkMode
            ? 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'
            : 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
    };

    const getAttribution = () => {
        return darkMode
            ? '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
            : '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';
    };

    // Fetch stats, history, and notifications
    useEffect(() => {
        if (!partnerData?.id) return;

        const controller = new AbortController();
        const { signal } = controller;

        const fetchData = async () => {
            try {
                // Fetch Stats and History when panel is open
                if (showStats) {
                    const statsRes = await fetch(`http://localhost:5000/api/riders/${partnerData.id}/stats`, { signal });
                    const statsData = await statsRes.json();
                    setStats(statsData);

                    const historyRes = await fetch(`http://localhost:5000/api/riders/${partnerData.id}/history`, { signal });
                    const historyData = await historyRes.json();
                    setHistory(historyData.history);
                }

                // Fetch Notifications
                const notifRes = await fetch(`http://localhost:5000/api/partners/${partnerData.id}/notifications`, { signal });
                const notifData = await notifRes.json();
                setNotifications(notifData.notifications || []);

            } catch (err) {
                if (err.name === 'AbortError') return;
                console.error('Background fetch error:', err);
            }
        };

        fetchData();

        return () => controller.abort();
    }, [showStats, partnerData?.id]);

    // Proactive re-fetch if vehicle data is missing from current session
    useEffect(() => {
        if (partnerData) {
            console.log('Driver Profile Data:', partnerData);
            if (!partnerData.vehicle_type && !partnerData.type) {
                fetch('http://localhost:5000/api/auth/me')
                    .then(res => res.json())
                    .then(data => {
                        if (data.authenticated && data.partner) {
                            // Update context/session via loginAsPartner (if available) or just let the next refresh handle it
                        }
                    }).catch(() => { });
            }
        }
    }, [partnerData]);

    // Prevent background scrolling when Activity Hub is open
    useEffect(() => {
        if (showStats) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, [showStats]);

    const markAsRead = (notifId) => {
        // Optimistic update
        setNotifications(prev => prev.map(n => n.id === notifId ? { ...n, is_read: true } : n));
        fetch(`http://localhost:5000/api/notifications/${notifId}/read`, { method: 'PUT' })
            .catch(err => console.error('Mark read error:', err));
    };

    const unreadCount = notifications.filter(n => !n.is_read).length;

    if (authLoading) {
        return <div className="loading-map">Loading...</div>;
    }

    if (!partnerData) {
        return (
            <div className="loading-map">
                Please log in as a Rider partner to access this dashboard.
            </div>
        );
    }

    return (
        <div className="partner-rider-dashboard">
            {/* Top Floating Header */}
            <div className="rider-header-overlay">
                <div className="status-card">
                    <div className={`status-indicator ${isOnline ? 'online' : 'offline'}`} />
                    <span className="status-text">{isOnline ? 'ONLINE' : 'OFFLINE'}</span>
                </div>

                <div className="header-controls">
                    {/* Notification Bell */}
                    <div style={{ position: 'relative' }}>
                        <button
                            className="icon-btn-glass"
                            onClick={() => setShowNotifications(!showNotifications)}
                            title="Notifications"
                        >
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path><path d="M13.73 21a2 2 0 0 1-3.46 0"></path></svg>
                            {unreadCount > 0 && (
                                <span style={{
                                    position: 'absolute', top: '-5px', right: '-5px',
                                    background: '#ef4444', color: 'white',
                                    borderRadius: '50%', width: '18px', height: '18px',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    fontSize: '11px', fontWeight: 'bold'
                                }}>{unreadCount}</span>
                            )}
                        </button>

                        {/* Notification Panel */}
                        {showNotifications && (
                            <div className="notification-panel" style={{
                                position: 'absolute', top: '50px', right: '0',
                                width: '320px', maxHeight: '400px', overflowY: 'auto',
                                background: 'rgba(255, 255, 255, 0.95)', backdropFilter: 'blur(10px)',
                                borderRadius: '16px', boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
                                border: '1px solid rgba(255, 255, 255, 0.5)', zIndex: 800,
                                padding: '16px'
                            }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                                    <h4 style={{ margin: 0, fontSize: '16px', color: '#1e293b' }}>Notifications</h4>
                                    <button onClick={() => setShowNotifications(false)} style={{ border: 'none', background: 'none', cursor: 'pointer', fontSize: '18px' }}>&times;</button>
                                </div>
                                {notifications.length === 0 ? (
                                    <p style={{ color: '#94a3b8', textAlign: 'center', fontSize: '14px' }}>No notifications</p>
                                ) : (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                        {notifications.map(n => (
                                            <div
                                                key={n.id}
                                                onClick={() => markAsRead(n.id)}
                                                style={{
                                                    padding: '12px', borderRadius: '12px',
                                                    background: n.is_read ? '#f8fafc' : '#ffffff',
                                                    borderLeft: n.is_read ? '3px solid transparent' : '3px solid #3b82f6',
                                                    boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
                                                    cursor: 'pointer', transition: 'background 0.2s'
                                                }}
                                            >
                                                <div style={{ fontSize: '14px', fontWeight: '600', color: '#0f172a', marginBottom: '2px' }}>{n.title}</div>
                                                <div style={{ fontSize: '12px', color: '#64748b', lineHeight: '1.4' }}>{n.message}</div>
                                                <div style={{ fontSize: '10px', color: '#94a3b8', marginTop: '4px', textAlign: 'right' }}>
                                                    {new Date(n.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Dark Mode Toggle */}
                    <button
                        className="icon-btn-glass"
                        onClick={() => setDarkMode(!darkMode)}
                        title={darkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
                        style={{ backgroundColor: darkMode ? '#334155' : 'white', color: darkMode ? '#fcd34d' : '#475569' }}
                    >
                        {darkMode ? (
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="5"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line><line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line></svg>
                        ) : (
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path></svg>
                        )}
                    </button>

                    <button
                        className="icon-btn-glass"
                        onClick={handleManualLocationRefresh}
                        disabled={isLocating}
                        title="My Location"
                    >
                        {isLocating ? (
                            <div className="spin" style={{ width: 18, height: 18, border: '2px solid #ccc', borderTopColor: '#333', borderRadius: '50%' }} />
                        ) : (
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <polygon points="3 11 22 2 13 21 11 13 3 11"></polygon>
                            </svg>
                        )}
                    </button>
                    {/* Menu/Stats Button */}
                    <button className="icon-btn-glass" onClick={() => setShowStats(true)}>
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="18" x2="21" y2="18"></line></svg>
                    </button>
                </div>
            </div>

            {/* Error Toast */}
            {locationError && (
                <div style={{
                    position: 'absolute', top: 90, left: '50%', transform: 'translateX(-50%)',
                    background: '#fee2e2', color: '#dc2626', padding: '10px 20px', borderRadius: '50px',
                    fontSize: '13px', fontWeight: '600', zIndex: 1200, boxShadow: '0 4px 12px rgba(220, 38, 38, 0.15)'
                }}>
                    ⚠️ {locationError}
                </div>
            )}

            {/* Stats & History Panel (Premium Activity Hub) */}
            <AnimatePresence>
                {showStats && (
                    <div className="stats-panel-overlay" onClick={() => setShowStats(false)}>
                        <motion.div
                            className="stats-panel"
                            onClick={e => e.stopPropagation()}
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                        >
                            {/* Hub Header */}
                            <div className="stats-header">
                                <div className="header-branding">
                                    <div className="brand-logo">
                                        <Star size={24} fill="currentColor" />
                                    </div>
                                    <div className="brand-text">
                                        <h2>Activity Hub</h2>
                                        <p>Your performance & insights</p>
                                    </div>
                                </div>

                                {/* Tab Switcher */}
                                <div className="tab-switcher">
                                    <button
                                        className={`tab-btn ${activeTab === 'insights' ? 'active' : ''}`}
                                        onClick={() => setActiveTab('insights')}
                                    >
                                        Insights
                                    </button>
                                    <button
                                        className={`tab-btn ${activeTab === 'history' ? 'active' : ''}`}
                                        onClick={() => setActiveTab('history')}
                                    >
                                        History
                                    </button>
                                    <div className={`tab-indicator ${activeTab}`} />
                                </div>

                                <button className="close-btn-glass" onClick={() => setShowStats(false)}>
                                    <X size={20} />
                                </button>
                            </div>

                            <div className="activity-body">
                                <AnimatePresence mode="wait">
                                    {activeTab === 'insights' ? (
                                        <motion.div
                                            key="insights"
                                            initial={{ opacity: 0, y: 20 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, y: -20 }}
                                            transition={{ duration: 0.2 }}
                                        >
                                            <div className="insights-grid">
                                                {/* Primary Earning Card */}
                                                <div className="premium-card main-earning">
                                                    <div className="card-bg-glow" />
                                                    <div className="card-content">
                                                        <span className="label">Today's Revenue</span>
                                                        <div className="value">Rs. {stats.today?.total_earnings || 0}</div>
                                                        <div className="sub-value">
                                                            <span className="pill green">{stats.today?.total_rides || 0} Trips</span>
                                                            <span className="trend">Successfully delivered</span>
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Weekly & Lifetime Stats */}
                                                <div className="premium-stats-group">
                                                    <div className="mini-card">
                                                        <span className="mini-label">Weekly Earnings</span>
                                                        <div className="mini-value">Rs. {stats.weekly_earnings || 0}</div>
                                                        <div className="mini-footer">7-day period</div>
                                                    </div>
                                                    <div className="mini-card">
                                                        <span className="mini-label">Lifetime Total</span>
                                                        <div className="mini-value">Rs. {stats.lifetime?.total_earnings || 0}</div>
                                                        <div className="mini-footer">{stats.lifetime?.total_rides || 0} Trips total</div>
                                                    </div>
                                                </div>

                                                {/* Rating & Acceptance */}
                                                <div className="performance-row">
                                                    <div className="perf-metric">
                                                        <div className="metric-icon star"><Star size={20} fill="currentColor" /></div>
                                                        <div className="metric-info">
                                                            <span className="m-label">Rider Rating</span>
                                                            <div className="m-value">{stats.rating || '0.0'}</div>
                                                        </div>
                                                    </div>
                                                    <div className="perf-metric">
                                                        <div className="metric-icon acceptance"><Shield size={20} /></div>
                                                        <div className="metric-info">
                                                            <span className="m-label">Acceptance Rate</span>
                                                            <div className="m-value">98.5%</div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="performance-chart-mock">
                                                <div className="chart-header">
                                                    <h3>Earnings Analysis</h3>
                                                    <span>Live Sync</span>
                                                </div>
                                                <div className="mock-bars">
                                                    {[40, 70, 45, 90, 65, 80, 55].map((h, i) => (
                                                        <div key={i} className="bar-col">
                                                            <div className="bar" style={{ height: `${h}%` }} />
                                                            <span className="day-label">{['M', 'T', 'W', 'T', 'F', 'S', 'S'][i]}</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        </motion.div>
                                    ) : (
                                        <motion.div
                                            key="history"
                                            initial={{ opacity: 0, y: 20 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, y: -20 }}
                                            transition={{ duration: 0.2 }}
                                            className="history-tab-content"
                                        >
                                            <div className="history-header">
                                                <h3>Transaction Logs</h3>
                                                <button className="export-btn">Download CSV</button>
                                            </div>

                                            <div className="premium-table-wrapper">
                                                <table className="premium-table">
                                                    <thead>
                                                        <tr>
                                                            <th>Trip Details</th>
                                                            <th>Distance</th>
                                                            <th>Fare</th>
                                                            <th>Status</th>
                                                            <th>Timestamp</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {history.length === 0 ? (
                                                            <tr>
                                                                <td colSpan="5" className="empty-state">
                                                                    <AlertCircle size={40} />
                                                                    <p>No trip records found in this account.</p>
                                                                </td>
                                                            </tr>
                                                        ) : (
                                                            history.map(trip => (
                                                                <tr key={trip.id}>
                                                                    <td className="route-cell">
                                                                        <div className="trip-id-tag">#{trip.id}</div>
                                                                        <div className="route-paths">
                                                                            <div className="path from">{trip.pickup_location.split(',')[0]}</div>
                                                                            <div className="path to">to {trip.dropoff_location ? trip.dropoff_location.split(',')[0] : 'Destination'}</div>
                                                                        </div>
                                                                    </td>
                                                                    <td>{trip.distance_km || '2.4'} km</td>
                                                                    <td className="fare-cell">Rs. {trip.estimated_fare}</td>
                                                                    <td><span className={`status-tag ${trip.status}`}>{trip.status}</span></td>
                                                                    <td className="date-cell">
                                                                        {trip.time_formatted || new Date(trip.requested_at).toLocaleTimeString()}
                                                                    </td>
                                                                </tr>
                                                            ))
                                                        )}
                                                    </tbody>
                                                </table>
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Full Screen Map */}
            <div className={`map-container ${darkMode ? 'dark-tiles' : ''}`}>
                <MapContainer
                    center={riderLocation || [6.9271, 79.8612]} // Colombo Default
                    zoom={mapZoom}
                    style={{ height: '100%', width: '100%', background: darkMode ? '#111' : '#ddd' }}
                    zoomControl={false}
                >
                    <TileLayer
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    />
                    <MapUpdater center={riderLocation} zoom={mapZoom} />

                    {/* Rider's Location - Draggable */}
                    <Marker
                        position={[riderLocation.lat, riderLocation.lng]}
                        icon={getVehicleIcon(partnerData?.vehicle_type || partnerData?.type)}
                        title={partnerData?.name || 'Me'}
                        eventHandlers={{
                            dragend: async (e) => {
                                const position = e.target.getLatLng();
                                const newLoc = { lat: position.lat, lng: position.lng };
                                setRiderLocation(newLoc);
                                setIsManualMode(true); // Locks location so watchPosition won't revert it
                                console.log('📍 Location manually corrected (Locked):', newLoc);

                                // Persist immediately for better reliability
                                if (partnerData?.id) {
                                    try {
                                        await fetch(`http://localhost:5000/api/riders/${partnerData.id}/location`, {
                                            method: 'POST',
                                            headers: { 'Content-Type': 'application/json' },
                                            body: JSON.stringify({
                                                lat: newLoc.lat,
                                                lng: newLoc.lng,
                                                is_online: isOnline,
                                                is_available: isAvailable
                                            })
                                        });
                                    } catch (err) {
                                        console.error('Failed to persist manual location:', err);
                                    }
                                }
                            }
                        }}
                    >
                        <Popup className="custom-popup">
                            <strong>You</strong>
                        </Popup>
                    </Marker>

                    {/* Online Radius */}
                    {isOnline && (
                        <Circle
                            center={[riderLocation.lat, riderLocation.lng]}
                            radius={radius * 1000}
                            pathOptions={{ color: '#00C853', fillColor: '#00C853', fillOpacity: 0.08, weight: 1 }}
                        />
                    )}

                    {/* Request Markers */}
                    {rideRequests.map(request => (
                        <Marker
                            key={request.id}
                            position={[request.pickup_lat, request.pickup_lng]}
                            icon={requestIcon}
                        >
                            <Popup>
                                <div style={{ fontSize: '13px' }}>
                                    <strong>Pickup Passenger</strong><br />
                                    {request.pickup_location}<br />
                                    <span style={{ color: '#64748b' }}>{request.distance_from_you} km away</span>
                                </div>
                            </Popup>
                        </Marker>
                    ))}

                    {/* Route Polyline - Pickup Phase (Blue) */}
                    {acceptedRide && acceptedRide.status === 'accepted' && routeCoordinates.length > 0 && (
                        <Polyline
                            positions={routeCoordinates}
                            pathOptions={{ color: '#3b82f6', weight: 4, opacity: 0.7 }}
                        />
                    )}

                    {/* Route Polyline - Dropoff Phase (Green) */}
                    {acceptedRide && acceptedRide.status === 'picked_up' && routeCoordinates.length > 0 && (
                        <Polyline
                            positions={routeCoordinates}
                            pathOptions={{ color: '#10b981', weight: 4, opacity: 0.7 }}
                        />
                    )}

                    {/* Pickup Location Marker */}
                    {acceptedRide && acceptedRide.status === 'accepted' && (
                        <Marker
                            position={[acceptedRide.pickup_lat, acceptedRide.pickup_lng]}
                            icon={L.icon({
                                iconUrl: 'https://cdn-icons-png.flaticon.com/512/684/684908.png',
                                iconSize: [40, 40],
                                iconAnchor: [20, 40]
                            })}
                        >
                            <Popup>
                                <strong>Pickup Location</strong><br />
                                {acceptedRide.pickup_location}
                            </Popup>
                        </Marker>
                    )}

                    {/* Dropoff Location Marker */}
                    {acceptedRide && (acceptedRide.status === 'arrived' || acceptedRide.status === 'picked_up') && (
                        <Marker
                            position={[acceptedRide.dropoff_lat, acceptedRide.dropoff_lng]}
                            icon={L.icon({
                                iconUrl: 'https://cdn-icons-png.flaticon.com/512/684/684809.png',
                                iconSize: [40, 40],
                                iconAnchor: [20, 40]
                            })}
                        >
                            <Popup>
                                <strong>Dropoff Location</strong><br />
                                {acceptedRide.dropoff_location}
                            </Popup>
                        </Marker>
                    )}
                </MapContainer>
            </div>

            {/* Bottom Floating Action Button for Online/Offline */}
            {!acceptedRide && (
                <div className="rider-bottom-overlay">
                    <button
                        className={`go-online-btn ${isOnline ? 'is-online' : ''}`}
                        onClick={toggleOnline}
                    >
                        {isOnline ? (
                            <>
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><rect x="6" y="4" width="4" height="16"></rect><rect x="14" y="4" width="4" height="16"></rect></svg>
                                GO OFFLINE
                            </>
                        ) : (
                            <>
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon></svg>
                                GO ONLINE
                            </>
                        )}
                    </button>
                </div>
            )}

            {/* Hidden Audio Element for Unlocking */}
            <audio ref={audioUnlockRef} src="/rider_alert.mp3" muted />

            {/* Notification Toast */}
            <AnimatePresence>
                {toastMessage && (
                    <div style={{
                        position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
                        zIndex: 2000, pointerEvents: 'none', width: '100%', display: 'flex', justifyContent: 'center'
                    }}>
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9, y: 10 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 10 }}
                            style={{
                                background: toastMessage.type === 'success' ? 'rgba(16, 185, 129, 0.95)' : 'rgba(0,0,0,0.85)',
                                color: 'white', padding: '16px 24px',
                                borderRadius: '16px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 10,
                                boxShadow: '0 10px 30px rgba(0,0,0,0.3)', backdropFilter: 'blur(8px)'
                            }}
                        >
                            {toastMessage.type === 'success' ? <Shield size={20} color="white" /> : <AlertCircle size={20} color="#F87171" />}
                            {toastMessage.text}
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Modern Ride Request Popup */}
            {currentRequest && (
                <div
                    className="ride-request-overlay"
                    onClick={(e) => {
                        console.log('🔵 Overlay clicked');
                        // Don't close on overlay click - only on decline
                    }}
                >
                    <div
                        className="ride-request-card alert-mode"
                        onClick={(e) => {
                            e.stopPropagation();
                            console.log('🟡 Card clicked (should not close)');
                        }}
                    >
                        <div className="request-header-modern">
                            <div className="request-title-row">
                                <span className="request-badge">NEW RIDE</span>
                                <div className="request-timer">
                                    <RideRequestTimer onDecline={() => handleDecline(currentRequest.id)} />
                                </div>
                            </div>

                            <div className="passenger-hero">
                                <div className="passenger-avatar-ring">
                                    <div className="passenger-initial">
                                        {currentRequest.passenger_name?.charAt(0) || 'U'}
                                    </div>
                                </div>
                                <div className="passenger-main-info">
                                    <div className="passenger-name-premium">{currentRequest.passenger_name || 'Anonymous User'}</div>
                                    <div className="passenger-rating-row">
                                        <Star size={14} fill="#fbbf24" color="#fbbf24" />
                                        <span>4.9 • Verified Passenger</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="request-body">
                            <div className="location-timeline">
                                <div className="timeline-point">
                                    <div className="point-dot pickup" />
                                    <div className="point-label">Pick-up</div>
                                    <div className="point-address">{currentRequest.pickup_location}</div>
                                </div>
                                <div className="timeline-point">
                                    <div className="point-dot dropff" />
                                    <div className="point-label">Drop-off</div>
                                    <div className="point-address">{currentRequest.dropoff_location || 'Not Specified'}</div>
                                </div>
                            </div>

                            <div className="fare-distance-box">
                                <div className="info-item">
                                    <div className="info-label">Distance</div>
                                    <div className="info-val">{currentRequest.distance_from_you} km</div>
                                </div>
                                <div className="info-item highlight">
                                    <div className="info-label">Est. Fare</div>
                                    <div className="info-val">Rs. {currentRequest.estimated_fare}</div>
                                    <div className="payment-method-tag">CASH PAYMENT</div>
                                </div>
                            </div>

                            <div className="modal-actions-v2">
                                <button
                                    className="action-btn-v2 decline-btn"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        console.log('🔴 Decline button clicked!');
                                        handleDecline(currentRequest.id);
                                    }}
                                >
                                    <X size={18} />
                                    <span>Decline</span>
                                </button>
                                <button
                                    className="action-btn-v2 accept-btn"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        console.log('🟢 Accept button clicked!');
                                        handleAccept(currentRequest.id);
                                    }}
                                >
                                    <Shield size={18} />
                                    <span>Accept</span>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Accepted Ride Bottom Sheet */}
            {acceptedRide && (
                <div className="active-ride-sheet">
                    <div className="sheet-header">
                        <div className="passenger-info">
                            <span style={{ fontSize: '12px', color: '#64748b', fontWeight: '600', textTransform: 'uppercase' }}>Current Passenger</span>
                            <h3>{acceptedRide.passenger_name}</h3>
                            <div className="passenger-rating">
                                ⭐ 4.9 • 150+ rides
                            </div>
                        </div>
                        <button className="call-btn" title="Call Passenger">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path></svg>
                        </button>
                    </div>

                    {/* Trip Progress Indicator */}
                    <div className="trip-progress-bar">
                        <div className={`progress-step ${acceptedRide.status === 'accepted' ? 'active' : 'completed'}`}>
                            <div className="step-icon">📍</div>
                            <span>Heading to Pickup</span>
                        </div>
                        <div className={`progress-step ${acceptedRide.status === 'arrived' ? 'active' : acceptedRide.status === 'picked_up' ? 'completed' : ''}`}>
                            <div className="step-icon">🚗</div>
                            <span>Arrived</span>
                        </div>
                        <div className={`progress-step ${acceptedRide.status === 'picked_up' ? 'active' : ''}`}>
                            <div className="step-icon">👤</div>
                            <span>In Transit</span>
                        </div>
                    </div>

                    <div className="location-timeline">
                        <div className="timeline-point">
                            <div className="point-dot pickup" />
                            <div className="point-address" style={{ fontSize: '14px' }}>{acceptedRide.pickup_location}</div>
                        </div>
                        <div className="timeline-point">
                            <div className="point-dot dropff" />
                            <div className="point-address" style={{ fontSize: '14px' }}>{acceptedRide.dropoff_location}</div>
                        </div>
                    </div>

                    {/* Dynamic Action Button based on ride status */}
                    {acceptedRide.status === 'accepted' && (
                        <SlideToStart
                            onComplete={handleArrivedAtPickup}
                            text="SLIDE TO CONFIRM ARRIVAL"
                        />
                    )}

                    {acceptedRide.status === 'arrived' && (
                        <SlideToStart
                            onComplete={handleStartTrip}
                            text="SLIDE TO START TRIP"
                        />
                    )}

                    {acceptedRide.status === 'picked_up' && (
                        <SlideToStart
                            onComplete={async () => {
                                try {
                                    const res = await fetch(`http://localhost:5000/api/riders/${partnerData.id}/requests/${acceptedRide.id}/complete`, {
                                        method: 'POST',
                                        headers: { 'Content-Type': 'application/json' }
                                    });
                                    const data = await res.json();
                                    if (data.success) {
                                        setAcceptedRide(null);
                                        setIsAvailable(true);
                                        setRouteCoordinates([]);
                                        setToastMessage({ text: 'Ride completed! Earnings added.', type: 'success' });
                                        setTimeout(() => setToastMessage(null), 3000);
                                    } else {
                                        alert('Failed to complete ride: ' + (data.error || 'Server error'));
                                    }
                                } catch (err) {
                                    console.error('Complete ride error:', err);
                                    alert('Network error while completing ride');
                                }
                            }}
                            text="SLIDE TO COMPLETE RIDE"
                        />
                    )}
                </div>
            )}
        </div>
    );
}

// Helper component for timer in modern card
function RideRequestTimer({ onDecline }) {
    const [timeLeft, setTimeLeft] = useState(30);

    useEffect(() => {
        let isMounted = true;
        let audioCtx = window.riderAudioContext; // Use pre-initialized context from GO ONLINE click

        const startAudio = async () => {
            // Only play audio if user has clicked GO ONLINE (which initializes the context)
            // This prevents the browser warning about AudioContext requiring user gesture
            if (!audioCtx) {
                console.log('⚠️ Audio skipped - click GO ONLINE first to enable sound alerts');
                return; // Silently skip audio
            }

            try {
                if (audioCtx.state === 'suspended') {
                    await audioCtx.resume();
                }

                console.log('🔊 Playing beep sound for ride alert');
                scheduleRing();
            } catch (e) {
                console.warn('Audio playback failed:', e);
            }
        };

        const scheduleRing = () => {
            if (!isMounted || !audioCtx) return;

            try {
                const osc = audioCtx.createOscillator();
                const gain = audioCtx.createGain();
                osc.type = 'square';
                osc.frequency.setValueAtTime(400, audioCtx.currentTime);
                osc.frequency.exponentialRampToValueAtTime(450, audioCtx.currentTime + 0.1);
                gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
                gain.gain.linearRampToValueAtTime(0, audioCtx.currentTime + 0.4);

                osc.connect(gain);
                gain.connect(audioCtx.destination);
                osc.start();
                osc.stop(audioCtx.currentTime + 0.4);

                setTimeout(() => {
                    if (isMounted) scheduleRing();
                }, 2000);
            } catch (e) {
                console.warn('Beep playback failed:', e);
            }
        };

        startAudio();

        const timer = setInterval(() => {
            setTimeLeft(prev => {
                if (prev <= 1) {
                    clearInterval(timer);
                    if (isMounted) {
                        console.log('⏰ Timer expired, calling onDecline');
                        onDecline();
                    }
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => {
            isMounted = false;
            clearInterval(timer);
            // Don't close the global audio context - it's shared across all ride requests
        };
    }, [onDecline]);

    return (
        <span className="timer-text-modern">{timeLeft}s</span>
    );
}
