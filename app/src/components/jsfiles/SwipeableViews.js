import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faChevronLeft, faChevronRight } from '@fortawesome/free-solid-svg-icons';
import '../cssfiles/SwipeableViews.css';

const SwipeableViews = ({ children, activeIndex, onChangeIndex, showNavigation = true }) => {
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
            <div className="view-container">
                {React.Children.map(children, (child, index) => (
                    <div className={`view-content ${index === activeIndex ? 'active' : ''}`}>
                        {child}
                    </div>
                ))}
            </div>
            {showNavigation && (
                <div className="navigation-arrows">
                    {activeIndex > 0 && (
                        <button className="prev-view-button" onClick={handlePrevious}>
                            <FontAwesomeIcon icon={faChevronLeft} />
                        </button>
                    )}
                    {activeIndex < React.Children.count(children) - 1 && (
                        <button className="next-view-button" onClick={handleNext}>
                            <FontAwesomeIcon icon={faChevronRight} />
                        </button>
                    )}
                </div>
            )}
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
