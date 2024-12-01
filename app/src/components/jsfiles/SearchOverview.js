import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSearch, faUserGroup, faChartLine } from '@fortawesome/free-solid-svg-icons';
import '../cssfiles/SearchOverview.css';

const SearchOverview = ({ isSignedIn, onLogin }) => {
    return (
        <div className="search-overview">
            <div className="search-overview-content">
                <div className="search-overview-header">
                    <FontAwesomeIcon icon={faSearch} className="search-icon" />
                    <h2>Discover Your Network</h2>
                </div>

                <div className="feature-cards">
                    <div className="feature-card">
                        <FontAwesomeIcon icon={faChartLine} className="feature-icon" />
                        <h3>Resume Analytics</h3>
                        <p>View detailed analysis of your resume and get insights for improvement</p>
                    </div>

                    <div className="feature-card">
                        <FontAwesomeIcon icon={faUserGroup} className="feature-icon" />
                        <h3>Alumni Network</h3>
                        <p>Connect with NYU alumni who share your career interests</p>
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
