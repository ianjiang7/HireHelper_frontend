import React, { createContext, useContext, useEffect, useState } from 'react';
import { getCurrentUser, signOut } from 'aws-amplify/auth';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState(null);
  const [fullName, setFullName] = useState(null);

  useEffect(() => {
    checkUser();
  }, []);

  const checkUser = async () => {
    try {
      const currentUser = await getCurrentUser();
      setUser(currentUser);
      setIsAuthenticated(true);
      
      // Restore user data from localStorage
      const storedRole = localStorage.getItem('userRole');
      const storedName = localStorage.getItem('fullname');
      if (storedRole && storedName) {
        setUserRole(storedRole);
        setFullName(storedName);
      }
    } catch (err) {
      setUser(null);
      setIsAuthenticated(false);
      setUserRole(null);
      setFullName(null);
    } finally {
      setLoading(false);
    }
  };

  const login = (role, name) => {
    setIsAuthenticated(true);
    setUserRole(role);
    setFullName(name);
    localStorage.setItem('userRole', role);
    localStorage.setItem('fullname', name);
  };

  const logout = async () => {
    try {
      setUser(null);
      setIsAuthenticated(false);
      setUserRole(null);
      setFullName(null);
      // Clear all authentication-related items from localStorage
      localStorage.removeItem('fullname');
      localStorage.removeItem('userRole');
      localStorage.removeItem('FullName');
      localStorage.removeItem('role');
    } catch (error) {
      console.error('Error during logout:', error);
    }
  };

  return (
    <AuthContext.Provider value={{
      user,
      isAuthenticated,
      loading,
      userRole,
      fullName,
      login,
      logout,
      checkUser
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
