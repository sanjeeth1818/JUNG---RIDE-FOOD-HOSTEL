import React from 'react';
import { useUser } from '../context/UserContext';
import HeroSection from '../components/home/HeroSection';
import ServicesGrid from '../components/home/ServicesGrid';

const StudentDashboard = () => {
    const { profile, location: userLocation } = useUser();

    // Construct personalized title
    const firstName = profile?.name?.split(' ')[0] || 'Student';
    const universityName = userLocation?.name || 'Your University';

    const heroTitle = `Welcome, ${firstName}.\n${universityName}`;
    const heroSubtitle = "Explore campus food, certified rooms, and safe rides all in one place.";

    return (
        <div style={{ backgroundColor: 'white' }}>
            <HeroSection
                title={heroTitle}
                subtitle={heroSubtitle}
                backgroundImage="https://images.unsplash.com/photo-1523050854058-8df90110c9f1?q=80&w=2670&auto=format&fit=crop"
            />
            {/* We reuse ServicesGrid but it needs to be filtered or we can just render it. 
                The user asked for: Deliveries (Food), Mobility (Rides), Living (Rooms).
                ServicesGrid already has these. It has a filter bar, but we can hide it via CSS or just let it be.
                The user specifically asked for "this selection page...". 
                Let's use ServicesGrid for now as it contains exactly what is needed. 
                If we need to remove "All" filter or something, we might need a prop on ServicesGrid, 
                but for now it matches the requirement of showing those services. 
            */}
            <ServicesGrid />

            {/* Custom Student Footer / Info could go here if needed, but MainLayout handles the main footer */}
        </div>
    );
};

export default StudentDashboard;
