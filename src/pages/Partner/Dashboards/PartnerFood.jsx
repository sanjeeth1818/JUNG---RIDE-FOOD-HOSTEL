import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    LayoutDashboard, Utensils, Clock, TrendingUp, Power,
    List, Plus, MapPin, CheckCircle, Users, XCircle,
    Edit2, Trash2, Camera, User, Search, Filter
} from 'lucide-react';
import { useUser } from '../../../context/UserContext';
import { motion, AnimatePresence } from 'framer-motion';
import StatusToggle from '../../../components/common/StatusToggle';

const PartnerFood = () => {
    const { partnerData, togglePartnerStatus, loading: authLoading } = useUser();
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('orders');
    const [restaurant, setRestaurant] = useState(null);
    const [orders, setOrders] = useState([]);
    const [menuItems, setMenuItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [notification, setNotification] = useState(null);
    const [foodCategories, setFoodCategories] = useState([]);

    // Menu Modal State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingItem, setEditingItem] = useState(null);
    const [menuFormData, setMenuFormData] = useState({
        name: '',
        description: '',
        price: '',
        category: '',
        image_url: ''
    });
    const [imageFile, setImageFile] = useState(null);
    const [imagePreview, setImagePreview] = useState(null);
    const [uploadingImage, setUploadingImage] = useState(false);

    // Search and Filter State
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('All');

    // History Filter State
    const [historySearchQuery, setHistorySearchQuery] = useState('');
    const [historyDateFilter, setHistoryDateFilter] = useState('all'); // all, today, week, month

    const showNotification = (message, type = 'success') => {
        setNotification({ message, type });
        setTimeout(() => setNotification(null), 3000);
    };

    useEffect(() => {
        const controller = new AbortController();
        if (!authLoading && partnerData?.id) {
            fetchData(controller.signal);
            // Poll for updates every 15 seconds
            const interval = setInterval(() => fetchData(null, true), 15000);
            return () => {
                controller.abort();
                clearInterval(interval);
            };
        } else if (!authLoading && !partnerData) {
            setLoading(false);
        }
        return () => controller.abort();
    }, [partnerData, authLoading]);

    const fetchData = async (signal, isSilent = false) => {
        if (!isSilent) setLoading(true);
        setError(null);
        try {
            const [resInfo, ordersRes, catsRes] = await Promise.all([
                fetch(`http://localhost:5000/api/partners/restaurants/${partnerData.id}`, { signal }),
                fetch(`http://localhost:5000/api/partners/orders/${partnerData.id}`, { signal }),
                fetch(`http://localhost:5000/api/food-categories`, { signal })
            ]);

            if (!resInfo.ok || !ordersRes.ok || !catsRes.ok) throw new Error('Failed to fetch dashboard data');

            const restaurantData = await resInfo.json();
            const ordersData = await ordersRes.json();
            const categoriesData = await catsRes.json();

            if (!isSilent) console.log('Restaurant Data Loaded:', restaurantData);
            setRestaurant(restaurantData);
            setOrders(ordersData);
            setFoodCategories(categoriesData);

            if (restaurantData) {
                const menuRes = await fetch(`http://localhost:5000/api/restaurants/${restaurantData.id}/menu`, { signal });
                if (menuRes.ok) {
                    setMenuItems(await menuRes.json());
                }
            }
        } catch (err) {
            if (err.name === 'AbortError') return;
            console.error('Data Load Error:', err);
            if (!isSilent) setError('Failed to load dashboard data. Please check your connection.');
        } finally {
            if (!isSilent) setLoading(false);
        }
    };

    const handleUpdateOrderStatus = async (orderId, newStatus) => {
        try {
            const res = await fetch(`http://localhost:5000/api/orders/${orderId}/status`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: newStatus })
            });

            if (res.ok) {
                setOrders(orders.map(o => o.id === orderId ? { ...o, status: newStatus } : o));
                showNotification(`Order marked as ${newStatus}`);
            } else {
                showNotification('Failed to update status', 'error');
            }
        } catch (err) {
            showNotification('Network error', 'error');
        }
    };

    const handleOpenModal = (item = null) => {
        if (item) {
            setEditingItem(item);
            setMenuFormData({
                name: item.name,
                description: item.description,
                price: item.price,
                category: item.category || '',
                image_url: item.image_url || ''
            });
            setImagePreview(item.image_url ? `http://localhost:5000${item.image_url}` : null);
        } else {
            setEditingItem(null);
            setMenuFormData({
                name: '',
                description: '',
                price: '',
                category: '',
                image_url: ''
            });
            setImagePreview(null);
        }
        setImageFile(null);
        setIsModalOpen(true);
    };

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            // Validate file size (5MB)
            if (file.size > 5 * 1024 * 1024) {
                showNotification('Image size should be less than 5MB', 'error');
                return;
            }
            // Validate file type
            const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
            if (!allowedTypes.includes(file.type)) {
                showNotification('Only JPEG, PNG, GIF, and WebP images are allowed', 'error');
                return;
            }
            setImageFile(file);
            // Create preview
            const reader = new FileReader();
            reader.onloadend = () => {
                setImagePreview(reader.result);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSaveMenuItem = async (e) => {
        e.preventDefault();

        console.log('Save Menu Item Called');
        console.log('Restaurant:', restaurant);
        console.log('Editing Item:', editingItem);
        console.log('Form Data:', menuFormData);
        console.log('Image File:', imageFile);

        // Validate restaurant is loaded
        if (!editingItem && !restaurant) {
            console.error('Restaurant data not available');
            showNotification('Restaurant data not loaded. Please try again.', 'error');
            return;
        }

        try {
            let imageUrl = menuFormData.image_url;

            // Upload image if a new file is selected
            if (imageFile) {
                console.log('Uploading image...');
                setUploadingImage(true);
                const formData = new FormData();
                formData.append('image', imageFile);

                const uploadRes = await fetch('http://localhost:5000/api/upload/menu-image', {
                    method: 'POST',
                    body: formData
                });

                if (!uploadRes.ok) {
                    throw new Error('Failed to upload image');
                }

                const uploadData = await uploadRes.json();
                imageUrl = uploadData.imageUrl;
                console.log('Image uploaded:', imageUrl);
                setUploadingImage(false);
            }

            const url = editingItem
                ? `http://localhost:5000/api/menu_items/${editingItem.id}`
                : `http://localhost:5000/api/restaurants/menu`;

            const method = editingItem ? 'PUT' : 'POST';
            const body = editingItem
                ? { ...menuFormData, image_url: imageUrl }
                : { ...menuFormData, image_url: imageUrl, restaurant_id: restaurant.id };

            console.log('Sending request:', { url, method, body });

            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body)
            });

            if (res.ok) {
                console.log('Menu item saved successfully');
                showNotification(`Item ${editingItem ? 'updated' : 'added'} successfully`);
                setIsModalOpen(false);
                setImageFile(null);
                setImagePreview(null);
                fetchData(); // Refresh list
            } else {
                const errorData = await res.json();
                console.error('Save failed:', errorData);
                showNotification('Failed to save item', 'error');
            }
        } catch (err) {
            console.error('Save error:', err);
            showNotification(err.message || 'Network error', 'error');
        } finally {
            setUploadingImage(false);
        }
    };

    const handleDeleteMenuItem = async (id) => {
        if (!window.confirm('Are you sure you want to delete this item?')) return;

        try {
            const res = await fetch(`http://localhost:5000/api/menu_items/${id}`, {
                method: 'DELETE'
            });

            if (res.ok) {
                showNotification('Item deleted successfully');
                fetchData(); // Refresh list
            } else {
                showNotification('Failed to delete item', 'error');
            }
        } catch (err) {
            showNotification('Network error', 'error');
        }
    };

    if (authLoading || (partnerData && loading)) return <LoadingScreen message="Initializing Food Dashboard..." />;

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

    const isAccepting = partnerData?.is_active ?? true;
    const totalTodaySales = orders
        .filter(o => o.status === 'Completed')
        .reduce((sum, o) => sum + Number(o.total_amount), 0);
    const activeOrdersCount = orders.filter(o => ['Pending', 'Confirmed', 'Preparing'].includes(o.status)).length;

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
                    background: linear-gradient(135deg, #E65100 0%, #FF9800 100%);
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

                .stat-icon.orders { color: #E65100; }
                .stat-icon.sales { color: #2E7D32; }
                .stat-icon.trending { color: #7c3aed; }

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
                    color: #E65100;
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
                    background: #E65100;
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
                    box-shadow: 0 4px 12px rgba(230, 81, 0, 0.2);
                }

                .primary-btn:hover { background: #BF360C; transform: translateY(-1px); }

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

                .order-card {
                    background: white;
                    border: 1px solid #e2e8f0;
                    border-radius: 24px;
                    padding: 24px;
                    margin-bottom: 16px;
                    transition: all 0.3s;
                }

                .order-card:hover { transform: translateY(-4px); box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.05); }

                .status-badge {
                    display: inline-flex;
                    align-items: center;
                    gap: 6px;
                    padding: 6px 12px;
                    border-radius: 20px;
                    font-size: 12px;
                    font-weight: 600;
                }

                .status-badge.pending { background: #E65100; color: white; }
                .status-badge.confirmed { background: #dbeafe; color: #1e40af; }
                .status-badge.preparing { background: #fef9c3; color: #854d0e; }
                .status-badge.completed { background: #dcfce7; color: #166534; }
                .status-badge.cancelled { background: #fee2e2; color: #991b1b; }

                .denied-container { min-height: 100vh; display: flex; align-items: center; justify-content: center; background: #f8fafc; }
                .denied-card { background: white; padding: 48px; border-radius: 32px; text-align: center; box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.05); max-width: 400px; }
                .login-link { display: inline-block; margin-top: 24px; background: #E65100; color: white; padding: 12px 32px; border-radius: 12px; text-decoration: none; font-weight: 600; }

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
                            <h1>{partnerData?.business_name || restaurant?.name || 'My Restaurant'}</h1>
                            <div className="location-tag">
                                <MapPin size={14} />
                                <span>{partnerData?.locationName || partnerData?.location || 'Location Not Set'}</span>
                            </div>
                        </motion.div>

                        <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                            <StatusToggle
                                isActive={isAccepting}
                                onToggle={togglePartnerStatus}
                            />

                            <motion.button
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={() => navigate('/partner/dashboard/food/profile')}
                                style={{
                                    background: 'rgba(255,255,255,0.1)',
                                    padding: '12px',
                                    borderRadius: '16px',
                                    border: '1px solid rgba(255,255,255,0.2)',
                                    backdropFilter: 'blur(10px)',
                                    color: 'white',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    transition: 'all 0.2s'
                                }}
                                title="My Profile"
                            >
                                <User size={22} />
                            </motion.button>

                            <motion.div
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                style={{
                                    background: 'rgba(255,255,255,0.1)',
                                    padding: '12px 24px',
                                    borderRadius: '20px',
                                    border: '1px solid rgba(255,255,255,0.2)',
                                    backdropFilter: 'blur(10px)'
                                }}
                            >
                                <span style={{ fontSize: '12px', fontWeight: '600', opacity: 0.8, display: 'block', color: 'white' }}>Account Status</span>
                                <span style={{ fontSize: '15px', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '6px', color: 'white' }}>
                                    <CheckCircle size={16} fill="white" color="#E65100" /> Verified Partner
                                </span>
                            </motion.div>
                        </div>
                    </div>
                </div>
            </header>

            <div className="container" style={{ position: 'relative' }}>
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
                            icon={<Utensils size={24} />}
                            label="Active Orders"
                            value={activeOrdersCount}
                            variant="orders"
                        />
                        <StatCard
                            icon={<TrendingUp size={24} />}
                            label="Today's Sales"
                            value={`LKR ${totalTodaySales.toLocaleString()}`}
                            variant="sales"
                        />
                        <StatCard
                            icon={<Clock size={24} />}
                            label="Store Status"
                            value={isAccepting ? 'Open' : 'Closed'}
                            variant="trending"
                        />
                    </div>

                    <div className="main-content">
                        <div className="tabs-nav">
                            <button
                                className={`tab-btn ${activeTab === 'orders' ? 'active' : ''}`}
                                onClick={() => setActiveTab('orders')}
                            >
                                <Utensils size={18} /> Active Orders
                            </button>
                            <button
                                className={`tab-btn ${activeTab === 'menu' ? 'active' : ''}`}
                                onClick={() => setActiveTab('menu')}
                            >
                                <List size={18} /> Menu Management
                            </button>
                            <button
                                className={`tab-btn ${activeTab === 'history' ? 'active' : ''}`}
                                onClick={() => setActiveTab('history')}
                            >
                                <Users size={18} /> History
                            </button>
                        </div>

                        <AnimatePresence mode="wait">
                            {activeTab === 'orders' && (
                                <motion.div
                                    key="orders"
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -20 }}
                                >
                                    <div className="section-header">
                                        <h2>Recent Orders</h2>
                                        {orders.filter(o => o.status === 'Pending').length > 0 && (
                                            <span style={{ backgroundColor: '#E65100', color: 'white', padding: '4px 12px', borderRadius: '12px', fontSize: '13px', fontWeight: '700' }}>
                                                {orders.filter(o => o.status === 'Pending').length} New
                                            </span>
                                        )}
                                    </div>

                                    <div>
                                        {orders.length > 0 ? (
                                            orders.filter(o => o.status !== 'Completed' && o.status !== 'Cancelled').map(order => (
                                                <OrderCard
                                                    key={order.id}
                                                    order={order}
                                                    onUpdateStatus={handleUpdateOrderStatus}
                                                />
                                            ))
                                        ) : (
                                            <div style={{ textAlign: 'center', padding: '60px', color: '#64748b', background: 'white', borderRadius: '24px', border: '1px solid #e2e8f0' }}>
                                                <Utensils size={48} style={{ margin: '0 auto 16px', opacity: 0.3 }} />
                                                <p>No active orders at the moment.</p>
                                            </div>
                                        )}
                                    </div>
                                </motion.div>
                            )}

                            {activeTab === 'menu' && (
                                <motion.div
                                    key="menu"
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -20 }}
                                >
                                    <div className="section-header">
                                        <h2>Main Menu</h2>
                                        <button className="primary-btn" onClick={() => handleOpenModal()}>
                                            <Plus size={20} /> Add Item
                                        </button>
                                    </div>

                                    {/* Search and Filter Bar */}
                                    <div style={{
                                        display: 'flex',
                                        gap: '16px',
                                        marginBottom: '24px',
                                        flexWrap: 'wrap'
                                    }}>
                                        {/* Search Input */}
                                        <div style={{
                                            flex: '1 1 300px',
                                            position: 'relative'
                                        }}>
                                            <Search
                                                size={20}
                                                color="#64748b"
                                                style={{
                                                    position: 'absolute',
                                                    left: '16px',
                                                    top: '50%',
                                                    transform: 'translateY(-50%)'
                                                }}
                                            />
                                            <input
                                                type="text"
                                                placeholder="Search by name or category..."
                                                value={searchQuery}
                                                onChange={(e) => setSearchQuery(e.target.value)}
                                                style={{
                                                    width: '100%',
                                                    padding: '12px 16px 12px 48px',
                                                    borderRadius: '12px',
                                                    border: '1px solid #e2e8f0',
                                                    fontSize: '15px',
                                                    outline: 'none',
                                                    transition: 'border-color 0.2s'
                                                }}
                                                onFocus={(e) => e.target.style.borderColor = '#E65100'}
                                                onBlur={(e) => e.target.style.borderColor = '#e2e8f0'}
                                            />
                                        </div>

                                        {/* Category Filter */}
                                        <div style={{
                                            flex: '0 1 250px',
                                            position: 'relative'
                                        }}>
                                            <Filter
                                                size={20}
                                                color="#64748b"
                                                style={{
                                                    position: 'absolute',
                                                    left: '16px',
                                                    top: '50%',
                                                    transform: 'translateY(-50%)',
                                                    pointerEvents: 'none',
                                                    zIndex: 1
                                                }}
                                            />
                                            <select
                                                value={selectedCategory}
                                                onChange={(e) => setSelectedCategory(e.target.value)}
                                                style={{
                                                    width: '100%',
                                                    padding: '12px 16px 12px 48px',
                                                    borderRadius: '12px',
                                                    border: '1px solid #e2e8f0',
                                                    fontSize: '15px',
                                                    outline: 'none',
                                                    background: 'white',
                                                    cursor: 'pointer',
                                                    fontWeight: '600',
                                                    color: '#0f172a'
                                                }}
                                            >
                                                <option value="All">All Categories</option>
                                                {foodCategories.map(cat => (
                                                    <option key={cat.id} value={cat.name}>{cat.name}</option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>

                                    {menuItems.length > 0 ? (
                                        (() => {
                                            // Filter items based on search and category
                                            const filteredItems = menuItems.filter(item => {
                                                const matchesSearch = searchQuery === '' ||
                                                    item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                                                    (item.category && item.category.toLowerCase().includes(searchQuery.toLowerCase()));

                                                const matchesCategory = selectedCategory === 'All' ||
                                                    (selectedCategory === 'Uncategorized' && !item.category) ||
                                                    item.category === selectedCategory;

                                                return matchesSearch && matchesCategory;
                                            });

                                            if (filteredItems.length === 0) {
                                                return (
                                                    <div style={{ textAlign: 'center', padding: '60px', color: '#64748b', background: 'white', borderRadius: '24px', border: '1px solid #e2e8f0' }}>
                                                        <Utensils size={48} style={{ margin: '0 auto 16px', opacity: 0.3 }} />
                                                        <p>No items found matching your search.</p>
                                                        {(searchQuery || selectedCategory !== 'All') && (
                                                            <button
                                                                onClick={() => {
                                                                    setSearchQuery('');
                                                                    setSelectedCategory('All');
                                                                }}
                                                                style={{ border: 'none', background: 'transparent', color: '#E65100', fontWeight: '700', cursor: 'pointer', marginTop: '8px' }}
                                                            >
                                                                Clear filters
                                                            </button>
                                                        )}
                                                    </div>
                                                );
                                            }

                                            // Group items by category
                                            const groupedItems = filteredItems.reduce((acc, item) => {
                                                const category = item.category || 'Uncategorized';
                                                if (!acc[category]) acc[category] = [];
                                                acc[category].push(item);
                                                return acc;
                                            }, {});

                                            // Define category order
                                            const categoryOrder = foodCategories.map(c => c.name);
                                            const sortedCategories = Object.keys(groupedItems).sort((a, b) => {
                                                const indexA = categoryOrder.indexOf(a);
                                                const indexB = categoryOrder.indexOf(b);
                                                if (indexA === -1 && indexB === -1) return a.localeCompare(b);
                                                if (indexA === -1) return 1;
                                                if (indexB === -1) return -1;
                                                return indexA - indexB;
                                            });

                                            return sortedCategories.map(category => (
                                                <div key={category} style={{ marginBottom: '40px' }}>
                                                    <h3 style={{
                                                        fontSize: '18px',
                                                        fontWeight: '700',
                                                        color: '#0f172a',
                                                        marginBottom: '20px',
                                                        paddingBottom: '12px',
                                                        borderBottom: '2px solid #E65100'
                                                    }}>
                                                        {category}
                                                    </h3>
                                                    <div className="room-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '24px' }}>
                                                        {groupedItems[category].map(item => (
                                                            <div key={item.id} className="order-card" style={{ padding: '0', overflow: 'hidden', position: 'relative' }}>
                                                                <div style={{ height: '160px', background: '#f1f5f9', position: 'relative' }}>
                                                                    {item.image_url ? (
                                                                        <img
                                                                            src={item.image_url.startsWith('http') ? item.image_url : `http://localhost:5000${item.image_url}`}
                                                                            alt={item.name}
                                                                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                                                            onError={(e) => {
                                                                                e.target.style.display = 'none';
                                                                                e.target.parentElement.innerHTML = '<div style="width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; color: #cbd5e1;"><svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></svg></div>';
                                                                            }}
                                                                        />
                                                                    ) : (
                                                                        <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#cbd5e1' }}>
                                                                            <Utensils size={48} />
                                                                        </div>
                                                                    )}
                                                                    {!item.is_available && (
                                                                        <div style={{ position: 'absolute', top: '12px', right: '12px', background: 'rgba(0,0,0,0.6)', color: 'white', padding: '4px 12px', borderRadius: '100px', fontSize: '11px', fontWeight: '700' }}>
                                                                            Unavailable
                                                                        </div>
                                                                    )}
                                                                </div>
                                                                <div style={{ padding: '20px' }}>
                                                                    <h3 style={{ fontWeight: '700', fontSize: '16px', marginBottom: '8px' }}>{item.name}</h3>
                                                                    <p style={{ fontSize: '13px', color: '#64748b', marginBottom: '16px', height: '40px', overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: '2', WebkitBoxOrient: 'vertical' }}>
                                                                        {item.description}
                                                                    </p>
                                                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                                        <span style={{ fontWeight: '800', color: '#E65100', fontSize: '18px' }}>LKR {item.price}</span>
                                                                        <div style={{ display: 'flex', gap: '8px' }}>
                                                                            <button
                                                                                onClick={() => handleOpenModal(item)}
                                                                                className="secondary-btn"
                                                                                style={{ padding: '8px', minWidth: 'auto', borderRadius: '10px' }}
                                                                                title="Edit"
                                                                            >
                                                                                <Edit2 size={16} />
                                                                            </button>
                                                                            <button
                                                                                onClick={() => handleDeleteMenuItem(item.id)}
                                                                                className="secondary-btn"
                                                                                style={{ padding: '8px', minWidth: 'auto', borderRadius: '10px', color: '#ef4444' }}
                                                                                title="Delete"
                                                                            >
                                                                                <Trash2 size={16} />
                                                                            </button>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            ));
                                        })()
                                    ) : (
                                        <div style={{ textAlign: 'center', padding: '60px', color: '#64748b', background: 'white', borderRadius: '24px', border: '1px solid #e2e8f0' }}>
                                            <Utensils size={48} style={{ margin: '0 auto 16px', opacity: 0.3 }} />
                                            <p>Menu items will appear here.</p>
                                            <button
                                                onClick={() => handleOpenModal()}
                                                style={{ border: 'none', background: 'transparent', color: '#E65100', fontWeight: '700', cursor: 'pointer', marginTop: '8px' }}
                                            >
                                                Add your first item
                                            </button>
                                        </div>
                                    )}
                                </motion.div>
                            )}

                            {activeTab === 'history' && (
                                <motion.div
                                    key="history"
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -20 }}
                                >
                                    <div className="section-header">
                                        <div>
                                            <h2>Order History</h2>
                                            <p style={{ margin: '4px 0 0 0', fontSize: '14px', color: '#64748b' }}>
                                                View and filter your past successful or cancelled orders
                                            </p>
                                        </div>
                                    </div>

                                    {/* History Filters */}
                                    <div style={{
                                        display: 'flex',
                                        gap: '16px',
                                        marginBottom: '32px',
                                        flexWrap: 'wrap',
                                        background: 'white',
                                        padding: '20px',
                                        borderRadius: '20px',
                                        border: '1px solid #e2e8f0',
                                        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.02)'
                                    }}>
                                        <div style={{ flex: '1 1 300px', position: 'relative' }}>
                                            <Search size={18} color="#64748b" style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)' }} />
                                            <input
                                                type="text"
                                                placeholder="Search by customer, order ID, or food..."
                                                value={historySearchQuery}
                                                onChange={(e) => setHistorySearchQuery(e.target.value)}
                                                style={{
                                                    width: '100%', padding: '12px 16px 12px 48px', borderRadius: '12px', border: '1px solid #e2e8f0',
                                                    fontSize: '14px', outline: 'none'
                                                }}
                                            />
                                        </div>
                                        <div style={{ flex: '0 1 200px' }}>
                                            <select
                                                value={historyDateFilter}
                                                onChange={(e) => setHistoryDateFilter(e.target.value)}
                                                style={{
                                                    width: '100%', padding: '12px 16px', borderRadius: '12px', border: '1px solid #e2e8f0',
                                                    fontSize: '14px', outline: 'none', background: 'white', cursor: 'pointer', fontWeight: '600'
                                                }}
                                            >
                                                <option value="all">All Time</option>
                                                <option value="today">Today</option>
                                                <option value="week">Past 7 Days</option>
                                                <option value="month">Past 30 Days</option>
                                            </select>
                                        </div>
                                    </div>

                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '20px' }}>
                                        {(() => {
                                            const filteredHistory = orders
                                                .filter(o => o.status === 'Completed' || o.status === 'Cancelled')
                                                .filter(o => {
                                                    // Status/Date Filter
                                                    if (historyDateFilter === 'today') {
                                                        const today = new Date().toDateString();
                                                        return new Date(o.created_at).toDateString() === today;
                                                    }
                                                    if (historyDateFilter === 'week') {
                                                        const weekAgo = new Date();
                                                        weekAgo.setDate(weekAgo.getDate() - 7);
                                                        return new Date(o.created_at) >= weekAgo;
                                                    }
                                                    if (historyDateFilter === 'month') {
                                                        const monthAgo = new Date();
                                                        monthAgo.setMonth(monthAgo.getMonth() - 1);
                                                        return new Date(o.created_at) >= monthAgo;
                                                    }
                                                    return true;
                                                })
                                                .filter(o => {
                                                    // Search Filter
                                                    const q = historySearchQuery.toLowerCase();
                                                    const itemsStr = Array.isArray(o.items) ? JSON.stringify(o.items) : (o.items || '');
                                                    return o.customer_name?.toLowerCase().includes(q) ||
                                                        o.id.toString().includes(q) ||
                                                        itemsStr.toLowerCase().includes(q);
                                                });

                                            if (filteredHistory.length === 0) {
                                                return (
                                                    <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '80px 20px', background: 'white', borderRadius: '24px', border: '1px solid #e2e8f0' }}>
                                                        <Clock size={48} style={{ margin: '0 auto 16px', opacity: 0.2 }} />
                                                        <h3 style={{ color: '#0f172a', fontWeight: '700' }}>No History Found</h3>
                                                        <p style={{ color: '#64748b' }}>Try adjusting your search or filters.</p>
                                                    </div>
                                                );
                                            }

                                            return filteredHistory.map(order => (
                                                <HistoryCard key={order.id} order={order} />
                                            ));
                                        })()}
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </motion.div>
            </div>

            {/* Offline Indicator Banner */}
            <AnimatePresence>
                {!isAccepting && (
                    <motion.div
                        style={{
                            position: 'fixed',
                            bottom: '32px',
                            left: 0,
                            right: 0,
                            display: 'flex',
                            justifyContent: 'center',
                            zIndex: 1000,
                            pointerEvents: 'none'
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
                            <span style={{ fontSize: '14px', fontWeight: '600' }}>Your Kitchen is currently Closed</span>
                            <button
                                onClick={togglePartnerStatus}
                                style={{
                                    background: '#E65100',
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

            <MenuModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSave={handleSaveMenuItem}
                formData={menuFormData}
                setFormData={setMenuFormData}
                isEditing={!!editingItem}
                imagePreview={imagePreview}
                onImageChange={handleImageChange}
                uploadingImage={uploadingImage}
                foodCategories={foodCategories}
            />
        </div>
    );
};

// Internal Components
const StatCard = ({ icon, label, value, variant }) => (
    <motion.div
        whileHover={{ y: -5 }}
        className="stat-card"
    >
        <div className={`stat-icon ${variant}`}>
            {icon}
        </div>
        <div>
            <div className="stat-label">{label}</div>
            <div className="stat-value">{value}</div>
        </div>
    </motion.div>
);

const OrderCard = ({ order, onUpdateStatus }) => {
    const items = Array.isArray(order.items) ? order.items : JSON.parse(order.items || '[]');
    const statusActions = {
        'Pending': { label: 'Accept Order', next: 'Confirmed', color: '#E65100' },
        'Confirmed': { label: 'Start Preparing', next: 'Preparing', color: '#1e40af' },
        'Preparing': { label: 'Order Completed', next: 'Completed', color: '#854d0e' }
    };

    const action = statusActions[order.status];

    return (
        <div className="order-card" style={{ borderLeft: order.status === 'Pending' ? '6px solid #E65100' : '1px solid #e2e8f0' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <div>
                    <span style={{ fontWeight: '800', fontSize: '18px', color: '#0f172a' }}>Order #{order.id}</span>
                    <span style={{ marginLeft: '12px', fontSize: '13px', color: '#64748b' }}>
                        {new Date(order.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                </div>
                <div className={`status-badge ${order.status.toLowerCase()}`}>
                    {order.status === 'Pending' && <div style={{ width: '6px', height: '6px', background: 'white', borderRadius: '50%', marginRight: '6px' }} />}
                    {order.status}
                </div>
            </div>

            <div style={{ marginBottom: '20px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                    <div style={{
                        padding: '4px 10px',
                        borderRadius: '6px',
                        fontSize: '11px',
                        fontWeight: '800',
                        textTransform: 'uppercase',
                        backgroundColor: order.user_type === 'worker' ? '#ede9fe' : '#e0f2fe',
                        color: order.user_type === 'worker' ? '#5b21b6' : '#075985'
                    }}>
                        {order.user_type || 'Student'}
                    </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
                    <div style={{ padding: '12px', background: '#f8fafc', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                        <div style={{ fontSize: '11px', color: '#64748b', fontWeight: '600', textTransform: 'uppercase', marginBottom: '4px' }}>Customer</div>
                        <div style={{ fontSize: '14px', fontWeight: '800', color: '#0f172a' }}>{order.customer_name || 'Anonymous'}</div>
                        <div style={{ fontSize: '13px', color: '#475569', marginTop: '2px' }}>{order.customer_phone || 'N/A'}</div>
                    </div>
                    <div style={{ padding: '12px', background: '#f8fafc', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                        <div style={{ fontSize: '11px', color: '#64748b', fontWeight: '600', textTransform: 'uppercase', marginBottom: '4px' }}>Delivery To</div>
                        <div style={{ fontSize: '14px', fontWeight: '800', color: '#0f172a', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {order.delivery_address || 'Local Pickup'}
                        </div>
                        <div style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>{order.user_default_location || 'Campus Area'}</div>
                    </div>
                </div>

                <div style={{ padding: '12px', background: 'white', borderRadius: '12px', border: '1px solid #f1f5f9' }}>
                    <div style={{ fontSize: '11px', color: '#64748b', fontWeight: '600', textTransform: 'uppercase', marginBottom: '8px' }}>Order Items</div>
                    {items.map((item, idx) => (
                        <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', marginBottom: idx === items.length - 1 ? 0 : '8px' }}>
                            <span>{item.quantity}x {item.name}</span>
                            <span style={{ fontWeight: '600' }}>LKR {item.price * item.quantity}</span>
                        </div>
                    ))}
                    <div style={{ borderTop: '1px dotted #e2e8f0', marginTop: '12px', paddingTop: '8px', display: 'flex', justifyContent: 'space-between', fontWeight: '800', color: '#0f172a', fontSize: '16px' }}>
                        <span>Total Amount</span>
                        <span style={{ color: '#E65100' }}>LKR {order.total_amount}</span>
                    </div>
                </div>
            </div>

            <div style={{ display: 'flex', gap: '12px' }}>
                {order.status !== 'Completed' && order.status !== 'Cancelled' && (
                    <button
                        className="secondary-btn"
                        style={{ flex: 1, justifyContent: 'center', color: '#991b1b' }}
                        onClick={() => onUpdateStatus(order.id, 'Cancelled')}
                    >
                        Cancel
                    </button>
                )}
                {action && (
                    <button
                        className="primary-btn"
                        style={{ flex: 2, justifyContent: 'center', background: action.color }}
                        onClick={() => onUpdateStatus(order.id, action.next)}
                    >
                        {action.label}
                    </button>
                )}
            </div>
        </div>
    );
};

const LoadingScreen = ({ message }) => (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#f8fafc' }}>
        <div style={{ position: 'relative' }}>
            <div style={{ width: '48px', height: '48px', border: '4px solid #e2e8f0', borderTopColor: '#E65100', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
        </div>
        <p style={{ marginTop: '20px', fontWeight: '600', color: '#475569' }}>{message}</p>
    </div>
);

const HistoryCard = ({ order }) => {
    const [isExpanded, setIsExpanded] = useState(false);
    const items = Array.isArray(order.items) ? order.items : JSON.parse(order.items || '[]');

    return (
        <motion.div
            layout
            style={{
                background: 'white',
                border: '1px solid #e2e8f0',
                borderRadius: '20px',
                padding: '20px',
                cursor: 'pointer',
                display: 'flex',
                flexDirection: 'column',
                gap: '12px',
                position: 'relative',
                overflow: 'hidden'
            }}
            onClick={() => setIsExpanded(!isExpanded)}
            whileHover={{ y: -2, boxShadow: '0 12px 20px -10px rgba(0,0,0,0.05)' }}
        >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                    <div style={{ fontSize: '12px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                        Order #{order.id}
                    </div>
                    <div style={{ fontSize: '15px', fontWeight: '800', color: '#1e293b', marginTop: '2px' }}>
                        {order.customer_name || 'Anonymous'}
                    </div>
                </div>
                <div className={`status-badge ${order.status.toLowerCase()}`}>
                    {order.status}
                </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '4px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#64748b', fontSize: '13px' }}>
                    <Clock size={14} />
                    <span>{new Date(order.created_at).toLocaleDateString([], { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</span>
                </div>
                <div style={{ fontSize: '16px', fontWeight: '800', color: order.status === 'Cancelled' ? '#EF4444' : '#E65100' }}>
                    LKR {order.total_amount}
                </div>
            </div>

            <AnimatePresence>
                {isExpanded && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        style={{ overflow: 'hidden' }}
                    >
                        <div style={{ paddingTop: '16px', borderTop: '1px dashed #e2e8f0', marginTop: '8px' }}>
                            <div style={{ fontSize: '11px', fontWeight: '700', color: '#94a3b8', textTransform: 'uppercase', marginBottom: '8px' }}>
                                Items Detail
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                {items.map((item, idx) => (
                                    <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                                        <span style={{ color: '#475569', fontWeight: '500' }}>
                                            <span style={{ fontWeight: '800', color: '#E65100' }}>{item.quantity}x</span> {item.name}
                                        </span>
                                        <span style={{ fontWeight: '700', color: '#1e293b' }}>
                                            LKR {Number(item.price_at_time || item.price) * item.quantity}
                                        </span>
                                    </div>
                                ))}
                            </div>

                            <div style={{ marginTop: '16px', padding: '12px', background: '#f8fafc', borderRadius: '12px', fontSize: '12px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                                    <MapPin size={12} color="#64748b" />
                                    <span style={{ fontWeight: '600', color: '#475569' }}>{order.delivery_address || 'Local Pickup'}</span>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                    <User size={12} color="#64748b" />
                                    <span style={{ fontWeight: '600', color: '#475569' }}>{order.customer_phone || 'No phone'}</span>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            <div style={{ textAlign: 'center', marginTop: isExpanded ? '8px' : '0' }}>
                <span style={{ fontSize: '11px', fontWeight: '700', color: '#E65100', opacity: 0.6 }}>
                    {isExpanded ? 'Click to collapse' : 'Click for details'}
                </span>
            </div>
        </motion.div>
    );
};

const MenuModal = ({ isOpen, onClose, onSave, formData, setFormData, isEditing, imagePreview, onImageChange, uploadingImage, foodCategories }) => {
    return (
        <AnimatePresence>
            {isOpen && (
                <div style={{ position: 'fixed', inset: 0, zIndex: 3000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        style={{ position: 'absolute', inset: 0, background: 'rgba(15, 23, 42, 0.4)', backdropFilter: 'blur(4px)' }}
                    />
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        style={{
                            position: 'relative', width: '100%', maxWidth: '500px', maxHeight: '90vh', background: 'white', borderRadius: '24px',
                            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)', overflow: 'hidden', display: 'flex', flexDirection: 'column'
                        }}
                    >
                        <div style={{ padding: '24px', background: 'linear-gradient(135deg, #E65100 0%, #FF9800 100%)', color: 'white' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <h2 style={{ fontSize: '20px', fontWeight: '800', margin: 0 }}>
                                    {isEditing ? 'Edit Menu Item' : 'Add New Item'}
                                </h2>
                                <button onClick={onClose} style={{ background: 'rgba(255,255,255,0.2)', border: 'none', color: 'white', padding: '8px', borderRadius: '12px', cursor: 'pointer' }}>
                                    <XCircle size={20} />
                                </button>
                            </div>
                        </div>

                        <form onSubmit={onSave} style={{ padding: '24px', overflowY: 'auto', flex: 1 }}>
                            {/* Image Upload Section */}
                            <div style={{ marginBottom: '24px' }}>
                                <label style={{ display: 'block', fontSize: '14px', fontWeight: '700', color: '#475569', marginBottom: '12px' }}>
                                    Item Image
                                </label>
                                <div style={{
                                    position: 'relative',
                                    width: '100%',
                                    height: '200px',
                                    border: '2px dashed #e2e8f0',
                                    borderRadius: '16px',
                                    overflow: 'hidden',
                                    background: '#f8fafc',
                                    cursor: 'pointer'
                                }}>
                                    {imagePreview ? (
                                        <div style={{ position: 'relative', width: '100%', height: '100%' }}>
                                            <img
                                                src={imagePreview}
                                                alt="Preview"
                                                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                            />
                                            <div style={{
                                                position: 'absolute',
                                                bottom: '12px',
                                                right: '12px',
                                                background: 'rgba(0,0,0,0.7)',
                                                color: 'white',
                                                padding: '8px 16px',
                                                borderRadius: '8px',
                                                fontSize: '13px',
                                                fontWeight: '600'
                                            }}>
                                                Click to change
                                            </div>
                                        </div>
                                    ) : (
                                        <div style={{
                                            display: 'flex',
                                            flexDirection: 'column',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            height: '100%',
                                            color: '#94a3b8'
                                        }}>
                                            <Camera size={48} style={{ marginBottom: '12px' }} />
                                            <p style={{ margin: 0, fontSize: '14px', fontWeight: '600' }}>Click to upload image</p>
                                            <p style={{ margin: '4px 0 0 0', fontSize: '12px' }}>JPEG, PNG, GIF, WebP (Max 5MB)</p>
                                        </div>
                                    )}
                                    <input
                                        type="file"
                                        accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
                                        onChange={onImageChange}
                                        style={{
                                            position: 'absolute',
                                            inset: 0,
                                            opacity: 0,
                                            cursor: 'pointer',
                                            width: '100%',
                                            height: '100%'
                                        }}
                                    />
                                </div>
                            </div>

                            <div style={{ marginBottom: '20px' }}>
                                <label style={{ display: 'block', fontSize: '14px', fontWeight: '700', color: '#475569', marginBottom: '8px' }}>Item Name</label>
                                <input
                                    type="text"
                                    required
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    placeholder="e.g. Spicy Chicken Burger"
                                    style={{ width: '100%', padding: '12px 16px', borderRadius: '12px', border: '1px solid #e2e8f0', fontSize: '15px' }}
                                />
                            </div>

                            <div style={{ marginBottom: '20px' }}>
                                <label style={{ display: 'block', fontSize: '14px', fontWeight: '700', color: '#475569', marginBottom: '8px' }}>Description</label>
                                <textarea
                                    required
                                    rows="3"
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    placeholder="Tell your customers about this dish..."
                                    style={{ width: '100%', padding: '12px 16px', borderRadius: '12px', border: '1px solid #e2e8f0', fontSize: '15px', resize: 'none' }}
                                />
                            </div>

                            <div style={{ marginBottom: '20px' }}>
                                <label style={{ display: 'block', fontSize: '14px', fontWeight: '700', color: '#475569', marginBottom: '8px' }}>Category</label>
                                <select
                                    value={formData.category}
                                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                                    style={{ width: '100%', padding: '12px 16px', borderRadius: '12px', border: '1px solid #e2e8f0', fontSize: '15px', background: 'white', cursor: 'pointer' }}
                                >
                                    <option value="">Select a category (Optional)</option>
                                    {foodCategories.map(cat => (
                                        <option key={cat.id} value={cat.name}>{cat.name}</option>
                                    ))}
                                </select>
                            </div>

                            <div style={{ marginBottom: '20px' }}>
                                <label style={{ display: 'block', fontSize: '14px', fontWeight: '700', color: '#475569', marginBottom: '8px' }}>Price (LKR)</label>
                                <input
                                    type="number"
                                    required
                                    value={formData.price}
                                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                                    placeholder="1200"
                                    style={{ width: '100%', padding: '12px 16px', borderRadius: '12px', border: '1px solid #e2e8f0', fontSize: '15px' }}
                                />
                            </div>

                            <div style={{ display: 'flex', gap: '12px', marginTop: '32px' }}>
                                <button type="button" onClick={onClose} className="secondary-btn" style={{ flex: 1, justifyContent: 'center' }}>
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="primary-btn"
                                    style={{ flex: 2, justifyContent: 'center' }}
                                    disabled={uploadingImage}
                                >
                                    {uploadingImage ? 'Uploading...' : (isEditing ? 'Save Changes' : 'Add Item to Menu')}
                                </button>
                            </div>
                        </form>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};

export default PartnerFood;

