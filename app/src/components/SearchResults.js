import React from "react";
import { useNavigate , useLocation} from "react-router-dom";
import { useState } from "react";
import Alumni from "./Alumni";
import "./SearchResults.css"
function SearchResults() {
    const navigate = useNavigate();
    const {state} = useLocation();
    const {industry, role, customJob, jobSearch, company} = state;
    
    return (
        <div>
            {/* Navbar */}
            <nav className="navbar">
                <h1 className="navbar-title" onClick={() => navigate("/")}>AlumniReach for NYU</h1>
                <div className="navbar-links">
                    <button onClick={() => navigate("/")} className="navbar-link">Home</button>
                    <button onClick={() => navigate("/profile-setup")} className="navbar-link">Profile Setup</button>
                    <button onClick = {() => navigate("/searchresults")} className = "navbar-link">Results</button>
                </div>
            </nav>
            <main className="main">
                <div className="results-header">
                    <p>Showing Results for {role} in {industry}</p>
                    <input 
                        type="text" 
                        placeholder="Search..." 
                        className="search-input"
                    />
                </div>
                <div className="alumni-container">
                <Alumni industry={industry} job={role} customJob={customJob} jobSearch={jobSearch} company={company}/>
                </div>
                <button onClick={() => navigate("/")} className="back-button">
                    Back
                </button>
            </main>
        </div>
    );
}

export default SearchResults;
