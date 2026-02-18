import React from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Briefcase } from 'lucide-react';

const Landing = () => {
    const navigate = useNavigate();

    return (
        <div style={{
            minHeight: '100vh',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'white',
            padding: '24px'
        }}>
            <div style={{ textAlign: 'center', marginBottom: '48px' }}>
                <img src="/logo.png" alt="JUNG" style={{ height: '80px', marginBottom: '16px' }} />
                <h1 style={{ fontSize: '28px', fontWeight: '800', color: 'var(--color-primary)' }}>Welcome to JUNG</h1>
                <p style={{ color: 'var(--color-text-secondary)' }}>Choose how you want to continue</p>
            </div>

            <div style={{ width: '100%', maxWidth: '400px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
                <SelectionCard
                    icon={<User size={32} color="var(--color-primary)" />}
                    title="I need a Service"
                    subtitle="Ordering food, rides, or rooms"
                    onClick={() => navigate('/welcome')}
                    bgColor="#F9FFF9"
                />

                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <div style={{ flex: 1, height: '1px', backgroundColor: '#E0E0E0' }}></div>
                    <span style={{ fontSize: '12px', color: '#9E9E9E', fontWeight: '500' }}>OR</span>
                    <div style={{ flex: 1, height: '1px', backgroundColor: '#E0E0E0' }}></div>
                </div>

                <SelectionCard
                    icon={<Briefcase size={32} color="#1565C0" />}
                    title="I want to be a Partner"
                    subtitle="Driver, Restaurant, or Room Owner"
                    onClick={() => navigate('/partner-select')}
                    bgColor="#E3F2FD"
                />
            </div>
        </div>
    );
};

const SelectionCard = ({ icon, title, subtitle, onClick, bgColor }) => (
    <button
        onClick={onClick}
        style={{
            padding: '32px 24px',
            borderRadius: '24px',
            backgroundColor: bgColor,
            display: 'flex',
            alignItems: 'center',
            gap: '24px',
            border: '2px solid transparent',
            transition: 'all 0.2s',
            cursor: 'pointer',
            textAlign: 'left'
        }}
        onMouseOver={(e) => {
            e.currentTarget.style.transform = 'translateY(-2px)';
            e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.08)';
        }}
        onMouseOut={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = 'none';
        }}
    >
        <div style={{
            width: '64px',
            height: '64px',
            borderRadius: '20px',
            backgroundColor: 'white',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 4px 12px rgba(0,0,0,0.05)'
        }}>
            {icon}
        </div>
        <div>
            <h3 style={{ fontSize: '20px', fontWeight: '700', color: '#1A1A1A', marginBottom: '4px' }}>{title}</h3>
            <p style={{ fontSize: '14px', color: 'var(--color-text-secondary)' }}>{subtitle}</p>
        </div>
    </button>
);

export default Landing;
