import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import {
    LayoutDashboard, Users, UserCheck, Hotel,
    CalendarCheck, Bike, Settings, LogOut,
    TrendingUp, Activity, Bell, Search,
    ArrowUpRight, MoreVertical, Map, GraduationCap,
    DollarSign, Utensils, Plus, Trash2, Edit3, Navigation, MapPin,
    Ban, Power, XCircle, FileText
} from 'lucide-react';

// Fix for default Leaflet icon not showing
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const StatusBadge = ({ status }) => {
    const styles = {
        Active: { bg: '#dcfce7', color: '#166534', dot: '#22c55e' },
        Inactive: { bg: '#fff7ed', color: '#9a3412', dot: '#f97316' },
        Pending: { bg: '#eff6ff', color: '#1e40af', dot: '#3b82f6' },
        Rejected: { bg: '#fef2f2', color: '#991b1b', dot: '#ef4444' },
        Rejected: { bg: '#fef2f2', color: '#991b1b', dot: '#ef4444' }
    };
    const style = styles[status] || styles.Active;

    return (
        <span style={{
            backgroundColor: style.bg,
            color: style.color,
            padding: '6px 12px',
            borderRadius: '20px',
            fontSize: '12px',
            fontWeight: '700',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
        }}>
            <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: style.dot }} />
            {status}
        </span>
    );
};

const FilterButton = ({ label, active, onClick }) => (
    <button onClick={onClick} style={{ padding: '10px 20px', borderRadius: '12px', border: active ? 'none' : '1px solid #E2E8F0', backgroundColor: active ? '#16a34a' : 'white', color: active ? 'white' : '#64748B', fontWeight: '700', fontSize: '13px', cursor: 'pointer', transition: 'all 0.2s' }}>
        {label}
    </button>
);

const HealthItem = ({ label, value }) => (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: '14px', opacity: 0.8 }}>{label}</span>
        <span style={{ fontWeight: '700' }}>{value}</span>
    </div>
);

const HealthCard = () => (
    <div style={{ backgroundColor: '#16a34a', borderRadius: '24px', padding: '32px', color: 'white', position: 'relative', overflow: 'hidden', boxShadow: '0 20px 40px -10px rgba(22, 163, 74, 0.3)' }}>
        <TrendingUp size={48} style={{ opacity: 0.3, marginBottom: '24px' }} />
        <h3 style={{ fontSize: '20px', fontWeight: '800', margin: '0 0 12px' }}>System Health</h3>
        <p style={{ fontSize: '14px', opacity: 0.9, lineHeight: '1.6', marginBottom: '32px' }}>All systems are operational. Platform traffic is up 12% compared to last week.</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <HealthItem label="API Response" value="42ms" />
            <HealthItem label="Active Sessions" value="1.2k" />
            <HealthItem label="DB Load" value="14%" />
        </div>
    </div>
);

const NavItem = ({ icon: Icon, label, active, onClick }) => (
    <button
        onClick={onClick}
        style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            padding: '14px 16px',
            borderRadius: '16px',
            backgroundColor: active ? '#f0fdf4' : 'transparent',
            color: active ? '#16a34a' : '#64748B',
            border: 'none',
            fontWeight: active ? '700' : '600',
            cursor: 'pointer',
            transition: 'all 0.2s',
            textAlign: 'left'
        }}
    >
        <Icon size={20} strokeWidth={active ? 2.5 : 2} /> {label}
    </button>
);

const IconButton = ({ icon: Icon, onClick }) => (
    <button onClick={onClick} style={{ width: '44px', height: '44px', borderRadius: '12px', border: '1px solid #E2E8F0', backgroundColor: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'all 0.2s', color: '#64748B' }}>
        <Icon size={20} />
    </button>
);

const ConfigSubTab = ({ icon: Icon, label, active, onClick }) => (
    <button onClick={onClick} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 16px', borderRadius: '12px', border: 'none', backgroundColor: active ? '#16a34a' : 'transparent', color: active ? 'white' : '#64748B', fontWeight: '700', fontSize: '13px', cursor: 'pointer', transition: 'all 0.2s' }}>
        <Icon size={16} />
        {label}
    </button>
);

