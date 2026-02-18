import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Search, Calendar, MapPin, Building2, Phone, MessageSquare, Clock, CheckCircle, XCircle } from 'lucide-react';
import { useUser } from '../../context/UserContext';

const UserBookingsModal = ({ onClose }) => {
    const { user } = useUser();
    const [bookings, setBookings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('All'); // All, Upcoming, Past
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        if (user?.phone) {
            fetchBookings();
        } else {
            setLoading(false);
        }
    }, [user]);

    const fetchBookings = async () => {
        try {
            const res = await fetch(`http://localhost:5000/api/bookings/user/${user.phone}`);
            const data = await res.json();
            setBookings(Array.isArray(data) ? data : []);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const resolveImageUrl = (imageJson) => {
        try {
            if (!imageJson) return 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?q=80&w=2670&auto=format&fit=crop';
            const imgs = typeof imageJson === 'string' ? JSON.parse(imageJson) : imageJson;
            if (Array.isArray(imgs) && imgs.length > 0) {
                const url = imgs[0];
                return url.startsWith('http') ? url : `http://localhost:5000${url.startsWith('/') ? '' : '/'}${url}`;
            }
        } catch (e) { }
        return 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?q=80&w=2670&auto=format&fit=crop';
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'Confirmed': return '#00B14F';
            case 'Pending': return '#F59E0B';
            case 'Cancelled': return '#EF4444';
            case 'Completed': return '#3B82F6';
            default: return '#6B7280';
        }
    };

    const getStatusIcon = (status) => {
        switch (status) {
            case 'Confirmed': return <CheckCircle size={14} />;
            case 'Pending': return <Clock size={14} />;
            case 'Cancelled': return <XCircle size={14} />;
            default: return <Clock size={14} />;
        }
    };

    const filteredBookings = bookings.filter(booking => {
        const matchSearch = booking.room_title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            booking.partner_name?.toLowerCase().includes(searchQuery.toLowerCase());

        if (!matchSearch) return false;

        const bookingDate = new Date(booking.check_in);
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        if (filter === 'Upcoming') return bookingDate >= today;
        if (filter === 'Past') return bookingDate < today;
        return true;
    });

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                style={{
                    position: 'fixed', inset: 0, zIndex: 1200,
                    backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    padding: '20px'
                }}
                onClick={onClose}
            >
                <motion.div
                    initial={{ scale: 0.95, opacity: 0, y: 20 }}
                    animate={{ scale: 1, opacity: 1, y: 0 }}
                    exit={{ scale: 0.95, opacity: 0, y: 20 }}
                    onClick={(e) => e.stopPropagation()}
                    style={{
                        backgroundColor: '#F9FAFB', borderRadius: '32px', overflow: 'hidden',
                        width: '100%', maxWidth: '600px', height: '85vh',
                        display: 'flex', flexDirection: 'column',
                        boxShadow: '0 40px 80px -20px rgba(0,0,0,0.3)'
                    }}
                >
                    {/* Header */}
                    <div style={{
                        padding: '24px 32px',
                        backgroundColor: 'white',
                        borderBottom: '1px solid #F3F4F6',
                        display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                    }}>
                        <div>
                            <h2 style={{ fontSize: '24px', fontWeight: '800', color: '#111827', margin: 0 }}>My Bookings</h2>
                            <p style={{ margin: '4px 0 0', color: '#6B7280', fontSize: '14px' }}>Track your room requests</p>
                        </div>
                        <button
                            onClick={onClose}
                            style={{
                                padding: '10px', borderRadius: '50%', border: 'none',
                                backgroundColor: '#F3F4F6', cursor: 'pointer',
                                transition: 'background-color 0.2s'
                            }}
                            className="hover:bg-gray-200"
                        >
                            <X size={20} color="#374151" />
                        </button>
                    </div>

                    {/* Controls */}
                    <div style={{ padding: '20px 32px 0', backgroundColor: '#fff' }}>
                        {/* Search */}
                        <div style={{
                            position: 'relative',
                            marginBottom: '20px'
                        }}>
                            <Search size={18} color="#9CA3AF" style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)' }} />
                            <input
                                type="text"
                                placeholder="Search by room or partner..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                style={{
                                    width: '100%', padding: '14px 16px 14px 48px',
                                    borderRadius: '16px', border: '1px solid #E5E7EB',
                                    backgroundColor: '#F9FAFB', fontSize: '15px', outline: 'none',
                                    transition: 'all 0.2s'
                                }}
                                onFocus={(e) => e.target.style.borderColor = '#00B14F'}
                                onBlur={(e) => e.target.style.borderColor = '#E5E7EB'}
                            />
                        </div>

                        {/* Tabs */}
                        <div style={{ display: 'flex', gap: '8px', paddingBottom: '20px' }}>
                            {['All', 'Upcoming', 'Past'].map(tab => (
                                <button
                                    key={tab}
                                    onClick={() => setFilter(tab)}
                                    style={{
                                        padding: '10px 20px',
                                        borderRadius: '12px',
                                        border: 'none',
                                        backgroundColor: filter === tab ? '#111827' : '#F3F4F6',
                                        color: filter === tab ? 'white' : '#6B7280',
                                        fontWeight: '600',
                                        fontSize: '14px',
                                        cursor: 'pointer',
                                        transition: 'all 0.2s'
                                    }}
                                >
                                    {tab}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* List */}
                    <div style={{ flex: 1, overflowY: 'auto', padding: '24px 32px' }}>
                        {loading ? (
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '200px', color: '#6B7280' }}>
                                Loading bookings...
                            </div>
                        ) : filteredBookings.length === 0 ? (
                            <div style={{ textAlign: 'center', padding: '60px 0', color: '#6B7280' }}>
                                <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: '#F3F4F6', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                                    <Calendar size={28} color="#9CA3AF" />
                                </div>
                                <h3 style={{ fontSize: '16px', fontWeight: '600', color: '#374151', margin: '0 0 8px' }}>No bookings found</h3>
                                <p style={{ fontSize: '14px' }}>Try adjusting your search or filters</p>
                            </div>
                        ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                                {filteredBookings.map((booking, index) => (
                                    <motion.div
                                        key={booking.id}
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: index * 0.05 }}
                                        style={{
                                            backgroundColor: 'white',
                                            borderRadius: '24px',
                                            padding: '20px',
                                            boxShadow: '0 4px 20px rgba(0,0,0,0.03)',
                                            border: '1px solid rgba(0,0,0,0.04)',
                                            display: 'flex',
                                            gap: '20px'
                                        }}
                                    >
                                        {/* Thumbnail */}
                                        <div style={{
                                            width: '100px',
                                            height: '100px',
                                            borderRadius: '18px',
                                            backgroundImage: `url(${resolveImageUrl(booking.room_images)})`,
                                            backgroundSize: 'cover',
                                            backgroundPosition: 'center',
                                            flexShrink: 0
                                        }} />

                                        {/* Details */}
                                        <div style={{ flex: 1 }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '8px' }}>
                                                <div>
                                                    <div style={{
                                                        display: 'inline-flex', alignItems: 'center', gap: '6px',
                                                        padding: '4px 10px', borderRadius: '8px',
                                                        backgroundColor: `${getStatusColor(booking.status)}15`,
                                                        color: getStatusColor(booking.status),
                                                        fontSize: '12px', fontWeight: '700', marginBottom: '8px'
                                                    }}>
                                                        {getStatusIcon(booking.status)}
                                                        {booking.status.toUpperCase()}
                                                    </div>
                                                    <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '700', color: '#111827' }}>
                                                        {booking.room_title}
                                                    </h3>
                                                </div>
                                                <div style={{ textAlign: 'right' }}>
                                                    <div style={{ fontSize: '12px', color: '#6B7280', fontWeight: '500' }}>Check-in</div>
                                                    <div style={{ fontSize: '15px', fontWeight: '700', color: '#111827' }}>
                                                        {new Date(booking.check_in).toLocaleDateString()}
                                                    </div>
                                                </div>
                                            </div>

                                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '14px', color: '#6B7280', marginBottom: '16px' }}>
                                                <MapPin size={14} />
                                                {booking.room_location}
                                            </div>

                                            {/* Partner Info */}
                                            <div style={{
                                                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                                paddingTop: '16px', borderTop: '1px solid #F3F4F6'
                                            }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                                    <div style={{ width: '32px', height: '32px', borderRadius: '10px', background: '#E0E7FF', color: '#4F46E5', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '700', fontSize: '14px' }}>
                                                        {booking.partner_name?.charAt(0)}
                                                    </div>
                                                    <div>
                                                        <div style={{ fontSize: '13px', fontWeight: '600', color: '#111827' }}>{booking.partner_name}</div>
                                                        <div style={{ fontSize: '12px', color: '#6B7280' }}>Host</div>
                                                    </div>
                                                </div>

                                                {booking.partner_phone && (
                                                    <a
                                                        href={`tel:${booking.partner_phone}`}
                                                        style={{
                                                            display: 'flex', alignItems: 'center', gap: '6px',
                                                            padding: '8px 14px', borderRadius: '12px',
                                                            backgroundColor: '#F0FDF4', color: '#16A34A',
                                                            textDecoration: 'none', fontSize: '13px', fontWeight: '600'
                                                        }}
                                                    >
                                                        <Phone size={14} />
                                                        Call
                                                    </a>
                                                )}
                                            </div>
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        )}
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
};

export default UserBookingsModal;
