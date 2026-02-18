import React, { useState } from 'react';
import { Search, ChevronDown, ChevronUp, Mail, MessageCircle } from 'lucide-react';

const HelpCentre = () => {
    const [searchQuery, setSearchQuery] = useState('');
    const [expandedFaq, setExpandedFaq] = useState(null);
    const [activeTopic, setActiveTopic] = useState('All');

    const faqs = [
        {
            question: "How do I reset my password?",
            answer: "Click 'Forgot Password' at login or change it in Profile settings.",
            category: "Account & Profile"
        },
        {
            question: "How do I report an issue?",
            answer: "Go to activity history, select the order, and tap 'Report an Issue'.",
            category: "Food Delivery"
        },
        {
            question: "Can I change payment methods?",
            answer: "Yes, manage cards and JUNG Pay in Profile > Payment.",
            category: "Payments & Refunds"
        },
        {
            question: "How do I become a Partner?",
            answer: "Visit the Partner registration page via the menu.",
            category: "Partner Support"
        },
        {
            question: "Is there insurance?",
            answer: "Yes, every ride and delivery is covered by JUNG Safety Insurance.",
            category: "Safety & Security"
        }
    ];

    const filteredFaqs = faqs.filter(faq => {
        const matchesSearch = faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
            faq.answer.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesTopic = activeTopic === 'All' || faq.category === activeTopic;
        return matchesSearch && matchesTopic;
    });

    const toggleFaq = (question) => {
        setExpandedFaq(expandedFaq === question ? null : question);
    };

    const topics = [
        { title: "Rides & Mobility", icon: "🚗" },
        { title: "Food Delivery", icon: "🍔" },
        { title: "Account & Profile", icon: "👤" },
        { title: "Payments & Refunds", icon: "💳" },
        { title: "Safety & Security", icon: "🛡️" },
        { title: "Partner Support", icon: "🤝" }
    ];

    return (
        <div style={{ paddingBottom: '100px', backgroundColor: '#F9FAFB' }}>
            {/* Hero Search Section */}
            <div style={{
                backgroundColor: '#1B5E20',
                padding: '100px 24px',
                textAlign: 'center',
                color: 'white',
                borderRadius: '0 0 40px 40px'
            }}>
                <h1 style={{ fontSize: '40px', fontWeight: '800', marginBottom: '24px' }}>How can we help you?</h1>
                <div style={{ position: 'relative', maxWidth: '700px', margin: '0 auto' }}>
                    <Search size={24} color="#999" style={{ position: 'absolute', left: '24px', top: '50%', transform: 'translateY(-50%)' }} />
                    <input
                        type="text"
                        placeholder="Search for questions (e.g., 'password', 'refund')..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        style={{
                            width: '100%',
                            padding: '24px 24px 24px 72px',
                            borderRadius: '20px',
                            border: 'none',
                            fontSize: '18px',
                            boxShadow: '0 10px 30px rgba(0,0,0,0.15)',
                            outline: 'none',
                            color: '#333'
                        }}
                    />
                </div>
            </div>

            <div className="container" style={{ marginTop: '80px' }}>
                {/* Categories */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
                    <h2 style={{ fontSize: '28px', fontWeight: '800' }}>Browse by Topic</h2>
                    <button
                        onClick={() => setActiveTopic('All')}
                        style={{ background: 'none', border: 'none', color: 'var(--color-primary)', fontWeight: '700', cursor: 'pointer', visibility: activeTopic === 'All' ? 'hidden' : 'visible' }}
                    >
                        Clear Filter
                    </button>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '24px', marginBottom: '80px' }}>
                    {topics.map(topic => (
                        <CategoryCard
                            key={topic.title}
                            {...topic}
                            isActive={activeTopic === topic.title}
                            onClick={() => setActiveTopic(topic.title)}
                        />
                    ))}
                </div>

                {/* Frequently Asked Questions */}
                <h2 style={{ fontSize: '28px', fontWeight: '800', marginBottom: '32px' }}>
                    {activeTopic === 'All' ? 'Common Questions' : `FAQ: ${activeTopic}`}
                </h2>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '80px', minHeight: '200px' }}>
                    {filteredFaqs.length > 0 ? (
                        filteredFaqs.map((faq) => (
                            <FaqItem
                                key={faq.question}
                                question={faq.question}
                                answer={faq.answer}
                                isOpen={expandedFaq === faq.question}
                                onClick={() => toggleFaq(faq.question)}
                            />
                        ))
                    ) : (
                        <div style={{ textAlign: 'center', padding: '60px', color: '#888' }}>
                            <p style={{ fontSize: '18px' }}>No articles found for "{searchQuery}" in {activeTopic}</p>
                        </div>
                    )}
                </div>

                {/* Contact Options */}
                <div style={{ backgroundColor: 'white', borderRadius: '32px', padding: '60px', boxShadow: '0 4px 20px rgba(0,0,0,0.03)', border: '1px solid #eee' }}>
                    <div style={{ textAlign: 'center', marginBottom: '48px' }}>
                        <h2 style={{ fontSize: '28px', fontWeight: '800', marginBottom: '12px' }}>Still need help?</h2>
                        <p style={{ color: '#666' }}>Our support team is available around the clock to assist you.</p>
                    </div>
                    <div style={{ display: 'flex', gap: '32px', flexWrap: 'wrap' }}>
                        <ContactCard
                            icon={<MessageCircle size={32} color="#2E7D32" />}
                            title="Chat with Us"
                            desc="Average wait: 2 mins"
                        />
                        <ContactCard
                            icon={<Mail size={32} color="#1565C0" />}
                            title="Email Support"
                            desc="Average wait: 4 hours"
                        />
                    </div>
                </div>
            </div>
        </div>
    );
};

