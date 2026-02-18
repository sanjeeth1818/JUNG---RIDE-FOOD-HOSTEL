import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useUser } from '../../context/UserContext';
import { ArrowLeft, Star, Clock, ShoppingBag, Plus, Minus, Info, Search, Filter, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const RestaurantDetail = () => {
    const navigate = useNavigate();
    const { id } = useParams();
    const { user } = useUser();

    const [restaurant, setRestaurant] = useState(null);
    const [menu, setMenu] = useState([]);
    const [categories, setCategories] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [cart, setCart] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [activeCategory, setActiveCategory] = useState('All');

    const resolveImageUrl = (url) => {
        if (!url || typeof url !== 'string' || url.trim() === '') return null;
        if (url.startsWith('http')) return url;
        return `http://localhost:5000${url.startsWith('/') ? '' : '/'}${url}`;
    };

    useEffect(() => {
        const fetchData = async () => {
            setIsLoading(true);
            try {
                const timestamp = new Date().getTime();
                // Fetch restaurant details
                const resResponse = await fetch(`http://localhost:5000/api/restaurants/${id}?t=${timestamp}`);
                const resData = await resResponse.json();
                setRestaurant(resData);

                // Fetch menu items
                const menuResponse = await fetch(`http://localhost:5000/api/restaurants/${id}/menu?t=${timestamp}`);
                const menuData = await menuResponse.json();
                setMenu(menuData);

                // Fetch categories
                const catResponse = await fetch(`http://localhost:5000/api/food-categories`);
                const catData = await catResponse.json();
                setCategories([{ id: 'all', name: 'All' }, ...catData]);
            } catch (err) {
                console.error('Failed to fetch restaurant data:', err);
            } finally {
                setIsLoading(false);
            }
        };
        fetchData();
    }, [id]);

    const addToCart = (item) => {
        setCart(prev => {
            const existing = prev.find(i => i.id === item.id);
            if (existing) {
                return prev.map(i => i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i);
            }
            return [...prev, { ...item, quantity: 1 }];
        });
    };

    const removeFromCart = (itemId) => {
        setCart(prev => {
            const existing = prev.find(i => i.id === itemId);
            if (existing.quantity === 1) {
                return prev.filter(i => i.id !== itemId);
            }
            return prev.map(i => i.id === itemId ? { ...i, quantity: i.quantity - 1 } : i);
        });
    };

    const getItemQuantity = (itemId) => {
        const item = cart.find(i => i.id === itemId);
        return item ? item.quantity : 0;
    };

    const cartTotal = cart.reduce((sum, item) => sum + (parseFloat(item.price) * item.quantity), 0);
    const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);

    const filteredMenu = menu.filter(item => {
        const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            item.description.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesCategory = activeCategory === 'All' || item.category === activeCategory;
        return matchesSearch && matchesCategory;
    });

    const groupedMenu = filteredMenu.reduce((acc, item) => {
        const cat = item.category || 'Uncategorized';
        if (!acc[cat]) acc[cat] = [];
        acc[cat].push(item);
        return acc;
    }, {});

    const sortedCategoryNames = Object.keys(groupedMenu).sort((a, b) => {
        if (a === 'Uncategorized') return 1;
        if (b === 'Uncategorized') return -1;
        return a.localeCompare(b);
    });

    if (isLoading) {
        return (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', backgroundColor: 'white' }}>
                <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
                    style={{ width: '40px', height: '40px', border: '4px solid #F1F3F5', borderTopColor: '#00B14F', borderRadius: '50%' }}
                />
            </div>
        );
    }

    if (!restaurant) {
        return (
            <div style={{ padding: '40px', textAlign: 'center' }}>
                <h2>Restaurant not found</h2>
                <button onClick={() => navigate('/food')}>Go Back</button>
            </div>
        );
    }

    return (
        <div style={{ backgroundColor: '#F8F9FA', minHeight: '100vh', paddingBottom: '120px' }}>
            {/* Hero Image / Header */}
            <div style={{
                height: '240px',
                backgroundColor: '#00B14F',
                position: 'relative',
                backgroundImage: (restaurant.image_url && restaurant.image_url.trim() !== '') || (restaurant.partner_avatar && restaurant.partner_avatar.trim() !== '') ? `url("${resolveImageUrl(restaurant.image_url || restaurant.partner_avatar)}")` : 'none',
                backgroundSize: 'cover',
                backgroundPosition: 'center'
            }}>
                <div style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    background: 'linear-gradient(to bottom, rgba(0,0,0,0.3) 0%, rgba(0,0,0,0.1) 100%)'
                }} />

                <motion.button
                    whileTap={{ scale: 0.9 }}
                    onClick={() => navigate(-1)}
                    style={{
                        position: 'absolute',
                        top: '24px',
                        left: '20px',
                        padding: '12px',
                        borderRadius: '16px',
                        backgroundColor: 'white',
                        boxShadow: '0 8px 20px rgba(0,0,0,0.15)',
                        zIndex: 10
                    }}
                >
                    <ArrowLeft size={20} color="#1A1A1A" />
                </motion.button>
            </div>

            {/* Restaurant Info Card */}
            <div style={{
                marginTop: '-40px',
                borderRadius: '32px 32px 0 0',
                backgroundColor: 'white',
                padding: '32px 20px 24px',
                position: 'relative',
                zIndex: 5,
                boxShadow: '0 -10px 30px rgba(0,0,0,0.03)'
            }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                    <div>
                        <h1 style={{ fontSize: '26px', fontWeight: '800', color: '#1A1A1A', marginBottom: '4px' }}>{restaurant.name}</h1>
                        <p style={{ color: '#6A6D7C', fontWeight: '500', fontSize: '15px' }}>{restaurant.cuisine_type} • {restaurant.address?.split(',')[0] || 'Local'}</p>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px', backgroundColor: '#E7F7EF', padding: '8px 14px', borderRadius: '14px' }}>
                        <Star size={16} color="#00B14F" fill="#00B14F" />
                        <span style={{ fontSize: '15px', fontWeight: '800', color: '#00B14F' }}>{restaurant.rating || '4.5'}</span>
                    </div>
                </div>

                <div style={{ display: 'flex', gap: '20px', marginBottom: '24px', marginTop: '16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div style={{ padding: '8px', backgroundColor: '#F1F3F5', borderRadius: '12px' }}>
                            <Clock size={16} color="#00B14F" />
                        </div>
                        <div>
                            <p style={{ fontSize: '12px', color: '#6A6D7C', fontWeight: '600' }}>Time</p>
                            <p style={{ fontSize: '14px', fontWeight: '700', color: '#1A1A1A' }}>{restaurant.delivery_time_min}-{restaurant.delivery_time_max} min</p>
                        </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div style={{ padding: '8px', backgroundColor: '#F1F3F5', borderRadius: '12px' }}>
                            <Info size={16} color="#00B14F" />
                        </div>
                        <div>
                            <p style={{ fontSize: '12px', color: '#6A6D7C', fontWeight: '600' }}>Type</p>
                            <p style={{ fontSize: '14px', fontWeight: '700', color: '#1A1A1A' }}>Order Now</p>
                        </div>
                    </div>
                </div>

                <div style={{ width: '100%', height: '1.5px', backgroundColor: '#F1F3F5', marginBottom: '24px' }}></div>

                {/* Search and Category Filter */}
                <div style={{ position: 'sticky', top: '10px', zIndex: 20, backgroundColor: 'white', padding: '10px 0', marginBottom: '24px' }}>
                    <div style={{ position: 'relative', marginBottom: '20px' }}>
                        <Search style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: '#6A6D7C' }} size={20} />
                        <input
                            type="text"
                            placeholder="Search dishes..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            style={{
                                width: '100%',
                                padding: '14px 16px 14px 48px',
                                borderRadius: '16px',
                                border: '1.5px solid #F1F3F5',
                                backgroundColor: '#F8F9FA',
                                fontSize: '15px',
                                outline: 'none',
                                fontWeight: '500'
                            }}
                        />
                    </div>

                    <div style={{ display: 'flex', gap: '12px', overflowX: 'auto', paddingBottom: '8px', scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
                        {categories.map(cat => (
                            <motion.button
                                key={cat.id}
                                whileTap={{ scale: 0.95 }}
                                onClick={() => setActiveCategory(cat.name)}
                                style={{
                                    padding: '10px 20px',
                                    borderRadius: '14px',
                                    backgroundColor: activeCategory === cat.name ? '#00B14F' : '#F1F3F5',
                                    color: activeCategory === cat.name ? 'white' : '#6A6D7C',
                                    fontSize: '14px',
                                    fontWeight: '700',
                                    whiteSpace: 'nowrap',
                                    border: 'none',
                                    cursor: 'pointer',
                                    transition: 'all 0.2s ease'
                                }}
                            >
                                {cat.name}
                            </motion.button>
                        ))}
                    </div>
                </div>

                {/* Menu Section */}
                {sortedCategoryNames.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '60px 0' }}>
                        <div style={{ fontSize: '48px', marginBottom: '16px' }}>🔍</div>
                        <h3 style={{ color: '#1A1A1A', fontWeight: '800' }}>No items found</h3>
                        <p style={{ color: '#6A6D7C' }}>Try adjusting your search or filters</p>
                    </div>
                ) : (
                    sortedCategoryNames.map(category => (
                        <div key={category} style={{ marginBottom: '40px' }}>
                            <h2 style={{ fontSize: '20px', fontWeight: '800', marginBottom: '20px', color: '#1A1A1A', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                {category}
                                <span style={{ fontSize: '14px', fontWeight: '600', color: '#00B14F', backgroundColor: '#E7F7EF', padding: '2px 8px', borderRadius: '8px' }}>
                                    {groupedMenu[category].length}
                                </span>
                            </h2>

                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' }}>
                                {groupedMenu[category].map(item => (
                                    <motion.div
                                        key={item.id}
                                        whileHover={{ y: -4 }}
                                        style={{
                                            display: 'flex',
                                            padding: '16px',
                                            backgroundColor: 'white',
                                            borderRadius: '20px',
                                            border: '1px solid #F1F3F5',
                                            boxShadow: '0 4px 15px rgba(0,0,0,0.02)',
                                            gap: '16px'
                                        }}
                                    >
                                        <div style={{ position: 'relative' }}>
                                            {item.image_url ? (
                                                <div style={{
                                                    width: '100px',
                                                    height: '100px',
                                                    borderRadius: '16px',
                                                    backgroundColor: '#F8F9FA',
                                                    backgroundImage: item.image_url && item.image_url.trim() !== '' ? `url("${resolveImageUrl(item.image_url)}")` : 'none',
                                                    backgroundSize: 'cover',
                                                    backgroundPosition: 'center',
                                                    flexShrink: 0
                                                }} />
                                            ) : (
                                                <div style={{
                                                    width: '100px',
                                                    height: '100px',
                                                    borderRadius: '16px',
                                                    backgroundColor: '#F8F9FA',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    fontSize: '32px',
                                                    flexShrink: 0
                                                }}>🥘</div>
                                            )}
                                        </div>

                                        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                                            <div>
                                                <h3 style={{ fontSize: '17px', fontWeight: '700', color: '#1A1A1A', marginBottom: '4px' }}>{item.name}</h3>
                                                <p style={{
                                                    fontSize: '13px',
                                                    color: '#6A6D7C',
                                                    marginBottom: '8px',
                                                    lineHeight: '1.4',
                                                    display: '-webkit-box',
                                                    WebkitLineClamp: '2',
                                                    WebkitBoxOrient: 'vertical',
                                                    overflow: 'hidden'
                                                }}>
                                                    {item.description}
                                                </p>
                                            </div>

                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                <span style={{ fontSize: '18px', fontWeight: '800', color: '#00B14F' }}>Rs. {parseFloat(item.price).toLocaleString()}</span>

                                                {/* Quantity Controls */}
                                                <div style={{ display: 'flex', alignItems: 'center', backgroundColor: '#F1F3F5', borderRadius: '12px', padding: '2px' }}>
                                                    {getItemQuantity(item.id) > 0 ? (
                                                        <>
                                                            <motion.button
                                                                whileTap={{ scale: 0.8 }}
                                                                onClick={(e) => { e.stopPropagation(); removeFromCart(item.id); }}
                                                                style={{ padding: '6px', color: '#00B14F', border: 'none', background: 'transparent', cursor: 'pointer' }}
                                                            >
                                                                <Minus size={16} />
                                                            </motion.button>
                                                            <span style={{ width: '20px', textAlign: 'center', fontSize: '13px', fontWeight: '700', color: '#1A1A1A' }}>
                                                                {getItemQuantity(item.id)}
                                                            </span>
                                                            <motion.button
                                                                whileTap={{ scale: 0.8 }}
                                                                onClick={(e) => { e.stopPropagation(); addToCart(item); }}
                                                                style={{ padding: '6px', color: '#00B14F', border: 'none', background: 'transparent', cursor: 'pointer' }}
                                                            >
                                                                <Plus size={16} />
                                                            </motion.button>
                                                        </>
                                                    ) : (
                                                        <motion.button
                                                            whileTap={{ scale: 0.9 }}
                                                            onClick={(e) => { e.stopPropagation(); addToCart(item); }}
                                                            style={{
                                                                padding: '6px 14px',
                                                                borderRadius: '10px',
                                                                backgroundColor: '#00B14F',
                                                                color: 'white',
                                                                fontWeight: '700',
                                                                fontSize: '13px',
                                                                border: 'none',
                                                                cursor: 'pointer'
                                                            }}
                                                        >
                                                            Add
                                                        </motion.button>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Floating Checkout Bar */}
            <AnimatePresence>
                {totalItems > 0 && (
                    <motion.div
                        initial={{ y: 100, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        exit={{ y: 100, opacity: 0 }}
                        style={{
                            position: 'fixed',
                            bottom: '24px',
                            left: '20px',
                            right: '20px',
                            padding: '16px 24px',
                            backgroundColor: '#1A1A1A', // Dark theme for the bar
                            borderRadius: '24px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            color: 'white',
                            boxShadow: '0 15px 35px rgba(0,0,0,0.2)',
                            zIndex: 100,
                            cursor: 'pointer'
                        }}
                        onClick={() => navigate('/food/checkout', { state: { cart, restaurant, total: cartTotal } })}
                    >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                            <div style={{
                                position: 'relative',
                                backgroundColor: '#00B14F',
                                padding: '10px',
                                borderRadius: '14px'
                            }}>
                                <ShoppingBag size={20} color="white" />
                                <span style={{
                                    position: 'absolute',
                                    top: '-6px',
                                    right: '-6px',
                                    backgroundColor: '#FF4136',
                                    color: 'white',
                                    fontSize: '11px',
                                    fontWeight: '800',
                                    width: '18px',
                                    height: '18px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    borderRadius: '50%',
                                    border: '2px solid #1A1A1A'
                                }}>
                                    {totalItems}
                                </span>
                            </div>
                            <div>
                                <p style={{ fontSize: '13px', fontWeight: '500', opacity: 0.8 }}>View your cart</p>
                                <p style={{ fontSize: '16px', fontWeight: '800' }}>Rs. {cartTotal.toLocaleString()}</p>
                            </div>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span style={{ fontWeight: '700', fontSize: '15px' }}>Checkout</span>
                            <ChevronRight size={18} />
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default RestaurantDetail;
