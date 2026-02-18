import React from 'react';
import { useNavigate } from 'react-router-dom';
import { GraduationCap, Briefcase, X, User } from 'lucide-react';
import { useUser } from '../../context/UserContext';

const UserTypeModal = ({ isOpen, onClose, redirectAfter }) => {
    const navigate = useNavigate();

    if (!isOpen) return null;

    const handleSelect = (type, path) => {
        // Navigate to login, passing the final destination
        navigate('/login', { state: { type, redirectAfter: path } });
        onClose();
    };

    const handleSelectStudent = () => handleSelect('student', '/student/university');
    const handleSelectWorker = () => handleSelect('worker', '/worker/location');

    return (
        <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.5)',
            zIndex: 1000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '24px',
            backdropFilter: 'blur(4px)'
        }}>
            <div style={{
                backgroundColor: 'white',
                borderRadius: '24px',
                padding: '32px 24px',
                width: '100%',
                maxWidth: '400px',
                position: 'relative',
                boxShadow: '0 20px 40px rgba(0,0,0,0.2)'
            }} className="animate-scale-in">

                <button
                    onClick={onClose}
                    style={{
                        position: 'absolute',
                        top: '16px',
                        right: '16px',
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        padding: '8px'
                    }}
                >
                    <X size={24} color="#666" />
                </button>

                <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '16px' }}>
                    <div style={{ width: '64px', height: '64px', borderRadius: '50%', backgroundColor: '#F5F5F5', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <User size={32} color="var(--color-primary)" />
                    </div>
                </div>

                <p style={{ textAlign: 'center', color: '#666', marginBottom: '24px', fontSize: '14px' }}>
                    Select your profile to continue.
                </p>

                <button
                    onClick={handleSelectStudent}
                    style={{
                        width: '100%',
                        padding: '20px',
                        borderRadius: '20px',
                        backgroundColor: 'white',
                        boxShadow: '0 4px 15px rgba(0,0,0,0.05)',
                        marginBottom: '16px',
                        display: 'flex',
                        alignItems: 'center',
                        transition: 'all 0.2s',
                        border: '1px solid #E0E0E0',
                        cursor: 'pointer',
                        textAlign: 'left'
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'var(--color-primary)'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#E0E0E0'; e.currentTarget.style.transform = 'translateY(0)'; }}
                >
                    <div style={{ width: '48px', height: '48px', borderRadius: '14px', background: '#E8F5E9', display: 'flex', alignItems: 'center', justifyContent: 'center', marginRight: '16px' }}>
                        <GraduationCap size={24} color="#2E7D32" />
                    </div>
                    <div>
                        <h3 style={{ fontSize: '16px', fontWeight: '700', color: '#1A1A1A', marginBottom: '2px' }}>I am a Student</h3>
                        <p style={{ fontSize: '12px', color: '#757575' }}>Find rooms & food around campus</p>
                    </div>
                </button>

                <button
                    onClick={handleSelectWorker}
                    style={{
                        width: '100%',
                        padding: '20px',
                        borderRadius: '20px',
                        backgroundColor: 'white',
                        boxShadow: '0 4px 15px rgba(0,0,0,0.05)',
                        display: 'flex',
                        alignItems: 'center',
                        transition: 'all 0.2s',
                        border: '1px solid #E0E0E0',
                        cursor: 'pointer',
                        textAlign: 'left'
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#1565C0'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#E0E0E0'; e.currentTarget.style.transform = 'translateY(0)'; }}
                >
                    <div style={{ width: '48px', height: '48px', borderRadius: '14px', background: '#E3F2FD', display: 'flex', alignItems: 'center', justifyContent: 'center', marginRight: '16px' }}>
                        <Briefcase size={24} color="#1565C0" />
                    </div>
                    <div>
                        <h3 style={{ fontSize: '16px', fontWeight: '700', color: '#1A1A1A', marginBottom: '2px' }}>I am a Worker</h3>
                        <p style={{ fontSize: '12px', color: '#757575' }}>Services based on your location</p>
                    </div>
                </button>

                <div style={{ textAlign: 'center', marginTop: '24px', borderTop: '1px solid #eee', paddingTop: '16px' }}>
                    <button
                        onClick={() => navigate('/partner-select')}
                        style={{ background: 'none', border: 'none', color: 'var(--color-primary)', fontWeight: '600', fontSize: '14px', cursor: 'pointer' }}
                    >
                        Want to grow with us? Become a Partner
                    </button>
                </div>
            </div>
        </div>
    );
};

export default UserTypeModal;
