import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUser } from '../../context/UserContext';
import {
    ArrowLeft, Search, MapPin, ChevronDown, X, GraduationCap,
    Building2, Home, Users, Phone, Mail, MapPinned, ChevronRight,
    Wifi, Bath, Wind, Bed, Zap, CheckCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import UserTypeModal from '../../components/common/UserTypeModal';
import RoomBookingModal from './RoomBookingModal';
import UserBookingsModal from './UserBookingsModal';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { Calendar } from 'lucide-react';

// Fix for default marker icon
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const PROPERTY_TYPES = [
    { id: 'All', name: 'All', icon: <Home size={18} /> },
    { id: 'Boarding', name: 'Boarding', icon: <Building2 size={18} /> },
    { id: 'Hostel', name: 'Hostel', icon: <Users size={18} /> },
    { id: 'Apartment', name: 'Apartment', icon: <Building2 size={18} /> },
    { id: 'House', name: 'House', icon: <Home size={18} /> }
];

const RoomMapModal = ({ room, onClose }) => {
    if (!room) return null;

    // Use partner location if room specific coordinates aren't available
    const lat = parseFloat(room.partner_lat || 6.9271);
    const lng = parseFloat(room.partner_lng || 79.8612);

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                style={{
                    position: 'fixed', inset: 0, zIndex: 1000,
                    backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(5px)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    padding: '20px'
                }}
                onClick={onClose}
            >
                <motion.div
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.9, opacity: 0 }}
                    onClick={(e) => e.stopPropagation()}
                    style={{
                        backgroundColor: 'white', borderRadius: '30px', overflow: 'hidden',
                        width: '100%', maxWidth: '800px', height: '80vh',
                        display: 'flex', flexDirection: 'column',
                        boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)'
                    }}
                >
                    <div style={{ padding: '24px', borderBottom: '1px solid #eee', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                            <h3 style={{ fontSize: '24px', fontWeight: '800', color: '#1A1A1A' }}>Location Map</h3>
                            <p style={{ color: '#666', fontSize: '14px' }}>{room.title} • {room.location_name}</p>
                        </div>
                        <button
                            onClick={onClose}
                            style={{ padding: '8px', borderRadius: '50%', border: 'none', backgroundColor: '#f5f5f5', cursor: 'pointer' }}
                        >
                            <X size={24} color="#666" />
                        </button>
                    </div>

                    <div style={{ flex: 1, position: 'relative' }}>
                        <MapContainer
                            center={[lat, lng]}
                            zoom={15}
                            style={{ height: '100%', width: '100%' }}
                        >
                            <TileLayer
                                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                            />
                            <Marker position={[lat, lng]}>
                                <Popup>
                                    <div style={{ padding: '5px' }}>
                                        <h3 style={{ margin: '0 0 5px', fontSize: '16px', fontWeight: 'bold' }}>{room.title}</h3>
                                        <p style={{ margin: 0, fontSize: '13px' }}>{room.location_name}</p>
                                    </div>
                                </Popup>
                            </Marker>
                        </MapContainer>
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
};

const RoomsHome = () => {
    const navigate = useNavigate();
    const { userType, location, updateLocation } = useUser();

    const [rooms, setRooms] = useState([]);
    const [partners, setPartners] = useState([]);
    const [selectedPartner, setSelectedPartner] = useState(null);
    const [selectedRoom, setSelectedRoom] = useState(null);
    const [selectedBookingRoom, setSelectedBookingRoom] = useState(null); // New state for booking
    const [showBookingsModal, setShowBookingsModal] = useState(false); // Bookings History Modal
    const [searchQuery, setSearchQuery] = useState('');
    const [activeType, setActiveType] = useState('All');
    const [isLoading, setIsLoading] = useState(true);
    const [showUserTypeModal, setShowUserTypeModal] = useState(false);
    const [isUniSelectorOpen, setIsUniSelectorOpen] = useState(false);

    useEffect(() => {
        if (!userType) setShowUserTypeModal(true);
    }, [userType]);

    useEffect(() => {
        const fetchRooms = async () => {
            setIsLoading(true);
            try {
                const locationName = location?.name || '';
                const url = `http://localhost:5000/api/rooms?location=${encodeURIComponent(locationName)}&search=${encodeURIComponent(searchQuery)}&type=${activeType}`;
                const response = await fetch(url);
                if (!response.ok) throw new Error('Server error');
                const data = await response.json();

                if (Array.isArray(data)) {
                    setRooms(data);

                    // Group rooms by partner
                    const grouped = {};
                    data.forEach(room => {
                        const partnerId = room.partner_id;
                        if (!grouped[partnerId]) {
                            grouped[partnerId] = {
                                id: partnerId,
                                name: room.owner_name || 'Unknown Partner',
                                phone: room.owner_phone,
                                location: room.partner_location || room.location_name,
                                avatar: room.owner_avatar,
                                rooms: []
                            };
                        }
                        grouped[partnerId].rooms.push(room);
                    });

                    setPartners(Object.values(grouped));
                } else {
                    setRooms([]);
                    setPartners([]);
                }
            } catch (err) {
                console.error('Failed to fetch rooms:', err);
                setRooms([]);
                setPartners([]);
            } finally {
                setIsLoading(false);
            }
        };

        if (userType) fetchRooms();
    }, [userType, location, activeType, searchQuery]);

    const resolveImageUrl = (imgJson) => {
        try {
            const imgs = typeof imgJson === 'string' ? JSON.parse(imgJson) : imgJson;
            if (Array.isArray(imgs) && imgs.length > 0) {
                const url = imgs[0];
                return url.startsWith('http') ? url : `http://localhost:5000${url.startsWith('/') ? '' : '/'}${url}`;
            }
        } catch (e) { }
        return 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?q=80&w=2670&auto=format&fit=crop';
    };

    const handleUniSelect = (uni) => {
        updateLocation({ name: uni, type: 'university' });
        setIsUniSelectorOpen(false);
    };

    const handlePartnerClick = (partner) => {
        setSelectedPartner(partner);
    };

    const handleBackToPartners = () => {
        setSelectedPartner(null);
    };

    const handleRoomClick = (room) => {
        setSelectedRoom(room);
    };

    return (
        <div style={{ backgroundColor: '#FDFDFD', minHeight: '100vh', paddingBottom: '60px', fontFamily: "'Inter', sans-serif" }}>
            <UserTypeModal
                isOpen={showUserTypeModal}
                onClose={() => setShowUserTypeModal(false)}
                redirectAfter="/rooms"
            />

            {/* Map Modal */}
            {selectedRoom && (
                <RoomMapModal
                    room={selectedRoom}
                    onClose={() => setSelectedRoom(null)}
                />
            )}

            {/* Booking Modal */}
            {selectedBookingRoom && (
                <RoomBookingModal
                    room={selectedBookingRoom}
                    onClose={() => setSelectedBookingRoom(null)}
                />
            )}

            {/* User Bookings History Modal */}
            {showBookingsModal && (
                <UserBookingsModal
                    onClose={() => setShowBookingsModal(false)}
                />
            )}

            {/* Header */}
            <div style={{
                backgroundColor: 'rgba(255, 255, 255, 0.85)',
                backdropFilter: 'blur(20px)',
                padding: '16px 20px',
                position: 'sticky',
                top: 0,
                zIndex: 100,
                borderBottom: '1px solid rgba(0,0,0,0.05)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '16px'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <motion.div whileTap={{ scale: 0.95 }} onClick={() => selectedPartner ? handleBackToPartners() : navigate(-1)} style={{ cursor: 'pointer' }}>
                        <ArrowLeft size={24} color="#1A1A1A" />
                    </motion.div>

                    <div style={{ position: 'relative' }}>
                        <h1 style={{ fontSize: '20px', fontWeight: '800', color: '#1A1A1A', margin: 0 }}>Find a Room</h1>
                        <div
                            onClick={() => setIsUniSelectorOpen(!isUniSelectorOpen)}
                            style={{ display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer' }}
                        >
                            <MapPin size={12} color="#00B14F" />
                            <span style={{ fontSize: '13px', fontWeight: '600', color: '#666' }}>{location?.name || location || 'Select Location'}</span>
                            <ChevronDown size={14} color="#999" />
                        </div>

                        {/* Dropdown */}
                        <AnimatePresence>
                            {isUniSelectorOpen && (
                                <motion.div
                                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                    style={{
                                        position: 'absolute', top: '100%', left: 0,
                                        width: '260px', marginTop: '12px',
                                        backgroundColor: 'white', borderRadius: '16px',
                                        boxShadow: '0 10px 40px rgba(0,0,0,0.15)', maxHeight: '300px',
                                        overflowY: 'auto', zIndex: 200, padding: '8px',
                                        border: '1px solid rgba(0,0,0,0.05)'
                                    }}
                                >
                                    {universities.map((uni) => (
                                        <motion.div
                                            key={uni}
                                            whileHover={{ backgroundColor: '#F0FDF4' }}
                                            onClick={() => {
                                                // Assuming handleUniSelect updates location and closes dropdown
                                                // If logic is different, verify handleUniSelect exists
                                                if (typeof handleUniSelect === 'function') handleUniSelect(uni);
                                                setIsUniSelectorOpen(false);
                                            }}
                                            style={{
                                                padding: '12px 14px', borderRadius: '12px',
                                                cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px',
                                                color: '#374151', fontSize: '13px', fontWeight: '600',
                                                transition: 'all 0.2s'
                                            }}
                                        >
                                            <GraduationCap size={16} color="#00B14F" />
                                            {uni}
                                        </motion.div>
                                    ))}
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </div>

                <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setShowBookingsModal(true)}
                    style={{
                        padding: '10px 16px', borderRadius: '14px', border: 'none',
                        background: '#F0FDF4', color: '#00B14F',
                        fontWeight: '700', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px',
                        cursor: 'pointer'
                    }}
                >
                    <Calendar size={16} />
                    My Bookings
                </motion.button>
            </div>

            <div style={{ padding: '24px 20px' }}>
                {/* Search and Filters */}
                <div style={{ marginBottom: '32px' }}>
                    <h2 style={{ fontSize: '28px', fontWeight: '900', color: '#1A1A1A', letterSpacing: '-1px', marginBottom: '20px' }}>
                        {selectedPartner ? `${selectedPartner.name}'s Rooms` : 'Find your next'} <span style={{ color: '#00B14F' }}>home</span>.
                    </h2>

                    {!selectedPartner && (
                        <>
                            <div style={{ position: 'relative', marginBottom: '20px' }}>
                                <div style={{ position: 'absolute', left: '18px', top: '50%', transform: 'translateY(-50%)', color: '#00B14F' }}>
                                    <Search size={20} />
                                </div>
                                <input
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    placeholder="Search partners, properties..."
                                    style={{
                                        width: '100%', padding: '18px 24px 18px 52px', borderRadius: '22px', border: '2px solid #F1F3F5',
                                        backgroundColor: 'white', fontSize: '16px', fontWeight: '600', outline: 'none'
                                    }}
                                />
                            </div>

                            {/* Property Type Filters */}
                            <div style={{ display: 'flex', gap: '14px', overflowX: 'auto', padding: '8px 4px 24px', scrollbarWidth: 'none' }}>
                                {PROPERTY_TYPES.map((type) => (
                                    <motion.button
                                        key={type.id}
                                        whileHover={{ y: -4 }}
                                        whileTap={{ scale: 0.95 }}
                                        onClick={() => setActiveType(type.id)}
                                        style={{
                                            flexShrink: 0, padding: '14px 24px', borderRadius: '20px',
                                            backgroundColor: activeType === type.id ? '#00B14F' : 'white',
                                            color: activeType === type.id ? 'white' : '#495057',
                                            display: 'flex', alignItems: 'center', gap: '10px', fontSize: '14px', fontWeight: '700',
                                            border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.03)', cursor: 'pointer'
                                        }}
                                    >
                                        {type.icon} {type.name}
                                    </motion.button>
                                ))}
                            </div>
                        </>
                    )}
                </div>

                {/* Content */}
                {isLoading ? (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '24px' }}>
                        {[1, 2, 3, 4].map(i => (
                            <div key={i} style={{ height: '200px', borderRadius: '30px', backgroundColor: '#F1F3F5', animation: 'pulse 1.5s infinite' }}></div>
                        ))}
                    </div>
                ) : selectedPartner ? (
                    // Show selected partner's premium rooms
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(380px, 1fr))', gap: '32px' }}>
                        {selectedPartner.rooms.map((room, index) => (
                            <motion.div
                                key={room.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.08 }}
                                whileHover={{ y: -8, boxShadow: '0 30px 60px -12px rgba(0,177,79,0.15)' }}
                                onClick={() => handleRoomClick(room)}
                                style={{
                                    background: 'white',
                                    borderRadius: '32px',
                                    border: '1px solid rgba(0,0,0,0.04)',
                                    overflow: 'hidden',
                                    cursor: 'pointer',
                                    boxShadow: '0 15px 40px -10px rgba(0,0,0,0.08)',
                                    position: 'relative'
                                }}
                            >
                                {/* Room Image - Larger */}
                                <div style={{
                                    height: '260px',
                                    width: '100%',
                                    backgroundImage: `url(${resolveImageUrl(room.images)})`,
                                    backgroundSize: 'cover',
                                    backgroundPosition: 'center',
                                    position: 'relative'
                                }}>
                                    {/* Gradient overlay */}
                                    <div style={{
                                        position: 'absolute',
                                        inset: 0,
                                        background: 'linear-gradient(to top, rgba(0,0,0,0.6) 0%, transparent 60%)',
                                    }} />

                                    {/* Property Type Badge - Prominent */}
                                    <div style={{
                                        position: 'absolute',
                                        top: '20px',
                                        right: '20px',
                                        background: 'rgba(255, 255, 255, 0.95)',
                                        backdropFilter: 'blur(10px)',
                                        padding: '8px 16px',
                                        borderRadius: '16px',
                                        fontSize: '13px',
                                        fontWeight: '800',
                                        color: '#00B14F',
                                        boxShadow: '0 8px 20px rgba(0,0,0,0.15)',
                                        display: 'flex', alignItems: 'center', gap: '6px'
                                    }}>
                                        {room.property_type === 'House' && <Home size={14} />}
                                        {room.property_type === 'Apartment' && <Building2 size={14} />}
                                        {(room.property_type === 'Hostel' || room.property_type === 'Boarding') && <Users size={14} />}
                                        {room.property_type || 'Room'}
                                    </div>

                                    {/* Price Badge - Floating */}
                                    <div style={{
                                        position: 'absolute',
                                        bottom: '20px',
                                        left: '20px',
                                        background: 'rgba(0,0,0,0.8)',
                                        backdropFilter: 'blur(12px)',
                                        padding: '10px 18px',
                                        borderRadius: '18px',
                                        border: '1px solid rgba(255,255,255,0.15)',
                                        display: 'flex',
                                        alignItems: 'baseline',
                                        gap: '4px',
                                        boxShadow: '0 8px 24px rgba(0,0,0,0.2)'
                                    }}>
                                        <span style={{ fontSize: '11px', fontWeight: '700', color: 'rgba(255,255,255,0.9)', textTransform: 'uppercase' }}>LKR</span>
                                        <span style={{ fontSize: '20px', fontWeight: '900', color: 'white', letterSpacing: '-0.5px' }}>
                                            {parseFloat(room.price_per_month).toLocaleString()}
                                        </span>
                                        <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.7)', fontWeight: '500' }}>/mo</span>
                                    </div>
                                </div>

                                {/* Room Details */}
                                <div style={{ padding: '24px' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '16px' }}>
                                        <h3 style={{
                                            fontSize: '20px',
                                            fontWeight: '800',
                                            color: '#1A1A1A',
                                            lineHeight: '1.3',
                                            flex: 1,
                                            margin: 0
                                        }}>
                                            {room.title}
                                        </h3>
                                    </div>

                                    <div style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '8px',
                                        color: '#666',
                                        fontSize: '14px',
                                        marginBottom: '20px',
                                        paddingBottom: '20px',
                                        borderBottom: '1px solid #f0f0f0'
                                    }}>
                                        <div style={{ padding: '6px', background: '#e6f7ed', borderRadius: '8px', display: 'flex' }}>
                                            <MapPin size={16} color="#00B14F" />
                                        </div>
                                        <span style={{ fontWeight: '500' }}>{room.location_name}</span>
                                    </div>

                                    {/* Amenities / Details Grid */}
                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '24px' }}>
                                        {/* Gender Badge */}
                                        <div style={{
                                            display: 'flex', alignItems: 'center', gap: '6px',
                                            fontSize: '12px', fontWeight: '700',
                                            padding: '6px 12px', borderRadius: '10px',
                                            backgroundColor: room.gender_restriction === 'Male' ? '#E3F2FD' : room.gender_restriction === 'Female' ? '#FCE4EC' : '#F3F4F6',
                                            color: room.gender_restriction === 'Male' ? '#1E88E5' : room.gender_restriction === 'Female' ? '#D81B60' : '#4B5563',
                                        }}>
                                            <Users size={14} />
                                            {room.gender_restriction === 'Any' ? 'Any Gender' : `${room.gender_restriction} Only`}
                                        </div>

                                        {/* Parse amenities and show all */}
                                        {(() => {
                                            try {
                                                const amenities = typeof room.amenities === 'string' ? JSON.parse(room.amenities) : (room.amenities || []);
                                                return Array.isArray(amenities) && amenities.map((amenity, i) => {
                                                    let icon = <CheckCircle size={14} />;
                                                    let label = amenity;
                                                    const lower = amenity.toLowerCase();

                                                    if (lower.includes('wifi')) icon = <Wifi size={14} />;
                                                    else if (lower.includes('bath') || lower.includes('toilet')) icon = <Bath size={14} />;
                                                    else if (lower.includes('ac') || lower.includes('air')) icon = <Wind size={14} />;
                                                    else if (lower.includes('bed') || lower.includes('room')) icon = <Bed size={14} />;
                                                    else if (lower.includes('power')) icon = <Zap size={14} />;

                                                    // Highlight "Attached Bathroom" or "Shared"
                                                    const isHighlight = lower.includes('attached') || lower.includes('private') || lower.includes('ac');

                                                    return (
                                                        <div key={i} style={{
                                                            display: 'flex', alignItems: 'center', gap: '6px',
                                                            fontSize: '12px', fontWeight: '600',
                                                            padding: '6px 12px', borderRadius: '10px',
                                                            backgroundColor: isHighlight ? '#E8F5E9' : '#FAFAFA',
                                                            color: isHighlight ? '#2E7D32' : '#666',
                                                            border: isHighlight ? '1px solid rgba(46, 125, 50, 0.1)' : '1px solid #EEEEEE'
                                                        }}>
                                                            {icon}
                                                            {label}
                                                        </div>
                                                    );
                                                });
                                            } catch (e) { return null; }
                                        })()}
                                    </div>

                                    {/* Action Buttons */}
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr', gap: '12px' }}>
                                        <motion.button
                                            whileHover={{ scale: 1.02 }}
                                            whileTap={{ scale: 0.98 }}
                                            onClick={(e) => { e.stopPropagation(); handleRoomClick(room); }}
                                            style={{
                                                padding: '14px',
                                                background: '#F0FDF4',
                                                borderRadius: '16px',
                                                border: 'none',
                                                fontSize: '14px',
                                                fontWeight: '700',
                                                color: '#00B14F',
                                                cursor: 'pointer',
                                                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px'
                                            }}
                                        >
                                            <MapPinned size={18} />
                                            Map
                                        </motion.button>

                                        <motion.button
                                            whileHover={{ scale: 1.02 }}
                                            whileTap={{ scale: 0.98 }}
                                            onClick={(e) => { e.stopPropagation(); setSelectedBookingRoom(room); }}
                                            style={{
                                                padding: '14px',
                                                background: '#00B14F',
                                                borderRadius: '16px',
                                                border: 'none',
                                                fontSize: '14px',
                                                fontWeight: '700',
                                                color: 'white',
                                                cursor: 'pointer',
                                                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                                                boxShadow: '0 4px 12px rgba(0, 177, 79, 0.25)'
                                            }}
                                        >
                                            Book Now
                                        </motion.button>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                ) : partners.length > 0 ? (
                    // Show premium partner cards
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '28px' }}>
                        {partners.map((partner, index) => (
                            <motion.div
                                key={partner.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.1 }}
                                whileHover={{ y: -8, boxShadow: '0 30px 60px -12px rgba(0,177,79,0.15)' }}
                                onClick={() => handlePartnerClick(partner)}
                                style={{
                                    background: 'linear-gradient(145deg, #ffffff 0%, #f8fffe 100%)',
                                    borderRadius: '32px',
                                    border: '1px solid rgba(0,177,79,0.08)',
                                    padding: '32px',
                                    cursor: 'pointer',
                                    position: 'relative',
                                    overflow: 'hidden',
                                    boxShadow: '0 10px 30px -10px rgba(0,0,0,0.08)'
                                }}
                            >
                                {/* Decorative gradient blob */}
                                <div style={{
                                    position: 'absolute',
                                    top: '-50px',
                                    right: '-50px',
                                    width: '150px',
                                    height: '150px',
                                    background: 'radial-gradient(circle, rgba(0,177,79,0.08) 0%, transparent 70%)',
                                    borderRadius: '50%',
                                    pointerEvents: 'none'
                                }} />

                                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '18px', marginBottom: '24px', position: 'relative', zIndex: 1 }}>
                                    <div style={{
                                        width: '72px',
                                        height: '72px',
                                        borderRadius: '24px',
                                        background: 'linear-gradient(135deg, #00B14F 0%, #00D95F 100%)',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        fontSize: '28px',
                                        fontWeight: '900',
                                        color: 'white',
                                        boxShadow: '0 8px 24px rgba(0,177,79,0.25)',
                                        position: 'relative'
                                    }}>
                                        <div style={{
                                            position: 'absolute',
                                            inset: '-2px',
                                            background: 'linear-gradient(135deg, rgba(255,255,255,0.3) 0%, transparent 100%)',
                                            borderRadius: '24px',
                                            pointerEvents: 'none'
                                        }} />
                                        {partner.name.charAt(0).toUpperCase()}
                                    </div>
                                    <div style={{ flex: 1 }}>
                                        <h3 style={{
                                            fontSize: '22px',
                                            fontWeight: '900',
                                            color: '#1A1A1A',
                                            marginBottom: '6px',
                                            letterSpacing: '-0.5px'
                                        }}>
                                            {partner.name}
                                        </h3>
                                        <div style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '6px',
                                            color: '#6A6D7C',
                                            fontSize: '14px',
                                            fontWeight: '600'
                                        }}>
                                            <MapPinned size={15} color="#00B14F" />
                                            {partner.location || 'Location not set'}
                                        </div>
                                    </div>
                                </div>

                                <div style={{
                                    padding: '24px',
                                    background: 'linear-gradient(135deg, #F0FDF4 0%, #E8F8F0 100%)',
                                    borderRadius: '24px',
                                    marginBottom: '24px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'space-between',
                                    border: '1px solid rgba(0,177,79,0.1)',
                                    position: 'relative',
                                    overflow: 'hidden'
                                }}>
                                    <div style={{
                                        position: 'absolute',
                                        top: 0,
                                        left: 0,
                                        right: 0,
                                        height: '2px',
                                        background: 'linear-gradient(90deg, transparent 0%, #00B14F 50%, transparent 100%)',
                                        opacity: 0.3
                                    }} />
                                    <div>
                                        <div style={{
                                            fontSize: '36px',
                                            fontWeight: '900',
                                            background: 'linear-gradient(135deg, #00B14F 0%, #00D95F 100%)',
                                            WebkitBackgroundClip: 'text',
                                            WebkitTextFillColor: 'transparent',
                                            letterSpacing: '-1px',
                                            lineHeight: '1'
                                        }}>
                                            {partner.rooms.length}
                                        </div>
                                        <div style={{ fontSize: '12px', fontWeight: '800', color: '#00B14F', marginTop: '4px', letterSpacing: '0.5px' }}>
                                            AVAILABLE ROOMS
                                        </div>
                                    </div>
                                    <motion.div
                                        whileHover={{ scale: 1.1, backgroundColor: '#00B14F' }}
                                        whileTap={{ scale: 0.95 }}
                                        style={{
                                            width: '48px',
                                            height: '48px',
                                            borderRadius: '50%',
                                            backgroundColor: '#00D95F',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            boxShadow: '0 8px 20px rgba(0,177,79,0.3)',
                                            color: 'white',
                                            cursor: 'pointer'
                                        }}
                                        onClick={() => handlePartnerClick(partner)}
                                    >
                                        <ChevronRight size={24} strokeWidth={3} />
                                    </motion.div>
                                </div>

                                {/* Property Types Summary */}
                                <div style={{
                                    display: 'flex',
                                    flexWrap: 'wrap',
                                    gap: '8px',
                                    marginBottom: '24px'
                                }}>
                                    {[...new Set(partner.rooms.map(r => r.property_type || 'Room'))].map((type, i) => (
                                        <div key={i} style={{
                                            padding: '6px 12px',
                                            backgroundColor: 'white',
                                            border: '1px solid #Eaeaea',
                                            borderRadius: '12px',
                                            fontSize: '13px',
                                            fontWeight: '700',
                                            color: '#555',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '6px'
                                        }}>
                                            {type === 'House' && <Home size={14} color="#00B14F" />}
                                            {type === 'Apartment' && <Building2 size={14} color="#00B14F" />}
                                            {(type === 'Hostel' || type === 'Boarding') && <Users size={14} color="#00B14F" />}
                                            {type}
                                        </div>
                                    ))}
                                </div>

                                {partner.phone && (
                                    <div style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '10px',
                                        padding: '12px 16px',
                                        backgroundColor: 'rgba(0,177,79,0.04)',
                                        borderRadius: '14px',
                                        border: '1px solid rgba(0,177,79,0.08)'
                                    }}>
                                        <div style={{
                                            width: '32px',
                                            height: '32px',
                                            borderRadius: '10px',
                                            background: 'linear-gradient(135deg, #00B14F 0%, #00D95F 100%)',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center'
                                        }}>
                                            <Phone size={16} color="white" />
                                        </div>
                                        <span style={{
                                            fontSize: '15px',
                                            fontWeight: '700',
                                            color: '#1A1A1A',
                                            letterSpacing: '0.2px'
                                        }}>
                                            {partner.phone}
                                        </span>
                                    </div>
                                )}
                            </motion.div>
                        ))}
                    </div>
                ) : (<div style={{ textAlign: 'center', padding: '60px 20px' }}>
                    <div style={{ fontSize: '48px', marginBottom: '16px' }}>🏠</div>
                    <h3 style={{ fontSize: '20px', fontWeight: '800', color: '#1A1A1A', marginBottom: '8px' }}>
                        No properties found
                    </h3>
                    <p style={{ color: '#6A6D7C', fontSize: '14px' }}>
                        Try adjusting your filters or search in a different location
                    </p>
                </div>
                )
                }
            </div >
        </div >
    );
};

export default RoomsHome;
