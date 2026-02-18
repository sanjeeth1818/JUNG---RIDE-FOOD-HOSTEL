import React, { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useUser } from '../../context/UserContext';

const ProtectedRoute = ({ children, allowedTypes = [] }) => {
    const { userType } = useUser();
    const location = useLocation();
    const [isVerified, setIsVerified] = useState(false);

    // Simple check: if we have a userType, we are logged in.
    // Ideally we might want a 'loading' state from context too.

    // If not logged in redirect to login
    if (!userType) {
        return <Navigate to="/login" state={{ redirectAfter: location.pathname }} replace />;
    }

    // If we have allowedTypes and the user's type isn't allowed
    if (allowedTypes.length > 0 && !allowedTypes.includes(userType)) {
        return <Navigate to="/" replace />;
    }

    return children;
};

export default ProtectedRoute;
