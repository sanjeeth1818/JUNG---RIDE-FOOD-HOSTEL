import React, { useState, useEffect } from 'react';
import { Search, ChevronRight, GraduationCap } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useUser } from '../context/UserContext';

const UniversitySelect = () => {
    const [universities, setUniversities] = useState([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const navigate = useNavigate();
    const locationState = useLocation();
    const { loginAsStudent, updateProfile, location: userLocation, profile } = useUser();

    useEffect(() => {
        const fetchUnis = async () => {
            try {
                const res = await fetch('http://localhost:5000/api/universities');
                const data = await res.json();
                if (Array.isArray(data)) {
                    setUniversities(data.map(u => u.name));
                }
            } catch (err) {
                console.error("Failed to fetch universities:", err);
                setError("Failed to load universities. Please try again.");
            } finally {
                setLoading(false);
            }
        };
        fetchUnis();
    }, []);

    const redirectAfter = locationState.state?.redirectAfter;

    const handleSelect = (uni) => {
        // If profile name is missing for some reason, we might need a fallback or prompt, 
        // but user asked to get from DB. Our context loaded it from DB.

        // updateProfile({ name }); // No need to update if it's already there

        if (!profile?.name) {
            // Fallback just in case, though protected route should ensure we have a user
            console.error("No profile name found");
        }

        loginAsStudent(uni);
        if (redirectAfter) {
            navigate(redirectAfter);
        } else {
            navigate('/student/dashboard');
        }

    };


    return (
        <div style={{ padding: '24px', paddingBottom: '100px' }}>

            {/* 1. Welcome Header (Big Size) */}
            <div style={{ marginBottom: '32px' }}>
                <h1 style={{ fontSize: '28px', fontWeight: '800', color: '#1B5E20', marginBottom: '4px' }}>
                    Welcome back, {profile?.name?.split(' ')[0]}!
                </h1>
                <p style={{ color: '#757575', fontSize: '15px' }}>Ready to explore your campus.</p>
            </div>

            {/* 2. Page Title & Description */}
            <h2 style={{ fontSize: '20px', fontWeight: '700', color: '#333', marginBottom: '8px' }}>Select University</h2>
            <p style={{ color: '#757575', marginBottom: '24px', fontSize: '14px' }}>Choose your university to find nearby services.</p>



            <div style={{ position: 'relative', marginBottom: '24px' }}>
                <Search size={20} color="#9E9E9E" style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)' }} />
                <input
                    type="text"
                    placeholder="Search university..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    style={{
                        width: '100%',
                        padding: '16px 16px 16px 48px',
                        borderRadius: '16px',
                        border: '1px solid #E0E0E0',
                        backgroundColor: '#F5F5F5',
                        fontSize: '16px',
                        outline: 'none'
                    }}
                />
            </div>

            {loading ? (
                <div style={{ padding: '40px', textAlign: 'center', color: '#757575' }}>Loading universities...</div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {universities.filter(u => u.toLowerCase().includes(searchTerm.toLowerCase())).map((uni, index) => (
                        <button
                            key={index}
                            onClick={() => handleSelect(uni)}
                            style={{
                                padding: '20px',
                                borderRadius: '16px',
                                backgroundColor: 'white',
                                boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                border: userLocation?.name === uni ? '2px solid var(--color-primary)' : '1px solid #F0F0F0',
                                textAlign: 'left',
                                width: '100%',
                                cursor: 'pointer'
                            }}
                        >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                                <div style={{
                                    width: '40px',
                                    height: '40px',
                                    borderRadius: '12px',
                                    background: userLocation?.name === uni ? 'var(--color-primary)' : '#E8F5E9',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center'
                                }}>
                                    <GraduationCap size={20} color={userLocation?.name === uni ? 'white' : '#2E7D32'} />
                                </div>
                                <span style={{
                                    fontWeight: userLocation?.name === uni ? '700' : '500',
                                    color: userLocation?.name === uni ? 'var(--color-primary)' : '#1A1A1A'
                                }}>
                                    {uni} {userLocation?.name === uni && "(Current Selection)"}
                                </span>
                            </div>
                            <ChevronRight size={20} color={userLocation?.name === uni ? 'var(--color-primary)' : "#BDBDBD"} />
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
};

export default UniversitySelect;
