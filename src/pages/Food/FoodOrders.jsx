import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUser } from '../../context/UserContext';
import { ArrowLeft, ShoppingBag, Clock, CheckCircle2, Package, Truck, ExternalLink, ChevronRight, MapPin } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const FoodOrders = () => {
    const navigate = useNavigate();
    const { profile } = useUser();
    const [orders, setOrders] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (profile?.id) {
            fetchOrders();
            // Poll for updates every 5 seconds
            const interval = setInterval(fetchOrders, 5000);
            return () => clearInterval(interval);
        }
    }, [profile]);

    const fetchOrders = async () => {
        try {
            const response = await fetch(`http://localhost:5000/api/orders/user/${profile.id}`);
            const data = await response.json();
            setOrders(data);
            if (profile?.id) {
                const storageKey = `food_order_statuses_${profile.id}`;
                const currentStatuses = {};
                data.forEach(order => {
                    currentStatuses[order.id] = order.status;
                });
                localStorage.setItem(storageKey, JSON.stringify(currentStatuses));
            }
        } catch (err) {
            console.error('Failed to fetch orders:', err);
        } finally {
            setIsLoading(false);
        }
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'Pending': return '#F59E0B';
            case 'Confirmed': return '#3B82F6';
            case 'Preparing': return '#8B5CF6';
            case 'Completed': return '#00B14F';
            case 'Cancelled': return '#EF4444';
            default: return '#6A6D7C';
        }
    };

    const getStatusIcon = (status) => {
        switch (status) {
            case 'Pending': return <Clock size={16} />;
            case 'Confirmed': return <CheckCircle2 size={16} />;
            case 'Preparing': return <Package size={16} />;
            case 'Completed': return <CheckCircle2 size={16} />;
            default: return <Clock size={16} />;
        }
    };

    const resolveImageUrl = (url) => {
        if (!url) return null;
        if (url.startsWith('http')) return url;
        return `http://localhost:5000${url}`;
    };

    if (isLoading) {
        return (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', backgroundColor: 'white' }}>
                <div style={{ width: '40px', height: '40px', border: '4px solid #F1F3F5', borderTopColor: '#00B14F', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
            </div>
        );
    }

    const activeOrders = orders.filter(o => ['Pending', 'Confirmed', 'Preparing'].includes(o.status));
    const pastOrders = orders.filter(o => ['Completed', 'Cancelled'].includes(o.status));

    return (
        <div style={{ backgroundColor: '#F8F9FA', minHeight: '100vh', paddingBottom: '40px' }}>
            {/* Header */}
            <div style={{ backgroundColor: 'white', padding: '24px 20px', display: 'flex', alignItems: 'center', gap: '16px', position: 'sticky', top: 0, zIndex: 10, borderBottom: '1px solid #F1F3F5' }}>
                <button onClick={() => navigate('/food')} style={{ padding: '10px', borderRadius: '14px', backgroundColor: '#F1F3F5', border: 'none', cursor: 'pointer' }}>
                    <ArrowLeft size={20} color="#1A1A1A" />
                </button>
                <h1 style={{ fontSize: '20px', fontWeight: '800', color: '#1A1A1A' }}>My Food Orders</h1>
            </div>

            <div style={{ padding: '24px 20px' }}>
                {/* Active Orders Section */}
                {activeOrders.length > 0 && (
                    <div style={{ marginBottom: '32px' }}>
                        <h2 style={{ fontSize: '18px', fontWeight: '800', marginBottom: '16px', color: '#1A1A1A', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#00B14F', boxShadow: '0 0 10px #00B14F' }} />
                            Ongoing Orders
                        </h2>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                            {activeOrders.map(order => (
                                <OrderCard key={order.id} order={order} getStatusColor={getStatusColor} getStatusIcon={getStatusIcon} resolveImageUrl={resolveImageUrl} isActive />
                            ))}
                        </div>
                    </div>
                )}

                {/* Past Orders Section */}
                <div>
                    <h2 style={{ fontSize: '18px', fontWeight: '800', marginBottom: '16px', color: '#1A1A1A' }}>Order History</h2>
                    {pastOrders.length === 0 && activeOrders.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '60px 20px', backgroundColor: 'white', borderRadius: '24px' }}>
                            <div style={{ fontSize: '48px', marginBottom: '16px' }}>🥘</div>
                            <h3 style={{ color: '#1A1A1A', fontWeight: '800', marginBottom: '8px' }}>No orders yet</h3>
                            <p style={{ color: '#6A6D7C', fontSize: '14px', marginBottom: '24px' }}>Hungry? Explore local restaurants and place your first order!</p>
                            <button
                                onClick={() => navigate('/food')}
                                style={{ padding: '12px 24px', backgroundColor: '#00B14F', color: 'white', fontWeight: '700', borderRadius: '12px', border: 'none', cursor: 'pointer' }}
                            >
                                Browse Food
                            </button>
                        </div>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                            {pastOrders.map(order => (
                                <OrderCard key={order.id} order={order} getStatusColor={getStatusColor} getStatusIcon={getStatusIcon} resolveImageUrl={resolveImageUrl} />
                            ))}
                        </div>
                    )}
                </div>
            </div>

            <style>{`
                @keyframes spin {
                    to { transform: rotate(360deg); }
                }
            `}</style>
        </div>
    );
};

