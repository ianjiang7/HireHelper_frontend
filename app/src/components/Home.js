import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import SlideshowModal from "./SlideshowModal";
import "./Home.css";

function Home() {
    const navigate = useNavigate();
    const [showSlideshow, setShowSlideshow] = useState(true);

    const handleSlideClose = (userType) => {
        setShowSlideshow(false);
        if (userType === "student") {
            navigate("/student-login");
        } else if (userType === "alumni") {
            navigate("/alumni-login");
        }
    };

    return (
        <div className="home-container">
            {showSlideshow && <SlideshowModal onClose={handleSlideClose} />}
            <nav className="navbar">
                <h1 className="navbar-title" onClick={() => navigate("/")}>AlumniReach for NYU</h1>
                <div className="navbar-links">
                    <button onClick={() => navigate("/student-login")} className="navbar-link">Students</button>
                    <button onClick={() => navigate("/alumni-login")} className="navbar-link">Alumni</button>
                </div>
            </nav>
            <footer className="footer">
                <p>AlumniReach for NYU</p>
            </footer>
        </div>
    );
}

export default Home;



/*
<main className="home-main">
                <h2 className="home-heading">Connect with NYU Alumnus</h2>
                <button onClick={() => navigate("/profile-setup")} className="home-button">Start Now</button>
                <p className="home-text">Unlock a whole new network of exclusive connections</p>
</main>
*/

/*import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAccess } from "./AccessContext";
import "./Home.css"; // Import the CSS file

function Home() {
    const navigate = useNavigate();
    const { hasAccess, setHasAccess } = useAccess();

    return (
        <div className="home-container">
            <nav className="navbar">
                <h1 className="navbar-title" onClick={() => navigate("/")}>AlumniReach for NYU</h1>
                <div className="navbar-links">
                    <button onClick={() => navigate("/")} className="navbar-link">Home</button>
                    <button onClick={() => navigate("/profile-setup")} className="navbar-link">Profile Setup</button>
                    <button onClick = {() => hasAccess && navigate("/searchresults")} className="navbar-link">Results</button>
                </div>
            </nav>
            
            <main className="home-main">
                <h2 className="home-heading">Connect with NYU Alumnus</h2>
                <button 
                    onClick={() => navigate("/profile-setup")} 
                    className="home-button"
                >
                    Start Now
                </button>
                <p className="home-text">Unlock a whole new network of exclusive connections</p>
            </main>
            <footer className="footer">
                        <p>AlumniReach for NYU</p>
            </footer>
        </div>
    );
}

export default Home;
*/
