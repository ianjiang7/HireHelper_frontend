import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [userRole, setUserRole] = useState(null);
    const [fullName, setFullName] = useState(null);

    // Initialize auth state from localStorage on component mount
    useEffect(() => {
        const storedRole = localStorage.getItem('userRole');
        const storedName = localStorage.getItem('fullname');
        if (storedRole && storedName) {
            setIsAuthenticated(true);
            setUserRole(storedRole);
            setFullName(storedName);
        }
    }, []);

    const login = (role, name) => {
        setIsAuthenticated(true);
        setUserRole(role);
        setFullName(name);
        localStorage.setItem('userRole', role);
        localStorage.setItem('fullname', name);
    };

    const logout = () => {
        setIsAuthenticated(false);
        setUserRole(null);
        setFullName(null);
        localStorage.removeItem('fullname');
        localStorage.removeItem('userRole');
        localStorage.removeItem('FullName');
        localStorage.removeItem('role');
    };

    return (
        <AuthContext.Provider value={{
            isAuthenticated,
            userRole,
            fullName,
            login,
            logout
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
