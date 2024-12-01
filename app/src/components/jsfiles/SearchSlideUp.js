import React, { useState, useEffect, useRef } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSearch, faChevronUp } from '@fortawesome/free-solid-svg-icons';
import '../cssfiles/SearchSlideUp.css';

const SearchSlideUp = ({ isSignedIn, onBeginSearch, onLogin }) => {
    const [isActive, setIsActive] = useState(false);
    const [isDragging, setIsDragging] = useState(false);
    const [startY, setStartY] = useState(0);
    const [offsetY, setOffsetY] = useState(0);
    const slideUpRef = useRef(null);

    useEffect(() => {
        // Show slide up after a short delay
        const timer = setTimeout(() => {
            setIsActive(true);
        }, 500);
        return () => clearTimeout(timer);
    }, []);

    const handleTouchStart = (e) => {
        setIsDragging(true);
        setStartY(e.touches[0].clientY);
    };

    const handleTouchMove = (e) => {
        if (!isDragging) return;
        
        const currentY = e.touches[0].clientY;
        const diff = currentY - startY;
        
        // Only allow dragging down
        if (diff < 0) return;
        
        setOffsetY(diff);
        if (slideUpRef.current) {
            slideUpRef.current.style.transform = `translateY(${diff}px)`;
        }
    };

    const handleTouchEnd = () => {
        setIsDragging(false);
        
        // If dragged more than 100px down, close the slide up
        if (offsetY > 100) {
            setIsActive(false);
        } else {
            // Reset position
            if (slideUpRef.current) {
                slideUpRef.current.style.transform = '';
            }
        }
        setOffsetY(0);
    };

    const handleBeginSearch = () => {
        setIsActive(false);
        onBeginSearch();
    };

    return (
        <div className={`search-slide-up ${isActive ? 'active' : ''} ${isDragging ? 'dragging' : ''}`}
             ref={slideUpRef}
             onTouchStart={handleTouchStart}
             onTouchMove={handleTouchMove}
             onTouchEnd={handleTouchEnd}>
            <div className="slide-handle" />
            <div className="search-content">
                <h2 className="search-title">
                    <FontAwesomeIcon icon={faSearch} style={{ marginRight: '0.5rem' }} />
                    Alumni Search
                </h2>
                <p className="search-description">
                    Discover and connect with NYU alumni who share your interests and career path.
                    Swipe up or click the button below to begin your search.
                </p>
                {isSignedIn ? (
                    <button
                        className="begin-search-btn"
                        onClick={handleBeginSearch}
                    >
                        <FontAwesomeIcon icon={faChevronUp} />
                        Begin Search
                    </button>
                ) : (
                    <div>
                        <button
                            className="begin-search-btn"
                            disabled
                        >
                            <FontAwesomeIcon icon={faChevronUp} />
                            Begin Search
                        </button>
                        <div className="login-prompt">
                            Please
                            <button className="login-btn" onClick={onLogin}>
                                Sign In
                            </button>
                            to begin searching
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default SearchSlideUp;
