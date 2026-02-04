// src/Component/Sidebar/ProtectedRoute.jsx
import React from 'react';
import { Navigate } from 'react-router-dom';

const ProtectedRoute = ({ children, allowedRoles }) => {
    try {
        const loggedUserStr = localStorage.getItem('loggedUser');

        // If no user data in localStorage, redirect to login
        if (!loggedUserStr) {
            return <Navigate to="/" replace />;
        }

        const loggedUser = JSON.parse(loggedUserStr);

        // Check if user object is valid
        if (!loggedUser || !loggedUser.role) {
            localStorage.removeItem('loggedUser');
            return <Navigate to="/" replace />;
        }

        // If roles are specified, check if user has required role
        if (allowedRoles && !allowedRoles.includes(loggedUser.role)) {
            return <Navigate to="/" replace />;
        }

        return children;
    } catch (error) {
        console.error('ProtectedRoute Error:', error);
        localStorage.removeItem('loggedUser');
        return <Navigate to="/" replace />;
    }
};

export default ProtectedRoute;