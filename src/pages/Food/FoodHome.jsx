import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useUser } from '../../context/UserContext';
import {
    Search, Star, Clock, ArrowLeft, Filter, MapPin,
    ChevronRight, ChevronDown, GraduationCap, X,
    Flame, Zap, Heart, ShoppingBag
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import UserTypeModal from '../../components/common/UserTypeModal';

const categories = [
    { id: 'all', name: 'All', icon: <Zap size={18} /> },
    { id: 'rice', name: 'Rice & Curry', icon: '🍚' },
    { id: 'fast', name: 'Fast Food', icon: '🍔' },
    { id: 'drinks', name: 'Drinks', icon: '🥤' },
    { id: 'desserts', name: 'Desserts', icon: '🍰' }
];

const FoodHome = () => {
    const [universities, setUniversities] = useState([]);
    useEffect(() => {
        const fetchUnis = async () => {
            try {
                const res = await fetch('http://localhost:5000/api/universities');
                const data = await res.json();
                if (Array.isArray(data)) setUniversities(data.map(u => u.name));
            } catch (err) { console.error(err); }
        };
        fetchUnis();
    }, []);
    const navigate = useNavigate();
    const { search } = useLocation();
    const { userType, location, updateLocation, profile } = useUser();

    const resolveImageUrl = (url) => {
        if (!url || typeof url !== 'string' || url.trim() === '') return null;
        if (url.startsWith('http')) return url;
        return `http://localhost:5000${url.startsWith('/') ? '' : '/'}${url}`;
    };
    const [showUserTypeModal, setShowUserTypeModal] = useState(false);
    const [isUniSelectorOpen, setIsUniSelectorOpen] = useState(false);
    const selectorRef = useRef(null);

    const queryParams = new URLSearchParams(search);
    const initialSearch = queryParams.get('search') || '';

    const [restaurants, setRestaurants] = useState([]);
    const [searchQuery, setSearchQuery] = useState(initialSearch);
    const [activeCategory, setActiveCategory] = useState('all');
    const [isLoading, setIsLoading] = useState(true);
    const [hasOrderUpdate, setHasOrderUpdate] = useState(false);

    useEffect(() => {
        if (!userType) {
            setShowUserTypeModal(true);
        }
    }, [userType]);

    useEffect(() => {
        const fetchRestaurants = async () => {
            setIsLoading(true);
            try {
                const categoryParam = userType === 'student' ? 'uni' : 'city';
                const locationName = location?.name || '';
                const timestamp = new Date().getTime();

                const response = await fetch(`http://localhost:5000/api/restaurants?location=${encodeURIComponent(locationName)}&category=${categoryParam}&t=${timestamp}`);
                const data = await response.json();
                setRestaurants(data);
            } catch (err) {
                console.error('Failed to fetch restaurants:', err);
            } finally {
                setIsLoading(false);
            }
        };

        if (userType) {
            fetchRestaurants();
        }
    }, [userType, location]);

    // Order status notification logic
    useEffect(() => {
        const checkOrderUpdates = async () => {
            if (!profile?.id) return;

            try {
                const response = await fetch(`http://localhost:5000/api/orders/user/${profile.id}`);
                const orders = await response.json();

                // Get only active orders for the badge logic
                const activeOrders = orders.filter(o => !['Completed', 'Cancelled'].includes(o.status));

                // Load last known statuses
                const storageKey = `food_order_statuses_${profile.id}`;
                const lastKnown = JSON.parse(localStorage.getItem(storageKey) || '{}');

                let foundNewUpdate = false;

                activeOrders.forEach(order => {
                    if (lastKnown[order.id] && lastKnown[order.id] !== order.status) {
                        foundNewUpdate = true;
                    }
                    // Also flag if it's a new order that isn't 'Pending' (meaning it was already processed)
                    if (!lastKnown[order.id] && order.status !== 'Pending') {
                        foundNewUpdate = true;
                    }
                });

                if (foundNewUpdate) {
                    setHasOrderUpdate(true);
                }
            } catch (err) {
                console.error('Failed to check order updates:', err);
            }
        };

        if (userType && profile?.id) {
            checkOrderUpdates();
            const interval = setInterval(checkOrderUpdates, 3000); // Check every 3 seconds for immediate updates
            return () => clearInterval(interval);
        }
    }, [userType, profile]);

    const handleUniSelect = (uni) => {
        updateLocation({ name: uni, type: 'university' });
        setIsUniSelectorOpen(false);
    };

    const filteredRestaurants = restaurants.filter(res => {
        const matchesSearch = res.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            res.cuisine_type.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (res.food_names && res.food_names.toLowerCase().includes(searchQuery.toLowerCase()));
        const matchesCategory = activeCategory === 'all' || res.cuisine_type.toLowerCase().includes(activeCategory);
        return matchesSearch && matchesCategory;
    });

    return (
        <div style={{ backgroundColor: '#FDFDFD', minHeight: '100vh', paddingBottom: '60px', fontFamily: "'Inter', sans-serif" }}>
            <UserTypeModal
                isOpen={showUserTypeModal}
                onClose={() => setShowUserTypeModal(false)}
                redirectAfter="/food"
            />

            {/* Premium Sticky Header */}
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
                <motion.button
                    whileTap={{ scale: 0.9 }}
                    onClick={() => navigate('/home')}
                    style={{
                        width: '44px',
                        height: '44px',
                        borderRadius: '14px',
                        backgroundColor: '#F7F7F7',
                        color: '#1A1A1A',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        border: 'none',
                        cursor: 'pointer'
                    }}
                >
                    <ArrowLeft size={20} />
                </motion.button>

                <div style={{ flex: 1, position: 'relative' }}>
                    <motion.div
                        onClick={() => setIsUniSelectorOpen(!isUniSelectorOpen)}
                        style={{ cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                    >
                        <div style={{
                            width: '32px',
                            height: '32px',
                            borderRadius: '10px',
                            backgroundColor: '#E7F7EF',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                        }}>
                            <MapPin size={16} color="#00B14F" />
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                            <span style={{ fontSize: '11px', fontWeight: '700', color: '#00B14F', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Current Campus</span>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                <span style={{ fontSize: '15px', fontWeight: '800', color: '#1A1A1A' }}>{location?.name || 'Set Location'}</span>
                                <ChevronDown size={14} color="#6A6D7C" />
                            </div>
                        </div>
                    </motion.div>

                    {/* University Selector Dropdown */}
                    <AnimatePresence>
                        {isUniSelectorOpen && (
                            <motion.div
                                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                style={{
                                    position: 'absolute',
                                    top: '100%',
                                    left: 0,
                                    marginTop: '12px',
                                    backgroundColor: 'white',
                                    borderRadius: '20px',
                                    boxShadow: '0 20px 40px rgba(0,0,0,0.12)',
                                    border: '1px solid #F1F3F5',
                                    width: '280px',
                                    padding: '12px',
                                    maxHeight: '400px',
                                    overflowY: 'auto',
                                    zIndex: 200
                                }}
                            >
                                <div style={{ padding: '8px 12px 16px', borderBottom: '1px solid #F1F3F5', marginBottom: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <span style={{ fontSize: '14px', fontWeight: '800', color: '#1A1A1A' }}>Switch Campus</span>
                                    <X size={16} color="#6A6D7C" onClick={() => setIsUniSelectorOpen(false)} style={{ cursor: 'pointer' }} />
                                </div>
                                {universities.map(uni => (
                                    <motion.button
                                        key={uni}
                                        whileHover={{ backgroundColor: '#F9F9F9' }}
                                        onClick={() => handleUniSelect(uni)}
                                        style={{
                                            width: '100%',
                                            padding: '12px 16px',
                                            borderRadius: '12px',
                                            border: 'none',
                                            backgroundColor: location?.name === uni ? '#F0FDF4' : 'transparent',
                                            textAlign: 'left',
                                            fontSize: '14px',
                                            fontWeight: '600',
                                            color: location?.name === uni ? '#00B14F' : '#495057',
                                            cursor: 'pointer',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '10px'
                                        }}
                                    >
                                        <GraduationCap size={16} />
                                        {uni}
                                    </motion.button>
                                ))}
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                <div style={{ display: 'flex', gap: '8px' }}>
                    <motion.div
                        whileTap={{ scale: 0.9 }}
                        onClick={() => {
                            setHasOrderUpdate(false);
                            navigate('/food/orders');
                        }}
                        style={{
                            width: '44px',
                            height: '44px',
                            borderRadius: '14px',
                            backgroundColor: '#E7F7EF',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: 'pointer',
                            position: 'relative'
                        }}
                    >
                        <ShoppingBag size={20} color="#00B14F" />
                        {hasOrderUpdate && (
                            <motion.div
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                style={{
                                    position: 'absolute',
                                    top: '-2px',
                                    right: '-2px',
                                    width: '12px',
                                    height: '12px',
                                    backgroundColor: '#FF4D4D',
                                    borderRadius: '50%',
                                    border: '2px solid white',
                                    boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                                }}
                            />
                        )}
                    </motion.div>
                </div>
            </div>

            <div style={{ padding: '24px 20px' }}>
                {/* Visual Title & Search */}
                <div style={{ marginBottom: '32px' }}>
                    <h2 style={{ fontSize: '28px', fontWeight: '900', color: '#1A1A1A', letterSpacing: '-1px', marginBottom: '20px' }}>
                        What's on your <span style={{ color: '#00B14F' }}>plate</span> today?
                    </h2>

                    <div style={{ position: 'relative' }}>
                        <div style={{
                            position: 'absolute',
                            left: '18px',
                            top: '50%',
                            transform: 'translateY(-50%)',
                            color: '#00B14F'
                        }}>
                            <Search size={20} />
                        </div>
                        <input
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Find food, restaurants, cravings..."
                            style={{
                                width: '100%',
                                padding: '18px 24px 18px 52px',
                                borderRadius: '22px',
                                border: '2px solid #F1F3F5',
                                backgroundColor: 'white',
                                fontSize: '16px',
                                fontWeight: '600',
                                outline: 'none',
                                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                                boxShadow: '0 10px 30px rgba(0,0,0,0.03)'
                            }}
                            onFocus={(e) => {
                                e.target.style.borderColor = '#00B14F';
                                e.target.style.boxShadow = '0 15px 40px rgba(0,177,79,0.1)';
                            }}
                            onBlur={(e) => {
                                e.target.style.borderColor = '#F1F3F5';
                                e.target.style.boxShadow = '0 10px 30px rgba(0,0,0,0.03)';
                            }}
                        />
                    </div>
                </div>

                {/* Animated Category Scroll */}
                <div style={{
                    display: 'flex',
                    gap: '14px',
                    overflowX: 'auto',
                    padding: '8px 4px 24px',
                    margin: '0 -4px',
                    scrollbarWidth: 'none',
                    msOverflowStyle: 'none'
                }}>
                    {categories.map((cat) => (
                        <motion.button
                            key={cat.id}
                            whileHover={{ y: -4 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => setActiveCategory(cat.id)}
                            style={{
                                flexShrink: 0,
                                padding: '14px 24px',
                                borderRadius: '20px',
                                backgroundColor: activeCategory === cat.id ? '#00B14F' : 'white',
                                color: activeCategory === cat.id ? 'white' : '#495057',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '10px',
                                fontSize: '14px',
                                fontWeight: '700',
                                border: 'none',
                                boxShadow: activeCategory === cat.id ? '0 12px 24px rgba(0,177,79,0.15)' : '0 4px 12px rgba(0,0,0,0.03)',
                                cursor: 'pointer',
                                transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)'
                            }}
                        >
                            <span style={{ fontSize: '18px' }}>{cat.icon}</span>
                            {cat.name}
                        </motion.button>
                    ))}
                </div>

                {/* Recommendations Section */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Flame size={20} color="#FF4D4D" fill="#FF4D4D" />
                        <h3 style={{ fontSize: '20px', fontWeight: '800', color: '#1A1A1A' }}>
                            {userType === 'student' ? 'Campus Favorites' : 'Top Rated Nearby'}
                        </h3>
                    </div>
                    <motion.button style={{ border: 'none', background: 'none', color: '#00B14F', fontWeight: '700', fontSize: '14px', cursor: 'pointer' }}>
                        View all
                    </motion.button>
                </div>

                {/* Premium Restaurant List */}
                {isLoading ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                        {[1, 2, 3].map(i => (
                            <div key={i} style={{ height: '160px', borderRadius: '28px', backgroundColor: '#F1F3F5', animation: 'pulse 1.5s infinite' }}></div>
                        ))}
                    </div>
                ) : (
                    <motion.div
                        layout
                        style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}
                    >
                        {filteredRestaurants.length > 0 ? (
                            filteredRestaurants.map((res) => (
                                <motion.div
                                    layout
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    whileHover={{ y: -6, boxShadow: '0 25px 50px -12px rgba(0,0,0,0.08)' }}
                                    whileTap={{ scale: 0.98 }}
                                    key={res.id}
                                    onClick={() => navigate(`/food/${res.id}`)}
                                    style={{
                                        display: 'flex',
                                        gap: '20px',
                                        padding: '16px',
                                        borderRadius: '30px',
                                        backgroundColor: 'white',
                                        boxShadow: '0 10px 25px rgba(0,0,0,0.02)',
                                        cursor: 'pointer',
                                        border: '1px solid #F1F3F5',
                                        position: 'relative'
                                    }}
                                >
                                    {/* Image Container */}
                                    <div style={{
                                        width: '120px',
                                        height: '120px',
                                        borderRadius: '24px',
                                        backgroundColor: '#F8F9FA',
                                        backgroundImage: (res.image_url && res.image_url.trim() !== '') || (res.partner_avatar && res.partner_avatar.trim() !== '') ? `url("${resolveImageUrl(res.image_url || res.partner_avatar)}")` : 'none',
                                        backgroundSize: 'cover',
                                        backgroundPosition: 'center',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        flexShrink: 0,
                                        boxShadow: 'inset 0 0 20px rgba(0,0,0,0.02)'
                                    }}>
                                        {(!(res.image_url && res.image_url.trim() !== '') && !(res.partner_avatar && res.partner_avatar.trim() !== '')) && <span style={{ fontSize: '32px' }}>🍜</span>}
                                    </div>

                                    {/* Content Wrapper */}
                                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: '4px 0' }}>
                                        <div>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '4px' }}>
                                                <h4 style={{ fontSize: '18px', fontWeight: '800', color: '#1A1A1A', letterSpacing: '-0.3px' }}>{res.name}</h4>
                                                <div style={{
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: '4px',
                                                    backgroundColor: '#F0FDF4',
                                                    padding: '6px 10px',
                                                    borderRadius: '12px'
                                                }}>
                                                    <Star size={12} color="#00B14F" fill="#00B14F" />
                                                    <span style={{ fontSize: '13px', fontWeight: '800', color: '#00B14F' }}>{res.rating || '4.0'}</span>
                                                </div>
                                            </div>
                                            <p style={{ fontSize: '14px', color: '#6A6D7C', fontWeight: '500' }}>
                                                {res.cuisine_type} • {res.address?.split(',')[0]}
                                            </p>
                                        </div>

                                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                                                    <div style={{ width: '24px', height: '24px', borderRadius: '50%', backgroundColor: '#F1F3F5', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                        <Clock size={12} color="#495057" />
                                                    </div>
                                                </div>
                                            </div>
                                            <ChevronRight size={20} color="#DEE2E6" />
                                        </div>
                                    </div>
                                </motion.div>
                            ))
                        ) : (
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                style={{ textAlign: 'center', padding: '80px 24px' }}
                            >
                                <div style={{ fontSize: '64px', marginBottom: '24px' }}>🍽️</div>
                                <h3 style={{ fontSize: '20px', fontWeight: '800', color: '#1A1A1A', marginBottom: '8px' }}>No matches found</h3>
                                <p style={{ color: '#6A6D7C', fontWeight: '500', maxWidth: '240px', margin: '0 auto' }}>
                                    Nothing cooking here in {location?.name} matching your search. Try another category!
                                </p>
                                <motion.button
                                    whileTap={{ scale: 0.95 }}
                                    onClick={() => { setSearchQuery(''); setActiveCategory('all'); }}
                                    style={{
                                        marginTop: '24px',
                                        padding: '12px 24px',
                                        borderRadius: '14px',
                                        border: 'none',
                                        backgroundColor: '#00B14F',
                                        color: 'white',
                                        fontWeight: '700',
                                        cursor: 'pointer'
                                    }}
                                >
                                    Clear Filters
                                </motion.button>
                            </motion.div>
                        )}
                    </motion.div>
                )}
            </div>

            <style>{`
                @keyframes pulse {
                    0% { opacity: 1; }
                    50% { opacity: 0.5; }
                    100% { opacity: 1; }
                }
                * {
                    -webkit-tap-highlight-color: transparent;
                }
                ::-webkit-scrollbar {
                    display: none;
                }
            `}</style>
        </div>
    );
};

export default FoodHome;