const ConfigTable = ({ data, type, onEdit, onDelete, onAdd }) => (
    <div style={{ backgroundColor: 'white', borderRadius: '24px', padding: '32px', boxShadow: '0 4px 20px rgba(0,0,0,0.02)', border: '1px solid #F1F5F9' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
            <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '800', color: '#1E293B', textTransform: 'capitalize' }}>{type.replace('-', ' ')} List</h3>
            <button onClick={onAdd} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 20px', borderRadius: '12px', backgroundColor: '#16a34a', color: 'white', border: 'none', fontWeight: '700', cursor: 'pointer' }}>
                <Plus size={18} /> Add New
            </button>
        </div>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
                <tr style={{ borderBottom: '1px solid #F1F5F9' }}>
                    <th style={{ textAlign: 'left', padding: '16px', color: '#64748B', fontSize: '13px', fontWeight: '600' }}>NAME</th>
                    {type === 'locations' || type === 'universities' ? (
                        <>
                            <th style={{ textAlign: 'left', padding: '16px', color: '#64748B', fontSize: '13px', fontWeight: '600' }}>LOCATION (LAT/LNG)</th>
                        </>
                    ) : type === 'pricing' ? (
                        <>
                            <th style={{ textAlign: 'left', padding: '16px', color: '#64748B', fontSize: '13px', fontWeight: '600' }}>RATES (BASE / KM)</th>
                            <th style={{ textAlign: 'left', padding: '16px', color: '#64748B', fontSize: '13px', fontWeight: '600' }}>ASSETS (ICON/COLOR)</th>
                        </>
                    ) : null}
                    <th style={{ textAlign: 'right', padding: '16px', color: '#64748B', fontSize: '13px', fontWeight: '600' }}>ACTIONS</th>
                </tr>
            </thead>
            <tbody>
                {data?.map((item) => (
                    <tr key={`${type}-${item.id}`} style={{ borderBottom: '1px solid #F8FAFC' }}>
                        <td style={{ padding: '16px' }}>
                            <span style={{ fontWeight: '700', color: '#1E293B', fontSize: '15px' }}>{item.name}</span>
                        </td>
                        {type === 'locations' || type === 'universities' ? (
                            <td style={{ padding: '16px' }}>
                                <span style={{ color: '#64748B', fontSize: '13px' }}>{item.latitude}, {item.longitude}</span>
                            </td>
                        ) : type === 'pricing' ? (
                            <>
                                <td style={{ padding: '16px' }}>
                                    <span style={{ color: '#1E293B', fontWeight: '700' }}>Rs {item.base_rate}</span>
                                    <span style={{ color: '#64748B', fontSize: '13px', marginLeft: '8px' }}>+ Rs {item.per_km_rate}/km</span>
                                </td>
                                <td style={{ padding: '16px' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <span style={{ fontSize: '20px' }}>{item.icon}</span>
                                        <div style={{ width: '16px', height: '16px', borderRadius: '4px', backgroundColor: item.color, border: '1px solid #E2E8F0' }} />
                                    </div>
                                </td>
                            </>
                        ) : null}
                        <td style={{ padding: '16px', textAlign: 'right' }}>
                            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                                <button onClick={() => onEdit(item)} style={{ color: '#64748B', background: 'none', border: 'none', cursor: 'pointer' }}><Edit3 size={18} /></button>
                                <button onClick={() => onDelete(item.id)} style={{ color: '#EF4444', background: 'none', border: 'none', cursor: 'pointer' }}><Trash2 size={18} /></button>
                            </div>
                        </td>
                    </tr>
                ))}
            </tbody>
        </table>
    </div>
);

const StatCard = ({ label, value, icon: Icon, color, trend }) => (
    <div style={{ backgroundColor: 'white', padding: '24px', borderRadius: '24px', border: '1px solid #F1F5F9', boxShadow: '0 4px 15px rgba(0,0,0,0.02)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
            <div style={{ backgroundColor: `${color}15`, padding: '10px', borderRadius: '12px' }}>
                <Icon color={color} size={24} />
            </div>
            <div style={{ backgroundColor: '#f0fdf4', color: '#16a34a', padding: '4px 8px', borderRadius: '8px', fontSize: '12px', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <ArrowUpRight size={14} /> {trend}
            </div>
        </div>
        <p style={{ margin: '0 0 4px', color: '#64748B', fontSize: '13px', fontWeight: '600' }}>{label}</p>
        <h4 style={{ margin: 0, fontSize: '24px', fontWeight: '800', color: '#1E293B' }}>{value}</h4>
    </div>
);

const DocumentViewerModal = ({ partner, onClose }) => {
    if (!partner) return null;

    // Helper to render image or placeholder
    const renderDoc = (url, label) => (
        <div style={{ flex: 1, minWidth: '300px', backgroundColor: '#F8FAFC', padding: '16px', borderRadius: '12px', border: '1px solid #E2E8F0' }}>
            <h4 style={{ margin: '0 0 12px', color: '#475569', fontSize: '14px', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <FileText size={16} /> {label}
            </h4>
            {url ? (
                <div style={{ position: 'relative', width: '100%', paddingTop: '60%', backgroundColor: '#e2e8f0', borderRadius: '8px', overflow: 'hidden' }}>
                    <img
                        src={url.startsWith('data:') || url.startsWith('http') ? url : `http://localhost:5000${url}`}
                        alt={label}
                        style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'contain' }}
                        onClick={() => {
                            if (url.startsWith('data:')) {
                                const newWindow = window.open();
                                newWindow.document.write(`<img src="${url}" />`);
                            } else if (url.startsWith('http')) {
                                window.open(url, '_blank');
                            } else {
                                window.open(`http://localhost:5000${url}`, '_blank');
                            }
                        }}
                    />
                </div>
            ) : (
                <div style={{ width: '100%', height: '180px', backgroundColor: '#F1F5F9', borderRadius: '8px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#94A3B8', border: '2px dashed #CBD5E1' }}>
                    <FileText size={32} style={{ opacity: 0.5, marginBottom: '8px' }} />
                    <span style={{ fontSize: '13px' }}>No document uploaded</span>
                </div>
            )}
        </div>
    );

    return (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(4px)' }}>
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
                style={{ backgroundColor: 'white', borderRadius: '24px', width: '90%', maxWidth: '900px', maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)' }}>

                <div style={{ padding: '24px', borderBottom: '1px solid #F1F5F9', display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'sticky', top: 0, backgroundColor: 'white', zIndex: 10 }}>
                    <div>
                        <h2 style={{ margin: 0, fontSize: '20px', fontWeight: '700', color: '#1E293B' }}>Partner Documents</h2>
                        <p style={{ margin: '4px 0 0', color: '#64748B', fontSize: '14px' }}>Reviewing documents for <span style={{ fontWeight: '600', color: '#0F172A' }}>{partner.name}</span></p>
                    </div>
                    <button onClick={onClose} style={{ padding: '8px', borderRadius: '50%', border: 'none', backgroundColor: '#F1F5F9', cursor: 'pointer', transition: 'background-color 0.2s' }}>
                        <XCircle size={24} color="#64748B" />
                    </button>
                </div>

                <div style={{ padding: '32px', display: 'flex', flexDirection: 'column', gap: '32px' }}>
                    {/* Section: Identity Proofs */}
                    <div>
                        <h3 style={{ fontSize: '16px', fontWeight: '700', color: '#1E293B', marginBottom: '16px', paddingBottom: '8px', borderBottom: '2px solid #F1F5F9', width: 'fit-content' }}>Identity Verification</h3>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '24px' }}>
                            {renderDoc(partner.profile_picture, 'Profile Picture')}
                            {renderDoc(partner.id_front_image, 'NIC / ID Front')}
                            {renderDoc(partner.id_back_image, 'NIC / ID Back')}
                        </div>
                    </div>

                    {/* Section: Vehicle / Business Documents */}
                    {(partner.type === 'Rider' || partner.vehicle_type) && (
                        <div>
                            <h3 style={{ fontSize: '16px', fontWeight: '700', color: '#1E293B', marginBottom: '16px', paddingBottom: '8px', borderBottom: '2px solid #F1F5F9', width: 'fit-content' }}>Vehicle Documents</h3>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '24px' }}>
                                {renderDoc(partner.vehicle_image, 'Vehicle Image')}
                                {renderDoc(partner.vehicle_book, 'Vehicle Registration Book')}
                            </div>
                        </div>
                    )}
                </div>

                <div style={{ padding: '24px', backgroundColor: '#F8FAFC', borderTop: '1px solid #F1F5F9', display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                    <button onClick={onClose} style={{ padding: '10px 24px', borderRadius: '12px', border: '1px solid #E2E8F0', backgroundColor: 'white', color: '#475569', fontWeight: '600', cursor: 'pointer' }}>Close</button>
                </div>
            </motion.div>
        </div>
    );
};

const ManagementTable = ({ data, type, onDelete, onUpdateStatus, onViewDocs }) => (
    <div style={{ backgroundColor: 'white', borderRadius: '24px', padding: '0', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)', border: '1px solid #E2E8F0', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead style={{ backgroundColor: '#F8FAFC' }}>
                <tr>
                    <th style={{ textAlign: 'left', padding: '20px 24px', color: '#475569', fontSize: '12px', fontWeight: '700', letterSpacing: '0.05em', textTransform: 'uppercase' }}>Details</th>
                    <th style={{ textAlign: 'left', padding: '20px 24px', color: '#475569', fontSize: '12px', fontWeight: '700', letterSpacing: '0.05em', textTransform: 'uppercase' }}>Category/Role</th>
                    <th style={{ textAlign: 'left', padding: '20px 24px', color: '#475569', fontSize: '12px', fontWeight: '700', letterSpacing: '0.05em', textTransform: 'uppercase' }}>Status</th>
                    <th style={{ textAlign: 'right', padding: '20px 24px', color: '#475569', fontSize: '12px', fontWeight: '700', letterSpacing: '0.05em', textTransform: 'uppercase' }}>Actions</th>
                </tr>
            </thead>
            <tbody>
                {data.map((item, index) => (
                    <tr key={`${type}-${item.id}`} style={{ borderBottom: index === data.length - 1 ? 'none' : '1px solid #F1F5F9', transition: 'background-color 0.2s' }}
                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#F8FAFC'}
                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'white'}
                    >
                        <td style={{ padding: '20px 24px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                                <div style={{
                                    width: '48px', height: '48px', borderRadius: '14px',
                                    backgroundColor: ['#dbeafe', '#e0e7ff', '#fae8ff', '#fce7f3'][item.id % 4],
                                    color: ['#1e40af', '#3730a3', '#86198f', '#be185d'][item.id % 4],
                                    display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '700', fontSize: '18px'
                                }}>
                                    {item.name?.charAt(0).toUpperCase()}
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                                    <span style={{ fontWeight: '700', color: '#0F172A', fontSize: '15px' }}>{item.business_name || item.name}</span>
                                    <span style={{ color: '#64748B', fontSize: '13px' }}>{item.email}</span>
                                </div>
                            </div>
                        </td>
                        <td style={{ padding: '20px 24px' }}>
                            <span style={{
                                padding: '6px 12px', borderRadius: '8px', backgroundColor: '#F1F5F9', color: '#475569',
                                fontSize: '13px', fontWeight: '600', textTransform: 'capitalize', display: 'inline-block'
                            }}>
                                {item.user_type || item.type}
                            </span>
                        </td>
                        <td style={{ padding: '20px 24px' }}>
                            <StatusBadge status={item.status || 'Active'} />
                        </td>
                        <td style={{ padding: '20px 24px', textAlign: 'right' }}>
                            {type === 'users' ? (
                                <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                                    {item.status === 'Active' ? (
                                        <button onClick={() => onUpdateStatus(item.id, 'Active')}
                                            title="Deactivate User"
                                            style={{ width: '36px', height: '36px', borderRadius: '10px', border: '1px solid #E2E8F0', backgroundColor: 'white', color: '#F59E0B', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s' }}
                                            onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#F59E0B'; e.currentTarget.style.backgroundColor = '#fffbeb'; }}
                                            onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#E2E8F0'; e.currentTarget.style.backgroundColor = 'white'; }}
                                        >
                                            <Power size={18} />
                                        </button>
                                    ) : (
                                        <button onClick={() => onUpdateStatus(item.id, 'Inactive')}
                                            title="Activate User"
                                            style={{ width: '36px', height: '36px', borderRadius: '10px', border: '1px solid #E2E8F0', backgroundColor: 'white', color: '#16a34a', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s' }}
                                            onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#16a34a'; e.currentTarget.style.backgroundColor = '#dcfce7'; }}
                                            onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#E2E8F0'; e.currentTarget.style.backgroundColor = 'white'; }}
                                        >
                                            <Power size={18} />
                                        </button>
                                    )}
                                    <button onClick={() => onDelete(item.id)}
                                        title="Delete User"
                                        style={{ width: '36px', height: '36px', borderRadius: '10px', border: '1px solid #E2E8F0', backgroundColor: 'white', color: '#EF4444', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s' }}
                                        onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#EF4444'; e.currentTarget.style.backgroundColor = '#fef2f2'; }}
                                        onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#E2E8F0'; e.currentTarget.style.backgroundColor = 'white'; }}
                                    >
                                        <Trash2 size={18} />
                                    </button>
                                </div>
                            ) : (
                                <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', alignItems: 'center' }}>
                                    {/* Action Buttons for Partners */}
                                    {/* Document View Button */}
                                    <button onClick={() => onViewDocs(item)}
                                        title="View Documents"
                                        style={{ width: '36px', height: '36px', borderRadius: '10px', border: '1px solid #E2E8F0', backgroundColor: 'white', color: '#3B82F6', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s' }}
                                        onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#3B82F6'; e.currentTarget.style.backgroundColor = '#eff6ff'; }}
                                        onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#E2E8F0'; e.currentTarget.style.backgroundColor = 'white'; }}
                                    >
                                        <FileText size={18} />
                                    </button>

                                    {item.status === 'Pending' && (
                                        <>
                                            <button onClick={() => onUpdateStatus(item.id, 'Active')} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 14px', borderRadius: '10px', backgroundColor: '#16a34a', color: 'white', fontWeight: '600', border: 'none', cursor: 'pointer', fontSize: '13px', boxShadow: '0 2px 4px rgba(22, 163, 74, 0.2)' }}>
                                                <UserCheck size={16} /> Approve
                                            </button>
                                            <button onClick={() => onUpdateStatus(item.id, 'Rejected')} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 14px', borderRadius: '10px', backgroundColor: 'white', border: '1px solid #EF4444', color: '#EF4444', fontWeight: '600', cursor: 'pointer', fontSize: '13px' }}>
                                                <XCircle size={16} /> Reject
                                            </button>
                                        </>
                                    )}
                                    {item.status === 'Active' && (
                                        <button onClick={() => onUpdateStatus(item.id, 'Inactive')} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 14px', borderRadius: '10px', backgroundColor: '#fff7ed', border: '1px solid #ffedd5', color: '#c2410c', fontWeight: '600', cursor: 'pointer', fontSize: '13px' }}>
                                            <Power size={16} /> Deactivate
                                        </button>
                                    )}
                                    {(item.status === 'Inactive' || item.status === 'Rejected') && (
                                        <button onClick={() => onUpdateStatus(item.id, 'Active')} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 14px', borderRadius: '10px', backgroundColor: '#dcfce7', border: '1px solid #dcfce7', color: '#166534', fontWeight: '600', cursor: 'pointer', fontSize: '13px' }}>
                                            <Power size={16} /> Activate
                                        </button>
                                    )}

                                    {/* Delete Button (Always Visible) */}
                                    <div style={{ width: '1px', height: '24px', backgroundColor: '#E2E8F0', margin: '0 8px' }}></div>
                                    <button onClick={() => onDelete(item.id)}
                                        title="Delete Partner"
                                        style={{ width: '36px', height: '36px', borderRadius: '10px', border: 'none', backgroundColor: 'transparent', color: '#94A3B8', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s' }}
                                        onMouseEnter={(e) => { e.currentTarget.style.color = '#EF4444'; e.currentTarget.style.backgroundColor = '#fef2f2'; }}
                                        onMouseLeave={(e) => { e.currentTarget.style.color = '#94A3B8'; e.currentTarget.style.backgroundColor = 'transparent'; }}
                                    >
                                        <Trash2 size={18} />
                                    </button>
                                </div>
                            )}
                        </td>
                    </tr>
                ))}
            </tbody>
        </table>
    </div>
);

const RecentActivityTable = ({ recentUsers }) => (
    <div style={{ backgroundColor: 'white', borderRadius: '24px', padding: '32px', boxShadow: '0 4px 20px rgba(0,0,0,0.02)', border: '1px solid #F1F5F9' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
            <h3 style={{ fontSize: '18px', fontWeight: '700', color: '#1E293B', margin: 0 }}>New Registrations</h3>
            <button style={{ color: '#16a34a', background: 'none', border: 'none', fontWeight: '700', cursor: 'pointer', fontSize: '14px' }}>View All</button>
        </div>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
                <tr style={{ borderBottom: '1px solid #F1F5F9' }}>
                    <th style={{ textAlign: 'left', padding: '16px', color: '#64748B', fontSize: '13px', fontWeight: '600' }}>USER</th>
                    <th style={{ textAlign: 'left', padding: '16px', color: '#64748B', fontSize: '13px', fontWeight: '600' }}>TYPE</th>
                    <th style={{ textAlign: 'left', padding: '16px', color: '#64748B', fontSize: '13px', fontWeight: '600' }}>DATE</th>
                </tr>
            </thead>
            <tbody>
                {recentUsers?.map((user, idx) => (
                    <tr key={`recent-${user.id || idx}`} style={{ borderBottom: '1px solid #F8FAFC' }}>
                        <td style={{ padding: '16px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                <div style={{ width: '36px', height: '36px', borderRadius: '10px', backgroundColor: '#F1F5F9', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748B', fontWeight: '700', fontSize: '12px' }}>
                                    {user.name?.charAt(0)}
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column' }}>
                                    <span style={{ fontWeight: '600', color: '#1E293B', fontSize: '14px' }}>{user.name}</span>
                                    <span style={{ color: '#64748B', fontSize: '12px' }}>{user.email}</span>
                                </div>
                            </div>
                        </td>
                        <td style={{ padding: '16px' }}>
                            <span style={{ padding: '6px 12px', borderRadius: '8px', fontSize: '12px', fontWeight: '700', backgroundColor: user.user_type === 'student' ? '#dcfce7' : '#dbeafe', color: user.user_type === 'student' ? '#166534' : '#1e40af' }}>
                                {user.user_type}
                            </span>
                        </td>
                        <td style={{ padding: '16px', color: '#64748B', fontSize: '14px' }}>
                            {new Date(user.created_at).toLocaleDateString()}
                        </td>
                    </tr>
                ))}
            </tbody>
        </table>
    </div>
);

const MapEventHandler = ({ onLocationSelect }) => {
    useMapEvents({
        click(e) {
            onLocationSelect(e.latlng.lat, e.latlng.lng);
        },
    });
    return null;
};

const MapSearch = ({ onResultSelect }) => {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState([]);
    const [loading, setLoading] = useState(false);
    const map = useMap();

    const handleSearch = async (e) => {
        e.preventDefault();
        if (!query.trim()) return;
        setLoading(true);
        try {
            const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}`);
            const data = await res.json();
            setResults(data);
        } catch (err) { console.error('Search error:', err); }
        finally { setLoading(false); }
    };

    return (
        <div style={{ position: 'absolute', top: '10px', left: '50px', zIndex: 1000, width: 'calc(100% - 70px)' }}>
            <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
                <input
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Search place..."
                    style={{ flex: 1, padding: '8px 12px', borderRadius: '8px', border: '1px solid #E2E8F0', boxShadow: '0 2px 10px rgba(0,0,0,0.1)', outline: 'none' }}
                />
                <button
                    onClick={handleSearch}
                    style={{ padding: '8px 15px', backgroundColor: '#2563EB', color: 'white', borderRadius: '8px', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px' }}
                >
                    <Search size={16} />
                </button>
            </div>
            {results.length > 0 && (
                <div style={{ backgroundColor: 'white', borderRadius: '8px', boxShadow: '0 4px 15px rgba(0,0,0,0.1)', maxHeight: '200px', overflowY: 'auto' }}>
                    {results.map((r, i) => (
                        <div
                            key={i}
                            onClick={() => {
                                const lat = parseFloat(r.lat);
                                const lon = parseFloat(r.lon);
                                map.setView([lat, lon], 13);
                                onResultSelect(lat, lon);
                                setResults([]);
                                setQuery(r.display_name);
                            }}
                            style={{ padding: '10px 15px', borderBottom: '1px solid #F1F5F9', cursor: 'pointer', fontSize: '13px' }}
                            onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#F8FAFC'}
                            onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'white'}
                        >
                            {r.display_name}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

const ConfigModal = ({ type, item, onClose, onSave }) => {
    const [lat, setLat] = useState(item?.latitude || 7.8731); // Default to Sri Lanka center
    const [lng, setLng] = useState(item?.longitude || 80.7718);

    // Update state if item changes
    useEffect(() => {
        if (item) {
            setLat(item.latitude);
            setLng(item.longitude);
        } else {
            setLat(7.8731);
            setLng(80.7718);
        }
    }, [item]);

    const handleLocationSelect = (newLat, newLng) => {
        setLat(newLat);
        setLng(newLng);
    };

    return (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' }}>
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} style={{ backgroundColor: 'white', borderRadius: '24px', padding: '30px', width: '100%', maxWidth: '600px', maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 20px 50px rgba(0,0,0,0.2)' }}>
                <h2 style={{ margin: '0 0 20px', fontSize: '24px', fontWeight: '800' }}>{item ? 'Edit' : 'Add New'} {type.slice(0, -1).replace('-', ' ')}</h2>
                <form onSubmit={onSave} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        <label style={{ fontSize: '13px', fontWeight: '700', color: '#64748B' }}>NAME</label>
                        <input name="name" defaultValue={item?.name} required style={{ padding: '12px 16px', borderRadius: '12px', border: '1px solid #E2E8F0', outline: 'none' }} />
                    </div>

                    {(type === 'locations' || type === 'universities') && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                            <div style={{ height: '300px', width: '100%', borderRadius: '16px', overflow: 'hidden', position: 'relative', border: '1px solid #E2E8F0' }}>
                                <MapContainer center={[lat, lng]} zoom={7} style={{ height: '100%', width: '100%' }}>
                                    <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                                    <MapEventHandler onLocationSelect={handleLocationSelect} />
                                    <MapSearch onResultSelect={handleLocationSelect} />
                                    <Marker position={[lat, lng]} />
                                </MapContainer>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                    <label style={{ fontSize: '13px', fontWeight: '700', color: '#64748B' }}>LATITUDE</label>
                                    <input name="latitude" type="number" step="any" value={lat} onChange={(e) => setLat(parseFloat(e.target.value))} required style={{ padding: '12px 16px', borderRadius: '12px', border: '1px solid #E2E8F0', outline: 'none' }} />
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                    <label style={{ fontSize: '13px', fontWeight: '700', color: '#64748B' }}>LONGITUDE</label>
                                    <input name="longitude" type="number" step="any" value={lng} onChange={(e) => setLng(parseFloat(e.target.value))} required style={{ padding: '12px 16px', borderRadius: '12px', border: '1px solid #E2E8F0', outline: 'none' }} />
                                </div>
                            </div>
                            <p style={{ margin: 0, fontSize: '11px', color: '#64748B', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                <Navigation size={12} /> Search or click on the map to pin exact coordinates
                            </p>
                        </div>
                    )}

                    {type === 'pricing' && (
                        <>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                <label style={{ fontSize: '13px', fontWeight: '700', color: '#64748B' }}>VEHICLE TYPE (Internal ID)</label>
                                <input name="vehicle_type" defaultValue={item?.vehicle_type} readOnly={!!item} placeholder="e.g. Tuk" required style={{ padding: '12px 16px', borderRadius: '12px', border: '1px solid #E2E8F0', outline: 'none', backgroundColor: item ? '#F8FAFC' : 'white' }} />
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                    <label style={{ fontSize: '13px', fontWeight: '700', color: '#64748B' }}>BASE RATE (Rs)</label>
                                    <input name="base_rate" type="number" defaultValue={item?.base_rate} required style={{ padding: '12px 16px', borderRadius: '12px', border: '1px solid #E2E8F0', outline: 'none' }} />
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                    <label style={{ fontSize: '13px', fontWeight: '700', color: '#64748B' }}>PER KM RATE (Rs)</label>
                                    <input name="per_km_rate" type="number" defaultValue={item?.per_km_rate} required style={{ padding: '12px 16px', borderRadius: '12px', border: '1px solid #E2E8F0', outline: 'none' }} />
                                </div>
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                    <label style={{ fontSize: '13px', fontWeight: '700', color: '#64748B' }}>ICON (Emoji/Char)</label>
                                    <input name="icon" defaultValue={item?.icon} placeholder="e.g. 🛺" required style={{ padding: '12px 16px', borderRadius: '12px', border: '1px solid #E2E8F0', outline: 'none' }} />
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                    <label style={{ fontSize: '13px', fontWeight: '700', color: '#64748B' }}>COLOR (Hex)</label>
                                    <input name="color" defaultValue={item?.color} placeholder="e.g. #16a34a" required style={{ padding: '12px 16px', borderRadius: '12px', border: '1px solid #E2E8F0', outline: 'none' }} />
                                </div>
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                    <label style={{ fontSize: '13px', fontWeight: '700', color: '#64748B' }}>DEFAULT ETA (Minutes)</label>
                                    <input name="eta_default" type="number" defaultValue={item?.eta_default || 10} placeholder="10" required style={{ padding: '12px 16px', borderRadius: '12px', border: '1px solid #E2E8F0', outline: 'none' }} />
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                    <label style={{ fontSize: '13px', fontWeight: '700', color: '#64748B' }}>STATUS</label>
                                    <select name="is_active" defaultValue={item?.is_active !== undefined ? item.is_active : 1} style={{ padding: '12px 16px', borderRadius: '12px', border: '1px solid #E2E8F0', outline: 'none', backgroundColor: 'white', cursor: 'pointer', fontWeight: '600' }}>
                                        <option value={1}>Active</option>
                                        <option value={0}>Inactive</option>
                                    </select>
                                </div>
                            </div>
                        </>
                    )}

                    <div style={{ display: 'flex', gap: '12px', marginTop: '12px' }}>
                        <button type="button" onClick={onClose} style={{ flex: 1, padding: '14px', borderRadius: '12px', border: '1px solid #E2E8F0', backgroundColor: 'white', fontWeight: '700', cursor: 'pointer' }}>Cancel</button>
                        <button type="submit" style={{ flex: 1, padding: '14px', borderRadius: '12px', border: 'none', backgroundColor: '#16a34a', color: 'white', fontWeight: '700', cursor: 'pointer' }}>Save Changes</button>
                    </div>
                </form>
            </motion.div>
        </div>
    );
};

const AdminDashboard = () => {
    const [stats, setStats] = useState(null);
    const [users, setUsers] = useState([]);
    const [partners, setPartners] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('overview');
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [configData, setConfigData] = useState({ locations: [], universities: [], foodCategories: [], vehicleTypes: [] });
    const [configTab, setConfigTab] = useState('locations');
    const [selectedPartnerForDocs, setSelectedPartnerForDocs] = useState(null);

    const handleViewDocs = (partner) => {
        setSelectedPartnerForDocs(partner);
    };
    const [isConfigModalOpen, setIsConfigModalOpen] = useState(false);
    const [editingItem, setEditingItem] = useState(null);
    const navigate = useNavigate();
    const adminUser = JSON.parse(localStorage.getItem('admin_user') || '{}');

    useEffect(() => {
        // Initial check for admin info in localStorage
        const adminData = localStorage.getItem('admin_user');
        if (!adminData) {
            navigate('/admin');
            return;
        }

        if (activeTab === 'overview') fetchStats();
        if (activeTab === 'users') fetchUsers();
        if (activeTab === 'partners') fetchPartners();
        if (activeTab === 'config') fetchConfig();
    }, [activeTab, searchQuery, statusFilter, configTab]);

    const fetchConfig = async () => {
        setLoading(true);
        try {
            let endpoint = '';
            if (configTab === 'locations') endpoint = 'locations';
            if (configTab === 'universities') endpoint = 'universities';
            if (configTab === 'food') endpoint = 'food-categories';
            if (configTab === 'pricing') endpoint = 'vehicle-types';

            const res = await fetch(`http://localhost:5000/api/admin/config/${endpoint}`, { credentials: 'include' });
            const data = await res.json();
            if (res.ok) setConfigData(prev => ({ ...prev, [configTab === 'food' ? 'foodCategories' : configTab === 'pricing' ? 'vehicleTypes' : configTab]: data }));
        } catch (err) {
            console.error('Failed to fetch config:', err);
            // Only alert if we're not unmounting/redirecting
            if (!loading) alert(`Failed to fetch ${configTab} configuration. The endpoint might be missing or you're unauthorized.`);
        }
        finally { setLoading(false); }
    };

    const fetchStats = async () => {
        try {
            const res = await fetch('http://localhost:5000/api/admin/stats', { credentials: 'include' });
            const data = await res.json();
            if (res.ok) setStats(data);
            else if (res.status === 401) navigate('/admin');
        } catch (err) { console.error('Failed to fetch stats'); }
        finally { setLoading(false); }
    };

    const fetchUsers = async () => {
        setLoading(true);
        try {
            const res = await fetch(`http://localhost:5000/api/admin/users?search=${searchQuery}`, { credentials: 'include' });
            const data = await res.json();
            if (res.ok) {
                const usersWithStatus = data.map(u => ({
                    ...u,
                    status: u.is_active === 1 ? 'Active' : 'Inactive'
                }));
                setUsers(usersWithStatus);
            }
        } catch (err) { console.error('Failed to fetch users'); }
        finally { setLoading(false); }
    };

    const fetchPartners = async () => {
        setLoading(true);
        try {
            const res = await fetch(`http://localhost:5000/api/admin/partners?search=${searchQuery}&status=${statusFilter}`, { credentials: 'include' });
            const data = await res.json();
            if (res.ok) setPartners(data);
        } catch (err) { console.error('Failed to fetch partners'); }
        finally { setLoading(false); }
    };

    const handleUpdatePartnerStatus = async (id, newStatus) => {
        try {
            const res = await fetch(`http://localhost:5000/api/admin/partners/${id}/status`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: newStatus }),
                credentials: 'include'
            });
            if (res.ok) fetchPartners();
        } catch (err) { alert('Failed to update status'); }
    };

    const handleDeletePartner = async (id) => {
        if (!window.confirm('Are you sure you want to delete this partner? This action cannot be undone.')) return;
        try {
            const res = await fetch(`http://localhost:5000/api/admin/partners/${id}`, {
                method: 'DELETE',
                credentials: 'include'
            });
            if (res.ok) fetchPartners();
            else alert('Failed to delete partner');
        } catch (err) { alert('Failed to delete partner'); }
    };

    const handleDeleteConfig = async (id) => {
        if (!window.confirm('Are you sure you want to delete this item?')) return;
        try {
            let endpoint = '';
            if (configTab === 'locations') endpoint = 'config/locations';
            if (configTab === 'universities') endpoint = 'config/locations';
            if (configTab === 'food') endpoint = 'config/food-categories';
            if (configTab === 'pricing') endpoint = 'config/vehicle-types';

            const res = await fetch(`http://localhost:5000/api/admin/${endpoint}/${id}`, {
                method: 'DELETE',
                credentials: 'include'
            });
            if (res.ok) fetchConfig();
            else alert('Failed to delete configuration item');
        } catch (err) { alert('Failed to delete config'); }
    };

    const handleDeleteUser = async (id) => {
        if (!window.confirm('Are you sure you want to delete this user?')) return;
        try {
            const res = await fetch(`http://localhost:5000/api/admin/users/${id}`, {
                method: 'DELETE',
                credentials: 'include'
            });
            if (res.ok) fetchUsers();
        } catch (err) { alert('Failed to delete user'); }
    };

    const handleUpdateUserStatus = async (id, currentStatus) => {
        const newStatus = currentStatus === 'Active' ? 'Inactive' : 'Active';
        if (!window.confirm(`Are you sure you want to ${newStatus === 'Active' ? 'activate' : 'deactivate'} this user?`)) return;

        try {
            const res = await fetch(`http://localhost:5000/api/admin/users/${id}/status`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: newStatus }),
                credentials: 'include'
            });
            if (res.ok) fetchUsers();
        } catch (err) { alert('Failed to update user status'); }
    };

    const handleSaveConfig = async (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        const data = Object.fromEntries(formData.entries());

        // Add type for locations/universities if not present
        if (configTab === 'locations') data.type = 'City';
        if (configTab === 'universities') {
            data.type = 'University';
        }

        try {
            let endpoint = '';
            if (configTab === 'locations' || configTab === 'universities') endpoint = 'config/locations';
            if (configTab === 'food') endpoint = 'config/food-categories';
            if (configTab === 'pricing') endpoint = 'config/vehicle-types';

            const url = editingItem
                ? `http://localhost:5000/api/admin/${endpoint}/${editingItem.id}`
                : `http://localhost:5000/api/admin/${endpoint}`;

            const method = editingItem ? 'PUT' : 'POST';

            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data),
                credentials: 'include'
            });

            if (res.ok) {
                setIsConfigModalOpen(false);
                setEditingItem(null);
                fetchConfig();
            } else {
                const errData = await res.json();
                alert(errData.error || 'Failed to save configuration');
            }
        } catch (err) { alert('Failed to save configuration'); }
    };

    const handleLogout = async () => {
        await fetch('http://localhost:5000/api/auth/logout', { method: 'POST', credentials: 'include' });
        localStorage.removeItem('admin_user');
        navigate('/admin');
    };

    if (loading && !stats && !users.length && !partners.length) return (
        <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#f0fdf4' }}>
            <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                style={{ width: '40px', height: '40px', border: '4px solid #dcfce7', borderTop: '4px solid #16a34a', borderRadius: '50%' }} />
        </div>
    );

    return (
        <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: '#F8FAFC', fontFamily: "'Inter', sans-serif" }}>
            {/* Sidebar */}
            <div style={{ width: '280px', backgroundColor: 'white', borderRight: '1px solid #E2E8F0', display: 'flex', flexDirection: 'column', padding: '32px 20px', position: 'fixed', height: '100vh', zIndex: 10 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '48px', paddingLeft: '12px' }}>
                    <div style={{ backgroundColor: '#16a34a', padding: '10px', borderRadius: '14px', boxShadow: '0 8px 16px -4px rgba(22, 163, 74, 0.3)' }}>
                        <LayoutDashboard color="white" size={24} />
                    </div>
                    <span style={{ fontSize: '20px', fontWeight: '800', color: '#166534', letterSpacing: '-0.5px' }}>JungAdmin</span>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', flex: 1 }}>
                    <NavItem icon={LayoutDashboard} label="Overview" active={activeTab === 'overview'} onClick={() => { setActiveTab('overview'); setSearchQuery(''); }} />
                    <NavItem icon={Users} label="Manage Users" active={activeTab === 'users'} onClick={() => { setActiveTab('users'); setSearchQuery(''); }} />
                    <NavItem icon={UserCheck} label="Partners" active={activeTab === 'partners'} onClick={() => { setActiveTab('partners'); setSearchQuery(''); }} />
                    <NavItem icon={Settings} label="Configuration" active={activeTab === 'config'} onClick={() => { setActiveTab('config'); setSearchQuery(''); }} />
                    <NavItem icon={Activity} label="Settings" active={activeTab === 'settings'} onClick={() => navigate('/admin/settings')} />
                </div>

                <button onClick={handleLogout} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '16px', borderRadius: '16px', backgroundColor: '#FEF2F2', color: '#EF4444', border: 'none', fontWeight: '700', cursor: 'pointer', transition: 'all 0.2s', marginTop: 'auto' }}>
                    <LogOut size={20} /> Logout
                </button>
            </div>

            {/* Main Content */}
            <div style={{ marginLeft: '280px', flex: 1, padding: '40px' }}>
                <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px' }}>
                    <div>
                        <h1 style={{ fontSize: '24px', fontWeight: '800', color: '#1E293B', margin: 0 }}>
                            {activeTab === 'overview' ? 'Overview' : activeTab === 'users' ? 'User Management' : activeTab === 'partners' ? 'Partner Network' : 'Platform Configuration'}
                        </h1>
                        <p style={{ color: '#64748B', fontSize: '15px', marginTop: '4px' }}>
                            {activeTab === 'overview' ? "Here's what's happening across the platform today." :
                                activeTab === 'users' ? `Managing total ${users.length} records.` :
                                    activeTab === 'partners' ? `Managing total ${partners.length} records.` :
                                        `Managing total ${configTab === 'food' ? configData.foodCategories.length : configTab === 'pricing' ? configData.vehicleTypes.length : configData[configTab]?.length || 0} configuration records.`}
                        </p>
                    </div>
                    <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                        {(activeTab === 'users' || activeTab === 'partners') && (
                            <div style={{ position: 'relative' }}>
                                <Search size={18} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }} />
                                <input
                                    type="text"
                                    placeholder="Search records..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    style={{ padding: '12px 16px 12px 48px', borderRadius: '14px', border: '1px solid #E2E8F0', outline: 'none', width: '280px', fontSize: '14px' }}
                                />
                            </div>
                        )}
                        <IconButton icon={Bell} />
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginLeft: '12px' }}>
                            <div style={{ textAlign: 'right' }}>
                                <p style={{ margin: 0, fontWeight: '700', color: '#1E293B', fontSize: '14px' }}>{adminUser.name}</p>
                                <p style={{ margin: 0, color: '#64748B', fontSize: '12px' }}>Super Admin</p>
                            </div>
                            <div style={{ width: '44px', height: '44px', borderRadius: '12px', backgroundColor: '#dcfce7', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <UserCheck color="#16a34a" size={20} />
                            </div>
                        </div>
                    </div>
                </header>

                <AnimatePresence mode="wait">
                    {activeTab === 'overview' && (
                        <motion.div key="overview" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '20px', marginBottom: '40px' }}>
                                <StatCard label="Total Users" value={stats?.totalUsers} icon={Users} color="#16a34a" trend="+12.5%" />
                                <StatCard label="Partners" value={stats?.totalPartners} icon={UserCheck} color="#0891b2" trend="+5.2%" />
                                <StatCard label="Ride Requests" value={stats?.totalRides} icon={Bike} color="#8b5cf6" trend="+15.1%" />
                                <StatCard label="Total Rooms" value={stats?.totalRooms} icon={Hotel} color="#3b82f6" trend="+3.2%" />
                                <StatCard label="Food (Restaurants)" value={stats?.totalFoodPartners} icon={Activity} color="#f59e0b" trend="+8.4%" />
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '24px' }}>
                                <RecentActivityTable recentUsers={stats?.recentUsers} />
                                <HealthCard />
                            </div>
                        </motion.div>
                    )}

                    {activeTab === 'users' && (
                        <motion.div key="users" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                            <ManagementTable
                                data={users}
                                type="users"
                                onDelete={handleDeleteUser}
                                onUpdateStatus={handleUpdateUserStatus}
                            />
                        </motion.div>
                    )}

                    {activeTab === 'partners' && (
                        <motion.div key="partners" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                            <div style={{ marginBottom: '24px', display: 'flex', gap: '12px' }}>
                                <FilterButton label="All Partners" active={statusFilter === ''} onClick={() => setStatusFilter('')} />
                                <FilterButton label="Pending" active={statusFilter === 'Pending'} onClick={() => setStatusFilter('Pending')} />
                                <FilterButton label="Active" active={statusFilter === 'Active'} onClick={() => setStatusFilter('Active')} />
                                <FilterButton label="Inactive" active={statusFilter === 'Inactive'} onClick={() => setStatusFilter('Inactive')} />
                                <FilterButton label="Rejected" active={statusFilter === 'Rejected'} onClick={() => setStatusFilter('Rejected')} />
                            </div>
                            <ManagementTable
                                data={partners}
                                type="partners"
                                onUpdateStatus={handleUpdatePartnerStatus}
                                onDelete={handleDeletePartner}
                                onViewDocs={handleViewDocs}
                            />
                        </motion.div>
                    )}



                    {activeTab === 'config' && (
                        <motion.div key="config" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                            <div style={{ marginBottom: '32px', display: 'flex', gap: '8px', backgroundColor: 'white', padding: '8px', borderRadius: '16px', border: '1px solid #E2E8F0', width: 'fit-content' }}>
                                <ConfigSubTab icon={Map} label="Cities" active={configTab === 'locations'} onClick={() => setConfigTab('locations')} />
                                <ConfigSubTab icon={GraduationCap} label="Universities" active={configTab === 'universities'} onClick={() => setConfigTab('universities')} />
                                <ConfigSubTab icon={DollarSign} label="Vehicle Types" active={configTab === 'pricing'} onClick={() => setConfigTab('pricing')} />
                                <ConfigSubTab icon={Utensils} label="Food Categories" active={configTab === 'food'} onClick={() => setConfigTab('food')} />
                            </div>

                            <ConfigTable
                                type={configTab}
                                data={configTab === 'food' ? configData.foodCategories : configTab === 'pricing' ? configData.vehicleTypes : configData[configTab]}
                                onEdit={(item) => { setEditingItem(item); setIsConfigModalOpen(true); }}
                                onDelete={handleDeleteConfig}
                                onAdd={() => { setEditingItem(null); setIsConfigModalOpen(true); }}
                            />

                            {isConfigModalOpen && (
                                <ConfigModal
                                    type={configTab}
                                    item={editingItem}
                                    onClose={() => { setIsConfigModalOpen(false); setEditingItem(null); }}
                                    onSave={handleSaveConfig}
                                />
                            )}
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Document Viewer Modal - Moved outside to fix AnimatePresence warning */}
                <AnimatePresence>
                    {selectedPartnerForDocs && (
                        <DocumentViewerModal
                            partner={selectedPartnerForDocs}
                            onClose={() => setSelectedPartnerForDocs(null)}
                        />
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
};

export default AdminDashboard;
