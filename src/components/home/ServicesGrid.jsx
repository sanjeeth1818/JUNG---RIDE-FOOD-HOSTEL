import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Utensils, Car, House, Wallet, Package, ShoppingBag, ArrowRight } from 'lucide-react';

import { useUser } from '../../context/UserContext';
import UserTypeModal from '../common/UserTypeModal';

import { motion, AnimatePresence } from 'framer-motion';

const ServicesGrid = () => {
    const [isModalOpen, setIsModalOpen] = React.useState(false);
    const [pendingPath, setPendingPath] = React.useState(null);
    const [activeCategory, setActiveCategory] = React.useState('All');
    const { userType } = useUser();
    const navigate = useNavigate();

    const handleServiceClick = (path) => {
        // If user is already logged in (has userType), go directly
        if (userType) {
            navigate(path);
            return;
        }

        // Otherwise ask for user type
        setPendingPath(path);
        setIsModalOpen(true);
    };


    const categories = ['All', 'Food', 'Rides', 'Rooms'];

    const sections = [
        {
            id: 'Food',
            title: "Deliveries",
            items: [
                { icon: <Utensils />, label: 'Food', desc: 'Order from restaurants', path: '/food', color: '#E8F5E9' },
            ]
        },
        {
            id: 'Rides',
            title: "Mobility",
            items: [
                { icon: <Car />, label: 'Rides', desc: 'Go anywhere', path: '/student/rides', color: '#FFEBEE' },
            ]
        },
        {
            id: 'Rooms',
            title: "Living",
            items: [
                { icon: <House />, label: 'Rooms', desc: 'Find your stay', path: '/rooms', color: '#E1F5FE' },
            ]
        }
    ];

    const filteredSections = activeCategory === 'All'
        ? sections
        : sections.filter(s => s.id === activeCategory || s.items.some(i => i.label === activeCategory));

    return (
        <section style={{ padding: '100px 0', backgroundColor: 'var(--color-bg-light)' }}>
            <div className="container" style={{ maxWidth: '1200px' }}>
                {/* Category Filters */}
                <div style={{ marginBottom: '56px', display: 'flex', gap: '16px', overflowX: 'auto', paddingBottom: '12px' }}>
                    {categories.map((cat) => (
                        <button
                            key={cat}
                            onClick={() => setActiveCategory(cat)}
                            style={{
                                padding: '14px 32px',
                                borderRadius: '100px',
                                backgroundColor: activeCategory === cat ? 'var(--color-primary)' : 'white',
                                color: activeCategory === cat ? 'white' : 'var(--color-text-main)',
                                fontWeight: '700',
                                fontSize: '16px',
                                boxShadow: 'var(--shadow-sm)',
                                whiteSpace: 'nowrap',
                                border: '1px solid',
                                borderColor: activeCategory === cat ? 'transparent' : '#eee',
                                cursor: 'pointer',
                                transition: 'all 0.2s'
                            }}
                        >
                            {cat}
                        </button>
                    ))}
                </div>

                <h2 style={{ fontSize: '42px', fontWeight: '800', marginBottom: '64px', color: 'var(--color-accent)' }}>
                    Keep discovering.
                </h2>

                <AnimatePresence mode="wait">
                    <motion.div
                        key={activeCategory}
                        layout
                        style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '40px' }}
                    >

                        {filteredSections.map((section, sIdx) => (
                            <SectionGroup
                                key={section.title}
                                title={section.title}
                                onServiceClick={handleServiceClick}
                                items={section.items}
                                staggerIndex={sIdx}
                            />
                        ))}
                    </motion.div>
                </AnimatePresence>
            </div>
            <UserTypeModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                redirectAfter={pendingPath}
            />
        </section>
    );
};

const SectionGroup = ({ title, items, onServiceClick, staggerIndex }) => (
    <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: staggerIndex * 0.1 }}
        style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}
    >
        <h3 style={{ fontSize: '20px', fontWeight: '600', color: '#757575', textTransform: 'uppercase', letterSpacing: '1px' }}>
            {title}
        </h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {items.map((item, index) => (
                <ServiceCard key={index} {...item} onClick={onServiceClick} />
            ))}
        </div>
    </motion.div>
);

// ... (rest of imports)

const ServiceCard = ({ icon, label, desc, path, color, onClick }) => {

    return (
        <motion.div
            whileHover={{ y: -8, boxShadow: '0 20px 40px rgba(0,0,0,0.08)' }}
            whileTap={{ scale: 0.98 }}
            onClick={() => onClick(path)}
            style={{
                display: 'flex',
                alignItems: 'center',
                gap: '24px',
                padding: '32px', // Increased padding
                borderRadius: '24px', // More rounded
                backgroundColor: 'white',
                boxShadow: '0 4px 20px rgba(0,0,0,0.04)', // Softer, premium shadow
                cursor: 'pointer',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                border: '1px solid rgba(0,0,0,0.03)',
                position: 'relative',
                overflow: 'hidden'
            }}
        >
            <div style={{
                width: '72px', // Larger icon container
                height: '72px',
                borderRadius: '20px', // Squircle-ish
                backgroundColor: color,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--color-primary-dark)',
                flexShrink: 0
            }}>
                {React.cloneElement(icon, { size: 36 })} {/* Larger icon */}
            </div>

            <div style={{ flex: 1 }}>
                <h4 style={{ fontSize: '22px', fontWeight: '800', marginBottom: '6px', color: '#1A1A1A' }}>{label}</h4>
                <p style={{ fontSize: '15px', color: '#666', fontWeight: '500' }}>{desc}</p>
            </div>

            {/* Action Arrow */}
            <div style={{
                width: '40px',
                height: '40px',
                borderRadius: '50%',
                backgroundColor: '#F5F5F5',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#333'
            }}>
                <ArrowRight size={20} />
            </div>
        </motion.div>
    );
};


export default ServicesGrid;


