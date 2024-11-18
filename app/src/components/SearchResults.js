import React, { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import Alumni from "./Alumni";
import "./SearchResults.css";

function SearchResults() {
  const navigate = useNavigate();
  const { state } = useLocation();
  const { industry, role, customJob, jobSearch, company } = state;
  const [searchTerm, setSearchTerm] = useState("");

  return (
    <div className="search-results-page">
      <nav className="navbar">
        <h1 className="navbar-title" onClick={() => navigate("/")}>
          AlumniReach for NYU
        </h1>
        <div className="navbar-links">
          <button onClick={() => navigate("/")} className="navbar-link">
            Home
          </button>
          <button onClick={() => navigate("/profile-setup")} className="navbar-link">
            Profile Setup
          </button>
        </div>
      </nav>

      <main className="search-content-results-container">
        <div className="search-header">
          <p className="search-text">
            Showing Results for <span className="highlight">{role}</span> in{" "}
            <span className="highlight">{industry}</span>
          </p>
          <input
            type="text"
            placeholder="Search..."
            className="search-input"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="results-container">
          <Alumni
            industry={industry}
            job={role}
            customJob={customJob}
            jobSearch={jobSearch}
            company={company}
            searchTerm={searchTerm}
          />
        </div>
      </main>
    </div>
  );
}

export default SearchResults;