const OrderCard = ({ order, getStatusColor, getStatusIcon, resolveImageUrl, isActive }) => {
    return (
        <motion.div
            whileHover={{ y: -2 }}
            style={{
                backgroundColor: 'white',
                borderRadius: '24px',
                padding: '20px',
                boxShadow: isActive ? '0 8px 30px rgba(0,0,0,0.06)' : '0 4px 15px rgba(0,0,0,0.02)',
                border: isActive ? '1.5px solid #E7F7EF' : '1px solid #F1F3F5',
                display: 'flex',
                flexDirection: 'column',
                gap: '20px',
                marginBottom: '16px'
            }}
        >
            {/* Restaurant & Status Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{
                        width: '44px',
                        height: '44px',
                        borderRadius: '12px',
                        backgroundColor: '#F8F9FA',
                        backgroundImage: (order.restaurant_image || order.partner_avatar) ? `url("${resolveImageUrl(order.restaurant_image || order.partner_avatar)}")` : 'none',
                        backgroundSize: 'cover',
                        backgroundPosition: 'center',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '18px'
                    }}>
                        {!(order.restaurant_image || order.partner_avatar) && '🏪'}
                    </div>
                    <div>
                        <h3 style={{ fontSize: '16px', fontWeight: '800', color: '#1A1A1A', margin: 0 }}>{order.restaurant_name}</h3>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#6A6D7C', fontSize: '12px' }}>
                            <Clock size={12} />
                            <span>{new Date(order.created_at).toLocaleDateString([], { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                    </div>
                </div>
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '8px 14px',
                    borderRadius: '12px',
                    backgroundColor: `${getStatusColor(order.status)}15`,
                    color: getStatusColor(order.status),
                    fontSize: '12px',
                    fontWeight: '800'
                }}>
                    {getStatusIcon(order.status)}
                    {order.status}
                </div>
            </div>

            {/* Items List */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {order.items?.map((item, idx) => (
                    <div key={idx} style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                        <div style={{
                            width: '80px',
                            height: '80px',
                            borderRadius: '16px',
                            backgroundColor: '#F8F9FA',
                            backgroundImage: item.image_url ? `url("${resolveImageUrl(item.image_url)}")` : 'none',
                            backgroundSize: 'cover',
                            backgroundPosition: 'center',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '24px',
                            flexShrink: 0,
                            boxShadow: '0 4px 12px rgba(0,0,0,0.03)'
                        }}>
                            {!item.image_url && '🍔'}
                        </div>
                        <div style={{ flex: 1 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '4px' }}>
                                <span style={{ fontSize: '16px', fontWeight: '800', color: '#1A1A1A' }}>{item.name}</span>
                                <span style={{ fontSize: '14px', fontWeight: '700', color: '#00B14F', backgroundColor: '#E7F7EF', padding: '2px 8px', borderRadius: '6px' }}>×{item.quantity}</span>
                            </div>
                            {item.description && (
                                <p style={{ fontSize: '13px', color: '#6A6D7C', margin: 0, lineHeight: '1.4', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                                    {item.description}
                                </p>
                            )}
                        </div>
                    </div>
                ))}
            </div>

            {/* Footer: Order Info & Price */}
            <div style={{
                paddingTop: '16px',
                borderTop: '1px solid #F1F3F5',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#6A6D7C', fontSize: '13px' }}>
                    <ShoppingBag size={14} color="#00B14F" />
                    <span>Order #{order.id}</span>
                </div>
                <div style={{ textAlign: 'right' }}>
                    <span style={{ fontSize: '12px', color: '#6A6D7C', display: 'block', marginBottom: '2px', fontWeight: '600' }}>Total Amount</span>
                    <span style={{ fontSize: '18px', fontWeight: '900', color: '#1A1A1A' }}>Rs. {parseFloat(order.total_amount).toLocaleString()}</span>
                </div>
            </div>
        </motion.div>
    );
};

export default FoodOrders;
