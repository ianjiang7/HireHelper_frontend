import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from './AuthContext';

const ProtectedRoute = ({ children }) => {
  const { user } = useAuth();

  if (!user) {
    // If the user is not authenticated, redirect to login
    return <Navigate to="/alumni-login" />;
  }

  // If authenticated, render the child components (protected page)
  return children;
};

export default ProtectedRoute;
