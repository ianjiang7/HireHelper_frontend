import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { signIn } from 'aws-amplify/auth';
import { useAuth } from './AuthContext';
import '../cssfiles/Login.css';

const AlumniLogin = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const navigate = useNavigate();
    const { isAuthenticated, login, checkUser } = useAuth();

    useEffect(() => {
        if (isAuthenticated) {
            navigate('/profile-setup', { replace: true });
        }
    }, [isAuthenticated, navigate]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        try {
            await signIn({ username: email, password });
            await checkUser();
            login('alumni', email); // Set role and email as fullname for now
            navigate('/profile-setup', { replace: true });
        } catch (error) {
            console.error('Error signing in:', error);
            setError('Failed to sign in. Please check your credentials.');
        }
    };

    return (
        <div className="login-container">
            <div className="brand-header">
                <h1>AlumniReach</h1>
                <p>Connect with your alumni network</p>
            </div>
            
            <form onSubmit={handleSubmit} className="login-form">
                <div className="form-group">
                    <label htmlFor="email">Email</label>
                    <input
                        type="email"
                        id="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                    />
                </div>
                
                <div className="form-group">
                    <label htmlFor="password">Password</label>
                    <input
                        type="password"
                        id="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                    />
                </div>

                {error && <div className="error">{error}</div>}
                
                <button type="submit" className="login-button">
                    Sign In
                </button>
            </form>

            <div className="signup-link">
                Don't have an account? <a href="/signup">Sign up</a>
            </div>
        </div>
    );
};

export default AlumniLogin;