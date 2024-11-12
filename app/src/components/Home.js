import React from "react";
import { useNavigate } from "react-router-dom";
import "./Home.css"; // Import the CSS file

function Home() {
    const navigate = useNavigate();

    return (
        <div className="home-container">
            <nav className="navbar">
                <h1 className="navbar-title" onClick={() => navigate("/")}>AlumniReach for NYU</h1>
                <div className="navbar-links">
                    <button onClick={() => navigate("/")} className="navbar-link">Home</button>
                    <button onClick={() => navigate("/profile-setup")} className="navbar-link">Profile Setup</button>
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
                        <p>AlumniReach LLC</p>
            </footer>
        </div>
    );
}

export default Home;
