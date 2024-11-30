import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { signOut, getCurrentUser, fetchAuthSession } from "aws-amplify/auth";
import { S3Client, PutObjectCommand, DeleteObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";
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
        resumeName: "", 
        resumeS3Path: "", 
        resumeAnalysis: ""
    });

    // Helper function to construct S3 path
    const getResumeS3Path = (fileName) => {
        return `private/${userSub}/${fileName}`;
    };

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
                    resumeName: userData.resumeName || "", 
                    resumeS3Path: userData.resumeName ? getResumeS3Path(userData.resumeName) : ""
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
                        Key: fileName
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
        try {
            const file = event.target.files[0];
            if (!file) return;

            const s3Path = getResumeS3Path(file.name);
            
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
                Key: s3Path,
                Body: file,
                ContentType: file.type
            });

            await s3Client.send(command);
            console.log("File uploaded successfully");

            // Update state with both resumeName and full S3 path
            setProfileData(prev => ({
                ...prev,
                resumeName: file.name,
                resumeS3Path: s3Path
            }));

            setResumeName(s3Path);
            localStorage.setItem(`resumeName_${userSub}`, s3Path);

            // Generate URL for viewing
            try {
                const command = new GetObjectCommand({
                    Bucket: "alumnireachresumestorage74831-dev",
                    Key: s3Path
                });

                const url = await getSignedUrl(s3Client, command, { expiresIn: 3600 });
                setResumeUrl(url);
                localStorage.setItem(`resumeUrl_${userSub}`, url);
            } catch (error) {
                console.error('Error generating resume URL:', error);
            }

            // Analyze the resume after upload
            await handleAnalyzeResume();
        } catch (error) {
            console.error('Error uploading file:', error);
        }
    };

    const handleAnalyzeResume = async () => {
        try {
            // Validate userSub
            if (!userSub) {
                console.error('User ID not found');
                return;
            }

            // Validate resumeName exists
            if (!profileData.resumeName) {
                console.error('No resume file found to analyze');
                return;
            }

            // Construct S3 path
            const s3Path = getResumeS3Path(profileData.resumeName);
            console.log('Analyzing resume at path:', s3Path);
            
            const session = await fetchAuthSession();
            const { idToken } = session.tokens ?? {};

            if (!idToken) {
                console.error('No authentication token found');
                return;
            }

            // Create clean request payload
            const requestPayload = {
                query: `
                    mutation AnalyzeResume($input: AnalyzeResumeInput!) {
                        analyzeResume(input: $input) {
                            success
                            analysis
                            error
                        }
                    }
                `,
                variables: {
                    input: {
                        userId: userSub,
                        s3Path: s3Path
                    }
                }
            };

            console.log('Request payload:', {
                userId: userSub,
                s3Path: s3Path
            });

            const response = await fetch(awsmobile.aws_appsync_graphqlEndpoint, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: idToken.toString(),
                },
                body: JSON.stringify(requestPayload)
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            console.log("Analysis response:", data);

            if (data.data?.analyzeResume?.success) {
                const analysis = data.data.analyzeResume.analysis;
                setProfileData(prev => ({
                    ...prev,
                    resumeAnalysis: analysis
                }));
                setAnalysisResult(analysis);
                console.log('Resume analysis completed:', analysis);
            } else {
                const errorMessage = data.data?.analyzeResume?.error || 'Unknown error occurred';
                console.error('Resume analysis failed:', errorMessage);
                setAnalysisError(errorMessage);
            }
        } catch (error) {
            console.error('Error analyzing resume:', error);
            setAnalysisError(error.message || 'Failed to analyze resume');
        }
    };

    const handleDeleteResume = async () => {
        try {
            if (!profileData.resumeName) {
                console.error('No resume to delete');
                return;
            }

            const s3Path = getResumeS3Path(profileData.resumeName);
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
                Key: s3Path
            });

            await s3Client.send(command);

            setProfileData(prev => ({
                ...prev,
                resumeName: '',
                resumeS3Path: '',
                resumeAnalysis: ''
            }));

            setResumeName('');
            setResumeUrl('');
            setAnalysisResult('');
            
            localStorage.removeItem(`resumeName_${userSub}`);
            localStorage.removeItem(`resumeUrl_${userSub}`);

            console.log('Resume deleted successfully');
        } catch (error) {
            console.error('Error deleting resume:', error);
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
                                                    onChange={handleFileUpload}
                                                    accept=".pdf,.doc,.docx"
                                                    disabled={isUploading}
                                                />
                                            </label>
                                        </div>
                                    </>
                                ) : (
                                    <>
                                        <p>Upload your resume to get started</p>
                                        <div className="resume-actions">
                                            <label className="upload-button">
                                                Upload Resume
                                                <input
                                                    type="file"
                                                    onChange={handleFileUpload}
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
                        <div className="analytics-section">
                            <h2 className="section-title">Resume Analytics</h2>
                            {!resumeName ? (
                                <div className="analytics-message">
                                    <p>Upload a resume in the Profile tab to get started with analytics</p>
                                </div>
                            ) : (
                                <div className="analytics-content">
                                    <p>Current Resume: {resumeName}</p>
                                    <button 
                                        className="analyze-button"
                                        onClick={handleAnalyzeResume}
                                        disabled={isAnalyzing || !resumeName}
                                    >
                                        {isAnalyzing ? 'Analyzing...' : 'Analyze Resume'}
                                    </button>
                                    
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