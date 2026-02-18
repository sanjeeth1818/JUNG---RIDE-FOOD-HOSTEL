import React, { useState, useEffect, useRef } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import MainLayout from './components/layout/MainLayout';
import LoadingScreen from './components/common/LoadingScreen';
// Landing removed as main entry
import Welcome from './pages/Welcome';
import UniversitySelect from './pages/UniversitySelect';
import LocationSelect from './pages/LocationSelect';
import PartnerSelect from './pages/Partner/PartnerSelect';
import PartnerRegister from './pages/Partner/PartnerRegister';
import PartnerLogin from './pages/Partner/PartnerLogin';
import PartnerRider from './pages/Partner/Dashboards/PartnerRider';
import PartnerFood from './pages/Partner/Dashboards/PartnerFood';
import PartnerRoom from './pages/Partner/Dashboards/PartnerRoom';
import PartnerRiderProfile from './pages/Partner/Dashboards/PartnerRiderProfile';
import HelpCentre from './pages/HelpCentre';
import Login from './pages/Login';
import SignUp from './pages/SignUp';
import StudentDashboard from './pages/StudentDashboard';
import Home from './pages/Home';

import About from './pages/About';
import FoodHome from './pages/Food/FoodHome';
import RestaurantDetail from './pages/Food/RestaurantDetail';
import FoodCheckout from './pages/Food/FoodCheckout';
import FoodOrders from './pages/Food/FoodOrders';
import RoomsHome from './pages/Rooms/RoomsHome';
import RideHome from './pages/Rides/RideHome';

import UserProfile from './pages/UserProfile';
import PartnerProfile from './pages/Partner/PartnerProfile';

// Admin Pages
import AdminLogin from './pages/Admin/AdminLogin';
import AdminDashboard from './pages/Admin/AdminDashboard';
import AdminSettings from './pages/Admin/AdminSettings';

import { UserProvider } from './context/UserContext';
import ProtectedRoute from './components/auth/ProtectedRoute';
import { useLocation, useNavigate } from 'react-router-dom';
import { useUser } from './context/UserContext';

const SessionAutoLogout = () => {
  const { userType, logout } = useUser();
  const { pathname } = useLocation();
  const prevPathRef = useRef(pathname);
  const [isReady, setIsReady] = useState(false);

  // Buffer for initial mount to prevent race conditions with location/context
  useEffect(() => {
    const timer = setTimeout(() => setIsReady(true), 1000);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!isReady) return;

    // 1. Dashboard Workspace Guard
    if (userType === 'partner') {
      const isPartnerPage = pathname.startsWith('/partner/dashboard') ||
        pathname === '/partner/profile' ||
        pathname === '/help' ||
        pathname === '/partner-login' ||
        pathname === '/'; // Temporarily allow home page to avoid immediate logout on refresh

      if (!isPartnerPage) {
        console.log('🚪 Partner left dashboard area. Logging out.');
        logout();
      }
    }

    // 2. Auth Page Guard (Back Button Protection)
    const isAuthPage = pathname === '/login' || pathname === '/partner-login' || pathname === '/signup';
    if (userType && isAuthPage) {
      // Only logout if they navigate FROM a protected area BACK to an auth page
      const wasInDashboard = prevPathRef.current.startsWith('/partner/dashboard') ||
        prevPathRef.current.startsWith('/student/dashboard') ||
        prevPathRef.current === '/profile' ||
        prevPathRef.current === '/partner/profile';

      if (wasInDashboard) {
        console.log('🔄 Back navigation detected. Clearing session.');
        logout();
      }
    }

    prevPathRef.current = pathname;
  }, [pathname, userType, logout, isReady]);

  return null;
};

const AdminProtectedRoute = ({ children }) => {
  const adminUser = localStorage.getItem('admin_user');
  if (!adminUser) {
    return <Navigate to="/admin" replace />;
  }
  return children;
};


