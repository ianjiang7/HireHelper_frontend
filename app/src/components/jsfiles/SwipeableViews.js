import React, { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faChevronLeft, faChevronRight } from '@fortawesome/free-solid-svg-icons';
import '../cssfiles/SwipeableViews.css';

const SwipeableViews = ({ children, activeIndex, onChangeIndex, showNavigation = true }) => {
    const [showLeftArrow, setShowLeftArrow] = useState(false);
    const [showRightArrow, setShowRightArrow] = useState(false);

    const handlePrevious = () => {
        if (activeIndex > 0) {
            onChangeIndex(activeIndex - 1);
        }
    };

    const handleNext = () => {
        if (activeIndex < React.Children.count(children) - 1) {
            onChangeIndex(activeIndex + 1);
        }
    };

    return (
        <div className="swipeable-container">
            {showNavigation && (
                <>
                    <div 
                        className="hover-zone left"
                        onMouseEnter={() => setShowLeftArrow(true)}
                        onMouseLeave={() => setShowLeftArrow(false)}
                    >
                        {showLeftArrow && activeIndex > 0 && (
                            <button className="prev-view-button" onClick={handlePrevious}>
                                <FontAwesomeIcon icon={faChevronLeft} />
                            </button>
                        )}
                    </div>
                    <div 
                        className="hover-zone right"
                        onMouseEnter={() => setShowRightArrow(true)}
                        onMouseLeave={() => setShowRightArrow(false)}
                    >
                        {showRightArrow && activeIndex < React.Children.count(children) - 1 && (
                            <button className="next-view-button" onClick={handleNext}>
                                <FontAwesomeIcon icon={faChevronRight} />
                            </button>
                        )}
                    </div>
                </>
            )}
            <div className="view-container">
                {React.Children.map(children, (child, index) => (
                    <div className={`view-content ${index === activeIndex ? 'active' : ''}`}>
                        {child}
                    </div>
                ))}
            </div>
            {showNavigation && (
                <div className="pagination-dots">
                    {React.Children.map(children, (_, index) => (
                        <div
                            className={`pagination-dot ${index === activeIndex ? 'active' : ''}`}
                            onClick={() => onChangeIndex(index)}
                        />
                    ))}
                </div>
            )}
        </div>
    );
};

export default SwipeableViews;
