import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSearch, faUserGroup, faChartLine } from '@fortawesome/free-solid-svg-icons';
import '../cssfiles/SearchOverview.css';

const SearchOverview = ({ isSignedIn, navigate, onLogin, setActiveTab, setActiveIndex }) => {
    const handleFeatureClick = (tab, index) => {
        setActiveTab(tab);
        setActiveIndex(index);
    };

    return (
        <div className="search-overview">
            <div className="search-overview-content">
                <div className="search-overview-header">
                    <FontAwesomeIcon icon={faSearch} className="search-icon" />
                    <h2>Welcome to HireHelper</h2>
                </div>

                <div className="feature-cards">
                    <div 
                        className="feature-card clickable" 
                        onClick={() => handleFeatureClick('analytics', 2)}
                    >
                        <FontAwesomeIcon icon={faChartLine} className="feature-icon" />
                        <h3>Resume Analytics</h3>
                        <p>Analyze resumes to gain insights into skills, experience, and qualifications.</p>
                    </div>

                    <div 
                        className="feature-card clickable"
                        onClick={() => handleFeatureClick('people', 3)}
                    >
                        <FontAwesomeIcon icon={faUserGroup} className="feature-icon" />
                        <h3>Alumni Network</h3>
                        <p>Connect with alumni and explore their career paths and experiences.</p>
                    </div>
                </div>

                <div className="search-overview-footer">
                    {!isSignedIn ? (
                        <div className="sign-in-prompt">
                            <p>Sign in to access the full features</p>
                            <button className="sign-in-button" onClick={onLogin}>
                                Sign In
                            </button>
                        </div>
                    ) : (
                        <div className="swipe-instruction">
                            <p></p>
                            <div className="swipe-animation">
                                <span className="swipe-arrow">→</span>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default SearchOverview;
