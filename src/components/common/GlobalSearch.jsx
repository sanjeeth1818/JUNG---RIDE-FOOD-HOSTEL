import React, { useState, useEffect } from 'react';
import { Search, X, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const GlobalSearch = ({ isOpen, onClose }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const navigate = useNavigate();

    // Prevent body scroll when modal is open
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
            setSearchTerm('');
        }
        return () => { document.body.style.overflow = 'unset'; };
    }, [isOpen]);

    if (!isOpen) return null;

    const handleSearch = (e) => {
        e.preventDefault();
        // Implement actual search logic or navigation here
        console.log("Searching for:", searchTerm);
        onClose();
        // Example: navigate(`/search?q=${searchTerm}`);
    };

    const suggestions = [
        { type: 'Service', label: 'Food Delivery', path: '/food' },
        { type: 'Service', label: 'Rides', path: '/student/rides' },
        { type: 'Help', label: 'How to pay?', path: '/help' },
        { type: 'Help', label: 'Contact Support', path: '/help' },
    ];

    const filteredSuggestions = searchTerm.length > 0
        ? suggestions.filter(s => s.label.toLowerCase().includes(searchTerm.toLowerCase()))
        : suggestions;

    return (
        <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.6)',
            zIndex: 1100,
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'center',
            paddingTop: '100px'
        }} className="animate-fade-in" onClick={onClose}>

            <div
                onClick={(e) => e.stopPropagation()}
                style={{
                    backgroundColor: 'white',
                    width: '100%',
                    maxWidth: '600px',
                    borderRadius: '24px',
                    padding: '24px',
                    boxShadow: '0 20px 50px rgba(0,0,0,0.2)',
                    display: 'flex',
                    flexDirection: 'column',
                    maxHeight: '80vh'
                }}
                className="animate-scale-in"
            >
                {/* Search Header */}
                <form onSubmit={handleSearch} style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '24px' }}>
                    <Search size={24} color="#666" />
                    <input
                        type="text"
                        placeholder="Search for services or help..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        autoFocus
                        style={{
                            flex: 1,
                            border: 'none',
                            fontSize: '20px',
                            fontWeight: '500',
                            outline: 'none',
                            color: '#333'
                        }}
                    />
                    <button
                        type="button"
                        onClick={onClose}
                        style={{
                            background: '#F5F5F5',
                            border: 'none',
                            borderRadius: '50%',
                            width: '36px',
                            height: '36px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: 'pointer'
                        }}
                    >
                        <X size={20} color="#666" />
                    </button>
                </form>

                {/* Suggestions List */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', overflowY: 'auto' }}>
                    {filteredSuggestions.map((item, index) => (
                        <div
                            key={index}
                            onClick={() => { navigate(item.path); onClose(); }}
                            style={{
                                padding: '16px',
                                borderRadius: '12px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                cursor: 'pointer',
                                transition: 'background 0.2s',
                            }}
                            onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#F5F5F5'}
                            onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                        >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                <span style={{
                                    fontSize: '12px',
                                    fontWeight: '700',
                                    backgroundColor: item.type === 'Service' ? '#E8F5E9' : '#E3F2FD',
                                    color: item.type === 'Service' ? '#2E7D32' : '#1565C0',
                                    padding: '4px 8px',
                                    borderRadius: '6px'
                                }}>
                                    {item.type}
                                </span>
                                <span style={{ fontSize: '16px', color: '#333' }}>{item.label}</span>
                            </div>
                            <ChevronRight size={16} color="#ccc" />
                        </div>
                    ))}

                    {filteredSuggestions.length === 0 && (
                        <div style={{ textAlign: 'center', padding: '40px', color: '#999' }}>
                            No results found for "{searchTerm}"
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default GlobalSearch;
