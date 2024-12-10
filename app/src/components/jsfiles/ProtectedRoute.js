import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from './AuthContext';

const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();
  const location = useLocation();

  // Check if the route state has skipAuth set to true
  const skipAuth = location.state?.skipAuth;

  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        backgroundColor: '#f8f9fa'
      }}>
        <div className="loading-spinner"></div>
      </div>
    );
  }

  if (!isAuthenticated && !skipAuth) {
    return <Navigate to="/alumni-login" replace />;
  }

  return children;
};

export default ProtectedRoute;
