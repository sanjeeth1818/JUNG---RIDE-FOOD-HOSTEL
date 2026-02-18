import React, { useState, memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Phone, MapPin, Clock, DollarSign, Car, ChevronDown, ChevronUp, Star } from 'lucide-react';

const TripHistoryCard = memo(({ trip }) => {
    const [isExpanded, setIsExpanded] = useState(false);

    // Format date and time
    const formatDateTime = (dateString) => {
        if (!dateString) return 'N/A';
        const date = new Date(dateString);
        const dateStr = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
        const timeStr = date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
        return { date: dateStr, time: timeStr };
    };

    // Calculate trip duration
    const calculateDuration = () => {
        if (!trip.accepted_at || !trip.completed_at) return 'N/A';
        const start = new Date(trip.accepted_at);
        const end = new Date(trip.completed_at);
        const diffMinutes = Math.round((end - start) / 60000);
        return `${diffMinutes} mins`;
    };

    const { date, time } = formatDateTime(trip.completed_at);
    const duration = calculateDuration();
    const isCompleted = trip.status === 'completed';

    // Vehicle icon mapping
    const getVehicleIcon = (type) => {
        const icons = {
            'Tuk': '🛺',
            'Bike': '🏍️',
            'Car': '🚗',
            'Van': '🚐'
        };
        return icons[type] || '🚗';
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }} // Reduced y offset for faster feel
            animate={{ opacity: 1, y: 0 }}
            className="trip-card"
        >
            {/* Header */}
            <div className="trip-header">
                <div className="vehicle-info">
                    <span className="vehicle-icon">{getVehicleIcon(trip.vehicle_type)}</span>
                    <span>{trip.vehicle_type}</span>
                    {trip.vehicle_plate && <span style={{ color: '#9ca3af', fontSize: '14px' }}>• {trip.vehicle_plate}</span>}
                </div>
                <span className={`status-badge ${isCompleted ? 'status-completed' : 'status-cancelled'}`}>
                    {isCompleted ? '✓ Completed' : '✕ Cancelled'}
                </span>
            </div>

            {/* Driver Section */}
            {trip.driver_name && (
                <div className="driver-section">
                    <div className="driver-avatar">
                        {trip.driver_avatar ? (
                            <img src={trip.driver_avatar} alt={trip.driver_name} />
                        ) : (
                            trip.driver_name.charAt(0).toUpperCase()
                        )}
                    </div>
                    <div className="driver-details">
                        <div className="driver-name">{trip.driver_name}</div>
                        {trip.driver_phone && (
                            <div className="driver-phone">
                                <a href={`tel:${trip.driver_phone}`} className="phone-link">
                                    <Phone size={14} />
                                    {trip.driver_phone}
                                </a>
                            </div>
                        )}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: '13px', fontWeight: 600, color: '#f59e0b' }}>
                        <Star size={14} fill="#f59e0b" />
                        4.8
                    </div>
                </div>
            )}

            {/* Route Section */}
            <div className="route-section">
                <div className="route-point">
                    <div className="route-icon pickup-icon">
                        <MapPin size={14} />
                    </div>
                    <div className="route-text">
                        <div className="route-label">Pickup</div>
                        <div className="route-location">{trip.pickup_location}</div>
                    </div>
                </div>
                <div className="route-arrow">
                    <div style={{ width: 2, height: 20, background: '#e5e7eb', marginLeft: 13 }}></div>
                    <span>{trip.distance_km} km</span>
                </div>
                <div className="route-point">
                    <div className="route-icon dropoff-icon">
                        <MapPin size={14} />
                    </div>
                    <div className="route-text">
                        <div className="route-label">Dropoff</div>
                        <div className="route-location">{trip.dropoff_location}</div>
                    </div>
                </div>
            </div>

            {/* Trip Details */}
            <div className="trip-details">
                <div className="detail-item">
                    <div className="detail-icon">
                        <Clock size={18} color="#6b7280" />
                    </div>
                    <div className="detail-text">
                        <div className="detail-label">Date & Time</div>
                        <div className="detail-value">{date} • {time}</div>
                    </div>
                </div>
                <div className="detail-item">
                    <div className="detail-icon">
                        <DollarSign size={18} color="#6b7280" />
                    </div>
                    <div className="detail-text">
                        <div className="detail-label">Fare</div>
                        <div className="detail-value">LKR {trip.estimated_fare}</div>
                    </div>
                </div>
            </div>

            {/* Expand Button */}
            <button className="expand-btn" onClick={() => setIsExpanded(!isExpanded)}>
                {isExpanded ? 'Show Less' : 'Show More Details'}
                {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </button>

            {/* Expanded Details */}
            <AnimatePresence>
                {isExpanded && (
                    <motion.div
                        className="expanded-details"
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                    >
                        <div className="expanded-grid">
                            <div className="detail-item">
                                <div className="detail-icon">
                                    <Clock size={18} color="#6b7280" />
                                </div>
                                <div className="detail-text">
                                    <div className="detail-label">Duration</div>
                                    <div className="detail-value">{duration}</div>
                                </div>
                            </div>
                            {trip.vehicle_model && (
                                <div className="detail-item">
                                    <div className="detail-icon">
                                        <Car size={18} color="#6b7280" />
                                    </div>
                                    <div className="detail-text">
                                        <div className="detail-label">Vehicle</div>
                                        <div className="detail-value">{trip.vehicle_model}</div>
                                    </div>
                                </div>
                            )}
                            {trip.vehicle_color && (
                                <div className="detail-item">
                                    <div className="detail-icon">
                                        <div style={{ width: 18, height: 18, borderRadius: '50%', background: trip.vehicle_color.toLowerCase(), border: '2px solid #e5e7eb' }}></div>
                                    </div>
                                    <div className="detail-text">
                                        <div className="detail-label">Color</div>
                                        <div className="detail-value">{trip.vehicle_color}</div>
                                    </div>
                                </div>
                            )}
                            <div className="detail-item">
                                <div className="detail-icon">
                                    <DollarSign size={18} color="#6b7280" />
                                </div>
                                <div className="detail-text">
                                    <div className="detail-label">Payment</div>
                                    <div className="detail-value">Cash</div>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
});

export default TripHistoryCard;