const CategoryCard = ({ title, icon, isActive, onClick }) => (
    <div
        onClick={onClick}
        style={{
            backgroundColor: isActive ? 'var(--color-primary)' : 'white',
            borderRadius: '20px',
            padding: '32px 24px',
            boxShadow: isActive ? '0 10px 20px rgba(0, 177, 79, 0.2)' : '0 4px 12px rgba(0,0,0,0.02)',
            cursor: 'pointer',
            textAlign: 'center',
            border: isActive ? '1px solid transparent' : '1px solid #eee',
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            transform: isActive ? 'translateY(-8px)' : 'translateY(0)'
        }}
    >
        <div style={{ fontSize: '40px', marginBottom: '16px' }}>{icon}</div>
        <h3 style={{ fontSize: '16px', fontWeight: '700', color: isActive ? 'white' : '#1A1A1A' }}>{title}</h3>
    </div>
);

const FaqItem = ({ question, answer, isOpen, onClick }) => (
    <div style={{
        backgroundColor: 'white',
        borderRadius: '12px',
        border: '1px solid #e0e0e0',
        overflow: 'hidden'
    }}>
        <button
            onClick={onClick}
            style={{
                width: '100%',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '20px',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                textAlign: 'left'
            }}
        >
            <span style={{ fontSize: '16px', fontWeight: '600', color: '#1A1A1A' }}>{question}</span>
            {isOpen ? <ChevronUp size={20} color="#666" /> : <ChevronDown size={20} color="#666" />}
        </button>
        {isOpen && (
            <div style={{ padding: '0 20px 20px', color: '#555', lineHeight: '1.6', fontSize: '15px' }}>
                {answer}
            </div>
        )}
    </div>
);

const ContactCard = ({ icon, title, desc }) => (
    <div className="hover-scale" style={{
        flex: 1,
        minWidth: '280px',
        backgroundColor: 'white',
        padding: '24px',
        borderRadius: '16px',
        display: 'flex',
        alignItems: 'center',
        gap: '24px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
        cursor: 'pointer',
        border: '1px solid #eee'
    }}>
        <div style={{ padding: '12px', borderRadius: '12px', backgroundColor: '#F5F5F5' }}>
            {icon}
        </div>
        <div>
            <h3 style={{ fontSize: '18px', fontWeight: '700', marginBottom: '4px' }}>{title}</h3>
            <p style={{ color: '#666', fontSize: '14px' }}>{desc}</p>
        </div>
    </div>
);

export default HelpCentre;
