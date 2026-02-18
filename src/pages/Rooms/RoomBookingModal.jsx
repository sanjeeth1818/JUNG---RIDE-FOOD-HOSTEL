import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Calendar, User, Phone, CheckCircle, AlertCircle } from 'lucide-react';
import { useUser } from '../../context/UserContext';

const RoomBookingModal = ({ room, onClose }) => {
    const { user } = useUser();

    // Form State
    const [formData, setFormData] = useState({
        guest_name: user?.name || '',
        guest_phone: user?.phone || '',
        check_in: '',
        check_out: ''
    });

    const [status, setStatus] = useState('idle'); // idle, submitting, success, error
    const [errorMessage, setErrorMessage] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setStatus('submitting');
        setErrorMessage('');

        try {
            const response = await fetch('http://localhost:5000/api/bookings', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    partner_id: room.partner_id,
                    room_id: room.id,
                    guest_name: formData.guest_name,
                    guest_phone: formData.guest_phone,
                    check_in: formData.check_in,
                    check_out: formData.check_out || null,
                    total_price: room.price_per_month
                })
            });

            const data = await response.json();

            if (!response.ok) throw new Error(data.error || 'Failed to book room');

            setStatus('success');

            // Auto close after success
            setTimeout(() => {
                onClose();
            }, 2000);

        } catch (err) {
            console.error(err);
            setStatus('error');
            setErrorMessage(err.message);
        }
    };

    if (!room) return null;

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                style={{
                    position: 'fixed', inset: 0, zIndex: 1100,
                    backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(5px)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    padding: '20px'
                }}
                onClick={onClose}
            >
                <motion.div
                    initial={{ scale: 0.9, opacity: 0, y: 20 }}
                    animate={{ scale: 1, opacity: 1, y: 0 }}
                    exit={{ scale: 0.9, opacity: 0, y: 20 }}
                    onClick={(e) => e.stopPropagation()}
                    style={{
                        backgroundColor: 'white', borderRadius: '24px', overflow: 'hidden',
                        width: '100%', maxWidth: '500px',
                        boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)'
                    }}
                >
                    {/* Header */}
                    <div style={{
                        padding: '20px 24px',
                        borderBottom: '1px solid #eee',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        background: '#fff'
                    }}>
                        <div>
                            <h3 style={{ fontSize: '20px', fontWeight: '800', color: '#1A1A1A', margin: 0 }}>
                                Book this Room
                            </h3>
                            <p style={{ margin: '4px 0 0', color: '#666', fontSize: '13px' }}>
                                {room.title} • {room.location_name}
                            </p>
                        </div>
                        <button
                            onClick={onClose}
                            style={{
                                padding: '8px',
                                borderRadius: '50%',
                                border: 'none',
                                backgroundColor: '#f5f5f5',
                                cursor: 'pointer',
                                display: 'flex', alignItems: 'center', justifyContent: 'center'
                            }}
                        >
                            <X size={20} color="#666" />
                        </button>
                    </div>

                    {/* Content */}
                    <div style={{ padding: '24px' }}>
                        {status === 'success' ? (
                            <div style={{ textAlign: 'center', padding: '40px 0' }}>
                                <motion.div
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 1 }}
                                    transition={{ type: 'spring', damping: 12 }}
                                    style={{
                                        width: '80px', height: '80px', borderRadius: '50%',
                                        background: '#D1FAE5', color: '#059669',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        margin: '0 auto 20px'
                                    }}
                                >
                                    <CheckCircle size={40} />
                                </motion.div>
                                <h3 style={{ fontSize: '22px', fontWeight: 'bold', color: '#059669', marginBottom: '8px' }}>
                                    Booking Requested!
                                </h3>
                                <p style={{ color: '#6B7280' }}>
                                    The partner will contact you shortly to confirm your stay.
                                </p>
                            </div>
                        ) : (
                            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                                {status === 'error' && (
                                    <div style={{
                                        padding: '12px', borderRadius: '12px',
                                        backgroundColor: '#FEE2E2', color: '#DC2626',
                                        fontSize: '14px', display: 'flex', alignItems: 'center', gap: '8px'
                                    }}>
                                        <AlertCircle size={16} />
                                        {errorMessage}
                                    </div>
                                )}

                                {/* Name Field */}
                                <div>
                                    <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#374151', marginBottom: '6px' }}>
                                        Full Name
                                    </label>
                                    <div style={{ position: 'relative' }}>
                                        <User size={18} style={{ position: 'absolute', left: '12px', top: '12px', color: '#9CA3AF' }} />
                                        <input
                                            type="text"
                                            required
                                            value={formData.guest_name}
                                            onChange={(e) => setFormData({ ...formData, guest_name: e.target.value })}
                                            placeholder="Your Name"
                                            style={{
                                                width: '100%', padding: '10px 12px 10px 40px',
                                                borderRadius: '12px', border: '1px solid #E5E7EB',
                                                fontSize: '15px', outline: 'none',
                                                transition: 'border-color 0.2s'
                                            }}
                                        />
                                    </div>
                                </div>

                                {/* Phone Field */}
                                <div>
                                    <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#374151', marginBottom: '6px' }}>
                                        Phone Number
                                    </label>
                                    <div style={{ position: 'relative' }}>
                                        <Phone size={18} style={{ position: 'absolute', left: '12px', top: '12px', color: '#9CA3AF' }} />
                                        <input
                                            type="tel"
                                            required
                                            value={formData.guest_phone}
                                            onChange={(e) => setFormData({ ...formData, guest_phone: e.target.value })}
                                            placeholder="077 123 4567"
                                            style={{
                                                width: '100%', padding: '10px 12px 10px 40px',
                                                borderRadius: '12px', border: '1px solid #E5E7EB',
                                                fontSize: '15px', outline: 'none'
                                            }}
                                        />
                                    </div>
                                </div>

                                {/* Date Fields Row */}
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                                    <div>
                                        <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#374151', marginBottom: '6px' }}>
                                            Move-in Date
                                        </label>
                                        <div style={{ position: 'relative' }}>
                                            <Calendar size={18} style={{ position: 'absolute', left: '12px', top: '12px', color: '#9CA3AF' }} />
                                            <input
                                                type="date"
                                                required
                                                min={new Date().toISOString().split('T')[0]}
                                                value={formData.check_in}
                                                onChange={(e) => setFormData({ ...formData, check_in: e.target.value })}
                                                style={{
                                                    width: '100%', padding: '10px 12px 10px 40px',
                                                    borderRadius: '12px', border: '1px solid #E5E7EB',
                                                    fontSize: '15px', outline: 'none',
                                                    fontFamily: 'inherit'
                                                }}
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#374151', marginBottom: '6px' }}>
                                            Check-out (Optional)
                                        </label>
                                        <input
                                            type="date"
                                            min={formData.check_in || new Date().toISOString().split('T')[0]}
                                            value={formData.check_out}
                                            onChange={(e) => setFormData({ ...formData, check_out: e.target.value })}
                                            style={{
                                                width: '100%', padding: '10px 12px',
                                                borderRadius: '12px', border: '1px solid #E5E7EB',
                                                fontSize: '15px', outline: 'none',
                                                fontFamily: 'inherit'
                                            }}
                                        />
                                    </div>
                                </div>

                                {/* Submit Button */}
                                <motion.button
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                    disabled={status === 'submitting'}
                                    type="submit"
                                    style={{
                                        marginTop: '10px',
                                        width: '100%', padding: '14px',
                                        backgroundColor: '#00B14F', color: 'white',
                                        border: 'none', borderRadius: '16px',
                                        fontSize: '16px', fontWeight: '700',
                                        cursor: status === 'submitting' ? 'wait' : 'pointer',
                                        boxShadow: '0 4px 12px rgba(0, 177, 79, 0.3)',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px'
                                    }}
                                >
                                    {status === 'submitting' ? (
                                        <>
                                            <div className="spinner" style={{
                                                width: '18px', height: '18px',
                                                border: '2px solid white', borderTopColor: 'transparent',
                                                borderRadius: '50%', animation: 'spin 1s linear infinite'
                                            }} />
                                            Processing...
                                        </>
                                    ) : (
                                        'Confirm Booking Request'
                                    )}
                                </motion.button>

                                <style>{`
                                    @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
                                `}</style>
                            </form>
                        )}
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
};

export default RoomBookingModal;
