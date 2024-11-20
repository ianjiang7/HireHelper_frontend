import React, { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import Alumni from "./Alumni";
import "../cssfiles/SearchResults.css";

function SearchResults() {
  const navigate = useNavigate();
  // const { state } = useLocation();
  // const { industry, role, customJob, jobSearch, company } = state;
  const [searchTerm, setSearchTerm] = useState("");
  const [industry, setIndustry] = useState("");
  const [role, setRole] = useState("");
  const [customJob, setCustomJob] = useState("");
  const [jobSearch, setJobSearch] = useState("");
  const [industrySearch, setIndustrySearch] = useState("");
  const [company, setCompany] = useState("")
  //const [resumeName, setResumeName] = useState("Upload your resume"); // Placeholder name
  const [showDropdown, setShowDropdown] = useState(false);
  const [showResults, setShowResults] = useState(false);
  //const [showModal, setShowModal] = useState(false); // State to control modal visibility
  //const [hasAccess, setHasAccess] = useState(true); // State to track access code entry
  const [isSignedIn, setIsSignedIn] = useState(false);
  const [signupData, setsignupData] = useState("");
  const industries = [
    "Investment Banking", "Quantitative Trading", "Tax", "Finance",
    "Private Equity", "Asset Management", "Data Science", "Venture Capital",
    "Fund Management", "Software Development", "Teaching", "Healthcare & Medical",
    "Marketing", "Sales", "Engineering & Manufacturing", "Legal & Compliance",
    "Human Resources (HR)", "Customer Service", "Consulting & Advisory",
    "Operations & Logistics", "Real Estate", "Arts & Entertainment",
    "Nonprofit & Social Services", "Hospitality & Tourism", "Retail & E-commerce",
    "Research & Development (R&D)", "Media & Communications", "Student",
    "Information Technology", "Government & Public Service", "Product Management", "Other"
 ];

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
      <div className="parent-container">
        <div className="search-query-container">
          <div className="bg-white rounded-lg p-6 shadow-md flex-grow">
          <h3 className="text-xl font-semibold mb-4">Who are you looking for?</h3>
            <form className="space-y-4">
                            <div className="relative">
                                <label htmlFor="industrySearch" className="block text-gray-600">Industry*</label>
                                <input
                                    type="text"
                                    id="industrySearch"
                                    name="industrySearch"
                                    value={industrySearch}
                                    onChange={(e) => setIndustrySearch(e.target.value)}
                                    placeholder="Search industry"
                                    className="w-full border border-gray-300 rounded-md p-2 mt-1"
                                    onFocus={() => setShowDropdown(true)}
                                />
                                {showDropdown && (
                                    <div className="dropdown">
                                        {industries.filter(ind => ind.toLowerCase().includes(industrySearch.toLowerCase())).map((item) => (
                                            <div
                                                key={item}
                                                onClick={() => {
                                                    setIndustry(item);
                                                    setIndustrySearch(item);
                                                    setShowDropdown(false);
                                                }}
                                                className="p-2 cursor-pointer hover:bg-gray-100"
                                            >
                                                {item}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                            <div>
                                <label htmlFor="role" className="block text-gray-600">Select Role*</label>
                                <select value={role} onChange={(e) => setRole(e.target.value)} required className="w-full border border-gray-300 rounded-md p-2 mt-1">
                                    <option value="">Select Role</option>
                                    <option value="Student">Student</option>
                                    <option value="Employee">Employee</option>
                                    <option value="Director">Director</option>
                                    <option value="Manager">Manager</option>
                                    <option value="Other">Other</option>
                                </select>
                                {role === 'Other' && (
                                    <input
                                        type="text"
                                        placeholder="Enter custom role"
                                        value={customJob}
                                        onChange={(e) => setCustomJob(e.target.value)}
                                        className="w-full border border-gray-300 rounded-md p-2 mt-1"
                                    />
                                )}
                            </div>
                            <div>
                                <label htmlFor="jobSearch" className="block text-gray-600">Job</label>
                                <input
                                    type="text"
                                    id="jobSearch"
                                    name="jobSearch"
                                    value={jobSearch}
                                    onChange={(e) => setJobSearch(e.target.value)}
                                    placeholder="Search job"
                                    className="w-full border border-gray-300 rounded-md p-2 mt-1"
                                />
                            </div>
                            <div>
                                <label htmlFor="company" className="block text-gray-600">Company</label>
                                <input type="text" id="company" name="company" value={company} onChange={(e)=>setCompany(e.target.value)}className="w-full border border-gray-300 rounded-md p-2 mt-1" />
                            </div>
                            <button 
                                type="button" 
                                onClick={() => setShowResults(true)}
                                className="w-full bg-gradient-to-r from-purple-600 to-blue-500 text-white py-2 px-6 rounded-lg font-medium shadow-lg hover:bg-blue-600 transform hover:scale-105 transition-transform"
                            >
                                Browse
                            </button>
                        </form>
              </div>
        </div>
        <main className="search-content-results-container">
          { showResults &&
          <>
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
          </div></> } 
        </main> 
      </div>
    </div>
  );
}

export default SearchResults;