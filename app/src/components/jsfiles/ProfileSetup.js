import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { signOut, getCurrentUser, fetchAuthSession} from "aws-amplify/auth";
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
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
    const [userSub, setUserSub] = useState("");
    const [identityID, setIdentityID] = useState("");
    const [authSession, setAuthSession] = useState();
    
    useEffect(() => {
        async function checkUserName() {
            try {
                const fullName = localStorage.getItem("FullName");
                const userID = localStorage.getItem("USERID");
                const currentUser = await getCurrentUser();
                const session = await fetchAuthSession();
                if (fullName && currentUser) {
                    setIsSignedIn(true);
                    setsignupData(fullName);
                    setUserSub(userID);
                    setIdentityID(session.identityId);
                    setAuthSession(session);
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

    const handleFileUpload = async(event) => {
        try {
            const file = event.target.files[0];
            if (!file) {
                console.error("No file selected");
                return;
            }

            // Make sure we have valid credentials
            if (!authSession?.credentials) {
                console.error("No valid credentials");
                alert("Please sign in again");
                return;
            }

            console.log("Auth session:", {
                accessKeyId: authSession.credentials.accessKeyId ? "Present" : "Missing",
                secretAccessKey: authSession.credentials.secretAccessKey ? "Present" : "Missing",
                sessionToken: authSession.credentials.sessionToken ? "Present" : "Missing",
                sub: userSub ? "Present" : "Missing"
            });

            const s3Client = new S3Client({
                region: "us-east-1",
                credentials: {
                    accessKeyId: authSession.credentials.accessKeyId,
                    secretAccessKey: authSession.credentials.secretAccessKey,
                    sessionToken: authSession.credentials.sessionToken
                }
            });

            setResumeName(file.name);
            
            // Use user's sub in the path
            const s3Key = `private/${userSub}/${file.name}`;
            console.log("Uploading to:", s3Key);

            const params = {
                Bucket: "alumnireachresumestorage74831-dev",
                Key: s3Key,
                ContentType: file.type
            };

            console.log("Upload params:", {
                Bucket: params.Bucket,
                Key: params.Key,
                ContentType: params.ContentType
            });

            // Generate pre-signed URL
            const command = new PutObjectCommand(params);
            const signedUrl = await getSignedUrl(s3Client, command, {
                expiresIn: 3600,
            });

            console.log("Starting upload with signed URL...");
            
            // Use fetch with the pre-signed URL
            const response = await fetch(signedUrl, {
                method: 'PUT',
                body: file,
                headers: {
                    'Content-Type': file.type
                }
            });

            if (!response.ok) {
                const errorText = await response.text().catch(() => 'No error details available');
                throw new Error(`Upload failed with status: ${response.status} ${response.statusText}. Details: ${errorText}`);
            }

            console.log("Upload succeeded!");
            alert("Resume uploaded successfully!");
        } catch (err) {
            console.error("Upload failed:", err);
            if (err.message.includes('status: 403')) {
                alert("Permission denied. Please check your credentials and try again.");
            } else {
                alert(`Failed to upload resume: ${err.message}`);
            }
        }
    };

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
                            {isSignedIn && (<input type="file" id="resume-upload" name="resume" className="hidden" onChange={handleFileUpload} />)}
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