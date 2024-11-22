import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { signOut, getCurrentUser } from "aws-amplify/auth";
import Header from "./Header"
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
    const [isAlumni, setIsAlumni] = useState(false);
    
    useEffect(() => {
        async function checkUserName() {
            try {
                const fullName = localStorage.getItem("FullName");
                const currentUser = await getCurrentUser();
                if (fullName && currentUser) {
                    setIsSignedIn(true);
                    setsignupData(fullName)
                };
            } catch (err) {
                console.error("Error fetching user data:", err);
                setIsSignedIn(false);
            }
        }
        checkUserName();
    }, []);

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
        <div>
            <Header
                navigate={navigate}
                isAlumni={isAlumni}
                isSignedIn={isSignedIn}
            />
            

            {/* Main content */}
            <main className="profile-setup-container">
                <h2 className="section-title">My Profile</h2>
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
                    <div className="bg-white rounded-lg p-6 shadow-md flex-grow">
                        <label>
                            Analytics Coming Soon!
                        </label>
                    </div>
                </div>
            </main>
             {/* Show AccessCodeModal only if showModal is true */}
             {/*showModal && <AccessCodeModal onClose={() => setShowModal(false)} onAccessGranted={handleAccessGranted} />*/}

            <footer className="footer">
                    <p>AlumniReach LLC</p>
            </footer>
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
                {isSignedIn ? (
                    <>
                        <p>Hi {signupData}!</p>
                        <button
                            onClick={handleSignOut}
                            style={{
                                padding: "0.5rem 1rem",
                                background: "#2575fc",
                                color: "white",
                                border: "none",
                                borderRadius: "8px",
                                cursor: "pointer",
                            }}
                        >
                            Sign Out
                        </button>
                    </>
                ) : (
                    <>
                        <p>You are signed out.</p>
                        <button
                            onClick={handleLogIn}
                            style={{
                                padding: "0.5rem 1rem",
                                background: "#2575fc",
                                color: "white",
                                border: "none",
                                borderRadius: "8px",
                                cursor: "pointer",
                            }}
                        >
                            Log In
                        </button>
                    </>
                )}
            </div>
        </div>
    );
}

export default ProfileSetup;
                                 