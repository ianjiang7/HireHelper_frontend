import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import ProfileSetup from './components/jsfiles/ProfileSetup';
import AlumniLogin from './components/jsfiles/AlumniLogin';
import Signup from './components/jsfiles/Signup';
import './App.css';
import { Amplify } from 'aws-amplify';
import awsExports from './aws-exports';
import { AuthProvider } from './components/jsfiles/AuthContext';
import ProtectedRoute from './components/jsfiles/ProtectedRoute';

Amplify.configure(awsExports);

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="App">
          <Routes>
            <Route path="/alumni-login" element={<AlumniLogin />} />
            <Route path="/signup" element={<Signup />} />
            <Route 
              path="/profile-setup" 
              element={
                <ProtectedRoute>
                  <ProfileSetup />
                </ProtectedRoute>
              } 
            />
            {/* Redirect authenticated users to profile-setup, unauthenticated to login */}
            <Route 
              path="*" 
              element={
                <ProtectedRoute>
                  <Navigate to="/profile-setup" replace />
                </ProtectedRoute>
              } 
            />
          </Routes>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;
