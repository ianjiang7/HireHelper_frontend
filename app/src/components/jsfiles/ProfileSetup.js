import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import AccessCodeModal from "./AccessCodeModal";
import { signOut, getCurrentUser } from "aws-amplify/auth";
import "../cssfiles/ProfileSetup.css"; // Import the CSS file

function ProfileSetup() {
    const navigate = useNavigate();
    const [industry, setIndustry] = useState("");
    const [role, setRole] = useState("");
    const [customJob, setCustomJob] = useState("");
    const [jobSearch, setJobSearch] = useState("");
    const [industrySearch, setIndustrySearch] = useState("");
    const [company, setCompany] = useState("")
    const [resumeName, setResumeName] = useState("Upload your resume"); // Placeholder name
    const [showDropdown, setShowDropdown] = useState(false);
    const [showModal, setShowModal] = useState(false); // State to control modal visibility
    const [hasAccess, setHasAccess] = useState(true); // State to track access code entry
    const [isSignedIn, setIsSignedIn] = useState(false);
    const [signupData, setsignupData] = useState("");
    
    useEffect(() => {
        async function checkUserName() {
            try {
                const fullName = await JSON.parse(localStorage.getItem("FullName"));
                console.log(fullName)
                const usersName = fullName?.UsersName
                const currentUser = await getCurrentUser();
                if (usersName && currentUser) {
                    setIsSignedIn(true);
                    setsignupData(usersName)
                };
            } catch (err) {
                console.error("Error fetching user data:", err);
                setIsSignedIn(false);
            }
        }
        checkUserName();
    }, []);

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

    const handleSignOut = async () => {
        try {
            await signOut();
            setIsSignedIn(false);
            setsignupData(null);
            navigate("/search-results"); // Redirect to the home page after sign-out
        } catch (err) {
            console.error("Error signing out:", err);
        }
    };

    const handleLogIn = async () => {
        navigate("/alumni-login")
    }

    // Function to handle successful access code entry
    const handleAccessGranted = () => {
        setHasAccess(true); // Set access to true
        setShowModal(false); // Close the modal
        navigate("/search-results", {state: {industry, role, customJob, jobSearch, company}}); // Navigate to ProfileSetup
    };

    const handleProceed = () => {
        // If access is already granted, navigate directly
        if (hasAccess) {
            navigate("/search-results", {state: {industry, role, customJob, jobSearch, company}});
        } else {
            // Otherwise, show the access code modal
            setShowModal(true);
        }
    };
    const handleFileUpload = (event) => {
        const file = event.target.files[0];
        if (file) {
            setResumeName(file.name);
            /*
            const formData = new FormData();
            formData.append("resume", file);

            try {
                const response = await fetch("/upload", {
                    method: "POST",
                    body: formData,
                });
                const result = await response.json();
                console.log("File uploaded successfully:", result);
            } catch (error) {
            console.error("Error uploading file:", error);
        }*/
    }
        }
    

    return (
        <div className="profile-setup-container">
            {/* Navbar */}
            <nav className="navbar">
                <h1 className="navbar-title" onClick={() => navigate("/")}>AlumniReach for NYU</h1>
                <div className="navbar-links">
                    <button onClick={() => navigate("/")} className="navbar-link">Home</button>
                    <button onClick = {() => hasAccess && navigate("/search-results")} className = "navbar-link" >Results</button>
                    <button onClick={() => navigate("/profile-setup")} className="navbar-link" style={{opacity: 0.5, cursor: "not-allowed"}}>Profile Setup</button>
                </div>
            </nav>

            {/* Main content */}
            <main className="profile-setup-main">
                <h2 className="section-title">Welcome!</h2>
                <p className="text-gray-700 text-center mb-6"></p>
                
                <div className="flex flex-col lg:flex-row w-full space-y-6 lg:space-y-0 lg:space-x-8">
                    {/* Attach Resume Section */}
                    <div className="bg-white rounded-lg p-6 shadow-md flex-grow">
                        <h3 className="text-xl font-semibold mb-4">Attach Resume</h3>
                        <p className="text-gray-600 mb-4">Please upload your resume for more targeted results</p>
                        <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                            <label htmlFor="resume-upload" className="text-gray-500 cursor-pointer">Drag & drop files or <span className="text-blue-500">Browse</span></label>
                            <input type="file" id="resume-upload" name="resume" className="hidden" onChange={handleFileUpload} />
                        </div>
                        <div className="mt-4 text-gray-700">{resumeName}</div>
                    </div>
                    
                    {/* Search Criteria Section */}
                    {/*
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
                                onClick={handleProceed}
                                className="w-full bg-gradient-to-r from-purple-600 to-blue-500 text-white py-2 px-6 rounded-lg font-medium shadow-lg hover:bg-blue-600 transform hover:scale-105 transition-transform"
                            >
                                Browse
                            </button>
                        </form>
                    </div> */}
                </div>
            </main>
             {/* Show AccessCodeModal only if showModal is true */}
             {/*showModal && <AccessCodeModal onClose={() => setShowModal(false)} onAccessGranted={handleAccessGranted} />*/}

            <footer className="footer">
                    <p>AlumniReach LLC</p>
            </footer>
            <div className="user-status">
                {isSignedIn ? (
                    <>
                        <p>Hi {signupData}!</p>
                        <button onClick={handleSignOut} className="sign-out-button">
                            Sign Out
                        </button>
                    </>
                ) : (
                    <>
                    <p>You are currently signed out.</p>
                    <button onClick={handleLogIn} className="sign-out-button">
                            Log In
                    </button></>
                )}
            </div>
        </div>
    );
}

export default ProfileSetup;
                                 
