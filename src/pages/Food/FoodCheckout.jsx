import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useUser } from '../../context/UserContext';
import { ArrowLeft, MapPin, CreditCard, ShoppingBag, CheckCircle2, ChevronRight, Truck } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const FoodCheckout = () => {
    const navigate = useNavigate();
    const locationState = useLocation();
    const { profile, location: userLocation } = useUser();
    const { cart, restaurant, total } = locationState.state || { cart: [], restaurant: {}, total: 0 };

    const [isPlacingOrder, setIsPlacingOrder] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);
    const [paymentMethod, setPaymentMethod] = useState('Cash');
    const [phone, setPhone] = useState(profile?.phone || '');

    const deliveryFee = 0;
    const finalTotal = total;

    const handlePlaceOrder = async () => {
        if (!profile?.id) return alert('Please login to place an order');
        if (!phone || phone.length < 9) return alert('Please provide a valid contact phone number');
        setIsPlacingOrder(true);
        try {
            if (!restaurant?.id) {
                console.error('Restaurant ID missing in checkout state:', restaurant);
                return alert('Checkout session expired. Please go back and try again.');
            }

            const orderData = {
                user_id: profile.id,
                restaurant_id: restaurant.id,
                total_amount: finalTotal,
                payment_method: 'Cash',
                delivery_address: userLocation?.name || 'Local Pickup',
                phone: phone,
                items: cart.map(item => ({
                    id: item.id,
                    quantity: item.quantity,
                    price: item.price
                }))
            };

            const response = await fetch('http://localhost:5000/api/orders', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(orderData)
            });

            if (response.ok) {
                const data = await response.json();
                setTimeout(() => {
                    setIsSuccess(true);
                }, 1500);
            }
        } catch (err) {
            console.error('Order placement failed:', err);
        } finally {
            setTimeout(() => setIsPlacingOrder(false), 1500);
        }
    };

    if (isSuccess) {
        return (
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                style={{
                    height: '100vh',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '40px',
                    textAlign: 'center',
                    backgroundColor: 'white'
                }}
            >
                <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', damping: 12 }}
                    style={{
                        width: '100px',
                        height: '100px',
                        borderRadius: '50%',
                        backgroundColor: '#E7F7EF',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        marginBottom: '24px'
                    }}
                >
                    <CheckCircle2 size={60} color="#00B14F" />
                </motion.div>
                <h1 style={{ fontSize: '28px', fontWeight: '800', marginBottom: '12px', color: '#1A1A1A' }}>Order Placed!</h1>
                <p style={{ color: '#6A6D7C', fontSize: '16px', marginBottom: '40px', lineHeight: '1.6' }}>
                    Your delicious meal from <span style={{ fontWeight: '700', color: '#1A1A1A' }}>{restaurant.name}</span> is being prepared and will be with you soon.
                </p>
                <motion.button
                    whileTap={{ scale: 0.95 }}
                    onClick={() => navigate('/food/orders')}
                    style={{
                        padding: '18px 40px',
                        borderRadius: '20px',
                        backgroundColor: '#00B14F',
                        color: 'white',
                        fontWeight: '700',
                        fontSize: '16px',
                        boxShadow: '0 12px 30px rgba(0, 177, 79, 0.3)'
                    }}
                >
                    View Order Status
                </motion.button>
            </motion.div>
        );
    }

    return (
        <div style={{ backgroundColor: '#F8F9FA', minHeight: '100vh', paddingBottom: '40px' }}>
            {/* Header */}
            <div style={{ backgroundColor: 'white', padding: '24px 20px', display: 'flex', alignItems: 'center', gap: '16px', position: 'sticky', top: 0, zIndex: 10 }}>
                <button onClick={() => navigate(-1)} style={{ padding: '10px', borderRadius: '14px', backgroundColor: '#F1F3F5' }}>
                    <ArrowLeft size={20} color="#1A1A1A" />
                </button>
                <h1 style={{ fontSize: '20px', fontWeight: '800', color: '#1A1A1A' }}>Checkout</h1>
            </div>

            <div style={{ padding: '24px 20px' }}>
                {/* Delivery Address */}
                <div style={{ backgroundColor: 'white', borderRadius: '24px', padding: '20px', marginBottom: '20px', boxShadow: '0 4px 15px rgba(0,0,0,0.02)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                        <div style={{ padding: '10px', backgroundColor: '#E7F7EF', borderRadius: '12px' }}>
                            <MapPin size={20} color="#00B14F" />
                        </div>
                        <h2 style={{ fontSize: '16px', fontWeight: '700' }}>Your Location</h2>
                    </div>
                    <div style={{ padding: '16px', border: '1.5px solid #F1F3F5', borderRadius: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                            <p style={{ fontWeight: '700', color: '#1A1A1A', marginBottom: '4px' }}>{userLocation?.name || 'Local'}</p>
                            <p style={{ fontSize: '13px', color: '#6A6D7C' }}>Your selected location</p>
                        </div>
                        <ChevronRight size={18} color="#CED4DA" />
                    </div>
                </div>

                {/* Contact Phone */}
                <div style={{ backgroundColor: 'white', borderRadius: '24px', padding: '20px', marginBottom: '20px', boxShadow: '0 4px 15px rgba(0,0,0,0.02)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                        <div style={{ padding: '10px', backgroundColor: '#FEF3C7', borderRadius: '12px' }}>
                            <Truck size={20} color="#D97706" />
                        </div>
                        <h2 style={{ fontSize: '16px', fontWeight: '700' }}>Contact Details</h2>
                    </div>
                    <div>
                        <p style={{ fontSize: '13px', color: '#6A6D7C', marginBottom: '10px' }}>To contact you regarding delivery/pickup</p>
                        <input
                            type="tel"
                            placeholder="Enter phone number"
                            value={phone}
                            onChange={(e) => setPhone(e.target.value)}
                            style={{
                                width: '100%',
                                padding: '16px',
                                borderRadius: '16px',
                                border: '1.5px solid #F1F3F5',
                                backgroundColor: '#F8F9FA',
                                fontSize: '15px',
                                fontWeight: '600',
                                outline: 'none',
                                boxSizing: 'border-box'
                            }}
                        />
                    </div>
                </div>

                {/* Order Summary */}
                <div style={{ backgroundColor: 'white', borderRadius: '24px', padding: '20px', marginBottom: '20px', boxShadow: '0 4px 15px rgba(0,0,0,0.02)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
                        <div style={{ padding: '10px', backgroundColor: '#F1F3F5', borderRadius: '12px' }}>
                            <ShoppingBag size={20} color="#1A1A1A" />
                        </div>
                        <h2 style={{ fontSize: '16px', fontWeight: '700' }}>Order Summary</h2>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        {cart.map(item => (
                            <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                    <div style={{ width: '24px', height: '24px', borderRadius: '6px', border: '1.5px solid #F1F3F5', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: '800', color: '#00B14F' }}>
                                        {item.quantity}
                                    </div>
                                    <span style={{ fontSize: '15px', color: '#1A1A1A', fontWeight: '600' }}>{item.name}</span>
                                </div>
                                <span style={{ fontSize: '15px', color: '#1A1A1A', fontWeight: '700' }}>Rs. {(item.price * item.quantity).toLocaleString()}</span>
                            </div>
                        ))}
                    </div>

                    <div style={{ height: '1.5px', backgroundColor: '#F1F3F5', margin: '20px 0' }}></div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', color: '#6A6D7C', fontSize: '14px', fontWeight: '500' }}>
                            <span>Subtotal</span>
                            <span>Rs. {total.toLocaleString()}</span>
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'space-between', color: '#1A1A1A', fontSize: '18px', fontWeight: '800', marginTop: '4px' }}>
                            <span>Total</span>
                            <span style={{ color: '#00B14F' }}>Rs. {finalTotal.toLocaleString()}</span>
                        </div>
                    </div>
                </div>

                {/* Payment Method */}
                <div style={{ backgroundColor: 'white', borderRadius: '24px', padding: '20px', marginBottom: '100px', boxShadow: '0 4px 15px rgba(0,0,0,0.02)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                        <div style={{ padding: '10px', backgroundColor: '#F1F3F5', borderRadius: '12px' }}>
                            <CreditCard size={20} color="#1A1A1A" />
                        </div>
                        <h2 style={{ fontSize: '16px', fontWeight: '700' }}>Payment Method</h2>
                    </div>

                    <div
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '12px',
                            padding: '16px',
                            border: '1.5px solid #00B14F',
                            backgroundColor: '#E7F7EF',
                            borderRadius: '16px',
                            cursor: 'default'
                        }}
                    >
                        <div style={{
                            width: '20px',
                            height: '20px',
                            borderRadius: '50%',
                            border: '2px solid #00B14F',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                        }}>
                            <div style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: '#00B14F' }} />
                        </div>
                        <div style={{ flex: 1 }}>
                            <p style={{ fontWeight: '700', color: '#00B14F', marginBottom: '2px' }}>Cash on Pickup</p>
                            <p style={{ fontSize: '12px', color: '#6A6D7C' }}>Pay when you collect your order</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Sticky Place Order Button */}
            <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, padding: '20px', backgroundColor: 'white', borderTop: '1px solid #F1F3F5' }}>
                <motion.button
                    whileTap={{ scale: 0.98 }}
                    disabled={isPlacingOrder}
                    onClick={handlePlaceOrder}
                    style={{
                        width: '100%',
                        padding: '18px',
                        borderRadius: '20px',
                        backgroundColor: '#00B14F',
                        color: 'white',
                        fontWeight: '800',
                        fontSize: '17px',
                        boxShadow: '0 10px 25px rgba(0, 177, 79, 0.25)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '12px'
                    }}
                >
                    {isPlacingOrder ? (
                        <>
                            <div style={{ width: '20px', height: '20px', border: '3px solid rgba(255,255,255,0.3)', borderTopColor: 'white', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
                            <span>Processing...</span>
                        </>
                    ) : (
                        <>
                            <CheckCircle2 size={20} />
                            <span>Place Order • Rs. {finalTotal.toLocaleString()}</span>
                        </>
                    )}
                </motion.button>
            </div>

            <style>{`
                @keyframes spin {
                    to { transform: rotate(360deg); }
                }
            `}</style>
        </div>
    );
};

export default FoodCheckout;
