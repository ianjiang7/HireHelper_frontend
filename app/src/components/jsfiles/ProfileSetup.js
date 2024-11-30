import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { signOut, getCurrentUser, fetchAuthSession } from "aws-amplify/auth";
import { S3Client, PutObjectCommand, DeleteObjectCommand, GetObjectCommand, ListObjectsV2Command } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import Header from "./Header";
import SearchResults from "./SearchResults";
import awsmobile from "../../aws-exports";
import ReactMarkdown from 'react-markdown';
import "../cssfiles/ProfileSetup.css";

function ProfileSetup() {
    const navigate = useNavigate();
    const [activeSection, setActiveSection] = useState("profile");
    const [userSub, setUserSub] = useState("");
    const [resumeName, setResumeName] = useState("");
    const [resumeUrl, setResumeUrl] = useState("");
    const [isUploading, setIsUploading] = useState(false);
    const [isSignedIn, setIsSignedIn] = useState(true);
    const [authSession, setAuthSession] = useState();
    const [isSaving, setIsSaving] = useState(false);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [analysisResult, setAnalysisResult] = useState(null);
    const [analysisError, setAnalysisError] = useState(null);
    const [hasExistingAnalysis, setHasExistingAnalysis] = useState(false);
    const [isAnalysisOpen, setIsAnalysisOpen] = useState(false);
    const [analysisVersions, setAnalysisVersions] = useState([]);
    const [currentVersionIndex, setCurrentVersionIndex] = useState(0);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [isAlumni, setIsAlumni] = useState(false);

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

    useEffect(() => {
        const checkUserRole = async () => {
            try {
                const currentUser = await getCurrentUser();
                const userGroups = currentUser.signInUserSession.accessToken.payload['cognito:groups'] || [];
                setIsAlumni(userGroups.includes('Alumni'));
            } catch (error) {
                console.error('Error checking user role:', error);
            }
        };
        checkUserRole();
    }, []);

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

    // Function to list all analysis versions
    const listAnalysisVersions = async () => {
        try {
            const s3Client = new S3Client({
                region: awsmobile.aws_project_region,
                credentials: (await fetchAuthSession()).credentials
            });

            const prefix = `private/${userSub}/analysis/${resumeName}_analysis_version_`;
            const command = new ListObjectsV2Command({
                Bucket: awsmobile.aws_user_files_s3_bucket,
                Prefix: prefix
            });

            const response = await s3Client.send(command);
            const versions = response.Contents || [];
            
            // Sort versions by last modified date, newest first
            versions.sort((a, b) => b.LastModified - a.LastModified);
            
            setAnalysisVersions(versions);
            if (versions.length > 0 && currentVersionIndex >= versions.length) {
                setCurrentVersionIndex(0);
            }
        } catch (error) {
            console.error('Error listing analysis versions:', error);
        }
    };

    // Function to get the next version number
    const getNextVersionNumber = () => {
        if (analysisVersions.length === 0) return 1;
        
        const versionNumbers = analysisVersions.map(version => {
            const match = version.Key.match(/_version_(\d+)\.json$/);
            return match ? parseInt(match[1]) : 0;
        });
        
        return Math.max(...versionNumbers) + 1;
    };

    // Function to load a specific version
    const loadAnalysisVersion = async (versionIndex) => {
        try {
            const version = analysisVersions[versionIndex];
            if (!version) return;

            const s3Client = new S3Client({
                region: awsmobile.aws_project_region,
                credentials: (await fetchAuthSession()).credentials
            });

            const command = new GetObjectCommand({
                Bucket: awsmobile.aws_user_files_s3_bucket,
                Key: version.Key
            });

            const response = await s3Client.send(command);
            const analysisText = await response.Body.transformToString();
            setAnalysisResult(JSON.parse(analysisText));
            setCurrentVersionIndex(versionIndex);
            setIsAnalysisOpen(true);
        } catch (error) {
            console.error('Error loading analysis version:', error);
        }
    };

    // Function to delete a version
    const deleteAnalysisVersion = async () => {
        try {
            if (analysisVersions.length <= 1) {
                alert("Cannot delete the last remaining version.");
                return;
            }

            const versionToDelete = analysisVersions[currentVersionIndex];
            const s3Client = new S3Client({
                region: awsmobile.aws_project_region,
                credentials: (await fetchAuthSession()).credentials
            });

            const command = new DeleteObjectCommand({
                Bucket: awsmobile.aws_user_files_s3_bucket,
                Key: versionToDelete.Key
            });

            await s3Client.send(command);
            await listAnalysisVersions();
            
            // Load the newest version after deletion
            if (analysisVersions.length > 0) {
                await loadAnalysisVersion(0);
            } else {
                setIsAnalysisOpen(false);
                setAnalysisResult(null);
            }
            
            setShowDeleteConfirm(false);
        } catch (error) {
            console.error('Error deleting analysis version:', error);
            alert('Failed to delete version. Please try again.');
        }
    };

    // Modified handleAnalyzeResume to support versioning
    const handleAnalyzeResume = async () => {
        if (!resumeUrl) {
            alert("Please upload a resume first.");
            return;
        }

        setIsAnalyzing(true);
        try {
            const response = await fetch(resumeUrl);
            const blob = await response.blob();
            const reader = new FileReader();

            reader.onload = async () => {
                const base64Data = reader.result.split(',')[1];

                try {
                    const response = await fetch('https://qdpuqjvdd6.execute-api.us-east-1.amazonaws.com/dev/analyze-resume', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({ pdf_base64: base64Data }),
                    });

                    if (!response.ok) {
                        throw new Error('Analysis failed');
                    }

                    const result = await response.json();
                    setAnalysisResult(result);

                    // Save new version to S3
                    const versionNumber = getNextVersionNumber();
                    const s3Client = new S3Client({
                        region: awsmobile.aws_project_region,
                        credentials: (await fetchAuthSession()).credentials
                    });

                    const key = `private/${userSub}/analysis/${resumeName}_analysis_version_${versionNumber}.json`;
                    const command = new PutObjectCommand({
                        Bucket: awsmobile.aws_user_files_s3_bucket,
                        Key: key,
                        Body: JSON.stringify(result),
                        ContentType: 'application/json'
                    });

                    await s3Client.send(command);
                    await listAnalysisVersions();
                    setCurrentVersionIndex(0); // Show newest version
                    setIsAnalysisOpen(true);
                } catch (error) {
                    console.error('Error:', error);
                    alert('Failed to analyze resume. Please try again.');
                }
            };

            reader.readAsDataURL(blob);
        } catch (error) {
            console.error('Error:', error);
            alert('Failed to process resume. Please try again.');
        } finally {
            setIsAnalyzing(false);
        }
    };

    // Load versions when resume is loaded
    useEffect(() => {
        if (resumeName) {
            listAnalysisVersions();
        }
    }, [resumeName]);

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

    const formatAnalysis = (analysis) => {
        if (!analysis) return '';
        
        // Replace ** with markdown headers
        let formatted = analysis
            .replace(/\*\*\*(.*?)\*\*\*/g, '### $1')  // Replace *** with ###
            .replace(/\*\*(.*?)\*\*/g, '## $1')       // Replace ** with ##
            .replace(/\*(.*?)\*/g, '*$1*');           // Keep single * for italics
            
        return formatted;
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
                        <li 
                            className={activeSection === "people" ? "active" : ""}
                            onClick={() => setActiveSection("people")}
                        >
                            <i className="fas fa-users"></i> People
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
                    ) : activeSection === "analytics" ? (
                        <div className="analytics-section">
                            <h2 className="section-title">Resume Analytics</h2>
                            {!resumeName ? (
                                <div className="upload-prompt">
                                    <p>Please upload your resume first to view analytics.</p>
                                </div>
                            ) : isAnalyzing ? (
                                <div className="analyzing-message">
                                    <p>Analyzing your resume...</p>
                                </div>
                            ) : isAnalysisOpen && analysisResult ? (
                                <div className="analysis-content">
                                    <div className="analysis-header">
                                        <div className="version-controls">
                                            <select 
                                                value={currentVersionIndex}
                                                onChange={(e) => loadAnalysisVersion(parseInt(e.target.value))}
                                                className="version-selector"
                                            >
                                                {analysisVersions.map((version, index) => {
                                                    const date = new Date(version.LastModified).toLocaleDateString();
                                                    return (
                                                        <option key={version.Key} value={index}>
                                                            Version {analysisVersions.length - index} ({date})
                                                        </option>
                                                    );
                                                })}
                                            </select>
                                            <button 
                                                onClick={() => setShowDeleteConfirm(true)}
                                                className="delete-version-btn"
                                                disabled={analysisVersions.length <= 1}
                                            >
                                                Delete Version
                                            </button>
                                            <button 
                                                onClick={handleAnalyzeResume}
                                                className="new-analysis-btn"
                                            >
                                                New Analysis
                                            </button>
                                        </div>
                                        {showDeleteConfirm && (
                                            <div className="delete-confirm">
                                                <p>Are you sure you want to delete this version?</p>
                                                <div className="delete-confirm-buttons">
                                                    <button onClick={deleteAnalysisVersion}>Yes, Delete</button>
                                                    <button onClick={() => setShowDeleteConfirm(false)}>Cancel</button>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                    <div className="analysis-results">
                                        <ReactMarkdown>{formatAnalysis(analysisResult.analysis)}</ReactMarkdown>
                                    </div>
                                </div>
                            ) : (
                                <div className="analysis-actions">
                                    <button 
                                        onClick={handleAnalyzeResume}
                                        className="analyze-btn"
                                        disabled={!resumeName}
                                    >
                                        Analyze Resume
                                    </button>
                                </div>
                            )}
                        </div>
                    ) : activeSection === "people" ? (
                        <div className="people-section">
                            <h2 className="section-title">Search People</h2>
                            <div className="people-content">
                                <SearchResults embedded={true} />
                            </div>
                        </div>
                    ) : null}
                </div>
            </div>
        </>
    );
}

export default ProfileSetup;