function App() {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Simulate loading time
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 2500);
    return () => clearTimeout(timer);
  }, []);

  if (isLoading) {
    return <LoadingScreen />;
  }

  return (
    <UserProvider>
      <BrowserRouter>
        <SessionAutoLogout />
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<SignUp />} />
          <Route path="/partner-login" element={<PartnerLogin />} />

          {/* Admin Routes */}
          <Route path="/admin" element={<AdminLogin />} />
          <Route path="/admin/dashboard" element={<AdminProtectedRoute><AdminDashboard /></AdminProtectedRoute>} />
          <Route path="/admin/settings" element={<AdminProtectedRoute><AdminSettings /></AdminProtectedRoute>} />

          <Route element={<MainLayout />}>
            <Route path="/" element={<Home />} />
            <Route path="/home" element={<Home />} />

            {/* Protected Routes */}
            <Route path="/student/university" element={<ProtectedRoute allowedTypes={['student']}><UniversitySelect /></ProtectedRoute>} />
            <Route path="/student/dashboard" element={<ProtectedRoute allowedTypes={['student']}><StudentDashboard /></ProtectedRoute>} />
            <Route path="/worker/location" element={<ProtectedRoute allowedTypes={['worker']}><LocationSelect /></ProtectedRoute>} />


            {/* Partner Routes */}
            <Route path="/partner-select" element={<PartnerSelect />} />
            <Route path="/partner-register" element={<PartnerRegister />} />


            <Route path="/partner/dashboard/rider" element={<ProtectedRoute allowedTypes={['partner']}><PartnerRider /></ProtectedRoute>} />
            <Route path="/partner/dashboard/food" element={<ProtectedRoute allowedTypes={['partner']}><PartnerFood /></ProtectedRoute>} />
            <Route path="/partner/dashboard/room" element={<ProtectedRoute allowedTypes={['partner']}><PartnerRoom /></ProtectedRoute>} />


            {/* Service Routes */}
            <Route path="/about" element={<About />} />
            <Route path="/food" element={<ProtectedRoute><FoodHome /></ProtectedRoute>} />
            <Route path="/food/:id" element={<ProtectedRoute><RestaurantDetail /></ProtectedRoute>} />
            <Route path="/food/checkout" element={<ProtectedRoute><FoodCheckout /></ProtectedRoute>} />
            <Route path="/food/orders" element={<ProtectedRoute><FoodOrders /></ProtectedRoute>} />
            <Route path="/rooms" element={<ProtectedRoute><RoomsHome /></ProtectedRoute>} />
            <Route path="/student/rides" element={<ProtectedRoute><RideHome /></ProtectedRoute>} />
            <Route path="/mart" element={<ProtectedRoute><div className="container" style={{ padding: '100px 24px' }}><h1>Mart Coming Soon</h1></div></ProtectedRoute>} />
            <Route path="/express" element={<ProtectedRoute><div className="container" style={{ padding: '100px 24px' }}><h1>Express Coming Soon</h1></div></ProtectedRoute>} />
            <Route path="/wallet" element={<ProtectedRoute><div className="container" style={{ padding: '100px 24px' }}><h1>Wallet Coming Soon</h1></div></ProtectedRoute>} />
            <Route path="/partner" element={<div className="container" style={{ padding: '100px 24px' }}><h1>Partner with JUNG</h1></div>} />
            <Route path="/help" element={<HelpCentre />} />

            {/* Profile Routes */}
            <Route path="/profile" element={<ProtectedRoute><UserProfile /></ProtectedRoute>} />
            <Route path="/partner/profile" element={<ProtectedRoute><PartnerProfile /></ProtectedRoute>} />
            <Route path="/partner/dashboard/room/profile" element={<ProtectedRoute allowedTypes={['partner']}><PartnerProfile /></ProtectedRoute>} />
            <Route path="/partner/dashboard/rider/profile" element={<ProtectedRoute allowedTypes={['partner']}><PartnerRiderProfile /></ProtectedRoute>} />
            <Route path="/partner/dashboard/food/profile" element={<ProtectedRoute allowedTypes={['partner']}><PartnerProfile /></ProtectedRoute>} />


            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </UserProvider>
  );
}

export default App;
