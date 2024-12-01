import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchAuthSession, getCurrentUser } from 'aws-amplify/auth';
import { generateClient } from 'aws-amplify/api';
import awsmobile from '../../aws-exports';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faGraduationCap, faBriefcase, faHandshake, faLightbulb, faTimes, faFileUpload, faSearch } from '@fortawesome/free-solid-svg-icons';
import '../cssfiles/Home.css';

const client = generateClient();

const Home = ({ isSignedIn, setActiveTab, setActiveIndex }) => {
    const [userName, setUserName] = useState(null);
    const [showStudentPopup, setShowStudentPopup] = useState(false);
    const [showAlumniPopup, setShowAlumniPopup] = useState(false);

    useEffect(() => {
        async function fetchUserData() {
            try {
                const { userId } = await getCurrentUser();
                const session = await fetchAuthSession();
                const { idToken } = session.tokens ?? {};

                if (!idToken) {
                    throw new Error("No ID token found.");
                }

                const query = `
                    query GetUserProfile($userId: String!) {
                        getUserProfile(userId: $userId) {
                            fullname
                            isAlumni
                        }
                    }
                `;

                const response = await client.graphql({
                    query: query,
                    variables: { userId },
                    authMode: 'userPool'
                });

                const responseData = response.data;
                const userProfile = responseData.getUserProfile;

                if (responseData.errors) {
                    console.error("GraphQL Errors:", responseData.errors);
                    return;
                }
                
                localStorage.setItem("USERID", userId);
                if (userProfile) {
                    setUserName(userProfile.fullname);
                }
            } catch (err) {
                console.error("Error fetching user data:", err);
            }
        }

        if (isSignedIn) {
            fetchUserData();
        }
    }, [isSignedIn]);

    const FeaturePopup = ({ isStudent, onClose }) => (
        <div className="popup-overlay">
            <div className="popup-content">
                <button className="close-button" onClick={onClose}>
                    <FontAwesomeIcon icon={faTimes} />
                </button>
                <h2>{isStudent ? "For Students" : "For Alumni"}</h2>
                <div className="feature-list">
                    {isStudent ? (
                        <>
                            <div className="feature-item">
                                <FontAwesomeIcon icon={faFileUpload} />
                                <h3>Resume Analysis</h3>
                                <p>Get instant feedback on your resume with our AI-powered analysis tool</p>
                            </div>
                            <div className="feature-item">
                                <FontAwesomeIcon icon={faSearch} />
                                <h3>Alumni Search</h3>
                                <p>Connect with alumni in your field of interest</p>
                            </div>
                            <div className="feature-item">
                                <FontAwesomeIcon icon={faHandshake} />
                                <h3>Mentorship</h3>
                                <p>Find mentors who can guide your career journey</p>
                            </div>
                        </>
                    ) : (
                        <>
                            <div className="feature-item">
                                <FontAwesomeIcon icon={faLightbulb} />
                                <h3>Share Experience</h3>
                                <p>Help guide the next generation of professionals</p>
                            </div>
                            <div className="feature-item">
                                <FontAwesomeIcon icon={faHandshake} />
                                <h3>Networking</h3>
                                <p>Connect with fellow alumni and expand your network</p>
                            </div>
                            <div className="feature-item">
                                <FontAwesomeIcon icon={faSearch} />
                                <h3>Talent Search</h3>
                                <p>Find promising candidates for your organization</p>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );

    return (
        <div className="home-container">
            <div className="welcome-section">
                <div className="decorative-line left"></div>
                <div className="welcome-content">
                    <h1>Welcome to AlumniReach</h1>
                    <p>Your AI-powered, all-in-one alumni networking platform</p>
                </div>
                <div className="decorative-line right"></div>
            </div>
            <div className="feature-cards">
                <div className="feature-card student-card" onClick={() => setShowStudentPopup(true)}>
                    <div className="card-header">
                        <FontAwesomeIcon icon={faGraduationCap} className="feature-icon" />
                        <h2>Students</h2>
                    </div>
                    <div className="card-body">
                        <ul>
                            <li>AI Resume Analysis</li>
                            <li>Alumni Search</li>
                            <li>Career Guidance</li>
                        </ul>
                    </div>
                </div>
                <div className="feature-card alumni-card" onClick={() => setShowAlumniPopup(true)}>
                    <div className="card-header">
                        <FontAwesomeIcon icon={faBriefcase} className="feature-icon" />
                        <h2>Alumni</h2>
                    </div>
                    <div className="card-body">
                        <ul>
                            <li>Share Experience</li>
                            <li>Network Growth</li>
                            <li>Talent Search</li>
                        </ul>
                    </div>
                </div>
            </div>

            {showStudentPopup && (
                <FeaturePopup 
                    isStudent={true}
                    onClose={() => setShowStudentPopup(false)}
                />
            )}
            {showAlumniPopup && (
                <FeaturePopup 
                    isStudent={false}
                    onClose={() => setShowAlumniPopup(false)}
                />
            )}
            <div className="begin-section">
                <button className="begin-button" onClick={() => {
                    setActiveTab('search');
                    setActiveIndex(1);
                }}>
                    Begin
                </button>
            </div>
        </div>
    );
};

export default Home;
