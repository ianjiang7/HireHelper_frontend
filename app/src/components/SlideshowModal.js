import React, { useState } from 'react';
import "./SlideshowModal.css";

function SlideshowModal({ onClose }) {
    const [slideIndex, setSlideIndex] = useState(0);
    const slides = [
        { 
            title: "AlumniReach is here",
            text: <>Empowering <span className="highlight">NYU Students</span> and <span className="highlight">Alumni</span> through a private, streamlined connection platform.</> 
        },
        { 
            title: "Unlock Your Network", 
            text: <>Connecting <span className="highlight">alumni</span> and <span className="highlight">students</span> effectively for <span className="highlight">mentoring</span>, <span className="highlight">career chats</span> , and <span className="highlight">hiring</span></> 
        },
        { 
            title: "Students", 
            text: <>Discover meaningful <span className="highlight">connections</span> to enhance their <span className="highlight">career journey</span>.</> 
        },
        { 
            title: "Alumni", 
            text: <>Offer support, post jobs, and connect with students through an <span className="highlight">organized platform</span>.</> 
        },
        { 
            title: "Get Started Now!", 
            buttons: true 
        },
    ];

    const nextSlide = () => {
        if (slideIndex < slides.length - 1) {
            setSlideIndex(slideIndex + 1);
        } else {
            onClose();
        }
    };

    const previousSlide = () => {
        if (slideIndex > 0) {
            setSlideIndex(slideIndex - 1);
        }
    };

    return (
        <div className="modal-overlay">
            <div className="modal-content">
                <h2 className="title">{slides[slideIndex].title}</h2>
                {slides[slideIndex].text && <p>{slides[slideIndex].text}</p>}
                
                {slides[slideIndex].buttons ? (
                    <div className="button-group">
                        <button onClick={() => onClose('student')} className="modal-button blue">Student</button>
                        <button onClick={() => onClose('alumni')} className="modal-button non-blue">Alumni</button>
                    </div>
                ) : (
                    <>
                        <button onClick={previousSlide} className="arrow-button non-blue-arrow left-arrow">&#10094;</button>
                        <button onClick={nextSlide} className="arrow-button blue-arrow right-arrow">&#10095;</button>
                    </>
                )}
            </div>
        </div>
    );
}

export default SlideshowModal;
