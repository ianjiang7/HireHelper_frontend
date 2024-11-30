import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { signOut, getCurrentUser, fetchAuthSession } from "aws-amplify/auth";
import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import Header from "./Header";
import awsmobile from "../../aws-exports";
import "../cssfiles/ProfileSetup.css";

function ProfileSetup() {
    const navigate = useNavigate();
    const [activeSection, setActiveSection] = useState("profile");
    const [userSub, setUserSub] = useState("");
    const [resumeName, setResumeName] = useState("");
    const [resumeUrl, setResumeUrl] = useState("");
    const [isUploading, setIsUploading] = useState(false);
    const [isSignedIn, setIsSignedIn] = useState(false);
    const [authSession, setAuthSession] = useState();
    const [isSaving, setIsSaving] = useState(false);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [analysisResult, setAnalysisResult] = useState(null);
    const [analysisError, setAnalysisError] = useState(null);
    
    // Profile state
    const [profileData, setProfileData] = useState({
        fullname: "",
        email: "",
        company: "",
        role: "",
    });

    const loadExistingResume = useCallback(async () => {
        try {
            if (!userSub || !authSession) return;

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
            
            if (responseData.data?.getUserProfile) {
                const userData = responseData.data.getUserProfile;
                setProfileData({
                    fullname: userData.fullname || "",
                    email: userData.email || "",
                    company: userData.company || "",
                    role: userData.role || "",
                });

                if (userData.resumeName) {
                    const fileName = userData.resumeName;
                    setResumeName(fileName);
                    localStorage.setItem(`resumeName_${userSub}`, fileName);

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
                }
            }
        } catch (err) {
            console.error("Error loading resume:", err);
        }
    }, [userSub, authSession]);

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

    useEffect(() => {
        if (userSub && authSession) {
            loadExistingResume();
        }
    }, [userSub, authSession, loadExistingResume]);

    const handleSignOut = async () => {
        try {
            await signOut();
            setIsSignedIn(false);
            navigate("/alumni-login");
        } catch (err) {
            console.error("Error signing out: ", err);
        }
    };

    const handleFileUpload = async (event) => {
        const file = event.target.files[0];
        if (!file) return;

        setIsUploading(true);
        try {
            const s3Client = new S3Client({
                region: "us-east-1",
                credentials: {
                    accessKeyId: authSession.credentials.accessKeyId,
                    secretAccessKey: authSession.credentials.secretAccessKey,
                    sessionToken: authSession.credentials.sessionToken
                }
            });

            const command = new PutObjectCommand({
                Bucket: "alumnireachresumestorage74831-dev",
                Key: `private/${userSub}/${file.name}`,
                Body: file,
                ContentType: file.type
            });

            await s3Client.send(command);
            console.log("File uploaded successfully");

            // Update GraphQL
            const session = await fetchAuthSession();
            const { idToken } = session.tokens ?? {};

            const response = await fetch(awsmobile.aws_appsync_graphqlEndpoint, {
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
                    }
                }),
            });

            const data = await response.json();
            console.log("GraphQL response:", data);

            setResumeName(file.name);
            localStorage.setItem(`resumeName_${userSub}`, file.name);

            // Generate URL for viewing
            const getCommand = new GetObjectCommand({
                Bucket: "alumnireachresumestorage74831-dev",
                Key: `private/${userSub}/${file.name}`
            });

            const url = await getSignedUrl(s3Client, getCommand, { expiresIn: 3600 });
            setResumeUrl(url);
            localStorage.setItem(`resumeUrl_${userSub}`, url);

        } catch (err) {
            console.error("Error uploading file:", err);
            alert("Error uploading file. Please try again.");
        } finally {
            setIsUploading(false);
        }
    };

    const handleDeleteResume = async () => {
        if (!resumeName) return;

        try {
            const s3Client = new S3Client({
                region: "us-east-1",
                credentials: {
                    accessKeyId: authSession.credentials.accessKeyId,
                    secretAccessKey: authSession.credentials.secretAccessKey,
                    sessionToken: authSession.credentials.sessionToken
                }
            });

            const command = new DeleteObjectCommand({
                Bucket: "alumnireachresumestorage74831-dev",
                Key: `private/${userSub}/${resumeName}`
            });

            await s3Client.send(command);
            console.log("File deleted successfully");

            // Update GraphQL
            const session = await fetchAuthSession();
            const { idToken } = session.tokens ?? {};

            const response = await fetch(awsmobile.aws_appsync_graphqlEndpoint, {
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
                    }
                }),
            });

            const data = await response.json();
            console.log("GraphQL response:", data);

            setResumeName("");
            setResumeUrl("");
            localStorage.removeItem(`resumeName_${userSub}`);
            localStorage.removeItem(`resumeUrl_${userSub}`);

        } catch (err) {
            console.error("Error deleting file:", err);
            alert("Error deleting file. Please try again.");
        }
    };

    const handleProfileChange = (e) => {
        const { name, value } = e.target;
        setProfileData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSaveProfile = async () => {
        setIsSaving(true);
        try {
            const session = await fetchAuthSession();
            const { idToken } = session.tokens ?? {};

            const response = await fetch(awsmobile.aws_appsync_graphqlEndpoint, {
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
                            email
                            fullname
                            company
                            role
                        }
                    }`,
                    variables: {
                        input: {
                            userId: userSub,
                            ...profileData
                        }
                    }
                }),
            });

            const data = await response.json();
            if (data.errors) {
                throw new Error(data.errors[0].message);
            }
            alert("Profile updated successfully!");
        } catch (err) {
            console.error("Error updating profile:", err);
            alert("Error updating profile. Please try again.");
        } finally {
            setIsSaving(false);
        }
    };

    const handleResumeUpload = async (event) => {
        const file = event.target.files[0];
        if (!file) return;

        setIsAnalyzing(true);
        setAnalysisError(null);

        try {
            // Upload file to S3
            const fileName = `${userSub}/resume/${Date.now()}-${file.name}`;
            const s3Client = new S3Client({
                region: "us-east-1",
                credentials: {
                    accessKeyId: authSession.credentials.accessKeyId,
                    secretAccessKey: authSession.credentials.secretAccessKey,
                    sessionToken: authSession.credentials.sessionToken
                }
            });

            const command = new PutObjectCommand({
                Bucket: "alumnireachresumestorage74831-dev",
                Key: `private/${fileName}`,
                Body: file,
                ContentType: file.type
            });

            await s3Client.send(command);

            // Analyze the resume
            const session = await fetchAuthSession();
            const { idToken } = session.tokens ?? {};

            const response = await fetch(awsmobile.aws_appsync_graphqlEndpoint, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${idToken}`,
                },
                body: JSON.stringify({
                    query: `
                    mutation AnalyzeResume($input: AnalyzeResumeInput!) {
                        analyzeResume(input: $input) {
                            success
                            analysis
                            error
                        }
                    }`,
                    variables: {
                        input: {
                            userId: userSub,
                            bucket: "alumnireachresumestorage74831-dev",
                            key: `private/${fileName}`
                        }
                    }
                }),
            });

            const data = await response.json();

            if (data.data.analyzeResume.success) {
                setAnalysisResult(data.data.analyzeResume.analysis);
                // Add show class after a brief delay to trigger animation
                setTimeout(() => {
                    const resultElement = document.querySelector('.analysis-result');
                    if (resultElement) {
                        resultElement.classList.add('show');
                    }
                }, 100);
            } else {
                setAnalysisError(data.data.analyzeResume.error || 'Failed to analyze resume');
            }
        } catch (error) {
            console.error('Error processing resume:', error);
            setAnalysisError(error.message || 'Error processing resume');
        } finally {
            setIsAnalyzing(false);
        }
    };

    return (
        <>
            <Header
                navigate={navigate}
                isSignedIn={isSignedIn}
            />
            <div className="profile-container">
                <div className="sidebar">
                    <h2>AlumniReach</h2>
                    <ul className="sidebar-menu">
                        <li 
                            className={activeSection === "profile" ? "active" : ""}
                            onClick={() => setActiveSection("profile")}
                        >
                            <i className="fas fa-user"></i> Profile
                        </li>
                        <li 
                            className={activeSection === "analytics" ? "active" : ""}
                            onClick={() => setActiveSection("analytics")}
                        >
                            <i className="fas fa-chart-line"></i> Analytics
                        </li>
                    </ul>
                    <div 
                        className="sign-out-button"
                        onClick={handleSignOut}
                    >
                        <i className="fas fa-sign-out-alt"></i> Sign Out
                    </div>
                </div>

                <div className="main-content">
                    {activeSection === "profile" ? (
                        <>
                            <div className="profile-section">
                                <h2 className="section-title">Profile Information</h2>
                                <div className="form-grid">
                                    <div className="form-group">
                                        <label htmlFor="fullname">Full Name</label>
                                        <input
                                            type="text"
                                            id="fullname"
                                            name="fullname"
                                            value={profileData.fullname}
                                            onChange={handleProfileChange}
                                            placeholder="Enter your full name"
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label htmlFor="email">Email</label>
                                        <input
                                            type="email"
                                            id="email"
                                            name="email"
                                            value={profileData.email}
                                            onChange={handleProfileChange}
                                            placeholder="Enter your email"
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label htmlFor="company">Company</label>
                                        <input
                                            type="text"
                                            id="company"
                                            name="company"
                                            value={profileData.company}
                                            onChange={handleProfileChange}
                                            placeholder="Enter your company"
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label htmlFor="role">Role</label>
                                        <input
                                            type="text"
                                            id="role"
                                            name="role"
                                            value={profileData.role}
                                            onChange={handleProfileChange}
                                            placeholder="Enter your role"
                                        />
                                    </div>
                                </div>
                                <button 
                                    className="save-button" 
                                    onClick={handleSaveProfile}
                                    disabled={isSaving}
                                >
                                    {isSaving ? (
                                        <span className="loading-spinner"></span>
                                    ) : (
                                        "Save Changes"
                                    )}
                                </button>
                            </div>

                            <div className="resume-section">
                                <h2 className="section-title">Resume</h2>
                                {resumeName ? (
                                    <>
                                        <p>Current Resume: {resumeName}</p>
                                        <div className="resume-actions">
                                            <a href={resumeUrl} target="_blank" rel="noopener noreferrer" className="view-button">
                                                View Resume
                                            </a>
                                            <label className="replace-button">
                                                Replace Resume
                                                <input
                                                    type="file"
                                                    onChange={handleResumeUpload}
                                                    accept=".pdf,.doc,.docx"
                                                    disabled={isUploading}
                                                />
                                            </label>
                                        </div>
                                        {(isAnalyzing || analysisResult || analysisError) && (
                                            <div className="analysis-container">
                                                {isAnalyzing && (
                                                    <div className="loading-state">
                                                        <div className="loading-spinner"></div>
                                                        <p>Analyzing your resume...</p>
                                                    </div>
                                                )}
                                                
                                                {analysisError && (
                                                    <div className="error-message">
                                                        {analysisError}
                                                    </div>
                                                )}
                                                
                                                {analysisResult && (
                                                    <div className="analysis-result">
                                                        <h3>Resume Analysis</h3>
                                                        <div className="analysis-content">
                                                            {analysisResult}
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </>
                                ) : (
                                    <>
                                        <p>Upload your resume to get started</p>
                                        <div className="resume-actions">
                                            <label className="upload-button">
                                                Upload Resume
                                                <input
                                                    type="file"
                                                    onChange={handleResumeUpload}
                                                    accept=".pdf,.doc,.docx"
                                                    disabled={isUploading}
                                                />
                                            </label>
                                        </div>
                                    </>
                                )}
                            </div>
                        </>
                    ) : (
                        <div className="profile-section">
                            <h2 className="section-title">Resume Analytics</h2>
                            {!resumeName ? (
                                <div className="analytics-message">
                                    <p>Please upload a resume in the Profile section to analyze your qualifications.</p>
                                </div>
                            ) : (
                                <div className="analytics-content">
                                    <p>Current Resume: {resumeName}</p>
                                    {(isAnalyzing || analysisResult || analysisError) && (
                                        <div className="analysis-container">
                                            {isAnalyzing && (
                                                <div className="loading-state">
                                                    <div className="loading-spinner"></div>
                                                    <p>Analyzing your resume...</p>
                                                </div>
                                            )}
                                            
                                            {analysisError && (
                                                <div className="error-message">
                                                    {analysisError}
                                                </div>
                                            )}
                                            
                                            {analysisResult && (
                                                <div className="analysis-result">
                                                    <h3>Analysis Results</h3>
                                                    <div className="analysis-content">
                                                        {analysisResult}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </>
    );
}

export default ProfileSetup;