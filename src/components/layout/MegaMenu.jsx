import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';

const MegaMenu = ({ isOpen, onClose }) => {
    const [activeCategory, setActiveCategory] = useState('Consumer'); // Default category

    if (!isOpen) return null;

    return (
        <div style={{
            position: 'fixed',
            top: '80px', // Below navbar
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(255, 255, 255, 0.98)',
            zIndex: 999,
            display: 'flex',
            overflow: 'hidden'
        }} className="animate-fade-in">

            {/* Sidebar Categories */}
            <div style={{
                width: '300px',
                padding: '40px',
                borderRight: '1px solid #f0f0f0',
                height: '100%',
                overflowY: 'auto'
            }}>
                <h2 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '32px', color: '#1A1A1A' }}>Menu</h2>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {['About', 'Consumer', 'Driver', 'Food', 'Rent (Room)'].map(cat => (
                        <CategoryButton
                            key={cat}
                            label={cat}
                            isActive={activeCategory === cat}
                            onClick={() => setActiveCategory(cat)}
                        />
                    ))}
                </div>
            </div>

            {/* Content Area */}
            <div style={{ flex: 1, padding: '60px 80px', backgroundColor: '#F9FAFB', overflowY: 'auto' }}>
                {activeCategory === 'About' && (
                    <div className="animate-slide-up">
                        <MenuSection title="About JUNG" items={[
                            { label: 'Who we are', to: '/about' },
                            { label: 'Our Mission & Values', to: '/about' },
                            { label: 'Inside JUNG Stories', to: '#' },
                            { label: 'Newsroom', to: '#' },
                        ]} />
                        <MenuSection title="Careers" items={[
                            { label: 'Join the Team', to: '#' },
                            { label: 'Life at JUNG', to: '#' },
                        ]} />
                    </div>
                )}

                {activeCategory === 'Consumer' && (
                    <div className="animate-slide-up">
                        <MenuSection title="Daily Services" items={[
                            { label: 'Food Delivery', to: '/food' },
                            { label: 'Rides & Mobility', to: '/student/rides' },
                            { label: 'Stay & Rooms', to: '/rooms' },
                            { label: 'JUNG Mart', to: '/mart' },
                            { label: 'JUNG Express', to: '/express' },
                        ]} />
                        <MenuSection title="Support" items={[
                            { label: 'Help Centre', to: '/help' },
                            { label: 'Safety', to: '#' },
                        ]} />
                    </div>
                )}

                {activeCategory === 'Driver' && (
                    <div className="animate-slide-up">
                        <MenuSection title="Partner with Us" items={[
                            { label: 'Drive with JUNG', to: '/partner-select' },
                            { label: 'Delivery Partner', to: '/partner-select' },
                            { label: 'Rental Partner', to: '/partner-select' },
                        ]} />
                        <MenuSection title="Partner Benefits" items={[
                            { label: 'Incentives', to: '#' },
                            { label: 'Training & Safety', to: '#' },
                        ]} />
                    </div>
                )}

                {activeCategory === 'Food' && (
                    <div className="animate-slide-up">
                        <MenuSection title="Food & Groceries" items={[
                            { label: 'Order Meals', to: '/food' },
                            { label: 'JUNG Mart', to: '/mart' },
                            { label: 'Fresh Market', to: '#' },
                        ]} />
                        <MenuSection title="For Merchants" items={[
                            { label: 'Join as a Merchant', to: '/partner-select' },
                            { label: 'Merchant Dashboard', to: '/partner-login' },
                        ]} />
                    </div>
                )}

                {activeCategory === 'Rent (Room)' && (
                    <div className="animate-slide-up">
                        <MenuSection title="Accommodation" items={[
                            { label: 'Student Hostels', to: '/rooms' },
                            { label: 'Shared Apartments', to: '/rooms' },
                            { label: 'Long-term Stays', to: '#' },
                        ]} />
                        <MenuSection title="Host Support" items={[
                            { label: 'List your Property', to: '/partner-select' },
                            { label: 'Room Management', to: '#' },
                        ]} />
                    </div>
                )}
            </div>
        </div>
    );
};

const CategoryButton = ({ label, isActive, onClick }) => (
    <button
        onClick={onClick}
        style={{
            textAlign: 'left',
            padding: '16px',
            fontSize: '18px',
            fontWeight: isActive ? '700' : '500',
            color: isActive ? '#00B14F' : '#444',
            backgroundColor: 'transparent',
            border: 'none',
            cursor: 'pointer',
            transition: 'color 0.2s'
        }}
    >
        {label}
    </button>
);

const MenuSection = ({ title, items }) => (
    <div style={{ marginBottom: '48px', maxWidth: '600px' }}>
        <h3 style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '24px', color: '#333' }}>{title}</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '24px' }}>
            {items.map((item, index) => (
                <div key={index}>
                    <Link
                        to={item.to}
                        style={{
                            fontSize: '16px',
                            color: '#555',
                            textDecoration: 'none',
                            fontWeight: '500',
                            display: 'block',
                            marginBottom: '8px'
                        }}
                    >
                        {item.label}
                    </Link>
                    {/* Description placeholder if needed */}
                </div>
            ))}
        </div>
    </div>
);

export default MegaMenu;
