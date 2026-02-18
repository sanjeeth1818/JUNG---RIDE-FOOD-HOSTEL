import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUser } from '../../context/UserContext';
import {
    ArrowLeft, MapPin, Navigation, Car, Bike,
    Smartphone, Search, X, Loader2, Phone,
    ShieldCheck, Star, Clock, ChevronRight,
    LocateFixed, CheckCircle2, AlertCircle, History as HistoryIcon,
    ClipboardList
} from 'lucide-react';
import { MapContainer, TileLayer, Marker, Popup, useMap, Circle, useMapEvents, Polyline } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { motion, AnimatePresence } from 'framer-motion';
import TripHistoryCard from '../../components/common/TripHistoryCard';
import DateRangePicker from '../../components/common/DateRangePicker';

// --- PREMIUM ASSETS & CONFIG ---

// Helper to get absolute icon URL
const getIconUrl = (filename) => `${window.location.origin}/${filename}`;

// Custom Vehicle Icons (PNG)
const bikeIcon = L.icon({
    iconUrl: getIconUrl('bike.png'),
    iconSize: [40, 40],
    iconAnchor: [20, 20],
    popupAnchor: [0, -20],
    className: 'vehicle-marker'
});

const carIcon = L.icon({
    iconUrl: getIconUrl('car.png'),
    iconSize: [45, 45],
    iconAnchor: [22, 22],
    popupAnchor: [0, -22],
    className: 'vehicle-marker'
});

const tukIcon = L.icon({
    iconUrl: getIconUrl('tuktuk.png'),
    iconSize: [45, 45],
    iconAnchor: [22, 22],
    popupAnchor: [0, -22],
    className: 'vehicle-marker'
});

const vanIcon = L.icon({
    iconUrl: getIconUrl('van.png'),
    iconSize: [55, 35],
    iconAnchor: [27, 17],
    popupAnchor: [0, -17],
    className: 'vehicle-marker'
});

const getVehicleIcon = (type) => {
    if (!type) return bikeIcon; // Fallback
    const lowerType = String(type).toLowerCase();
    if (lowerType.includes('bike')) return bikeIcon;
    if (lowerType.includes('van')) return vanIcon;
    if (lowerType.includes('car')) return carIcon;
    if (lowerType.includes('tuk')) return tukIcon;
    return bikeIcon;
};

// Google Maps Style Blue Dot
const userLocationIcon = L.divIcon({
    html: `<div class="blue-dot-container">
            <div class="blue-dot-pulse"></div>
            <div class="blue-dot-inner"></div>
          </div>`,
    className: 'user-marker',
    iconSize: [24, 24],
    iconAnchor: [12, 12],
});

const MAP_TILES = "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png";

// --- HELPERS ---

function MapUpdater({ pickup, dropoff, driver, zoomLevel = 15 }) {
    const map = useMap();
    useEffect(() => {
        if (driver && pickup) {
            // Focus on driver and pickup point
            const bounds = L.latLngBounds([driver.lat, driver.lng], [pickup.lat, pickup.lng]);
            map.fitBounds(bounds, { padding: [100, 100], duration: 1.5 });
        } else if (pickup && dropoff) {
            const bounds = L.latLngBounds([pickup.lat, pickup.lng], [dropoff.lat, dropoff.lng]);
            map.fitBounds(bounds, { padding: [100, 100], duration: 1.5 });
        } else if (pickup) {
            map.flyTo([pickup.lat, pickup.lng], zoomLevel, { animate: true, duration: 1.0 });
        }
    }, [pickup, dropoff, driver, map, zoomLevel]);
    return null;
}

function MapClickHandler({ onMapClick, isSelecting }) {
    useMapEvents({
        click(e) {
            if (isSelecting) {
                onMapClick(e.latlng);
            }
        },
    });
    return null;
}

