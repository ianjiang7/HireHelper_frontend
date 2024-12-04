import React, { useState, useEffect, useContext, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import Alumni from "./Alumni";
import SearchSlideUp from './SearchSlideUp';
import { signOut, getCurrentUser } from "aws-amplify/auth";
import Header from "./Header"
import "../cssfiles/SearchResults.css";
import { useAuth } from './AuthContext';

function SearchResults({ embedded = false }) {
  const navigate = useNavigate();
  const { state } = useLocation();
  const initialState = state || {};
  const { isAuthenticated } = useAuth();
  const [isAlumni, setIsAlumni] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [industry, setIndustry] = useState(initialState.industry || "");
  const [role, setRole] = useState(initialState.role || "");
  const [customJob, setCustomJob] = useState(initialState.customJob || "");
  const [jobSearch, setJobSearch] = useState(initialState.jobSearch || "");
  const [industrySearch, setIndustrySearch] = useState("");
  const [company, setCompany] = useState(initialState.company || "");
  const [showDropdown, setShowDropdown] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [signupData, setsignupData] = useState("");
  const [isBrowsing, setIsBrowsing] = useState(false);
  const [searchInfo, setSearchInfo] = useState({
    Industry: "",
    Role: "",
    Company: ""
  });
  const [isSearchCollapsed, setIsSearchCollapsed] = useState(false);
  const dropdownRef = useRef(null);

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

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const toggleSearch = () => {
    setIsSearchCollapsed(!isSearchCollapsed);
  };

  useEffect(() => {
    async function checkUserName() {
      try {
        const fullName = localStorage.getItem("FullName");
        const currentUser = await getCurrentUser();
        if (fullName && currentUser) {
          setIsAlumni(true);
          setsignupData(fullName)
        };
      } catch (err) {
        console.error("Error fetching user data:", err);
        setIsAlumni(false);
      }
    }
    checkUserName();
  }, []);

  const handleLogIn = async () => {
    navigate("/alumni-login")
  } 

  const handleSignOut = async () => {
    try {
      await signOut();
      setIsAlumni(false);
      setsignupData(null);
      navigate("/search-results"); // Redirect to the home page after sign-out
    } catch (err) {
      console.error("Error signing out:", err);
    }
  };

  const handleBrowseClick = () => {
    setSearchInfo({
      Industry: industry,
      Role: role,
      Company: company,
      Job: jobSearch,
      CustomJob: customJob
    });
  }

  const handleBeginSearch = () => {
    setShowResults(true);
  };

  return (
    <>
      {!embedded && <Header navigate={navigate} isSignedIn={isAuthenticated} />}
      <div className="search-page">
        <div className="search-container">
          <div className="top-section">
            <h1 className="page-title">
              Find any NYU alumni
              <span>Connect with graduates in your field</span>
            </h1>
          </div>
          <div className="search-section">
            <div className="search-header">
              <input
                type="text"
                placeholder="Search..."
                className="search-input"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
          <div className="parent-container">
            <main className="search-content-results-container">
              <div className={`search-query-container ${isSearchCollapsed ? 'collapsed' : ''}`}>
                <div className={`search-form-container ${isSearchCollapsed ? 'collapsed' : ''}`} onClick={isSearchCollapsed ? toggleSearch : undefined}>
                  <form className="space-y-4">
                    <div className="relative" ref={dropdownRef}>
                      <label htmlFor="industrySearch" className="block text-gray-600">Industry*</label>
                      <input
                        type="text"
                        id="industrySearch"
                        name="industrySearch"
                        value={industrySearch}
                        onChange={(e) => {
                          setIndustrySearch(e.target.value);
                          setIsBrowsing(true);
                          setShowDropdown(true);
                        }}
                        placeholder="Search industry"
                        className="w-full border border-gray-300 rounded-md p-2 mt-1"
                        onFocus={() => setShowDropdown(true)}
                      />
                      {showDropdown && (
                        <div className="dropdown">
                          {industries
                            .filter(ind => 
                              ind.toLowerCase().includes(industrySearch.toLowerCase())
                            )
                            .map((item) => (
                              <div
                                key={item}
                                onClick={() => {
                                  setIndustry(item);
                                  setIndustrySearch(item);
                                  setIsBrowsing(true);
                                  setShowDropdown(false);
                                }}
                                className="dropdown-item"
                              >
                                {item}
                              </div>
                            ))
                          }
                        </div>
                      )}
                    </div>
                    <div>
                      <label htmlFor="role" className="block text-gray-600">Select Role*</label>
                      <select value={role} onChange={(e) => {setRole(e.target.value);setIsBrowsing(true)}} required className="w-full border border-gray-300 rounded-md p-2 mt-1">
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
                          onChange={(e) => {setCustomJob(e.target.value); setIsBrowsing(true)}}
                          className="w-full border border-gray-300 rounded-md p-2 mt-1"
                        />
                      ) }
                    </div>
                    <div>
                      <label htmlFor="jobSearch" className="block text-gray-600">Job</label>
                      <input
                        type="text"
                        id="jobSearch"
                        name="jobSearch"
                        value={jobSearch}
                        onChange={(e) => {setJobSearch(e.target.value); setIsBrowsing(true)}}
                        placeholder="Search job"
                        className="w-full border border-gray-300 rounded-md p-2 mt-1"
                      />
                    </div>
                    <div>
                      <label htmlFor="company" className="block text-gray-600">Company</label>
                      <input type="text" id="company" name="company" value={company} onChange={(e)=>{setCompany(e.target.value);setIsBrowsing(true)}}className="w-full border border-gray-300 rounded-md p-2 mt-1" />
                    </div>
                    <button 
                      type="button" 
                      onClick={handleBrowseClick}
                      className="w-full bg-gradient-to-r from-purple-600 to-blue-500 text-white py-2 px-6 rounded-lg font-medium shadow-lg hover:bg-blue-600 transform hover:scale-105 transition-transform"
                      disabled={!isAuthenticated}
                    >
                      Search
                    </button>
                  </form>
                </div>
              </div>
              <div className="results-container">
                <Alumni
                  industry={searchInfo.Industry}
                  job={searchInfo.Role}
                  customJob={searchInfo.CustomJob}
                  jobSearch={searchInfo.Job}
                  company={searchInfo.Company}
                  searchTerm={searchTerm}
                /> 
              </div> 
            </main> 
            <div
              style={{
                position: "fixed",
                bottom: "10px",
                right: "10px",
                background: "rgba(255, 255, 255, 0.8)",
                color: "#333",
                border: "1px solid #ddd",
                borderRadius: "10px",
                padding: "1rem",
                boxShadow: "0px 4px 8px rgba(0, 0, 0, 0.2)",
              }}
            >
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export default SearchResults;
