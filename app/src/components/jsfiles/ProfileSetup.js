import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { signOut, getCurrentUser, fetchAuthSession } from "aws-amplify/auth";
import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import Header from "./Header";
import awsmobile from "../../aws-exports";
import "../cssfiles/ProfileSetup.css";

const client = null; // GraphQL client is no longer needed

function ProfileSetup() {
    const navigate = useNavigate();
    const [industry, setIndustry] = useState("");
    const [role, setRole] = useState("");
    const [customJob, setCustomJob] = useState("");
    const [jobSearch, setJobSearch] = useState("");
    const [industrySearch, setIndustrySearch] = useState("");
    const [company, setCompany] = useState("")
    const [resumeName, setResumeName] = useState("");
    const [resumeUrl, setResumeUrl] = useState("");
    const [isUploading, setIsUploading] = useState(false);
    const [showDropdown, setShowDropdown] = useState(false);
    const [showModal, setShowModal] = useState(false); // State to control modal visibility
    const [hasAccess, setHasAccess] = useState(true); // State to track access code entry
    const [isSignedIn, setIsSignedIn] = useState(false);
    const [signupData, setsignupData] = useState("");
    const [isAlumni, setIsAlumni] = useState(false);
    const [userSub, setUserSub] = useState("");
    const [identityID, setIdentityID] = useState("");
    const [authSession, setAuthSession] = useState();
    
    const loadExistingResume = useCallback(async () => {
        try {
            if (!userSub || !authSession) return; // Guard clause

            console.log("Loading resume for user:", userSub);
            const session = await fetchAuthSession();
            const { idToken } = session.tokens ?? {};

            if (!idToken) {
                throw new Error("No ID token found.");
            }

            const response = await fetch(awsmobile.aws_appsync_graphqlEndpoint, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${idToken}`,
                },
                body: JSON.stringify({
                    query: `
                    query GetUserProfile($userId: ID!) {
                        getUserProfile(userId: $userId) {
                            userId
                            email
                            fullname
                            company
                            role
                            resumeName
                        }
                    }`,
                    variables: { userId: userSub },
                }),
            });
            
            const responseData = await response.json();
            console.log("Got user data:", responseData);
            
            if (responseData.data?.getUserProfile?.resumeName) {
                const fileName = responseData.data.getUserProfile.resumeName;
                setResumeName(fileName);
                localStorage.setItem(`resumeName_${userSub}`, fileName);

                // Generate a temporary URL for viewing
                const s3Client = new S3Client({
                    region: "us-east-1",
                    credentials: {
                        accessKeyId: authSession.credentials.accessKeyId,
                        secretAccessKey: authSession.credentials.secretAccessKey,
                        sessionToken: authSession.credentials.sessionToken
                    }
                });

                const command = new GetObjectCommand({
                    Bucket: "alumnireachresumestorage74831-dev",
                    Key: `private/${userSub}/${fileName}`
                });

                const url = await getSignedUrl(s3Client, command, { expiresIn: 3600 });
                setResumeUrl(url);
                localStorage.setItem(`resumeUrl_${userSub}`, url);
                console.log("Generated presigned URL for viewing");
            }
        } catch (err) {
            console.error("Error loading resume:", err);
        }
    }, [userSub, authSession]); // Dependencies for useCallback

    useEffect(() => {
        const checkUserName = async () => {
            try {
                const { username, userId } = await getCurrentUser();
                setUserSub(userId);
                const auth = await fetchAuthSession();
                setAuthSession(auth);
                setIsSignedIn(true);

                // Check localStorage first
                const storedResumeName = localStorage.getItem(`resumeName_${userId}`);
                const storedResumeUrl = localStorage.getItem(`resumeUrl_${userId}`);
                
                if (storedResumeName) {
                    setResumeName(storedResumeName);
                    if (storedResumeUrl) {
                        setResumeUrl(storedResumeUrl);
                    }
                }
            } catch (err) {
                console.error("Authentication error:", err);
                setIsSignedIn(false);
                alert("Please sign in to access your profile and resume.");
            }
        };
        checkUserName();
    }, []);

    // Call loadExistingResume when userSub or authSession changes
    useEffect(() => {
        if (userSub && authSession) {
            loadExistingResume();
        }
    }, [userSub, authSession, loadExistingResume]);

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

    const handleDeleteResume = async () => {
        try {
            if (!window.confirm('Are you sure you want to delete your resume?')) {
                return;
            }

            const s3Client = new S3Client({
                region: "us-east-1",
                credentials: {
                    accessKeyId: authSession.credentials.accessKeyId,
                    secretAccessKey: authSession.credentials.secretAccessKey,
                    sessionToken: authSession.credentials.sessionToken
                }
            });

            // Delete from S3
            await s3Client.send(new DeleteObjectCommand({
                Bucket: "alumnireachresumestorage74831-dev",
                Key: `private/${userSub}/${resumeName}`
            }));

            // Update DynamoDB
            const session = await fetchAuthSession();
            const { idToken } = session.tokens ?? {};

            if (!idToken) {
                throw new Error("No ID token found for GraphQL update");
            }

            const graphqlResponse = await fetch(awsmobile.aws_appsync_graphqlEndpoint, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${idToken}`,
                },
                body: JSON.stringify({
                    query: `
                    mutation UpdateUserProfile($input: UpdateUserProfileInput!) {
                        updateUserProfile(input: $input) {
                            userId
                            resumeName
                        }
                    }`,
                    variables: {
                        input: {
                            userId: userSub,
                            resumeName: null
                        }
                    },
                }),
            });

            const graphqlData = await graphqlResponse.json();
            if (graphqlData.errors) {
                throw new Error(`GraphQL Error: ${JSON.stringify(graphqlData.errors)}`);
            }

            // Clear localStorage
            localStorage.removeItem(`resumeName_${userSub}`);
            localStorage.removeItem(`resumeUrl_${userSub}`);

            setResumeName('');
            setResumeUrl('');
            alert('Resume deleted successfully!');
        } catch (err) {
            console.error("Error deleting resume:", err);
            alert('Failed to delete resume. Please try again.');
        }
    };

    const handleFileUpload = async(event) => {
        try {
            const file = event.target.files[0];
            if (!file) {
                console.error("No file selected");
                return;
            }

            // Check if replacing existing resume
            if (resumeName && !window.confirm('Do you want to replace your existing resume?')) {
                return;
            }

            setIsUploading(true);

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

            // Use user's sub in the path
            const s3Key = `private/${userSub}/${file.name}`;
            console.log("Uploading to:", s3Key);

            const params = {
                Bucket: "alumnireachresumestorage74831-dev",
                Key: s3Key,
                ContentType: file.type
            };

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

            // Update DynamoDB with resume info
            const session = await fetchAuthSession();
            const { idToken } = session.tokens ?? {};

            if (!idToken) {
                throw new Error("No ID token found for GraphQL update");
            }

            const graphqlResponse = await fetch(awsmobile.aws_appsync_graphqlEndpoint, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${idToken}`,
                },
                body: JSON.stringify({
                    query: `
                    mutation UpdateUserProfile($input: UpdateUserProfileInput!) {
                        updateUserProfile(input: $input) {
                            userId
                            resumeName
                        }
                    }`,
                    variables: {
                        input: {
                            userId: userSub,
                            resumeName: file.name
                        }
                    },
                }),
            });

            const graphqlData = await graphqlResponse.json();
            if (graphqlData.errors) {
                throw new Error(`GraphQL Error: ${JSON.stringify(graphqlData.errors)}`);
            }

            // Update localStorage
            localStorage.setItem(`resumeName_${userSub}`, file.name);

            setResumeName(file.name);
            // Generate URL for immediate viewing
            const getCommand = new GetObjectCommand(params);
            const viewUrl = await getSignedUrl(s3Client, getCommand, { expiresIn: 3600 });
            setResumeUrl(viewUrl);
            localStorage.setItem(`resumeUrl_${userSub}`, viewUrl);

            console.log("Upload succeeded!");
            alert("Resume uploaded successfully!");
        } catch (err) {
            console.error("Upload failed:", err);
            if (err.message.includes('status: 403')) {
                alert("Permission denied. Please check your credentials and try again.");
            } else {
                alert(`Failed to upload resume: ${err.message}`);
            }
        } finally {
            setIsUploading(false);
        }
    };

    const resumeSection = (
        <div className="resume-section">
            <h3>Resume</h3>
            {isUploading ? (
                <p>Uploading...</p>
            ) : resumeName ? (
                <div>
                    <p>Current Resume: {resumeName}</p>
                    <div className="resume-actions">
                        <a href={resumeUrl} target="_blank" rel="noopener noreferrer" className="view-button">
                            View Resume
                        </a>
                        <button onClick={handleDeleteResume} className="delete-button">
                            Delete Resume
                        </button>
                        <label className="replace-button">
                            Replace Resume
                            <input
                                type="file"
                                accept=".pdf,.doc,.docx"
                                onChange={handleFileUpload}
                                style={{ display: 'none' }}
                            />
                        </label>
                    </div>
                </div>
            ) : (
                <div>
                    <p>No resume uploaded</p>
                    <label className="upload-button">
                        Upload Resume
                        <input
                            type="file"
                            accept=".pdf,.doc,.docx"
                            onChange={handleFileUpload}
                            style={{ display: 'none' }}
                        />
                    </label>
                </div>
            )}
        </div>
    );

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
                        {resumeSection}
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