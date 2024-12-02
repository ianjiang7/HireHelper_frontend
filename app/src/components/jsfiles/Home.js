import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchAuthSession, getCurrentUser } from 'aws-amplify/auth';
import { generateClient } from 'aws-amplify/api';
import awsmobile from '../../aws-exports';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowRight } from '@fortawesome/free-solid-svg-icons';
import '../cssfiles/Home.css';

const client = generateClient();

const Home = ({ isSignedIn, setActiveTab, setActiveIndex }) => {
    const [userName, setUserName] = useState(null);

    // Helper function to get first name
    const getFirstName = (fullName) => {
        if (!fullName) return '';
        return fullName.split(' ')[0];
    };

    useEffect(() => {
        async function fetchUserData() {
            try {
                const { userId } = await getCurrentUser();
                
                const query = `
                    query GetUserProfile($userId: ID!) {
                        getUserProfile(userId: $userId) {
                            fullname
                        }
                    }
                `;

                const response = await client.graphql({
                    query: query,
                    variables: { userId },
                    authMode: 'userPool'
                });

                const fullname = response.data.getUserProfile?.fullname;
                if (fullname) {
                    const firstName = getFirstName(fullname);
                    setUserName(firstName);
                    localStorage.setItem('fullname', fullname);
                }
            } catch (err) {
                console.error("Error fetching user data:", err);
            }
        }

        if (isSignedIn) {
            const storedName = localStorage.getItem('fullname');
            if (storedName) {
                const firstName = getFirstName(storedName);
                setUserName(firstName);
            } else {
                fetchUserData();
            }
        }
    }, [isSignedIn]);

    const handleGetStarted = () => {
        setActiveTab('resume');
        setActiveIndex(1);
    };

    return (
        <div className="home-container">
            <div className="title-section">
                <div className="decorative-line left"></div>
                <div className="welcome-content">
                    <h1>Welcome to AlumniReach</h1>
                    <p>Your AI-powered, all-in-one alumni networking platform</p>
                </div>
                <div className="decorative-line right"></div>
            </div>
            <div className="welcome-user">
                <h2 className="greeting">Hi {userName || ''}!</h2>
                <button className="get-started-btn" onClick={handleGetStarted}>
                    Get Started
                    <FontAwesomeIcon icon={faArrowRight} className="arrow-icon" />
                </button>
            </div>
        </div>
    );
};

export default Home;
