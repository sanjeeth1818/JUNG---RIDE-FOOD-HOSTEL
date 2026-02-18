import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Quote, Utensils, Car, House } from 'lucide-react';

const PartnerSelect = () => {
    const navigate = useNavigate();

    const handleSelect = (type) => {
        navigate('/partner-register', { state: { partnerType: type } });
    };

    return (
        <div style={{
            minHeight: '100vh',
            padding: '48px 24px',
            background: 'white',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center'
        }}>
            <div style={{ width: '100%', maxWidth: '1000px', display: 'flex', justifyContent: 'flex-end', marginBottom: '16px' }}>
                <button
                    onClick={() => navigate('/partner-login')}
                    style={{
                        padding: '12px 24px',
                        borderRadius: '100px',
                        border: '1px solid var(--color-primary)',
                        backgroundColor: 'white',
                        color: 'var(--color-primary)',
                        fontWeight: '700',
                        cursor: 'pointer',
                        fontSize: '14px'
                    }}
                >
                    Already a Partner? Login
                </button>
            </div>

            <h1 style={{ fontSize: '32px', fontWeight: '800', color: 'var(--color-primary)', marginBottom: '16px' }}>
                Join as a Partner
            </h1>
            <p style={{ color: 'var(--color-text-secondary)', marginBottom: '48px', textAlign: 'center' }}>
                Choose the service you want to provide
            </p>


            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                gap: '24px',
                width: '100%',
                maxWidth: '1000px'
            }}>
                <PartnerCard
                    icon={<Car size={40} color="#C62828" />}
                    title="JUNG Rider"
                    desc="Drive your vehicle and earn"
                    color="#FFEBEE"
                    onClick={() => handleSelect('Rider')}
                />
                <PartnerCard
                    icon={<Utensils size={40} color="#E65100" />}
                    title="JUNG Food"
                    desc="List your restaurant"
                    color="#FFF3E0"
                    onClick={() => handleSelect('Food')}
                />
                <PartnerCard
                    icon={<House size={40} color="#1565C0" />}
                    title="JUNG Rooms"
                    desc="Rent your boarding place"
                    color="#E3F2FD"
                    onClick={() => handleSelect('Room')}
                />
            </div>
        </div>
    );
};

const PartnerCard = ({ icon, title, desc, color, onClick }) => (
    <button
        onClick={onClick}
        style={{
            padding: '48px 24px',
            borderRadius: '24px',
            backgroundColor: color,
            border: 'none',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '24px',
            cursor: 'pointer',
            transition: 'transform 0.2s',
            textAlign: 'center'
        }}
        onMouseOver={(e) => e.currentTarget.style.transform = 'translateY(-8px)'}
        onMouseOut={(e) => e.currentTarget.style.transform = 'translateY(0)'}
    >
        <div style={{
            width: '80px',
            height: '80px',
            borderRadius: '50%',
            backgroundColor: 'white',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
        }}>
            {icon}
        </div>
        <div>
            <h3 style={{ fontSize: '24px', fontWeight: '700', marginBottom: '8px' }}>{title}</h3>
            <p style={{ fontSize: '16px', opacity: 0.8 }}>{desc}</p>
        </div>
    </button>
);

export default PartnerSelect;
