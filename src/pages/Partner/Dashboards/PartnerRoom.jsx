import React, { useState, useEffect } from 'react';
import {
    Plus, Eye, Edit2, Trash2, MapPin, Calendar, Bed, Users,
    CheckCircle, Clock, XCircle, Wifi, Wind, Car, Coffee,
    Tv, TrendingUp, Home, ArrowRight, LayoutDashboard,
    Image as ImageIcon, Loader2, Search, Filter, MoreVertical, Power, ChevronDown
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useUser } from '../../../context/UserContext';
import StatusToggle from '../../../components/common/StatusToggle';

const PartnerRoom = () => {
    const { partnerData, loading: authLoading, togglePartnerStatus } = useUser();
    const [activeTab, setActiveTab] = useState('bookings');
    const [rooms, setRooms] = useState([]);
    const [bookings, setBookings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [bookingFilter, setBookingFilter] = useState('All Active');
    const [selectedBooking, setSelectedBooking] = useState(null);
    const [isEditingBooking, setIsEditingBooking] = useState(false);
    const [notification, setNotification] = useState(null); // { message, type: 'success' | 'error' }

    const showNotification = (message, type = 'success') => {
        setNotification({ message, type });
        setTimeout(() => setNotification(null), 3000);
    };

    // Modal States
    const [showRoomModal, setShowRoomModal] = useState(false);
    const [showBookingModal, setShowBookingModal] = useState(false);

    // Form States
    const [newRoom, setNewRoom] = useState({
        title: '',
        price: '',
        location: '',
        description: '',
        type: 'Boarding',
        room_type: 'Individual',
        image_url: '',
        amenities: []
    });

    const [roomImage, setRoomImage] = useState(null);
    const [roomImagePreview, setRoomImagePreview] = useState(null);
    const [isUploading, setIsUploading] = useState(false);

    const [newBooking, setNewBooking] = useState({
        room_id: '',
        guest_name: '',
        guest_phone: '',
        check_in: '',
        check_out: '',
        total_price: '',
        status: 'Confirmed'
    });

    const amenitiesOptions = [
        { id: 'attached_bathroom', label: 'Attached Bathroom', icon: <CheckCircle size={14} /> },
        { id: 'wifi', label: 'WiFi', icon: <Wifi size={14} /> },
        { id: 'ac', label: 'AC', icon: <Wind size={14} /> },
        { id: 'parking', label: 'Parking', icon: <Car size={14} /> },
        { id: 'kitchen', label: 'Kitchen', icon: <Coffee size={14} /> },
        { id: 'tv', label: 'TV', icon: <Tv size={14} /> }
    ];

    useEffect(() => {
        let interval;
        if (!authLoading && partnerData?.id) {
            fetchData();
            // Poll for new bookings every 5 seconds
            interval = setInterval(() => {
                fetchBookings();
            }, 5000);
        } else if (!authLoading && !partnerData) {
            setLoading(false);
        }
        return () => {
            if (interval) clearInterval(interval);
        };
    }, [partnerData, authLoading]);

    const fetchData = async () => {
        setLoading(true);
        setError(null);
        try {
            await Promise.all([fetchRooms(), fetchBookings()]);
        } catch (err) {
            console.error('Data Load Error:', err);
            setError('Failed to load dashboard data. Please check your connection.');
        } finally {
            setLoading(false);
        }
    };

    const fetchRooms = async () => {
        const res = await fetch(`http://localhost:5000/api/partners/rooms/${partnerData.id}`);
        if (!res.ok) throw new Error('Failed to fetch rooms');
        setRooms(await res.json());
    };

    const fetchBookings = async () => {
        const res = await fetch(`http://localhost:5000/api/partners/bookings/${partnerData.id}`);
        if (!res.ok) throw new Error('Failed to fetch bookings');
        setBookings(await res.json());
    };

    const [editingRoomId, setEditingRoomId] = useState(null);
    const [bookingConflict, setBookingConflict] = useState(null); // { message, conflictingDates: [] }

    // Real-time Availability Check
    useEffect(() => {
        if (showBookingModal && newBooking.room_id && newBooking.check_in && newBooking.check_out) {
            const start = new Date(newBooking.check_in);
            const end = new Date(newBooking.check_out);

            const conflicts = bookings.filter(b => {
                if (String(b.room_id) !== String(newBooking.room_id)) return false;
                if (b.status === 'Cancelled' || b.status === 'Completed') return false;

                const bStart = new Date(b.check_in);
                const bEnd = new Date(b.check_out);

                // Overlap: (StartA < EndB) && (EndA > StartB)
                return start < bEnd && end > bStart;
            });

            if (conflicts.length > 0) {
                const dates = conflicts.map(c =>
                    `${new Date(c.check_in).toLocaleDateString()} - ${new Date(c.check_out).toLocaleDateString()}`
                ).join(', ');
                setBookingConflict({
                    message: 'Room is unavailable for selected dates.',
                    conflictingDates: conflicts
                });
            } else {
                setBookingConflict(null);
            }
        } else {
            setBookingConflict(null);
        }
    }, [newBooking.room_id, newBooking.check_in, newBooking.check_out, showBookingModal, bookings]);

    const toggleAmenity = (id) => {
        setNewRoom(prev => ({
            ...prev,
            amenities: prev.amenities.includes(id)
                ? prev.amenities.filter(a => a !== id)
                : [...prev.amenities, id]
        }));
    };

    const handleCreateRoom = async (e) => {
        e.preventDefault();
        setIsUploading(true);
        try {
            let finalImageUrl = newRoom.image_url;

            // Handle Image Upload if file exists
            if (roomImage) {
                const formData = new FormData();
                formData.append('image', roomImage);
                const uploadRes = await fetch('http://localhost:5000/api/upload/room-image', {
                    method: 'POST',
                    body: formData
                });
                if (uploadRes.ok) {
                    const uploadData = await uploadRes.json();
                    finalImageUrl = uploadData.imageUrl;
                } else {
                    throw new Error('Image upload failed');
                }
            }

            const imagesArray = finalImageUrl ? [finalImageUrl] : (newRoom.images || []);
            const url = editingRoomId
                ? `http://localhost:5000/api/partners/rooms/${editingRoomId}`
                : 'http://localhost:5000/api/partners/rooms';

            const method = editingRoomId ? 'PUT' : 'POST';

            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...newRoom,
                    images: imagesArray,
                    price: newRoom.price, // Ensure this matches backend expected field
                    location_name: newRoom.location, // Map to correct field
                    partner_id: partnerData.id,
                    type: partnerData.property_type || newRoom.type // Enforce partner's property type
                })
            });

            if (res.ok) {
                setShowRoomModal(false);
                fetchRooms();
                setNewRoom({
                    title: '',
                    price: '',
                    location: '',
                    description: '',
                    type: 'Boarding',
                    room_type: 'Individual',
                    image_url: '',
                    amenities: []
                });
                setRoomImage(null);
                setRoomImagePreview(null);
                setEditingRoomId(null);
                showNotification(editingRoomId ? 'Room updated successfully' : 'Room created successfully');
            } else {
                const err = await res.json();
                showNotification(err.error || 'Failed to save room', 'error');
            }
        } catch (err) {
            showNotification(err.message || 'Network Error: Could not connect to server.', 'error');
        } finally {
            setIsUploading(false);
        }
    };

    const handleEditRoom = (room) => {
        let images = [];
        try { images = typeof room.images === 'string' ? JSON.parse(room.images) : (room.images || []); } catch (e) { }
        const imageUrl = images.length > 0 ? images[0] : '';

        // Parse amenities if needed
        let amenities = [];
        try { amenities = typeof room.amenities === 'string' ? JSON.parse(room.amenities) : (room.amenities || []); } catch (e) { }

        setNewRoom({
            title: room.title || '',
            price: room.price_per_month || '',
            location: room.location_name || '',
            description: room.description || '',
            type: room.property_type || '',
            room_type: room.room_type || 'Individual',
            image_url: imageUrl || '',
            amenities: amenities || []
        });
        setEditingRoomId(room.id);
        setShowRoomModal(true);
    };

    const handleCreateBooking = async (e) => {
        e.preventDefault();
        if (bookingConflict) return; // Prevent submission if conflict exists

        try {
            const res = await fetch('http://localhost:5000/api/partners/bookings', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ...newBooking, partner_id: partnerData.id })
            });

            if (res.ok) {
                setShowBookingModal(false);
                fetchBookings();
                fetchRooms(); // Refresh room status (Occupied/Available)
                setNewBooking({
                    room_id: '',
                    guest_name: '',
                    guest_phone: '',
                    check_in: '',
                    check_out: '',
                    total_price: '',
                    status: 'Confirmed'
                });
                showNotification('Booking confirmed successfully');
            } else {
                const err = await res.json();
                showNotification(err.error || 'Failed to create booking', 'error');
            }
        } catch (err) {
            showNotification('Network Error: Could not connect to server.', 'error');
        }
    };

    const handleDeleteRoom = async (id) => {
        if (!window.confirm('Are you sure you want to delete this room? This action cannot be undone.')) return;
        try {
            await fetch(`http://localhost:5000/api/partners/rooms/${id}`, { method: 'DELETE' });
            setRooms(rooms.filter(r => r.id !== id));
            showNotification('Property deleted successfully');
        } catch (err) {
            showNotification('Failed to delete room', 'error');
        }
    };

    const handleRoomStatusUpdate = async (id, newStatus) => {
        try {
            // Optimistic update
            setRooms(rooms.map(r => r.id === id ? { ...r, status: newStatus, is_available: newStatus === 'Available' } : r));

            const res = await fetch(`http://localhost:5000/api/partners/rooms/${id}/status`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: newStatus })
            });

            if (!res.ok) {
                throw new Error('Failed to update status on server');
            }
            showNotification('Status updated');
        } catch (err) {
            console.error(err);
            showNotification('Failed to update status', 'error');
            // Revert on failure (could fetch rooms again to be safe)
            fetchRooms();
        }
    };

    const handleUpdateBookingStatus = async (id, newStatus) => {
        try {
            const res = await fetch(`http://localhost:5000/api/partners/bookings/${id}/status`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: newStatus })
            });

            if (res.ok) {
                fetchBookings();
                fetchRooms(); // Refresh room status immediately
                if (selectedBooking && selectedBooking.id === id) {
                    setSelectedBooking(prev => ({ ...prev, status: newStatus }));
                }
                showNotification(`Booking marked as ${newStatus}`);
            } else {
                showNotification('Failed to update status', 'error');
            }
        } catch (err) {
            console.error('Update status error:', err);
            showNotification('Network error', 'error');
        }
    };

    const handleUpdateBooking = async (e) => {
        e.preventDefault();
        try {
            const res = await fetch(`http://localhost:5000/api/partners/bookings/${selectedBooking.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    guest_name: selectedBooking.guest_name,
                    guest_phone: selectedBooking.guest_phone,
                    check_in: selectedBooking.check_in.split('T')[0],
                    check_out: selectedBooking.check_out.split('T')[0],
                    total_price: selectedBooking.total_price
                })
            });

            if (res.ok) {
                fetchBookings();
                setIsEditingBooking(false);
                showNotification('Booking updated successfully');
            } else {
                const err = await res.json();
                showNotification(err.error || 'Update failed', 'error');
            }
        } catch (err) {
            showNotification('Network Error', 'error');
        }
    };



    if (authLoading) return <LoadingScreen message="Initializing Dashboard..." />;

    if (!partnerData) {
        return (
            <div className="denied-container">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="denied-card"
                >
                    <XCircle size={48} color="#EF4444" />
                    <h2>Access Denied</h2>
                    <p>Please log in as a partner to access this space.</p>
                    <a href="/partner-login" className="login-link">Continue to Login</a>
                </motion.div>
            </div>
        );
    }

    const totalRevenue = bookings.reduce((sum, b) => sum + Number(b.total_price), 0);
    const activeRooms = rooms.length;
    const recentBookingsCount = bookings.filter(b => b.status === 'Confirmed').length;

    return (
        <div className="dashboard-wrapper">
            <AnimatePresence>
                {notification && (
                    <motion.div
                        initial={{ opacity: 0, y: -20, x: '-50%' }}
                        animate={{ opacity: 1, y: 0, x: '-50%' }}
                        exit={{ opacity: 0, y: -20, x: '-50%' }}
                        style={{
                            position: 'fixed', top: '24px', left: '50%', zIndex: 2000,
                            background: notification.type === 'error' ? '#fef2f2' : '#f0fdf4',
                            color: notification.type === 'error' ? '#991b1b' : '#166534',
                            border: `1px solid ${notification.type === 'error' ? '#fee2e2' : '#bbf7d0'}`,
                            padding: '12px 24px', borderRadius: '12px', fontWeight: '600',
                            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                        }}
                    >
                        {notification.message}
                    </motion.div>
                )}
            </AnimatePresence>
            <style>{`
                .dashboard-wrapper {
                    min-height: 100vh;
                    background-color: #f8fafc;
                    font-family: 'Inter', sans-serif;
                    color: #1e293b;
                    padding-bottom: 60px;
                }

                .premium-header {
                    background: linear-gradient(135deg, #059669 0%, #10b981 100%);
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
                    max-width: 1200px;
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

                .stats-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
                    gap: 20px;
                    margin-top: -60px;
                    position: relative;
                    z-index: 10;
                }

                .stat-card {
                    background: rgba(255, 255, 255, 0.8);
                    backdrop-filter: blur(12px);
                    border: 1px solid rgba(255, 255, 255, 0.3);
                    padding: 24px;
                    border-radius: 24px;
                    box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.05);
                    display: flex;
                    align-items: center;
                    gap: 20px;
                }

                .stat-icon {
                    width: 56px;
                    height: 56px;
                    border-radius: 16px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    background: white;
                    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
                }

                .stat-icon.revenue { color: #059669; }
                .stat-icon.rooms { color: #2563eb; }
                .stat-icon.bookings { color: #7c3aed; }

                .stat-label { font-size: 14px; color: #64748b; font-weight: 500; }
                .stat-value { font-size: 24px; font-weight: 800; color: #0f172a; margin-top: 2px; }

                .main-content { margin-top: 40px; }

                .tabs-nav {
                    display: flex;
                    gap: 8px;
                    background: #e2e8f0;
                    padding: 6px;
                    border-radius: 16px;
                    width: fit-content;
                    margin-bottom: 32px;
                }

                .tab-btn {
                    padding: 10px 24px;
                    border-radius: 12px;
                    border: none;
                    cursor: pointer;
                    font-size: 14px;
                    font-weight: 600;
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    transition: all 0.2s;
                    background: transparent;
                    color: #64748b;
                }

                .tab-btn.active {
                    background: white;
                    color: #059669;
                    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
                }

                .section-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 24px;
                }

                .section-header h2 {
                    font-size: 22px;
                    font-weight: 700;
                    color: #0f172a;
                    margin: 0;
                }

                .primary-btn {
                    background: #059669;
                    color: white;
                    border: none;
                    padding: 12px 24px;
                    border-radius: 12px;
                    font-weight: 600;
                    display: flex;
                    align-items: center;
                    gap: 10px;
                    cursor: pointer;
                    transition: all 0.2s;
                    box-shadow: 0 4px 12px rgba(5, 150, 105, 0.2);
                }

                .primary-btn:hover { background: #047857; transform: translateY(-1px); }

                .secondary-btn {
                    background: #f1f5f9;
                    color: #475569;
                    border: none;
                    padding: 12px 24px;
                    border-radius: 12px;
                    font-weight: 600;
                    display: flex;
                    align-items: center;
                    gap: 10px;
                    cursor: pointer;
                    transition: all 0.2s;
                }

                .secondary-btn:hover { background: #e2e8f0; }

                .room-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fill, minmax(340px, 1fr));
                    gap: 24px;
                }

                .glass-card {
                    background: white;
                    border: 1px solid #e2e8f0;
                    border-radius: 24px;
                    overflow: hidden;
                    transition: all 0.3s;
                    display: flex;
                    flex-direction: column;
                }

                .glass-card:hover { transform: translateY(-4px); box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.05); }

                .card-image {
                    height: 200px;
                    background: #f1f5f9;
                    position: relative;
                }

                .card-image img { width: 100%; height: 100%; object-fit: cover; }

                .type-badge {
                    position: absolute;
                    top: 16px;
                    right: 16px;
                    background: rgba(255,255,255,0.95);
                    padding: 6px 12px;
                    border-radius: 10px;
                    font-size: 11px;
                    font-weight: 700;
                    color: #059669;
                    text-transform: uppercase;
                    backdrop-filter: blur(4px);
                }

                .card-body { padding: 24px; flex: 1; display: flex; flexDirection: column; }
                .card-title { font-size: 18px; font-weight: 700; color: #0f172a; margin-bottom: 8px; }

                .btn-icon-danger {
                    width: 38px;
                    height: 38px;
                    border-radius: 10px;
                    border: none;
                    background: #fef2f2;
                    color: #ef4444;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    cursor: pointer;
                    transition: all 0.2s;
                }
                .btn-icon-danger:hover { background: #fee2e2; }

                .table-container {
                    background: white;
                    border-radius: 24px;
                    border: 1px solid #e2e8f0;
                    overflow: hidden;
                }

                table { width: 100%; border-collapse: collapse; }
                th { background: #f8fafc; padding: 16px 24px; text-align: left; font-size: 12px; font-weight: 600; color: #64748b; text-transform: uppercase; border-bottom: 1px solid #e2e8f0; }
                td { padding: 20px 24px; border-bottom: 1px solid #f1f5f9; vertical-align: middle; }

                .status-badge {
                    display: inline-flex;
                    align-items: center;
                    gap: 6px;
                    padding: 6px 12px;
                    border-radius: 20px;
                    font-size: 12px;
                    font-weight: 600;
                }

                .status-badge.confirmed { background: #dcfce7; color: #166534; }
                .status-badge.pending { background: #fef9c3; color: #854d0e; }
                .status-badge.cancelled { background: #fee2e2; color: #991b1b; }

                .denied-container { min-height: 100vh; display: flex; align-items: center; justify-content: center; background: #f8fafc; }
                .denied-card { background: white; padding: 48px; border-radius: 32px; text-align: center; box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.05); max-width: 400px; }
                .login-link { display: inline-block; margin-top: 24px; background: #059669; color: white; padding: 12px 32px; border-radius: 12px; text-decoration: none; font-weight: 600; }

                .modal-overlay {
                    position: fixed;
                    inset: 0;
                    background: rgba(15, 23, 42, 0.4);
                    backdrop-filter: blur(8px);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    z-index: 1000;
                    padding: 20px;
                }

                .modal-content {
                    background: white;
                    width: 100%;
                    max-width: 550px;
                    border-radius: 32px;
                    padding: 40px;
                    position: relative;
                    max-height: 90vh;
                    overflow-y: auto;
                    -ms-overflow-style: none;
                    scrollbar-width: none;
                    box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.15);
                }
                .modal-content::-webkit-scrollbar {
                    display: none;
                }

                .form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
                .form-group { margin-bottom: 24px; }
                .form-group label { display: block; font-size: 13px; font-weight: 600; color: #475569; margin-bottom: 8px; text-transform: uppercase; letter-spacing: 0.025em; }
                .form-input, .form-select, .form-textarea {
                    width: 100%;
                    padding: 14px 16px;
                    border-radius: 14px;
                    border: 1px solid #e2e8f0;
                    background: #f8fafc;
                    font-size: 15px;
                    transition: all 0.2s;
                    box-sizing: border-box;
                }
                .form-input:focus { border-color: #059669; outline: none; background: white; box-shadow: 0 0 0 4px rgba(5, 150, 105, 0.1); }

                .amenity-chip {
                    display: inline-flex;
                    align-items: center;
                    gap: 8px;
                    padding: 8px 16px;
                    border-radius: 12px;
                    background: white;
                    border: 1px solid #e2e8f0;
                    cursor: pointer;
                    font-size: 13px;
                    font-weight: 500;
                    transition: all 0.2s;
                }

                .amenity-chip.selected {
                    background: #dcfce7;
                    border-color: #059669;
                    color: #065f46;
                }

                .spin { animation: spin 1s linear infinite; }
                @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
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
                            <h1>{partnerData.business_name}</h1>
                            <div className="location-tag">
                                <MapPin size={14} />
                                <span>{partnerData.locationName || partnerData.location || 'Location Not Set'}</span>
                            </div>
                        </motion.div>

                        <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                            <StatusToggle
                                isActive={partnerData.is_active}
                                onToggle={togglePartnerStatus}
                            />

                            <motion.div
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="premium-badge"
                                style={{
                                    background: 'rgba(255,255,255,0.1)',
                                    padding: '12px 24px',
                                    borderRadius: '20px',
                                    border: '1px solid rgba(255,255,255,0.2)',
                                    backdropFilter: 'blur(10px)'
                                }}
                            >
                                <span style={{ fontSize: '12px', fontWeight: '600', opacity: 0.8, display: 'block' }}>Account Status</span>
                                <span style={{ fontSize: '15px', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                    <CheckCircle size={16} fill="white" color="#059669" /> Verified Partner
                                </span>
                            </motion.div>
                        </div>
                    </div>
                </div>
            </header>

            <div className="container" style={{ position: 'relative' }}>
                {/* Content with conditional effects */}
                <motion.div
                    animate={{
                        filter: 'none',
                        opacity: 1,
                        pointerEvents: 'auto'
                    }}
                    transition={{ duration: 0.4 }}
                >
                    <div className="stats-grid">
                        <StatCard
                            icon={<TrendingUp />}
                            label="Total Revenue"
                            value={`LKR ${totalRevenue.toLocaleString()}`}
                            variant="revenue"
                            subtitle={`${bookings.length} total bookings`}
                        />
                        <StatCard
                            icon={<Bed />}
                            label="Room Inventory"
                            value={activeRooms}
                            variant="rooms"
                            subtitle={`${rooms.filter(r => r.is_available).length} available now`}
                        />
                        <StatCard
                            icon={<Calendar />}
                            label="Active Bookings"
                            value={recentBookingsCount}
                            variant="bookings"
                            subtitle="Confirmed & upcoming"
                        />
                    </div>

                    <div className="main-content">
                        <div className="tabs-nav">
                            <button
                                className={`tab-btn ${activeTab === 'bookings' ? 'active' : ''}`}
                                onClick={() => setActiveTab('bookings')}
                            >
                                <Calendar size={18} /> Bookings
                            </button>
                            <button
                                className={`tab-btn ${activeTab === 'rooms' ? 'active' : ''}`}
                                onClick={() => setActiveTab('rooms')}
                            >
                                <Bed size={18} /> Room List
                            </button>
                            <button
                                className={`tab-btn ${activeTab === 'history' ? 'active' : ''}`}
                                onClick={() => setActiveTab('history')}
                            >
                                <Users size={18} /> History
                            </button>
                        </div>

                        <AnimatePresence mode="wait">
                            {activeTab === 'rooms' ? (
                                <motion.div
                                    key="rooms"
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -20 }}
                                >
                                    <div className="section-header">
                                        <h2>Room Management</h2>
                                        <button onClick={() => setShowRoomModal(true)} className="primary-btn">
                                            <Plus size={20} /> Add Room
                                        </button>
                                    </div>

                                    {loading ? <LoaderComponent /> : (
                                        <div className="room-grid">
                                            {rooms.map(room => (
                                                <RoomCard
                                                    key={room.id}
                                                    room={room}
                                                    onDelete={() => handleDeleteRoom(room.id)}
                                                    onStatusChange={handleRoomStatusUpdate}
                                                    onEdit={() => handleEditRoom(room)}
                                                />
                                            ))}
                                            {rooms.length === 0 && <EmptyState message="No properties registered yet." />}
                                        </div>
                                    )}
                                </motion.div>
                            ) : activeTab === 'bookings' ? (
                                <motion.div
                                    key="bookings"
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -20 }}
                                >
                                    <div className="section-header">
                                        <h2>Reservations & Bookings</h2>
                                        <div style={{ display: 'flex', gap: '12px' }}>
                                            <select
                                                className="form-select"
                                                style={{ width: 'auto', padding: '8px 16px', borderRadius: '12px' }}
                                                value={bookingFilter}
                                                onChange={(e) => setBookingFilter(e.target.value)}
                                            >
                                                <option>All Active</option>
                                                <option>Confirmed</option>
                                                <option>Pending</option>
                                            </select>
                                            <button onClick={() => setShowBookingModal(true)} className="secondary-btn">
                                                <Plus size={18} /> Manual Entry
                                            </button>
                                        </div>
                                    </div>

                                    {loading ? <LoaderComponent /> : (
                                        <>
                                            {/* Today's Activity Section */}
                                            <div style={{ marginBottom: '24px', display: 'flex', gap: '16px' }}>
                                                {bookings.filter(b => {
                                                    const today = new Date().toISOString().split('T')[0];
                                                    const checkIn = b.check_in.split('T')[0];
                                                    const checkOut = b.check_out.split('T')[0];
                                                    return (checkIn === today || checkOut === today) && b.status === 'Confirmed';
                                                }).map(b => {
                                                    const today = new Date().toISOString().split('T')[0];
                                                    const checkIn = b.check_in.split('T')[0];
                                                    const isCheckIn = checkIn === today;
                                                    return (
                                                        <div key={b.id} style={{
                                                            background: 'white', padding: '16px', borderRadius: '16px',
                                                            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)', flex: 1,
                                                            border: isCheckIn ? '1px solid #dcfce7' : '1px solid #fee2e2'
                                                        }}>
                                                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                                                                <span style={{
                                                                    fontSize: '11px', fontWeight: '700',
                                                                    color: isCheckIn ? '#166534' : '#991b1b',
                                                                    background: isCheckIn ? '#dcfce7' : '#fee2e2',
                                                                    padding: '4px 8px', borderRadius: '100px'
                                                                }}>
                                                                    {isCheckIn ? 'ARRIVING TODAY' : 'DEPARTING TODAY'}
                                                                </span>
                                                                <button
                                                                    onClick={() => isCheckIn ? null : handleUpdateBookingStatus(b.id, 'Completed')}
                                                                    style={{
                                                                        border: 'none', background: 'none', cursor: 'pointer',
                                                                        color: '#64748b', fontSize: '12px', fontWeight: '600',
                                                                        display: isCheckIn ? 'none' : 'block'
                                                                    }}
                                                                >
                                                                    Mark Checked Out
                                                                </button>
                                                            </div>
                                                            <h4 style={{ margin: 0, fontSize: '15px' }}>{b.guest_name}</h4>
                                                            <p style={{ margin: '4px 0 0', fontSize: '13px', color: '#64748b' }}>
                                                                Room: {b.room_title}
                                                            </p>
                                                        </div>
                                                    );
                                                })}
                                            </div>

                                            <div className="table-container">
                                                <table>
                                                    <thead>
                                                        <tr>
                                                            <th>Guest Name</th>
                                                            <th>Room Type</th>
                                                            <th>Dates</th>
                                                            <th>Status</th>
                                                            <th>Total Price</th>
                                                            <th style={{ textAlign: 'right' }}>Action</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {bookings
                                                            .filter(b => {
                                                                const isPast = new Date(b.check_out) < new Date();
                                                                const status = b.status?.toLowerCase();
                                                                const isHistoryStatus = status === 'completed' || status === 'cancelled';

                                                                // Bookings Tab: Only show current/future and non-cancelled/non-completed
                                                                if (isPast || isHistoryStatus) return false;

                                                                if (bookingFilter === 'All Active') return true;
                                                                return b.status === bookingFilter;
                                                            })
                                                            .map(booking => (
                                                                <BookingRow
                                                                    key={booking.id}
                                                                    booking={booking}
                                                                    onView={() => setSelectedBooking(booking)}
                                                                />
                                                            ))}
                                                        {bookings.length === 0 && (
                                                            <tr><td colSpan="6"><EmptyState message="No reservations found." /></td></tr>
                                                        )}
                                                    </tbody>
                                                </table>
                                            </div>
                                        </>
                                    )}
                                </motion.div>
                            ) : (
                                <motion.div
                                    key="history"
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -20 }}
                                >
                                    <div className="section-header">
                                        <h2>Booking History</h2>
                                        <p style={{ color: '#64748b', fontSize: '14px' }}>Past, Completed, and Cancelled reservations</p>
                                    </div>

                                    {loading ? <LoaderComponent /> : (
                                        <div className="table-container">
                                            <table>
                                                <thead>
                                                    <tr>
                                                        <th>Guest Name</th>
                                                        <th>Room Type</th>
                                                        <th>Dates</th>
                                                        <th>Status</th>
                                                        <th>Total Price</th>
                                                        <th style={{ textAlign: 'right' }}>Action</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {bookings
                                                        .filter(b => {
                                                            const isPast = new Date(b.check_out) < new Date();
                                                            const status = b.status?.toLowerCase();
                                                            const isHistoryStatus = status === 'completed' || status === 'cancelled';
                                                            return isPast || isHistoryStatus;
                                                        })
                                                        .map(booking => (
                                                            <BookingRow
                                                                key={booking.id}
                                                                booking={booking}
                                                                onView={() => setSelectedBooking(booking)}
                                                            />
                                                        ))}
                                                    {bookings.filter(b => {
                                                        const isPast = new Date(b.check_out) < new Date();
                                                        const status = b.status?.toLowerCase();
                                                        const isHistoryStatus = status === 'completed' || status === 'cancelled';
                                                        return isPast || isHistoryStatus;
                                                    }).length === 0 && (
                                                            <tr><td colSpan="6"><EmptyState message="No previous bookings found." /></td></tr>
                                                        )}
                                                </tbody>
                                            </table>
                                        </div>
                                    )}
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </motion.div>

                {/* Offline Indicator Banner */}
                <AnimatePresence>
                    {!partnerData.is_active && (
                        <motion.div
                            initial={{ y: 50, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            exit={{ y: 50, opacity: 0 }}
                            style={{
                                position: 'fixed',
                                bottom: '32px',
                                left: 0,
                                right: 0,
                                display: 'flex',
                                justifyContent: 'center',
                                zIndex: 1000,
                                pointerEvents: 'none' // Allow clicks through the gap
                            }}
                        >
                            <motion.div
                                initial={{ y: 50, opacity: 0 }}
                                animate={{ y: 0, opacity: 1 }}
                                exit={{ y: 50, opacity: 0 }}
                                style={{
                                    background: '#1e293b',
                                    color: 'white',
                                    padding: '16px 32px',
                                    borderRadius: '100px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '16px',
                                    boxShadow: '0 10px 30px rgba(0,0,0,0.3)',
                                    border: '1px solid rgba(255,255,255,0.1)',
                                    pointerEvents: 'auto'
                                }}
                            >
                                <div style={{ width: '8px', height: '8px', background: '#94a3b8', borderRadius: '50%' }}></div>
                                <span style={{ fontSize: '14px', fontWeight: '600' }}>Your Shop is currently Offline</span>
                                <button
                                    onClick={togglePartnerStatus}
                                    style={{
                                        background: '#10b981',
                                        border: 'none',
                                        color: 'white',
                                        padding: '4px 12px',
                                        borderRadius: '100px',
                                        fontSize: '12px',
                                        fontWeight: '800',
                                        cursor: 'pointer'
                                    }}
                                >
                                    GO ONLINE
                                </button>
                            </motion.div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* MODALS */}
            <AnimatePresence>
                {showRoomModal && (
                    <Modal title={editingRoomId ? "Edit Room" : "Add New Room"} onClose={() => {
                        setShowRoomModal(false);
                        setEditingRoomId(null);
                        setNewRoom({ title: '', price: '', location: '', description: '', type: 'Boarding', room_type: 'Individual', image_url: '', amenities: [] });
                    }}>
                        <form onSubmit={handleCreateRoom}>
                            <div className="form-group">
                                <label>Room Number / Name</label>
                                <input
                                    className="form-input"
                                    placeholder="e.g. Room 101 or Single Room A"
                                    value={newRoom.title}
                                    onChange={e => setNewRoom({ ...newRoom, title: e.target.value })}
                                    required
                                />
                            </div>
                            <div className="form-grid">
                                <div className="form-group">
                                    <label>Monthly Rent (LKR)</label>
                                    <input
                                        type="number"
                                        className="form-input"
                                        placeholder="0.00"
                                        value={newRoom.price}
                                        onChange={e => setNewRoom({ ...newRoom, price: e.target.value })}
                                        required
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Type</label>
                                    <input
                                        className="form-input"
                                        value={partnerData.property_type || newRoom.type}
                                        disabled
                                        style={{ opacity: 0.7, cursor: 'not-allowed' }}
                                    />
                                    <div style={{ fontSize: '11px', color: '#64748b', marginTop: '4px' }}>
                                        Registered as {partnerData.property_type}
                                    </div>
                                </div>
                                <div className="form-group">
                                    <label>Room Type</label>
                                    <select
                                        className="form-select"
                                        value={newRoom.room_type || 'Individual'}
                                        onChange={e => setNewRoom({ ...newRoom, room_type: e.target.value })}
                                    >
                                        <option value="Individual">Individual</option>
                                        <option value="Shared">Shared</option>
                                    </select>
                                </div>
                            </div>

                            <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '24px' }}>
                                <input
                                    type="checkbox"
                                    id="attached_bathroom"
                                    checked={newRoom.amenities.includes('attached_bathroom')}
                                    onChange={() => toggleAmenity('attached_bathroom')}
                                    style={{ width: '18px', height: '18px' }}
                                />
                                <label htmlFor="attached_bathroom" style={{ margin: 0, fontSize: '14px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                    <CheckCircle size={16} color={newRoom.amenities.includes('attached_bathroom') ? '#059669' : '#cbd5e1'} />
                                    Attached Bathroom
                                </label>
                            </div>

                            <div className="form-group">
                                <label>Location Reference</label>
                                <input
                                    className="form-input"
                                    placeholder="e.g. Near University Main Gate"
                                    value={newRoom.location}
                                    onChange={e => setNewRoom({ ...newRoom, location: e.target.value })}
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label>Property Image</label>
                                <div
                                    onClick={() => document.getElementById('room-image-upload').click()}
                                    style={{
                                        border: '2px dashed #E2E8F0',
                                        borderRadius: '16px',
                                        height: '120px',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        cursor: 'pointer',
                                        background: '#F8FAFC',
                                        overflow: 'hidden',
                                        position: 'relative',
                                        transition: 'all 0.2s'
                                    }}
                                >
                                    {roomImagePreview || newRoom.image_url ? (
                                        <>
                                            <img
                                                src={roomImagePreview || newRoom.image_url}
                                                alt="Preview"
                                                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                            />
                                            <div style={{
                                                position: 'absolute',
                                                inset: 0,
                                                background: 'rgba(0,0,0,0.4)',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                opacity: 0,
                                                transition: 'opacity 0.2s'
                                            }} onMouseOver={e => e.currentTarget.style.opacity = 1} onMouseOut={e => e.currentTarget.style.opacity = 0}>
                                                <Edit2 color="white" size={24} />
                                            </div>
                                        </>
                                    ) : (
                                        <>
                                            <ImageIcon size={32} color="#94A3B8" />
                                            <span style={{ fontSize: '13px', color: '#64748B', marginTop: '8px' }}>Click to upload image</span>
                                        </>
                                    )}
                                </div>
                                <input
                                    id="room-image-upload"
                                    type="file"
                                    hidden
                                    accept="image/*"
                                    onChange={(e) => {
                                        const file = e.target.files[0];
                                        if (file) {
                                            setRoomImage(file);
                                            setRoomImagePreview(URL.createObjectURL(file));
                                        }
                                    }}
                                />
                            </div>
                            <div className="form-group">
                                <label>Key Amenities</label>
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                                    {amenitiesOptions.map(opt => (
                                        <div
                                            key={opt.id}
                                            className={`amenity-chip ${newRoom.amenities.includes(opt.id) ? 'selected' : ''}`}
                                            onClick={() => toggleAmenity(opt.id)}
                                        >
                                            {opt.icon} {opt.label}
                                        </div>
                                    ))}
                                </div>
                            </div>
                            <div className="form-group">
                                <label>Full Description</label>
                                <textarea
                                    className="form-textarea"
                                    rows={3}
                                    placeholder="Detail any specific rules, inclusions, or highlights..."
                                    value={newRoom.description}
                                    onChange={e => setNewRoom({ ...newRoom, description: e.target.value })}
                                />
                            </div>
                            <button
                                type="submit"
                                className="primary-btn"
                                style={{
                                    width: '100%',
                                    justifyContent: 'center',
                                    padding: '16px',
                                    opacity: isUploading ? 0.7 : 1,
                                    cursor: isUploading ? 'not-allowed' : 'pointer'
                                }}
                                disabled={isUploading}
                            >
                                {isUploading ? (
                                    <><Loader2 className="spin" size={20} /> Processing...</>
                                ) : (
                                    editingRoomId ? 'Update Property' : 'Create Property Listing'
                                )}
                            </button>
                        </form>
                    </Modal>
                )}

                {showBookingModal && (
                    <Modal title="Direct Reservation" onClose={() => setShowBookingModal(false)}>
                        <form onSubmit={handleCreateBooking}>
                            <div className="form-group">
                                <label>Select Property</label>
                                <select
                                    className="form-select"
                                    value={newBooking.room_id}
                                    onChange={e => {
                                        const rId = e.target.value;
                                        const selectedRoom = rooms.find(r => String(r.id) === String(rId));
                                        setNewBooking({
                                            ...newBooking,
                                            room_id: rId,
                                            total_price: selectedRoom ? selectedRoom.price_per_month : ''
                                        });
                                    }}
                                    required
                                >
                                    <option value="">Choose a room...</option>
                                    {rooms.map(r => <option key={r.id} value={r.id}>{r.title}</option>)}
                                </select>
                            </div>
                            <div className="form-group">
                                <label>Full Name of Guest</label>
                                <input
                                    className="form-input"
                                    value={newBooking.guest_name}
                                    onChange={e => setNewBooking({ ...newBooking, guest_name: e.target.value })}
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label>Contact Number</label>
                                <input
                                    className="form-input"
                                    value={newBooking.guest_phone}
                                    onChange={e => setNewBooking({ ...newBooking, guest_phone: e.target.value })}
                                    required
                                />
                            </div>
                            <div className="form-grid">
                                <div className="form-group">
                                    <label>Start Date</label>
                                    <input
                                        type="date"
                                        className="form-input"
                                        value={newBooking.check_in}
                                        onChange={e => setNewBooking({ ...newBooking, check_in: e.target.value })}
                                        required
                                    />
                                </div>
                                <div className="form-group">
                                    <label>End Date</label>
                                    <input
                                        type="date"
                                        className="form-input"
                                        value={newBooking.check_out}
                                        onChange={e => setNewBooking({ ...newBooking, check_out: e.target.value })}
                                        required
                                    />
                                </div>
                            </div>

                            {/* Availability Warning */}
                            {bookingConflict && (
                                <div style={{
                                    background: '#fee2e2', padding: '12px', borderRadius: '12px',
                                    marginBottom: '20px', border: '1px solid #fecaca',
                                    color: '#991b1b', fontSize: '13px'
                                }}>
                                    <div style={{ fontWeight: '700', marginBottom: '4px' }}>⚠️ {bookingConflict.message}</div>
                                    <ul style={{ margin: '4px 0 0 16px', padding: 0 }}>
                                        {bookingConflict.conflictingDates.map((c, i) => (
                                            <li key={i}>
                                                Occupied: {new Date(c.check_in).toLocaleDateString()} — {new Date(c.check_out).toLocaleDateString()}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                                <div className="form-group">
                                    <label>Negotiated Price (LKR)</label>
                                    <input
                                        type="number"
                                        className="form-input"
                                        value={newBooking.total_price}
                                        onChange={e => setNewBooking({ ...newBooking, total_price: e.target.value })}
                                        required
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Initial Status</label>
                                    <select
                                        className="form-select"
                                        value={newBooking.status || 'Confirmed'}
                                        onChange={e => setNewBooking({ ...newBooking, status: e.target.value })}
                                    >
                                        <option value="Confirmed">Confirmed</option>
                                        <option value="Pending">Pending Inquiry</option>
                                    </select>
                                </div>
                            </div>
                            <button type="submit" className="primary-btn" style={{ width: '100%', justifyContent: 'center', padding: '16px' }}>
                                Confirm Reservation
                            </button>
                        </form>
                    </Modal>
                )}
                {selectedBooking && (
                    <Modal
                        title={isEditingBooking ? "Edit Reservation" : "Reservation Details"}
                        onClose={() => {
                            setSelectedBooking(null);
                            setIsEditingBooking(false);
                        }}
                    >
                        <form onSubmit={handleUpdateBooking} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                            <div style={{ background: '#f8fafc', padding: '20px', borderRadius: '20px', border: '1px solid #e2e8f0' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                                    <span className={`status-badge ${selectedBooking.status?.toLowerCase() || 'pending'}`} style={{ fontSize: '14px', padding: '8px 16px' }}>
                                        {selectedBooking.status || 'Pending'}
                                    </span>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <span style={{ fontSize: '14px', color: '#64748b', fontWeight: '500' }}>Reference: #{selectedBooking.id}</span>
                                        {!isEditingBooking && selectedBooking.status !== 'Completed' && (
                                            <button
                                                type="button"
                                                onClick={() => setIsEditingBooking(true)}
                                                className="btn-icon"
                                                style={{ background: '#f1f5f9', color: '#64748b', width: '32px', height: '32px', padding: 0 }}
                                            >
                                                <Edit2 size={16} />
                                            </button>
                                        )}
                                    </div>
                                </div>
                                {isEditingBooking ? (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                        <div className="form-group">
                                            <label style={{ fontSize: '11px' }}>Guest Name</label>
                                            <input
                                                className="form-input"
                                                value={selectedBooking.guest_name}
                                                onChange={e => setSelectedBooking({ ...selectedBooking, guest_name: e.target.value })}
                                                required
                                            />
                                        </div>
                                        <div className="form-group">
                                            <label style={{ fontSize: '11px' }}>Contact Number</label>
                                            <input
                                                className="form-input"
                                                value={selectedBooking.guest_phone}
                                                onChange={e => setSelectedBooking({ ...selectedBooking, guest_phone: e.target.value })}
                                                required
                                            />
                                        </div>
                                    </div>
                                ) : (
                                    <>
                                        <h3 style={{ fontSize: '20px', fontWeight: '800', color: '#0f172a', margin: '0 0 4px 0' }}>{selectedBooking.guest_name}</h3>
                                        <p style={{ color: '#64748b', margin: 0, display: 'flex', alignItems: 'center', gap: '6px' }}>
                                            <Users size={16} /> {selectedBooking.guest_phone}
                                        </p>
                                    </>
                                )}
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                                <div>
                                    <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#94a3b8', textTransform: 'uppercase', marginBottom: '8px' }}>Stay Duration</label>
                                    <div style={{ background: 'white', padding: '16px', borderRadius: '16px', border: '1px solid #e2e8f0' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
                                            <Calendar size={18} color="#059669" />
                                            <div>
                                                <div style={{ fontSize: '11px', color: '#94a3b8' }}>Check In</div>
                                                {isEditingBooking ? (
                                                    <input
                                                        type="date"
                                                        className="form-input"
                                                        style={{ padding: '4px 8px', fontSize: '13px' }}
                                                        value={selectedBooking.check_in.split('T')[0]}
                                                        disabled={selectedBooking.status === 'Confirmed'}
                                                        onChange={e => setSelectedBooking({ ...selectedBooking, check_in: e.target.value })}
                                                    />
                                                ) : (
                                                    <div style={{ fontSize: '14px', fontWeight: '700' }}>{new Date(selectedBooking.check_in).toLocaleDateString()}</div>
                                                )}
                                            </div>
                                        </div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                            <Calendar size={18} color="#ef4444" />
                                            <div>
                                                <div style={{ fontSize: '11px', color: '#94a3b8' }}>Check Out</div>
                                                {isEditingBooking ? (
                                                    <input
                                                        type="date"
                                                        className="form-input"
                                                        style={{ padding: '4px 8px', fontSize: '13px' }}
                                                        value={selectedBooking.check_out.split('T')[0]}
                                                        onChange={e => setSelectedBooking({ ...selectedBooking, check_out: e.target.value })}
                                                    />
                                                ) : (
                                                    <div style={{ fontSize: '14px', fontWeight: '700' }}>{new Date(selectedBooking.check_out).toLocaleDateString()}</div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div>
                                    <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#94a3b8', textTransform: 'uppercase', marginBottom: '8px' }}>Accounting</label>
                                    <div style={{ background: 'white', padding: '16px', borderRadius: '16px', border: '1px solid #e2e8f0', height: 'fit-content' }}>
                                        <div style={{ fontSize: '11px', color: '#94a3b8' }}>Total Agreed Amount</div>
                                        {isEditingBooking ? (
                                            <input
                                                type="number"
                                                className="form-input"
                                                style={{ fontSize: '18px', fontWeight: '800', color: '#059669', padding: '4px 8px' }}
                                                value={selectedBooking.total_price}
                                                onChange={e => setSelectedBooking({ ...selectedBooking, total_price: e.target.value })}
                                            />
                                        ) : (
                                            <div style={{ fontSize: '22px', fontWeight: '800', color: '#059669' }}>LKR {Number(selectedBooking.total_price).toLocaleString()}</div>
                                        )}
                                        <div style={{ marginTop: '8px', padding: '4px 10px', background: '#f0fdf4', borderRadius: '8px', fontSize: '11px', color: '#166534', fontWeight: '600', width: 'fit-content' }}>
                                            Payment Confirmed
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {!isEditingBooking ? (
                                <>
                                    <div>
                                        <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#94a3b8', textTransform: 'uppercase', marginBottom: '8px' }}>Property Details</label>
                                        <div style={{ background: 'white', padding: '16px', borderRadius: '16px', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: '12px' }}>
                                            <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#059669' }}>
                                                <Home size={24} />
                                            </div>
                                            <div>
                                                <div style={{ fontSize: '15px', fontWeight: '700' }}>{selectedBooking.room_title || 'Untitled Property'}</div>
                                                <div style={{ fontSize: '12px', color: '#64748b' }}>Individual Room Lease</div>
                                            </div>
                                        </div>
                                    </div>

                                    <div style={{ display: 'flex', gap: '12px', marginTop: '12px' }}>
                                        {selectedBooking.status === 'Confirmed' && (
                                            <button
                                                type="button"
                                                onClick={() => handleUpdateBookingStatus(selectedBooking.id, 'Completed')}
                                                className="primary-btn"
                                                style={{ flex: 1, justifyContent: 'center', padding: '14px', background: '#059669' }}
                                            >
                                                <CheckCircle size={18} /> Mark as Completed
                                            </button>
                                        )}
                                        {selectedBooking.status === 'Pending' && (
                                            <button
                                                type="button"
                                                onClick={() => handleUpdateBookingStatus(selectedBooking.id, 'Confirmed')}
                                                className="primary-btn"
                                                style={{ flex: 1, justifyContent: 'center', padding: '14px', background: '#3b82f6' }}
                                            >
                                                <CheckCircle size={18} /> Confirm Booking
                                            </button>
                                        )}
                                        {selectedBooking.status !== 'Cancelled' && selectedBooking.status !== 'Completed' && (
                                            <button
                                                type="button"
                                                onClick={() => handleUpdateBookingStatus(selectedBooking.id, 'Cancelled')}
                                                className="secondary-btn"
                                                style={{
                                                    flex: 1,
                                                    justifyContent: 'center',
                                                    padding: '14px',
                                                    color: '#ef4444',
                                                    borderColor: '#fee2e2',
                                                    background: '#fef2f2'
                                                }}
                                            >
                                                <XCircle size={18} /> Cancel Booking
                                            </button>
                                        )}
                                    </div>
                                </>
                            ) : (
                                <div style={{ display: 'flex', gap: '12px', marginTop: '12px' }}>
                                    <button
                                        type="submit"
                                        className="primary-btn"
                                        style={{ flex: 1, justifyContent: 'center', padding: '14px' }}
                                    >
                                        Save Changes
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setIsEditingBooking(false)}
                                        className="secondary-btn"
                                        style={{ flex: 1, justifyContent: 'center', padding: '14px' }}
                                    >
                                        Cancel
                                    </button>
                                </div>
                            )}

                            {!isEditingBooking && (
                                <button type="button" onClick={() => setSelectedBooking(null)} className="secondary-btn" style={{ width: '100%', justifyContent: 'center', padding: '12px', marginTop: '8px', border: 'none' }}>
                                    Close View
                                </button>
                            )}
                        </form>
                    </Modal>
                )}
            </AnimatePresence>
        </div>
    );
};

// Internal Components
const StatCard = ({ icon, label, value, variant, subtitle }) => (
    <motion.div
        whileHover={{ y: -8, boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)' }}
        className="stat-card"
        style={{
            background: 'white',
            borderRadius: '24px',
            padding: '24px',
            display: 'flex',
            alignItems: 'center',
            gap: '20px',
            border: '1px solid #f1f5f9',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)',
            position: 'relative',
            overflow: 'hidden'
        }}
    >
        <div style={{
            width: '64px',
            height: '64px',
            borderRadius: '18px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: variant === 'revenue' ? '#f0fdf4' : variant === 'rooms' ? '#eff6ff' : '#faf5ff',
            color: variant === 'revenue' ? '#059669' : variant === 'rooms' ? '#2563eb' : '#7c3aed'
        }}>
            {React.cloneElement(icon, { size: 28 })}
        </div>
        <div>
            <div style={{ fontSize: '14px', fontWeight: '600', color: '#64748b', marginBottom: '4px' }}>{label}</div>
            <div style={{ fontSize: '28px', fontWeight: '900', color: '#0f172a', lineHeight: '1' }}>{value}</div>
            {subtitle && <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '6px' }}>{subtitle}</div>}
        </div>
        <div style={{
            position: 'absolute',
            bottom: '-10px',
            right: '-10px',
            opacity: 0.05,
            transform: 'rotate(-15deg)'
        }}>
            {React.cloneElement(icon, { size: 80 })}
        </div>
    </motion.div>
);

const RoomCard = ({ room, onDelete, onStatusChange, onEdit }) => {
    let images = [];
    try { images = typeof room.images === 'string' ? JSON.parse(room.images) : (room.images || []); } catch (e) { }
    const mainImg = images[0] || "https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?auto=format&fit=crop&q=80&w=800";

    // Status Logic
    const currentStatus = room.status || (room.is_available ? 'Available' : 'Occupied');
    const statusColors = {
        'Available': { bg: '#dcfce7', text: '#166534', border: '#bbf7d0', ring: '#22c55e' },
        'Occupied': { bg: '#dbeafe', text: '#1e40af', border: '#bfdbfe', ring: '#3b82f6' },
        'Maintenance': { bg: '#ffedd5', text: '#9a3412', border: '#fed7aa', ring: '#f97316' },
        'Hidden': { bg: '#f1f5f9', text: '#475569', border: '#e2e8f0', ring: '#64748b' }
    };
    const style = statusColors[currentStatus] || statusColors['Available'];

    // Amenities parsing
    let amenitiesList = [];
    try { amenitiesList = typeof room.amenities === 'string' ? JSON.parse(room.amenities) : (room.amenities || []); } catch (e) { }

    const amenityIcons = {
        'wifi': <Wifi size={14} />,
        'ac': <Wind size={14} />,
        'parking': <Car size={14} />,
        'kitchen': <Coffee size={14} />,
        'tv': <Tv size={14} />,
        'attached_bathroom': <CheckCircle size={14} />
    };

    const getGenderIcon = (gender) => {
        if (gender === 'Male') return <Users size={14} color="#3b82f6" />;
        if (gender === 'Female') return <Users size={14} color="#ec4899" />;
        return <Users size={14} color="#64748b" />;
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            whileHover={{ y: -8 }}
            className="glass-card"
            style={{
                position: 'relative',
                overflow: 'hidden',
                display: 'flex',
                flexDirection: 'column',
                height: '100%',
                background: 'rgba(255, 255, 255, 0.9)',
                backdropFilter: 'blur(10px)',
                borderRadius: '24px',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                boxShadow: '0 10px 30px rgba(0,0,0,0.05)',
                minHeight: '440px'
            }}
        >
            <div className="card-image" style={{ height: '180px', position: 'relative', overflow: 'hidden' }}>
                <img src={mainImg} alt={room.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />

                {/* Overlay Tags */}
                <div style={{ position: 'absolute', top: '12px', left: '12px', display: 'flex', gap: '8px' }}>
                    <div style={{
                        background: 'rgba(255,255,255,0.95)', backdropFilter: 'blur(8px)',
                        padding: '4px 12px', borderRadius: '100px',
                        color: '#0f172a', fontSize: '10px', fontWeight: '800',
                        display: 'flex', alignItems: 'center', gap: '6px',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                        textTransform: 'uppercase'
                    }}>
                        <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: style.ring }}></div>
                        {currentStatus}
                    </div>
                </div>

                <div style={{
                    position: 'absolute', top: '12px', right: '12px',
                    background: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(8px)',
                    padding: '4px 12px', borderRadius: '100px',
                    color: 'white', fontSize: '10px', fontWeight: '700',
                    display: 'flex', alignItems: 'center', gap: '6px',
                    textTransform: 'uppercase'
                }}>
                    <Home size={10} />
                    {room.property_type}
                </div>

                <div style={{
                    position: 'absolute', bottom: '12px', left: '12px',
                    background: 'rgba(255, 255, 255, 0.95)', padding: '6px 12px',
                    borderRadius: '12px', fontSize: '14px', fontWeight: '800',
                    color: '#1e293b', boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
                    display: 'flex', alignItems: 'baseline', gap: '2px'
                }}>
                    LKR {Number(room.price_per_month).toLocaleString()}
                    <span style={{ fontSize: '10px', color: '#64748b', fontWeight: '500' }}>/mo</span>
                </div>
            </div>

            <div className="card-body" style={{ padding: '20px', display: 'flex', flexDirection: 'column', flex: 1 }}>
                <div style={{ marginBottom: '12px' }}>
                    <h3 style={{
                        fontSize: '16px',
                        fontWeight: '800',
                        color: '#1e293b',
                        marginBottom: '4px',
                        lineHeight: '1.4'
                    }}>{room.title}</h3>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', color: '#64748b' }}>
                        <MapPin size={12} />
                        {room.location_name}
                    </div>
                </div>

                {/* Details Row */}
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '16px' }}>
                    <div style={{
                        display: 'flex', alignItems: 'center', gap: '6px',
                        padding: '4px 10px', background: '#f8fafc',
                        borderRadius: '8px', border: '1px solid #e2e8f0'
                    }}>
                        {getGenderIcon(room.gender_restriction)}
                        <span style={{ fontSize: '11px', fontWeight: '600', color: '#475569' }}>
                            {room.gender_restriction || 'Any'}
                        </span>
                    </div>

                    <div style={{
                        display: 'flex', alignItems: 'center', gap: '6px',
                        padding: '4px 10px', background: '#eff6ff',
                        borderRadius: '8px', border: '1px solid #dbeafe'
                    }}>
                        <Bed size={12} color="#2563eb" />
                        <span style={{ fontSize: '11px', fontWeight: '600', color: '#1e40af' }}>
                            {room.room_type || 'Room'}
                        </span>
                    </div>

                    {amenitiesList.includes('attached_bathroom') && (
                        <div style={{
                            display: 'flex', alignItems: 'center', gap: '6px',
                            padding: '4px 10px', background: '#ecfdf5',
                            borderRadius: '8px', border: '1px solid #d1fae5'
                        }}>
                            <CheckCircle size={12} color="#059669" />
                            <span style={{ fontSize: '11px', fontWeight: '700', color: '#047857' }}>
                                Attached Bathroom
                            </span>
                        </div>
                    )}

                    <div style={{
                        display: 'flex', alignItems: 'center', gap: '6px',
                        padding: '4px 10px', background: '#f8fafc',
                        borderRadius: '8px', border: '1px solid #e2e8f0'
                    }}>
                        <Eye size={12} color="#64748b" />
                        <span style={{ fontSize: '11px', fontWeight: '600', color: '#475569' }}>
                            {room.views || 0}
                        </span>
                    </div>
                </div>

                <div style={{
                    display: 'flex', gap: '6px', marginBottom: '20px',
                    padding: '8px', background: '#f1f5f9',
                    borderRadius: '12px', flexWrap: 'wrap'
                }}>
                    {amenitiesList.filter(id => id !== 'attached_bathroom').length > 0 ? amenitiesList.filter(id => id !== 'attached_bathroom').map(id => (
                        <div key={id} style={{
                            width: '28px', height: '28px', borderRadius: '6px',
                            background: 'white', display: 'flex', alignItems: 'center',
                            justifyContent: 'center', color: '#2563eb',
                            boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
                        }} title={id}>
                            {amenityIcons[id] || <Home size={12} />}
                        </div>
                    )) : (
                        <span style={{ fontSize: '10px', color: '#94a3b8', padding: '4px' }}>Essentials included</span>
                    )}
                </div>

                {/* Actions Footer */}
                <div style={{ marginTop: 'auto', paddingTop: '16px', borderTop: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{ position: 'relative', flex: 1 }}>
                        <select
                            value={currentStatus}
                            onChange={(e) => onStatusChange(room.id, e.target.value)}
                            style={{
                                width: '100%',
                                appearance: 'none',
                                background: style.bg,
                                color: style.text,
                                border: `1px solid ${style.border}`,
                                padding: '8px 12px',
                                borderRadius: '10px',
                                fontSize: '12px',
                                fontWeight: '700',
                                cursor: 'pointer',
                                outline: 'none'
                            }}
                        >
                            <option value="Available">Available</option>
                            <option value="Occupied">Occupied</option>
                            <option value="Maintenance">Maintenance</option>
                            <option value="Hidden">Hidden</option>
                        </select>
                        <ChevronDown size={14} style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: style.text }} />
                    </div>

                    <div style={{ display: 'flex', gap: '6px' }}>
                        <button
                            onClick={() => onEdit(room)}
                            style={{
                                width: '36px', height: '36px', borderRadius: '10px', border: '1px solid #e2e8f0',
                                background: 'white', color: '#64748b', cursor: 'pointer',
                                display: 'flex', alignItems: 'center', justifyContent: 'center'
                            }}
                        >
                            <Edit2 size={16} />
                        </button>
                        <button
                            onClick={() => onDelete(room.id)}
                            style={{
                                width: '36px', height: '36px', borderRadius: '10px', border: 'none',
                                background: '#fee2e2', color: '#ef4444', cursor: 'pointer',
                                display: 'flex', alignItems: 'center', justifyContent: 'center'
                            }}
                        >
                            <Trash2 size={16} />
                        </button>
                    </div>
                </div>
            </div>
        </motion.div>
    );
};

const BookingRow = ({ booking, onView }) => (
    <motion.tr
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        style={{ borderBottom: '1px solid #f1f5f9' }}
    >
        <td>
            <div style={{ fontWeight: '700', color: '#0f172a' }}>{booking.guest_name}</div>
            <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '2px' }}>{booking.guest_phone}</div>
        </td>
        <td style={{ color: '#475569', fontSize: '14px' }}>
            {booking.room_title || <span style={{ opacity: 0.5 }}>Untitled Room</span>}
        </td>
        <td>
            <div style={{ fontSize: '14px', color: '#1e293b', fontWeight: '500' }}>
                {new Date(booking.check_in).toLocaleDateString()}
            </div>
            <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '2px' }}>
                to {new Date(booking.check_out).toLocaleDateString()}
            </div>
        </td>
        <td>
            <div className={`status-badge ${booking.status?.toLowerCase() || 'pending'}`}>
                {booking.status === 'Confirmed' && <CheckCircle size={12} />}
                {booking.status === 'Pending' && <Clock size={12} />}
                {booking.status === 'Cancelled' && <XCircle size={12} />}
                {booking.status === 'Completed' && <CheckCircle size={12} style={{ color: '#059669' }} />}
                {booking.status || 'Pending'}
            </div>
        </td>
        <td style={{ fontWeight: '800', color: '#059669', fontSize: '15px' }}>
            LKR {Number(booking.total_price).toLocaleString()}
        </td>
        <td style={{ textAlign: 'right' }}>
            <button
                onClick={onView}
                className="secondary-btn"
                style={{ padding: '8px 12px', borderRadius: '10px' }}
                title="View Full Details"
            >
                <Eye size={16} />
            </button>
        </td>
    </motion.tr>
);

const Modal = ({ title, onClose, children }) => (
    <div className="modal-overlay" onClick={onClose}>
        <motion.div
            className="modal-content"
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            onClick={e => e.stopPropagation()}
        >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
                <h2 style={{ fontSize: '24px', fontWeight: '800', margin: 0 }}>{title}</h2>
                <button onClick={onClose} style={{ border: 'none', background: 'none', cursor: 'pointer', padding: '4px' }}>
                    <XCircle size={24} color="#94a3b8" />
                </button>
            </div>
            {children}
        </motion.div>
    </div>
);

const LoaderComponent = () => (
    <div style={{ padding: '60px', textAlign: 'center', color: '#94a3b8' }}>
        <Loader2 className="spin" size={32} />
        <p style={{ marginTop: '16px', fontWeight: '500' }}>Syncing with server...</p>
    </div>
);

const EmptyState = ({ message }) => (
    <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '80px 40px', background: '#f8fafc', borderRadius: '24px', border: '2px dashed #e2e8f0' }}>
        <div style={{ color: '#94a3b8', marginBottom: '16px' }}>
            <Filter size={48} style={{ margin: '0 auto', opacity: 0.5 }} />
        </div>
        <p style={{ fontWeight: '500', color: '#64748b' }}>{message}</p>
    </div>
);

const LoadingScreen = ({ message }) => (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#f8fafc' }}>
        <div style={{ position: 'relative' }}>
            <div style={{ width: '48px', height: '48px', border: '4px solid #e2e8f0', borderTopColor: '#059669', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
        </div>
        <p style={{ marginTop: '20px', fontWeight: '600', color: '#475569' }}>{message}</p>
    </div>
);

export default PartnerRoom;
