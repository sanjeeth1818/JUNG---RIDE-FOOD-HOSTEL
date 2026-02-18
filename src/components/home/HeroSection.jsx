import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const HeroSection = ({
    title = "JUNG.\nThe Everyday\nEverything App.",
    subtitle = "From food delivery to payment solutions, we're here to make your life easier across Sri Lanka.",
    backgroundImage = 'https://images.unsplash.com/photo-1596627116790-23d58efc3405?q=80&w=2670&auto=format&fit=crop'
}) => {
    const [query, setQuery] = useState('');
    const navigate = useNavigate();

    const handleSearch = (e) => {
        if (e.key && e.key !== 'Enter') return;
        if (!query.trim()) return;

        // Redirect to food search as a default powerful search behavior
        navigate(`/food?search=${encodeURIComponent(query)}`);
    };

    return (
        <section style={{
            position: 'relative',
            width: '100%',
            height: '600px',
            backgroundColor: '#002E27', // Dark fallback
            backgroundImage: `url(${backgroundImage})`, // Better lifestyle image
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            display: 'flex',
            alignItems: 'center'
        }}>
            {/* Overlay Gradient */}
            <div style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                background: 'linear-gradient(90deg, rgba(0,46,39,0.8) 0%, rgba(0,46,39,0.4) 60%, rgba(0,0,0,0) 100%)'
            }}></div>

            <div className="container" style={{ position: 'relative', zIndex: 1, color: 'white', width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '48px' }}>
                <div style={{ maxWidth: '600px', flex: '1 1 500px' }}>
                    <h1 style={{
                        fontSize: 'clamp(48px, 5vw, 72px)',
                        fontWeight: '700',
                        lineHeight: '1.1',
                        marginBottom: '24px',
                        whiteSpace: 'pre-line' // Allow \n to work
                    }}>
                        {title}
                    </h1>
                    <p style={{ fontSize: '18px', opacity: 0.9, marginBottom: '32px', maxWidth: '480px' }}>
                        {subtitle}
                    </p>

                    <div style={{
                        backgroundColor: 'white',
                        padding: '8px',
                        borderRadius: '8px',
                        display: 'flex',
                        maxWidth: '400px',
                        boxShadow: '0 8px 32px rgba(0,0,0,0.2)'
                    }}>
                        <input
                            type="text"
                            placeholder="What can we help you with today?"
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            onKeyDown={handleSearch}
                            style={{
                                flex: 1,
                                border: 'none',
                                padding: '12px 16px',
                                fontSize: '16px',
                                outline: 'none',
                                color: '#333'
                            }}
                        />
                        <button
                            onClick={handleSearch}
                            style={{
                                backgroundColor: 'var(--color-primary)',
                                color: 'white',
                                padding: '12px 24px',
                                borderRadius: '6px',
                                fontWeight: '600',
                                border: 'none',
                                cursor: 'pointer'
                            }}
                        >
                            Search
                        </button>
                    </div>
                </div>

                <div style={{ flex: '1 1 300px', display: 'flex', justifyContent: 'center' }}>
                    <img
                        src="/logo.png"
                        alt="JUNG Logo"
                        style={{
                            maxWidth: '100%',
                            height: 'auto',
                            maxHeight: '400px',
                            objectFit: 'contain',
                            borderRadius: '24px'
                        }}
                    />
                </div>
            </div>
        </section>
    );
};

export default HeroSection;