const RideHome = () => {
    const navigate = useNavigate();
    const { user, location: userLocation } = useUser();

    // Core state
    const [pickup, setPickup] = useState(null);
    const [dropoff, setDropoff] = useState(null);
    const [nearbyRiders, setNearbyRiders] = useState([]);
    const [selectedVehicle, setSelectedVehicle] = useState('Tuk');
    const [rideStatus, setRideStatus] = useState('idle'); // idle, selection, requesting, active
    const [activeRide, setActiveRide] = useState(null);

    // UI state
    const [bookingStep, setBookingStep] = useState('pickup'); // 'pickup', 'dropoff', 'review', 'selection'
    const [showSuggestions, setShowSuggestions] = useState(null); // 'pickup' or 'dropoff' or null
    const [mapSelectionMode, setMapSelectionMode] = useState(null); // 'pickup' or 'dropoff' or null
    const [pickupQuery, setPickupQuery] = useState('');
    const [dropoffQuery, setDropoffQuery] = useState('');
    const [distance, setDistance] = useState(0);
    const [isCalculatingRoute, setIsCalculatingRoute] = useState(false);
    const [routeCoordinates, setRouteCoordinates] = useState([]);
    const [searchTimer, setSearchTimer] = useState(60);
    const [driverRoute, setDriverRoute] = useState([]); // Route from driver to pickup
    const [rebookMessage, setRebookMessage] = useState(null);
    const [rateDriverModal, setRateDriverModal] = useState(false);
    const [rating, setRating] = useState(0);
    const [comment, setComment] = useState('');
    const [isSearchingIntent, setIsSearchingIntent] = useState(false);
    const [apiSuggestions, setApiSuggestions] = useState([]);
    const [isSearchingLocation, setIsSearchingLocation] = useState(false);
    const [driverETA, setDriverETA] = useState(null); // Estimated time in minutes
    const dismissedRideIdRef = useRef(null); // Track locally dismissed ride
    const timerRef = useRef(null);
    const rideStatusRef = useRef(rideStatus);

    // Trip History State
    const [showTripHistory, setShowTripHistory] = useState(false);
    const [tripHistory, setTripHistory] = useState([]);
    const [filterStartDate, setFilterStartDate] = useState(null);
    const [filterEndDate, setFilterEndDate] = useState(null);
    const [isLoadingHistory, setIsLoadingHistory] = useState(false);

    // Keep ref in sync for race checks
    useEffect(() => {
        rideStatusRef.current = rideStatus;
        // AUTO-CLEANUP TIMER: If we are no longer searching, kill any active timer
        if (rideStatus !== 'requesting' && timerRef.current) {
            console.log(`🛡️ Ride Status changed to ${rideStatus}: Clearing search timer`);
            clearInterval(timerRef.current);
            timerRef.current = null;
        }
    }, [rideStatus]);

    const [vehicleTypes, setVehicleTypes] = useState([]);

    const fetchVehicleConfig = async () => {
        try {
            const res = await fetch('http://localhost:5000/api/config/vehicle-types');
            const data = await res.json();
            if (Array.isArray(data)) {
                // Map database fields to the UI structure if needed, or use as is
                setVehicleTypes(data.map(v => ({
                    type: v.vehicle_type,
                    name: v.name,
                    base: parseFloat(v.base_rate),
                    perKm: parseFloat(v.per_km_rate),
                    icon: v.icon,
                    color: v.color,
                    eta: v.eta_default
                })));
                if (data.length > 0) setSelectedVehicle(data[0].vehicle_type);
            }
        } catch (err) {
            console.error('Failed to fetch vehicle config:', err);
            // Fallback to minimal hardcoded if API fails
            setVehicleTypes([
                { type: 'Tuk', name: 'Premium Tuk', base: 120, perKm: 60, icon: '🛺', color: '#10B981', eta: '2 mins' },
                { type: 'Bike', name: 'Flash Bike', base: 80, perKm: 40, icon: '🏍️', color: '#3B82F6', eta: '1 min' },
            ]);
        }
    };

    const popularPlaces = [
        { label: 'University of Moratuwa', sub: 'Katubedda, Moratuwa', lat: 6.7951, lng: 79.9009 },
        { label: 'Galle Face Green', sub: 'Colombo 03', lat: 6.9271, lng: 79.8431 },
        { label: 'Majestic City', sub: 'Bambalapitiya', lat: 6.8939, lng: 79.8547 },
        { label: 'One Galle Face', sub: 'Colombo 02', lat: 6.9275, lng: 79.8455 },
        { label: 'Liberty Plaza', sub: 'Kollupitiya', lat: 6.9110, lng: 79.8510 }
    ];

    // Helper: Haversine distance
    const calculateDistance = (p1, p2) => {
        const R = 6371; // km
        const dLat = (p2.lat - p1.lat) * Math.PI / 180;
        const dLon = (p2.lng - p1.lng) * Math.PI / 180;
        const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(p1.lat * Math.PI / 180) * Math.cos(p2.lat * Math.PI / 180) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return parseFloat((R * c).toFixed(1));
    };

    // Helper: Fetch road route from OSRM
    const fetchRoadRoute = async (p1, p2, type = 'trip') => {
        try {
            const url = `https://router.project-osrm.org/route/v1/driving/${p1.lng},${p1.lat};${p2.lng},${p2.lat}?overview=full&geometries=geojson`;
            const res = await fetch(url);
            const data = await res.json();

            if (data.routes && data.routes.length > 0) {
                const route = data.routes[0];
                const coords = route.geometry.coordinates.map(coord => [coord[1], coord[0]]);
                if (type === 'trip') {
                    setRouteCoordinates(coords);
                    setDistance(parseFloat((route.distance / 1000).toFixed(1)));
                } else {
                    setDriverRoute(coords);
                }
            }
        } catch (err) {
            console.error('OSRM Routing failed:', err);
            // Fallback to straight line
            if (type === 'trip') {
                setRouteCoordinates([[p1.lat, p1.lng], [p2.lat, p2.lng]]);
                setDistance(calculateDistance(p1, p2));
            } else {
                setDriverRoute([[p1.lat, p1.lng], [p2.lat, p2.lng]]);
            }
        } finally {
            if (type === 'trip') setIsCalculatingRoute(false);
        }
    };

    useEffect(() => {
        if (pickup && dropoff && bookingStep === 'review') {
            setIsCalculatingRoute(true);
            setDistance(0);
            setRouteCoordinates([]);
            fetchRoadRoute(pickup, dropoff);
        }
    }, [pickup, dropoff, bookingStep]);

    // Helper: Reverse geocoding (coordinates to location name)
    const reverseGeocode = async (lat, lng) => {
        try {
            const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&addressdetails=1`;
            const res = await fetch(url);
            const data = await res.json();

            if (data && data.display_name) {
                // Extract meaningful location name
                const address = data.address || {};
                let label = address.road || address.neighbourhood || address.suburb ||
                    address.city || address.town || address.village ||
                    data.display_name.split(',')[0];

                const sub = [address.suburb, address.city, address.state]
                    .filter(Boolean)
                    .join(', ');

                return {
                    label: label,
                    sub: sub || data.display_name.split(',').slice(1, 3).join(',').trim(),
                    lat: lat,
                    lng: lng
                };
            }
        } catch (err) {
            console.error('Reverse geocoding failed:', err);
        }

        // Fallback to generic name
        return {
            label: 'Pinned Location',
            sub: `${lat.toFixed(5)}, ${lng.toFixed(5)}`,
            lat: lat,
            lng: lng
        };
    };

    // Debounced search
    const fetchLocationSuggestions = async (query, signal) => {
        if (!query || query.trim().length === 0) return;
        setIsSearchingLocation(true);
        try {
            // Use current coordinates for local biasing
            const biasLat = pickup?.lat || userLocation?.coords?.lat;
            const biasLng = pickup?.lng || userLocation?.coords?.lng;

            // Restrict to SL (countrycodes=lk) and use viewbox biasing if available
            let url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=5&addressdetails=1&countrycodes=lk`;

            if (biasLat && biasLng) {
                // Biasing window (+/- 0.5 deg ~ 55km)
                const v = {
                    minLng: biasLng - 0.5,
                    maxLat: biasLat + 0.5,
                    maxLng: biasLng + 0.5,
                    minLat: biasLat - 0.5
                };
                url += `&viewbox=${v.minLng},${v.maxLat},${v.maxLng},${v.minLat}&bounded=0`;
            }

            const res = await fetch(url, { signal });
            const data = await res.json();
            const formatted = data.map(item => ({
                label: item.display_name.split(',')[0],
                sub: item.display_name.split(',').slice(1).join(',').trim(),
                lat: parseFloat(item.lat),
                lng: parseFloat(item.lon)
            }));
            setApiSuggestions(formatted);
        } catch (err) {
            if (err.name === 'AbortError') {
                console.log('🔍 Geocoding request aborted (new search started)');
            } else {
                console.error('Geocoding search failed:', err);
            }
        } finally {
            setIsSearchingLocation(false);
        }
    };

    // Debounced search effect
    useEffect(() => {
        const query = showSuggestions === 'pickup' ? pickupQuery : (showSuggestions === 'dropoff' ? dropoffQuery : null);
        if (!query || query === 'Current Location' || query === 'Pinned Location' || query === 'Pinned Destination') {
            setApiSuggestions([]);
            return;
        }

        const controller = new AbortController();
        const handler = setTimeout(() => {
            fetchLocationSuggestions(query, controller.signal);
        }, 300); // Faster 300ms debounce

        return () => {
            clearTimeout(handler);
            controller.abort();
        };
    }, [pickupQuery, dropoffQuery, showSuggestions]);

    // --- EFFECTS ---

    useEffect(() => {
        getCurrentLocation();
        checkActiveRide();
        fetchVehicleConfig();
    }, []);

    const pollData = useCallback((signal) => {
        if (pickup?.lat) fetchNearbyRiders(signal);
        if (user?.id) checkActiveRide(signal);
    }, [pickup, user?.id]);

    useEffect(() => {
        const controller = new AbortController();
        const interval = setInterval(() => pollData(controller.signal), 5000);

        // Initial poll with signal
        pollData(controller.signal);

        return () => {
            clearInterval(interval);
            controller.abort();
        };
    }, [pollData]);

    // Cleanup timer on unmount
    useEffect(() => {
        return () => {
            if (timerRef.current) clearInterval(timerRef.current);
        };
    }, []);

    // --- ACTIONS ---

    const getCurrentLocation = () => {
        // 1. Immediate fallback to context/saved location
        if (userLocation?.coords?.lat && userLocation?.coords?.lng) {
            const loc = {
                lat: userLocation.coords.lat,
                lng: userLocation.coords.lng,
                label: userLocation.name || 'Saved Location'
            };
            setPickup(loc);
            setPickupQuery(loc.label);
            // Stay in pickup step to let user click "Next"
            console.log('📍 Initialized with Saved Location');
        }

        if (!navigator.geolocation) return;

        // 2. Try to get precise location (GPS)
        navigator.geolocation.getCurrentPosition(
            (pos) => {
                const newLoc = { lat: pos.coords.latitude, lng: pos.coords.longitude, label: 'Current Location' };
                setPickup(newLoc);
                setPickupQuery('Current Location');
                // Stay in pickup step to let user click "Next"
            },
            (err) => {
                console.warn('Geolocation access denied or failed:', err.message);
                if (!(userLocation?.coords?.lat && userLocation?.coords?.lng)) {
                    const defaultLoc = { lat: 6.9271, lng: 79.8612, label: 'Colombo, Sri Lanka' };
                    setPickup(defaultLoc);
                    setPickupQuery('Colombo, Sri Lanka');
                    // Stay in pickup step
                }
            }
        );
    };

    const fetchNearbyRiders = async (signal) => {
        try {
            const res = await fetch(`http://localhost:5000/api/riders/nearby?lat=${pickup.lat}&lng=${pickup.lng}&radius=10`, { signal });
            if (res.ok) {
                const data = await res.json();
                // Ensure data is an array before setting state
                setNearbyRiders(Array.isArray(data) ? data : []);
            } else {
                console.warn('Failed to fetch nearby riders:', res.status);
            }
        } catch (err) {
            if (err.name === 'AbortError') return; // Silent ignore
            console.error('Nearby riders fetch failed:', err);
            setNearbyRiders([]); // Fallback to empty array
        }
    };

    const checkActiveRide = async (signal) => {
        if (!user?.id || rideStatus === 'requesting') return;
        try {
            const res = await fetch(`http://localhost:5000/api/ride-requests/active/${user.id}`, { signal });
            if (res.ok) {
                const data = await res.json();

                // If NO ride found on server
                if (!data) {
                    // Only reset if we were previously in an active state and not already showing completion
                    if ((rideStatus === 'requesting' || rideStatus === 'active') && rideStatus !== 'completed') {
                        console.log("🔄 No active ride on server, resetting to idle...");
                        setRideStatus('idle');
                        setActiveRide(null);
                        setBookingStep(pickup && dropoff ? 'selection' : 'pickup');
                    }
                    return;
                }

                // If ride FOUND, check if it's dismissed
                const isDismissed = data.id === dismissedRideIdRef.current ||
                    localStorage.getItem(`dismissed_ride_${data.id}`) === 'true';

                if (isDismissed) {
                    if (rideStatus !== 'idle') {
                        setRideStatus('idle');
                        setActiveRide(null);
                    }
                    return;
                }

                // STATUS HANDLING
                if (data.status === 'pending') {
                    // ONLY show "Searching" if user explicitly has the intent to search
                    // Or if it's an extremely fresh ride (less than 10s old) - usually from a page refresh
                    const ageSeconds = (new Date() - new Date(data.requested_at)) / 1000;
                    const isNewFreshRequest = ageSeconds < 10;

                    if (isSearchingIntent || isNewFreshRequest) {
                        setActiveRide(data);
                        setRideStatus('requesting');
                        setBookingStep('searching');
                    } else {
                        // Backend has a pending ride we don't want to see right now
                        // Auto-cleanup stale zombie rides from server
                        if (ageSeconds > 15) {
                            console.log(`🧹 Auto-cleaning zombie ride ${data.id} from server...`);
                            fetch(`http://localhost:5000/api/ride-requests/${data.id}`, { method: 'DELETE' })
                                .catch(() => { });
                        } else {
                            console.log("🙈 Ignoring server 'pending' ride due to lack of local searching intent");
                        }
                    }
                } else if (data.status === 'accepted' || data.status === 'active' || data.status === 'enroute' || data.status === 'arrived' || data.status === 'picked_up') {
                    // Drivers found/active MUST always be shown
                    setActiveRide(data);
                    setRideStatus('active');
                    setBookingStep('searching'); // Keep UI card consistent

                    if (data.driver_lat && data.driver_lng && pickup) {
                        fetchRoadRoute({ lat: data.driver_lat, lng: data.driver_lng }, pickup, 'driver');

                        // Calculate ETA based on distance
                        const driverDist = calculateDistance(
                            { lat: data.driver_lat, lng: data.driver_lng },
                            pickup
                        );
                        // Assume average speed: 30 km/h in city traffic
                        const etaMinutes = Math.ceil((driverDist / 30) * 60);
                        setDriverETA(etaMinutes);
                    }
                } else if (data.status === 'completed' || data.status === 'dropped_off') {
                    console.log("🏁 Ride completed! Showing modal.");
                    setActiveRide(data);
                    setRideStatus('completed');
                    setRateDriverModal(true);
                    setBookingStep('completed');
                }

                // If we found ANY non-pending ride (accepted, active, completed), kill the timer
                if (data.status !== 'pending' && timerRef.current) {
                    console.log(`🛡️ Found ${data.status} ride: Killing background search timer`);
                    clearInterval(timerRef.current);
                    timerRef.current = null;
                }
            }
        } catch (err) {
            if (err.name === 'AbortError') return; // Silent ignore
            console.error('Active ride check failed:', err);
        }
    };

    const handleMapClick = async (latlng) => {
        if (mapSelectionMode === 'pickup') {
            // Show temporary placeholder while fetching
            setPickup({ ...latlng, label: 'Fetching location...' });
            setPickupQuery('Fetching location...');

            // Fetch real location name
            const location = await reverseGeocode(latlng.lat, latlng.lng);
            setPickup(location);
            setPickupQuery(location.label);
            setMapSelectionMode(null);
        } else if (mapSelectionMode === 'dropoff') {
            // Show temporary placeholder while fetching
            setDropoff({ ...latlng, label: 'Fetching location...' });
            setDropoffQuery('Fetching location...');

            // Fetch real location name
            const location = await reverseGeocode(latlng.lat, latlng.lng);
            setDropoff(location);
            setDropoffQuery(location.label);
            setMapSelectionMode(null);
        }
    };

    const startSearchingTimer = () => {
        setSearchTimer(60);
        if (timerRef.current) clearInterval(timerRef.current);
        timerRef.current = setInterval(() => {
            // DEFENSIVE: If status changed globally but logic didn't catch it, stop the timer
            if (rideStatusRef.current !== 'requesting') {
                console.log("🛑 Timer interval blocked: Status is no longer 'requesting'");
                clearInterval(timerRef.current);
                timerRef.current = null;
                return;
            }

            setSearchTimer(prev => {
                if (prev <= 1) {
                    clearInterval(timerRef.current);
                    timerRef.current = null;
                    handleCancelRequest('Oops! No vehicles found\nSelect another ride and try again');
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);
    };

    const handleCancelRequest = async (msg = null, targetId = null) => {
        // 1. Clear any active timers
        if (timerRef.current) clearInterval(timerRef.current);

        // 2. Track references before state reset
        const currentRideId = targetId || activeRide?.id;
        const isPending = rideStatus === 'requesting' || activeRide?.status === 'pending';

        // 3. Mark for local dismissal (prevents persistence glitches)
        if (currentRideId) {
            dismissedRideIdRef.current = currentRideId;
            localStorage.setItem(`dismissed_ride_${currentRideId}`, 'true');
            console.log(`🚫 Locally dismissed ride: ${currentRideId}`);
        }

        // 4. Async Backend Cleanup
        if (currentRideId && isPending) {
            fetch(`http://localhost:5000/api/ride-requests/${currentRideId}`, { method: 'DELETE' })
                .then(res => {
                    if (res.ok) console.log(`✅ Backend: Cancelled ride ${currentRideId}`);
                    else console.warn(`⚠️ Backend: Failed to delete ride ${currentRideId}`);
                })
                .catch(err => console.error('❌ Backend: Cancellation error', err));
        }

        // 5. Intelligent State Reset
        setActiveRide(null);
        setRideStatus('idle');
        setSearchTimer(60);
        setIsSearchingIntent(false); // CRITICAL: Stop searching intent
        setRebookMessage(msg || (currentRideId ? 'Oops! Search cancelled\nSelect another ride and try again' : null));

        // Preserve locations if they exist to allow immediate re-selection
        const hasRoute = pickup && dropoff;
        setBookingStep(hasRoute ? 'selection' : 'pickup');

        if (!hasRoute) {
            setPickup(null);
            setDropoff(null);
            setPickupQuery('');
            setDropoffQuery('');
            setDistance(0);
            setRouteCoordinates([]);
        }
    };

    const handleRequestRide = async () => {
        if (!dropoff) return;
        if (!user?.id) return alert('Please login to book a ride');

        const veh = vehicleTypes.find(v => v.type === selectedVehicle);
        const fare = veh.base + Math.round(veh.perKm * distance);

        setRideStatus('requesting');
        setBookingStep('searching');
        setIsSearchingIntent(true); // CRITICAL: Mark search intent
        setRebookMessage(null); // Clear any rebooking guidance
        startSearchingTimer();

        try {
            const res = await fetch('http://localhost:5000/api/ride-requests', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    passenger_id: user.id,
                    pickup_location: pickup.label,
                    pickup_lat: pickup.lat,
                    pickup_lng: pickup.lng,
                    dropoff_location: dropoff.label,
                    dropoff_lat: dropoff.lat,
                    dropoff_lng: dropoff.lng,
                    vehicle_type: selectedVehicle,
                    estimated_fare: fare,
                    distance_km: distance
                })
            });
            if (!res.ok) throw new Error('Request failed');
            const data = await res.json();
            if (data.success) {
                // RACE CONDITION CHECK:
                // If the user cancelled locally (rideStatus is no longer 'requesting')
                // while this request was in flight, we must immediately dismiss the newly created ID.
                const userCancelledInFlight = rideStatusRef.current !== 'requesting';

                if (userCancelledInFlight) {
                    console.log(`⚠️ Race detected: User cancelled in-flight request. Dismissing new ride ${data.id}`);
                    handleCancelRequest(null, data.id);
                    return;
                }

                setActiveRide({ id: data.id, status: 'pending' });
            } else {
                handleCancelRequest('Failed to request ride. Please try again.');
            }
        } catch (err) {
            handleCancelRequest('Failed to connect to drivers. Please try again.');
        }
    };

    // Fetch trip history
    const fetchTripHistory = async () => {
        if (!user?.id) return;
        setIsLoadingHistory(true);
        try {
            let url = `http://localhost:5000/api/ride-requests/history/${user.id}`;
            const params = new URLSearchParams();
            if (filterStartDate) params.append('startDate', filterStartDate);
            if (filterEndDate) params.append('endDate', filterEndDate);
            if (params.toString()) url += `?${params.toString()}`;

            const res = await fetch(url);
            const data = await res.json();
            if (data.success) {
                setTripHistory(data.trips || []);
            }
        } catch (err) {
            console.error('Failed to fetch trip history:', err);
        } finally {
            setIsLoadingHistory(false);
        }
    };

    // Fetch trip history when modal opens or filters change
    useEffect(() => {
        if (showTripHistory) {
            fetchTripHistory();
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
        return () => { document.body.style.overflow = 'unset'; };
    }, [showTripHistory, filterStartDate, filterEndDate]);

    return (
        <div className="ride-v2-container">
            <style>{`
                .ride-v2-container { flex: 1; min-height: calc(100vh - 80px); width: 100%; position: relative; overflow: hidden; font-family: 'Inter', sans-serif; background: #e5e7eb; }
                .map-layer { position: absolute; top: 0; left: 0; right: 0; bottom: 0; z-index: 1; }
                
                /* Blue Dot Animation */
                .blue-dot-container { position: relative; width: 24px; height: 24px; display: flex; align-items: center; justify-content: center; }
                .blue-dot-inner { width: 12px; height: 12px; background: #4285F4; border: 2.5px solid white; border-radius: 50%; z-index: 2; box-shadow: 0 0 10px rgba(66,133,244,0.5); }
                .blue-dot-pulse { position: absolute; width: 100%; height: 100%; background: rgba(66,133,244,0.3); border-radius: 50%; z-index: 1; animation: blue-pulse 2s infinite; }
                @keyframes blue-pulse { 0% { transform: scale(0.5); opacity: 1; } 100% { transform: scale(2.5); opacity: 0; } }

                /* Floating UI Elements */
                .top-search-card { position: absolute; top: 20px; left: 16px; right: 16px; z-index: 100; max-width: 500px; margin: 0 auto; background: white; border-radius: 20px; box-shadow: 0 10px 25px rgba(0,0,0,0.1); padding: 12px; overflow: visible; }
                .bottom-action-card { position: absolute; bottom: 24px; left: 16px; right: 16px; z-index: 100; max-width: 500px; margin: 0 auto; background: white; border-radius: 28px; box-shadow: 0 -10px 30px rgba(0,0,0,0.08); padding: 20px 24px; }
                
                .search-input-group { position: relative; display: flex; flex-direction: column; gap: 8px; }
                .input-field { display: flex; align-items: center; gap: 12px; background: #f3f4f6; border-radius: 14px; padding: 10px 16px; transition: all 0.2s; border: 1.5px solid transparent; }
                .input-field:focus-within { background: white; border-color: #111827; box-shadow: 0 0 0 4px rgba(0,0,0,0.03); }
                .input-field input { border: none; background: transparent; outline: none; width: 100%; font-size: 15px; font-weight: 600; color: #1f2937; }
                
                .suggestion-box { position: absolute; top: 100%; left: 0; right: 0; background: white; border-radius: 18px; margin-top: 10px; box-shadow: 0 15px 40px rgba(0,0,0,0.15); max-height: 280px; overflow-y: auto; z-index: 110; padding: 10px 0; }
                .suggestion-item { padding: 14px 20px; display: flex; align-items: center; gap: 16px; cursor: pointer; transition: background 0.2s; }
                .suggestion-item:hover { background: #f9fafb; }
                
                .vehicle-row { display: flex; gap: 12px; margin-top: 10px; overflow-x: auto; padding: 5px 0 15px; scrollbar-width: none; }
                .vehicle-card { flex: 1; min-width: 100px; padding: 16px 10px; border-radius: 20px; border: 2px solid #f3f4f6; text-align: center; cursor: pointer; transition: all 0.2s; }
                .vehicle-card.active { border-color: #111827; background: #f9fafb; }
                .vehicle-card.active .vehicle-icon { transform: scale(1.1); }
                
                .btn-primary { width: 100%; padding: 18px; border-radius: 18px; background: #111827; color: white; font-weight: 800; border: none; cursor: pointer; font-size: 16px; box-shadow: 0 15px 30px -5px rgba(17,24,39,0.3); transition: transform 0.1s; }
                .btn-primary:active { transform: scale(0.98); }
                
                .map-select-banner { position: absolute; top: 180px; left: 50%; transform: translateX(-50%); z-index: 105; background: #111827; color: white; padding: 10px 20px; border-radius: 30px; display: flex; alignItems: center; gap: 10px; box-shadow: 0 10px 20px rgba(0,0,0,0.2); }
                
                .back-btn-v2 { width: 44px; height: 44px; border-radius: 14px; background: white; border: none; box-shadow: 0 4px 12px rgba(0,0,0,0.08); display: flex; align-items: center; justify-content: center; cursor: pointer; margin-right: 12px; }

                /* Professional Search Animation */
                .searching-container { text-align: center; padding: 20px 0; }
                .radar-pulse { position: relative; width: 120px; height: 120px; margin: 0 auto 24px; display: flex; align-items: center; justify-content: center; }
                .radar-pulse::before, .radar-pulse::after { content: ''; position: absolute; width: 100%; height: 100%; border: 2px solid #10B981; border-radius: 50%; animation: radar 2s infinite ease-out; opacity: 0; }
                .radar-pulse::after { animation-delay: 1s; }
                @keyframes radar { 0% { transform: scale(0.5); opacity: 0; } 50% { opacity: 0.5; } 100% { transform: scale(1.5); opacity: 0; } }
                .radar-inner { width: 60px; height: 60px; background: #10B981; border-radius: 50%; display: flex; align-items: center; justify-content: center; z-index: 2; box-shadow: 0 0 20px rgba(16,185,129,0.4); }
                
                .route-summary { display: flex; flex-direction: column; gap: 4px; border-left: 2px dashed #e5e7eb; padding-left: 16px; margin-left: 8px; }
                .step-dot { width: 10px; height: 10px; border-radius: 50%; flex-shrink: 0; margin-top: 5px; }

                /* Hide Scrollbar */
                .hide-scrollbar::-webkit-scrollbar { display: none; }
                .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }

                /* Trip History Card Styles */
                .trip-card { background: white; border-radius: 20px; padding: 20px; margin-bottom: 16px; box-shadow: 0 4px 12px rgba(0,0,0,0.08); transition: all 0.2s; border: 1px solid #f3f4f6; }
                .trip-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; }
                .vehicle-info { display: flex; align-items: center; gap: 10px; font-weight: 700; font-size: 16px; color: #1f2937; }
                .vehicle-icon { font-size: 24px; }
                .status-badge { padding: 6px 14px; border-radius: 20px; font-size: 11px; font-weight: 700; text-transform: uppercase; }
                .status-completed { background: #d1fae5; color: #065f46; }
                .status-cancelled { background: #fee2e2; color: #991b1b; }
                .driver-section { display: flex; align-items: center; gap: 14px; padding: 14px; background: #f9fafb; border-radius: 14px; margin-bottom: 16px; }
                .driver-avatar { width: 44px; height: 44px; border-radius: 50%; background: linear-gradient(135deg, #10B981 0%, #059669 100%); display: flex; align-items: center; justify-content: center; color: white; font-weight: 700; font-size: 18px; flex-shrink: 0; }
                .driver-avatar img { width: 100%; height: 100%; border-radius: 50%; object-fit: cover; }
                .driver-details { flex: 1; }
                .driver-name { font-weight: 700; font-size: 14px; color: #1f2937; margin-bottom: 2px; }
                .driver-phone { font-size: 12px; }
                .phone-link { color: #10B981; text-decoration: none; display: flex; align-items: center; gap: 6px; font-weight: 600; }
                .route-section { margin-bottom: 16px; }
                .route-point { display: flex; align-items: flex-start; gap: 12px; }
                .route-icon { width: 24px; height: 24px; border-radius: 50%; display: flex; align-items: center; justify-content: center; flex-shrink: 0; margin-top: 2px; }
                .pickup-icon { background: #ecfdf5; color: #10b981; }
                .dropoff-icon { background: #fef2f2; color: #ef4444; }
                .route-label { font-size: 10px; font-weight: 700; color: #9ca3af; text-transform: uppercase; margin-bottom: 2px; }
                .route-location { font-size: 13px; font-weight: 600; color: #1f2937; line-height: 1.4; }
                .route-arrow { display: flex; align-items: center; gap: 8px; margin: 4px 0 4px 36px; font-size: 11px; color: #9ca3af; font-weight: 600; }
                .trip-details { display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px; padding-top: 16px; border-top: 1px solid #f3f4f6; }
                .detail-item { display: flex; align-items: center; gap: 10px; }
                .detail-icon { width: 32px; height: 32px; border-radius: 8px; display: flex; align-items: center; justify-content: center; background: #f9fafb; color: #6b7280; }
                .detail-label { font-size: 10px; color: #9ca3af; font-weight: 700; text-transform: uppercase; }
                .detail-value { font-size: 13px; font-weight: 700; color: #1f2937; }
                .expand-btn { width: 100%; padding: 10px; margin-top: 12px; background: #f9fafb; border: none; border-radius: 12px; font-weight: 700; font-size: 12px; color: #6b7280; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 6px; transition: all 0.2s; }
                .expand-btn:hover { background: #f3f4f6; color: #111827; }
                .expanded-details { margin-top: 16px; padding-top: 16px; border-top: 1px solid #f3f4f6; }
                .expanded-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px; }
            `}</style>

            {/* Top Search Card - Dynamic based on step */}
            <div className="top-search-card">
                <div style={{ display: 'flex', alignItems: 'center', marginBottom: 12 }}>
                    <button className="back-btn-v2" onClick={() => {
                        if (bookingStep === 'review' || bookingStep === 'selection') setBookingStep('dropoff');
                        else if (bookingStep === 'dropoff') setBookingStep('pickup');
                        else navigate(-1);
                    }}><ArrowLeft size={20} /></button>
                    <span style={{ fontWeight: 800, fontSize: 18 }}>
                        {bookingStep === 'pickup' ? 'Where are you?' :
                            bookingStep === 'dropoff' ? 'Where to?' : 'Review Trip'}
                    </span>
                </div>

                {bookingStep !== 'review' && bookingStep !== 'selection' && bookingStep !== 'searching' && (
                    <div className="search-input-group">
                        {bookingStep === 'pickup' ? (
                            <div className="input-field">
                                <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#4285F4' }} />
                                <input
                                    placeholder="Confirm Pickup Point"
                                    value={pickupQuery}
                                    onChange={(e) => { setPickupQuery(e.target.value); setShowSuggestions('pickup'); }}
                                    onFocus={() => setShowSuggestions('pickup')}
                                />
                                {pickupQuery.length > 0 ? (
                                    <X size={18} color="#9ca3af" onClick={() => { setPickupQuery(''); setPickup(null); }} style={{ cursor: 'pointer' }} />
                                ) : (
                                    <Search size={18} color="#9ca3af" />
                                )}
                            </div>
                        ) : (
                            <div className="input-field">
                                <div style={{ width: 8, height: 8, background: '#111827' }} />
                                <input
                                    placeholder="Arrival Destination"
                                    value={dropoffQuery}
                                    onChange={(e) => { setDropoffQuery(e.target.value); setShowSuggestions('dropoff'); }}
                                    onFocus={() => setShowSuggestions('dropoff')}
                                />
                                <Search size={18} color="#9ca3af" />
                            </div>
                        )}
                    </div>
                )}

                {(bookingStep === 'review' || bookingStep === 'selection') && (
                    <div className="route-summary">
                        <div
                            style={{ display: 'flex', gap: 12, cursor: 'pointer', padding: '4px', borderRadius: '8px', transition: 'background 0.2s' }}
                            onClick={() => setBookingStep('pickup')}
                            onMouseEnter={(e) => e.currentTarget.style.background = '#f3f4f6'}
                            onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                        >
                            <div className="step-dot" style={{ background: '#4285F4' }} />
                            <div style={{ fontSize: 13, fontWeight: 700, color: '#1f2937' }}>{pickup?.label || 'Pickup'} (Edit)</div>
                        </div>
                        <div
                            style={{ display: 'flex', gap: 12, cursor: 'pointer', padding: '4px', borderRadius: '8px', transition: 'background 0.2s' }}
                            onClick={() => setBookingStep('dropoff')}
                            onMouseEnter={(e) => e.currentTarget.style.background = '#f3f4f6'}
                            onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                        >
                            <div className="step-dot" style={{ background: '#111827' }} />
                            <div style={{ fontSize: 13, fontWeight: 700, color: '#1f2937' }}>{dropoff?.label || 'Destination'} (Edit)</div>
                        </div>
                    </div>
                )}

                <AnimatePresence>
                    {showSuggestions && (
                        <motion.div
                            className="suggestion-box"
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                        >
                            {isSearchingLocation && (
                                <div style={{ padding: '12px 20px', fontSize: 13, color: '#6b7280', display: 'flex', alignItems: 'center', gap: 10 }}>
                                    <Loader2 className="animate-spin" size={16} />
                                    <span>Searching for locations...</span>
                                </div>
                            )}

                            {/* 1. Quick Action: Current Location */}
                            <div className="suggestion-item" onClick={() => { getCurrentLocation(); setShowSuggestions(null); }}>
                                <Navigation size={20} color="#4285F4" />
                                <div>
                                    <div style={{ fontWeight: 700, color: '#4285F4' }}>Current Location</div>
                                    <div style={{ fontSize: 12, color: '#9ca3af' }}>Use GPS for accurate pickup</div>
                                </div>
                            </div>

                            {/* 2. Quick Action: Map Selection */}
                            <div className="suggestion-item" onClick={() => { setMapSelectionMode(showSuggestions); setShowSuggestions(null); }}>
                                <MapPin size={20} color="#6b7280" />
                                <div>
                                    <div style={{ fontWeight: 700 }}>Set location on map</div>
                                    <div style={{ fontSize: 12, color: '#9ca3af' }}>Select precisely by tapping</div>
                                </div>
                            </div>

                            {/* Show API results if available, otherwise show popular places matching query */}
                            {(apiSuggestions.length > 0 ? apiSuggestions : popularPlaces
                                .filter(p => {
                                    const query = (showSuggestions === 'pickup' ? pickupQuery : dropoffQuery).toLowerCase();
                                    return query === '' || p.label.toLowerCase().includes(query);
                                }))
                                .map((place, i) => (
                                    <div key={i} className="suggestion-item" onClick={() => {
                                        if (showSuggestions === 'pickup') {
                                            setPickup(place);
                                            setPickupQuery(place.label);
                                            // NO AUTO ADVANCE
                                        }
                                        else {
                                            setDropoff(place);
                                            setDropoffQuery(place.label);
                                            // NO AUTO ADVANCE
                                        }
                                        setShowSuggestions(null);
                                        setApiSuggestions([]);
                                    }}>
                                        <Clock size={20} color="#6b7280" />
                                        <div style={{ flex: 1, overflow: 'hidden' }}>
                                            <div style={{ fontWeight: 700, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{place.label}</div>
                                            <div style={{ fontSize: 11, color: '#9ca3af', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{place.sub}</div>
                                        </div>
                                    </div>
                                ))}

                            {!isSearchingLocation && apiSuggestions.length === 0 && (showSuggestions === 'pickup' ? pickupQuery : dropoffQuery).length > 2 && (
                                <div style={{ padding: '12px 20px', fontSize: 12, color: '#9ca3af', textAlign: 'center' }}>
                                    No results found. Try a different search.
                                </div>
                            )}
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Map Interaction Banner */}
            {mapSelectionMode && (
                <div className="map-select-banner">
                    <Navigation size={18} className="animate-pulse" />
                    <span style={{ fontWeight: 700 }}>Tap on map to set {mapSelectionMode}</span>
                    <X size={18} style={{ marginLeft: 10, cursor: 'pointer' }} onClick={() => setMapSelectionMode(null)} />
                </div>
            )}

            <div className="map-layer">
                <MapContainer center={[pickup?.lat || 6.9271, pickup?.lng || 79.8612]} zoom={15} zoomControl={false} style={{ height: '100%', width: '100%' }}>
                    <TileLayer url={MAP_TILES} />
                    <MapUpdater
                        pickup={pickup}
                        dropoff={rideStatus === 'active' ? null : dropoff}
                        driver={activeRide?.driver_lat ? { lat: activeRide.driver_lat, lng: activeRide.driver_lng } : null}
                    />
                    <MapClickHandler isSelecting={!!mapSelectionMode} onMapClick={handleMapClick} />

                    {/* Route Line (Trip) */}
                    {routeCoordinates.length > 0 && rideStatus !== 'active' && (
                        <Polyline
                            positions={routeCoordinates}
                            pathOptions={{ color: '#4285F4', weight: 6, opacity: 0.9 }}
                        />
                    )}

                    {/* Driver to Pickup Route */}
                    {driverRoute.length > 0 && rideStatus === 'active' && (
                        <Polyline
                            positions={driverRoute}
                            pathOptions={{ color: '#10B981', weight: 6, opacity: 0.9, dashArray: '10, 10' }}
                        />
                    )}

                    {/* Student Blue Dot / Pickup */}
                    {pickup && <Marker position={[pickup.lat, pickup.lng]} icon={userLocationIcon} />}

                    {/* Destination Marker */}
                    {dropoff && (
                        <Marker position={[dropoff.lat, dropoff.lng]} icon={L.divIcon({ html: '<div style="font-size: 30px; filter: drop-shadow(0 2px 5px rgba(0,0,0,0.3));">📍</div>', className: 'dest-marker', iconAnchor: [15, 30] })}>
                            <Popup>{dropoff.label}</Popup>
                        </Marker>
                    )}

                    {/* Nearby Riders (Only during selection/searching) */}
                    {(bookingStep === 'selection' || bookingStep === 'searching') && rideStatus !== 'active' && nearbyRiders
                        .filter(r => r.vehicle_type === selectedVehicle)
                        .map((rider, idx) => (
                            <Marker
                                key={`v-${rider.rider_id || idx}`}
                                position={[rider.current_lat, rider.current_lng]}
                                icon={getVehicleIcon(rider.vehicle_type)}
                            />
                        ))}

                    {/* Accepted Driver Marker */}
                    {rideStatus === 'active' && activeRide?.driver_lat && (
                        <Marker
                            position={[activeRide.driver_lat, activeRide.driver_lng]}
                            icon={getVehicleIcon(activeRide.vehicle_model || activeRide.vehicle_type)}
                        >
                            <Popup>
                                <div style={{ fontWeight: 800 }}>{activeRide.driver_name}</div>
                                <div style={{ fontSize: 12 }}>{activeRide.plate_number}</div>
                            </Popup>
                        </Marker>
                    )}

                    {pickup && <Circle center={[pickup.lat, pickup.lng]} radius={1000} pathOptions={{ color: '#4285F4', weight: 1, fillOpacity: 0.05, dashArray: '5, 5' }} />}
                </MapContainer>
            </div>

            {/* Bottom Panel */}
            <AnimatePresence mode="wait">
                {rideStatus === 'idle' && (bookingStep === 'review' || bookingStep === 'selection') && (
                    <motion.div
                        key="selection-panel"
                        className="bottom-action-card"
                        initial={{ y: 200 }}
                        animate={{ y: 0 }}
                        exit={{ y: 200 }}
                    >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 }}>
                            <span style={{ fontWeight: 900, fontSize: 20 }}>
                                {bookingStep === 'review' ? 'Trip Details' : 'Select Ride'}
                            </span>
                            <div style={{ background: '#f3f4f6', padding: '4px 12px', borderRadius: '10px', fontSize: 13, fontWeight: 700, color: '#6b7280' }}>
                                {bookingStep === 'review' ? 'Road Routing' : `${selectedVehicle} • Cash`}
                            </div>
                        </div>

                        {bookingStep === 'review' && (
                            <div style={{ padding: '10px 0' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 20 }}>
                                    <div style={{ color: '#64748b', fontSize: 13, fontWeight: 700 }}>Estimated Distance</div>
                                    <div style={{ fontWeight: 800 }}>
                                        {isCalculatingRoute ? <Loader2 className="animate-spin" size={14} /> : `~ ${distance} km`}
                                    </div>
                                </div>
                                <button
                                    className="btn-primary"
                                    onClick={() => setBookingStep('selection')}
                                    disabled={isCalculatingRoute} // Disable ONLY if calculating route
                                    style={{ opacity: isCalculatingRoute ? 0.6 : 1 }}
                                >
                                    {isCalculatingRoute ? 'Calculating Route...' : 'Continue to Selection'}
                                </button>
                            </div>
                        )}

                        {bookingStep === 'selection' && (
                            <>
                                {rebookMessage && (
                                    <div style={{
                                        background: '#FFF5F5',
                                        border: '1.5px solid #FEE2E2',
                                        color: '#991B1B',
                                        padding: '16px 20px',
                                        borderRadius: '20px',
                                        fontSize: '14px',
                                        marginBottom: '20px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '15px',
                                        boxShadow: '0 4px 12px rgba(153, 27, 27, 0.05)'
                                    }}>
                                        <div style={{
                                            width: 36, height: 36, background: '#FEE2E2',
                                            borderRadius: '12px', display: 'flex',
                                            alignItems: 'center', justifyContent: 'center',
                                            flexShrink: 0
                                        }}>
                                            <AlertCircle size={20} color="#991B1B" />
                                        </div>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                                            <div style={{ fontWeight: 800, fontSize: '15px' }}>{rebookMessage.split('\n')[0]}</div>
                                            <div style={{ fontWeight: 600, color: '#DC2626', opacity: 0.9 }}>{rebookMessage.split('\n')[1]}</div>
                                        </div>
                                    </div>
                                )}
                                <div className="vehicle-row">
                                    {vehicleTypes.map(v => (
                                        <div
                                            key={v.type}
                                            className={`vehicle-card ${selectedVehicle === v.type ? 'active' : ''}`}
                                            onClick={() => setSelectedVehicle(v.type)}
                                        >
                                            <div className="vehicle-icon" style={{ fontSize: 32, marginBottom: 8 }}>{v.icon}</div>
                                            <div style={{ fontSize: 13, fontWeight: 800, color: '#111827' }}>{v.name}</div>
                                            <div style={{ fontSize: 11, fontWeight: 700, color: '#10B981', marginTop: 2 }}>{v.eta} away</div>
                                            <div style={{ fontSize: 14, fontWeight: 900, marginTop: 4 }}>Rs.{v.base + Math.round(v.perKm * distance)}</div>
                                        </div>
                                    ))}
                                </div>

                                <button
                                    className="btn-primary"
                                    onClick={handleRequestRide}
                                >
                                    Book Now {selectedVehicle}
                                </button>
                            </>
                        )}
                    </motion.div>
                )}

                {rideStatus === 'idle' && (bookingStep === 'pickup' || bookingStep === 'dropoff') && (
                    <motion.div key="pickup-panel" className="bottom-action-card" initial={{ y: 200 }} animate={{ y: 0 }} exit={{ y: 200 }}>
                        <div style={{ padding: '0px 0' }}>
                            <div style={{ fontWeight: 900, fontSize: 18, marginBottom: 4 }}>
                                {bookingStep === 'pickup' ? 'Confirm your pickup' : 'Confirm destination'}
                            </div>
                            <div style={{ color: '#64748b', fontSize: 14, marginBottom: 20 }}>
                                {(bookingStep === 'pickup' ? pickup?.label : dropoff?.label) || 'Select a location to continue'}
                            </div>

                            <button
                                className="btn-primary"
                                disabled={!(bookingStep === 'pickup' ? pickup : dropoff)}
                                style={{ opacity: (bookingStep === 'pickup' ? pickup : dropoff) ? 1 : 0.5 }}
                                onClick={() => {
                                    if (bookingStep === 'pickup' && pickup) {
                                        setBookingStep('dropoff');
                                    } else if (bookingStep === 'dropoff' && dropoff) {
                                        setBookingStep('review');
                                    }
                                }}
                            >
                                {bookingStep === 'pickup' ? 'Confirm Pickup' : 'Confirm Destination'}
                            </button>
                        </div>
                    </motion.div>
                )}

                {rideStatus === 'requesting' && (
                    <motion.div
                        key="searching-panel"
                        className="bottom-action-card"
                        initial={{ y: 200 }}
                        animate={{ y: 0 }}
                        exit={{ y: 200 }}
                    >
                        <div className="searching-container">
                            <div className="radar-pulse">
                                <div className="radar-inner">
                                    <Loader2 className="animate-spin" color="white" size={32} />
                                </div>
                            </div>
                            <div style={{ fontWeight: 900, fontSize: 22, color: '#111827', marginBottom: 8 }}>Searching for {selectedVehicle}</div>
                            <div style={{ color: '#64748b', fontSize: 15, marginBottom: 24 }}>Connecting with nearby drivers... ({searchTimer}s)</div>

                            <button
                                style={{ width: '100%', padding: '16px', borderRadius: '16px', border: '1.5px solid #f3f4f6', background: 'white', color: '#6b7280', fontWeight: 800, cursor: 'pointer', transition: 'all 0.2s' }}
                                onClick={() => handleCancelRequest()}
                            >
                                Cancel Request
                            </button>
                        </div>
                    </motion.div>
                )}

                {rideStatus === 'active' && activeRide && (
                    <motion.div
                        key="active-panel"
                        className="bottom-action-card"
                        initial={{ y: 200 }}
                        animate={{ y: 0 }}
                        exit={{ y: 200 }}
                        style={{ padding: '24px', maxWidth: '600px', width: '95%' }}
                    >
                        {/* Driver & Vehicle Header */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
                            <div style={{ display: 'flex', gap: 15, alignItems: 'center', flex: 1 }}>
                                <div style={{ position: 'relative' }}>
                                    <div style={{ width: 64, height: 64, background: '#f3f4f6', borderRadius: '22px', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px solid white', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
                                        {activeRide.driver_avatar ? (
                                            <img src={activeRide.driver_avatar} alt="Driver" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                        ) : (
                                            <Car size={32} color="#6b7280" />
                                        )}
                                    </div>
                                    <div style={{ position: 'absolute', bottom: -5, right: -5, background: '#10B981', width: 20, height: 20, borderRadius: '50%', border: '3px solid white', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}></div>
                                </div>
                                <div style={{ flex: 1 }}>
                                    <div style={{ fontWeight: 900, fontSize: 19, display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
                                        {activeRide.driver_name}
                                        <div style={{ background: '#FFF7ED', padding: '2px 8px', borderRadius: '8px', fontSize: 12, color: '#f59e0b', display: 'flex', alignItems: 'center', gap: 4, fontWeight: 800 }}>
                                            <Star size={12} fill="#f59e0b" /> 4.9
                                        </div>
                                    </div>
                                    <div style={{ color: '#6b7280', fontSize: 13, fontWeight: 700, letterSpacing: '0.1px', marginBottom: 4 }}>
                                        {activeRide.vehicle_type} • {activeRide.vehicle_model}
                                    </div>
                                    <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                                        <div style={{ background: '#F3F4F6', display: 'inline-block', padding: '2px 8px', borderRadius: '6px', fontSize: 12, fontWeight: 800, color: '#111827', textTransform: 'uppercase', border: '1px solid #E5E7EB' }}>
                                            {activeRide.plate_number}
                                        </div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 13, fontWeight: 700, color: '#10B981' }}>
                                            <Phone size={14} />
                                            <span>{activeRide.driver_phone}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <a
                                href={`tel:${activeRide.driver_phone}`}
                                style={{ width: 48, height: 48, borderRadius: '16px', background: '#ECFDF5', textDecoration: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'transform 0.2s', flexShrink: 0 }}
                                onMouseDown={(e) => e.currentTarget.style.transform = 'scale(0.95)'}
                                onMouseUp={(e) => e.currentTarget.style.transform = 'scale(1)'}
                                onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                            >
                                <Phone size={22} color="#10B981" />
                            </a>
                        </div>

                        {/* Trip Summary Section */}
                        <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '20px', marginBottom: 20, border: '1px solid #f1f5f9' }}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                                <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, marginTop: 4 }}>
                                        <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#3b82f6', border: '2px solid #bfdbfe' }}></div>
                                        <div style={{ width: 1, height: 20, background: '#e2e8f0' }}></div>
                                        <div style={{ width: 8, height: 8, background: '#10b981', borderRadius: '2px' }}></div>
                                    </div>
                                    <div style={{ flex: 1 }}>
                                        <div style={{ fontSize: 11, fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', marginBottom: 2 }}>Route Details</div>
                                        <div style={{ fontSize: 14, fontWeight: 700, color: '#334155', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                            {activeRide.pickup_location} → {activeRide.dropoff_location}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Status Message */}
                        <div style={{ background: '#111827', padding: '16px 20px', borderRadius: '20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', boxShadow: '0 8px 20px rgba(0,0,0,0.15)' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                <div style={{ width: 32, height: 32, background: 'rgba(16, 185, 129, 0.2)', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <ShieldCheck size={18} color="#10B981" />
                                </div>
                                <span style={{ fontWeight: 800, fontSize: 15, color: 'white' }}>
                                    {activeRide.status === 'accepted' ? 'Driver is coming' :
                                        activeRide.status === 'arrived' ? 'Driver has arrived' :
                                            activeRide.status === 'picked_up' ? 'Heading to destination' : 'Trip in progress'}
                                </span>
                            </div>
                            <span style={{ color: '#10B981', fontWeight: 900, fontSize: 16 }}>
                                {driverETA ? `${driverETA} min${driverETA !== 1 ? 's' : ''}` : 'Calculating...'}
                            </span>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Completion / Rate Driver Modal */}
            <AnimatePresence>
                {rateDriverModal && activeRide && (
                    <div style={{
                        position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                        background: 'rgba(0,0,0,0.6)', zIndex: 2000,
                        display: 'flex', alignItems: 'center', justifyContent: 'center', p: 4
                    }}>
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            style={{
                                background: 'white', width: '90%', maxWidth: '400px',
                                borderRadius: '24px', padding: '30px', textAlign: 'center',
                                boxShadow: '0 20px 50px rgba(0,0,0,0.2)'
                            }}
                        >
                            <div style={{
                                width: 80, height: 80, background: '#ECFDF5', borderRadius: '50%',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                margin: '0 auto 20px'
                            }}>
                                <CheckCircle2 size={40} color="#10B981" />
                            </div>

                            <h2 style={{ fontSize: 24, fontWeight: 900, marginBottom: 8, color: '#111827' }}>
                                You've Arrived!
                            </h2>
                            <p style={{ color: '#6b7280', marginBottom: 25, lineHeight: 1.5 }}>
                                Hope you enjoyed your ride with {activeRide.driver_name}.
                                <br />Total Fare: <strong>Rs. {activeRide.estimated_fare}</strong>
                            </p>

                            <div style={{ display: 'flex', justifyContent: 'center', gap: 10, marginBottom: 20 }}>
                                {[1, 2, 3, 4, 5].map((star) => (
                                    <Star
                                        key={star}
                                        size={32}
                                        fill={star <= rating ? "#FBBF24" : "none"}
                                        color={star <= rating ? "#FBBF24" : "#9ca3af"}
                                        style={{ cursor: 'pointer', transition: 'all 0.2s' }}
                                        onClick={() => setRating(star)}
                                    />
                                ))}
                            </div>

                            <textarea
                                placeholder="Add a comment (optional)..."
                                value={comment}
                                onChange={(e) => setComment(e.target.value)}
                                style={{
                                    width: '100%', padding: '12px', borderRadius: '12px',
                                    border: '1.5px solid #e5e7eb', marginBottom: 20,
                                    fontSize: '14px', resize: 'none', height: '80px', fontFamily: 'inherit'
                                }}
                            />

                            <button
                                className="btn-primary"
                                onClick={() => {
                                    // Mark this ride ID as dismissed persistently
                                    if (activeRide?.id) {
                                        localStorage.setItem(`dismissed_ride_${activeRide.id}`, 'true');
                                        dismissedRideIdRef.current = activeRide.id;
                                    }

                                    setRateDriverModal(false);
                                    setActiveRide(null);
                                    setRideStatus('idle');
                                    setBookingStep('pickup');
                                    setPickup(null);
                                    setDropoff(null);
                                    setPickupQuery('');
                                    setDropoffQuery('');
                                    setRouteCoordinates([]);
                                    setRating(0);
                                    setComment('');
                                }}
                            >
                                Done
                            </button>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Trip History Button - Floating */}
            {!showTripHistory && bookingStep !== 'searching' && (
                <motion.button
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    whileHover={{
                        scale: 1.15,
                        rotate: 8,
                        boxShadow: '0 15px 40px rgba(16,185,129,0.4)'
                    }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => setShowTripHistory(true)}
                    style={{
                        position: 'fixed',
                        top: '140px',
                        right: '24px',
                        width: '56px',
                        height: '56px',
                        borderRadius: '16px',
                        background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
                        color: 'white',
                        border: 'none',
                        boxShadow: '0 10px 25px rgba(16,185,129,0.3)',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        zIndex: 1000,
                        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
                    }}
                >
                    <ClipboardList size={26} />
                </motion.button>
            )}

            {/* Trip History Modal */}
            <AnimatePresence>
                {showTripHistory && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        style={{
                            position: 'fixed',
                            top: 0,
                            left: 0,
                            right: 0,
                            bottom: 0,
                            background: 'rgba(0,0,0,0.4)',
                            backdropFilter: 'blur(4px)', // Reduced blur for better performance
                            zIndex: 2000,
                            display: 'flex',
                            alignItems: 'flex-end',
                            justifyContent: 'center',
                            willChange: 'opacity'
                        }}
                        onClick={() => setShowTripHistory(false)}
                    >
                        <motion.div
                            initial={{ y: '100%' }}
                            animate={{ y: 0 }}
                            exit={{ y: '100%' }}
                            transition={{
                                type: 'tween',
                                ease: [0.4, 0, 0.2, 1], // Standard material ease
                                duration: 0.4
                            }}
                            onClick={(e) => e.stopPropagation()}
                            className="hide-scrollbar"
                            style={{
                                width: '100%',
                                maxWidth: '1000px',
                                maxHeight: '90vh',
                                background: 'white',
                                borderRadius: '28px 28px 0 0',
                                padding: '32px',
                                overflowY: 'auto',
                                boxShadow: '0 -10px 40px rgba(0,0,0,0.15)',
                                willChange: 'transform' // GPU acceleration
                            }}
                        >
                            {/* Header */}
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                                <h2 style={{ fontSize: '24px', fontWeight: 800, color: '#1f2937', margin: 0 }}>
                                    Trip History
                                </h2>
                                <button
                                    onClick={() => setShowTripHistory(false)}
                                    style={{
                                        width: '40px',
                                        height: '40px',
                                        borderRadius: '50%',
                                        border: 'none',
                                        background: '#f3f4f6',
                                        cursor: 'pointer',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        transition: 'background 0.2s'
                                    }}
                                    onMouseEnter={(e) => e.currentTarget.style.background = '#e5e7eb'}
                                    onMouseLeave={(e) => e.currentTarget.style.background = '#f3f4f6'}
                                >
                                    <X size={20} />
                                </button>
                            </div>

                            <DateRangePicker
                                startDate={filterStartDate}
                                endDate={filterEndDate}
                                onStartDateChange={setFilterStartDate}
                                onEndDateChange={setFilterEndDate}
                                onClearFilters={() => {
                                    setFilterStartDate(null);
                                    setFilterEndDate(null);
                                }}
                            />

                            {/* Trip Count Summary */}
                            <div style={{
                                marginBottom: '20px',
                                padding: '12px 16px',
                                background: '#f9fafb',
                                borderRadius: '12px',
                                fontSize: '14px',
                                fontWeight: 600,
                                color: '#6b7280'
                            }}>
                                {isLoadingHistory ? (
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <Loader2 className="animate-spin" size={16} />
                                        Loading trips...
                                    </div>
                                ) : (
                                    `Showing ${tripHistory.length} trip${tripHistory.length !== 1 ? 's' : ''}`
                                )}
                            </div>

                            {/* Trip Cards List */}
                            <div style={{ marginTop: '20px' }}>
                                {isLoadingHistory ? (
                                    <div style={{ textAlign: 'center', padding: '40px 0', color: '#9ca3af' }}>
                                        <Loader2 className="animate-spin" size={32} style={{ margin: '0 auto 16px' }} />
                                        <p>Loading your trip history...</p>
                                    </div>
                                ) : tripHistory.length === 0 ? (
                                    <div style={{ textAlign: 'center', padding: '60px 20px', color: '#9ca3af' }}>
                                        <HistoryIcon size={48} style={{ margin: '0 auto 16px', opacity: 0.3 }} />
                                        <p style={{ fontSize: '16px', fontWeight: 600, marginBottom: '8px' }}>No trips found</p>
                                        <p style={{ fontSize: '14px' }}>
                                            {filterStartDate || filterEndDate
                                                ? 'Try adjusting your date filters'
                                                : 'Your completed trips will appear here'}
                                        </p>
                                    </div>
                                ) : (
                                    tripHistory.map((trip) => (
                                        <TripHistoryCard key={trip.id} trip={trip} />
                                    ))
                                )}
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default RideHome;
