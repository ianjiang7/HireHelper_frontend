import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from "react-router-dom";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faChartLine, faSearch, faUserGroup, faUser, faHome, faChevronLeft, faBars } from '@fortawesome/free-solid-svg-icons';
import SwipeableViews from './SwipeableViews';
import ResumeAnalysis from "./ResumeAnalysis";
import SearchOverview from './SearchOverview';
import SearchResults from './SearchResults';
import Header from './Header';
import Home from './Home';
import { Auth, API, Storage } from 'aws-amplify';
import { signOut, getCurrentUser, fetchAuthSession } from "aws-amplify/auth";
import { S3Client, PutObjectCommand, DeleteObjectCommand, GetObjectCommand, ListObjectsV2Command } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import awsmobile from "../../aws-exports";
import ReactMarkdown from 'react-markdown';
import "../cssfiles/ProfileSetup.css";

function ProfileSetup() {
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('welcome');
    const [activeIndex, setActiveIndex] = useState(0);
    const [swipeIndex, setSwipeIndex] = useState(0);
    const [userSub, setUserSub] = useState("");
    const [isSignedIn, setIsSignedIn] = useState(true);
    const [authSession, setAuthSession] = useState();
    const [isSaving, setIsSaving] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [analysisResult, setAnalysisResult] = useState(null);
    const [analysisError, setAnalysisError] = useState(null);
    const [hasExistingAnalysis, setHasExistingAnalysis] = useState(false);
    const [isAnalysisOpen, setIsAnalysisOpen] = useState(false);
    const [analysisVersions, setAnalysisVersions] = useState([]);
    const [currentVersionIndex, setCurrentVersionIndex] = useState(0);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [isAlumni, setIsAlumni] = useState(false);
    const [resumeName, setResumeName] = useState("");
    const [resumeUrl, setResumeUrl] = useState("");
    const [isSidebarOpen, setSidebarOpen] = useState(false);

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

                // Store user data in localStorage
                localStorage.setItem('fullname', userData.fullname || "");
                localStorage.setItem('userRole', userData.role || "");
                localStorage.setItem('FullName', userData.fullname || "");
                localStorage.setItem('role', userData.role || "");

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
                navigate("/alumni-login", { replace: true });
            }
        };
        checkUserName();
    }, [navigate]);

    useEffect(() => {
        if (userSub && authSession) {
            loadExistingResume();
        }
    }, [userSub, authSession, loadExistingResume]);

    useEffect(() => {
        const checkUserRole = async () => {
            try {
                const { tokens } = await fetchAuthSession();
                const userGroups = tokens?.accessToken?.payload['cognito:groups'] || [];
                setIsAlumni(userGroups.includes('Alumni'));
            } catch (error) {
                console.error('Error checking user role:', error);
            }
        };
        checkUserRole();
    }, []);

    useEffect(() => {
        if (!isSignedIn && activeTab !== 'welcome') {
            setActiveTab('welcome');
            setActiveIndex(0);
            setSwipeIndex(0);
        }
    }, [isSignedIn, activeTab]);

    const handleTabClick = (tab, index) => {
        if (!isSignedIn && tab !== 'welcome') {
            // Show message or redirect to login
            navigate('/alumni-login');
            return;
        }
        setActiveTab(tab);
        setActiveIndex(index);
        setSwipeIndex(index);
    };

    const handleChangeIndex = (index) => {
        if (!isSignedIn && index !== 0) {
            // If not authenticated, only allow access to welcome tab
            setSwipeIndex(0);
            navigate('/alumni-login');
            return;
        }
        setSwipeIndex(index);
        setActiveIndex(index);
        switch (index) {
            case 0:
                setActiveTab('welcome');
                break;
            case 1:
                setActiveTab('search');
                break;
            case 2:
                setActiveTab('analytics');
                break;
            case 3:
                setActiveTab('people');
                break;
            default:
                setActiveTab('welcome');
        }
    };

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

            // Set resumeName to the file name, not the S3 path
            setResumeName(file.name);
            localStorage.setItem(`resumeName_${userSub}`, file.name);

            // Update user profile in DynamoDB with the resumeName
            const { idToken } = (await fetchAuthSession()).tokens ?? {};
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
            if (data.errors) {
                throw new Error(data.errors[0].message);
            }

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
        } catch (error) {
            console.error('Error uploading file:', error);
        }
    };

    // Function to list all analysis versions
    const listAnalysisVersions = async () => {
        if (!userSub || !resumeName) return;
        
        try {
            const { credentials } = await fetchAuthSession();
            const s3Client = new S3Client({
                region: "us-east-1",
                credentials: {
                    accessKeyId: credentials.accessKeyId,
                    secretAccessKey: credentials.secretAccessKey,
                    sessionToken: credentials.sessionToken
                }
            });

            const prefix = `private/${userSub}/analysis/${resumeName.replace(/\.[^/.]+$/, '')}_analysis_version_`;
            const command = new ListObjectsV2Command({
                Bucket: "alumnireachresumestorage74831-dev",
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

            const { credentials } = await fetchAuthSession();
            const s3Client = new S3Client({
                region: "us-east-1",
                credentials: {
                    accessKeyId: credentials.accessKeyId,
                    secretAccessKey: credentials.secretAccessKey,
                    sessionToken: credentials.sessionToken
                }
            });

            const command = new GetObjectCommand({
                Bucket: "alumnireachresumestorage74831-dev",
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
            const { credentials } = await fetchAuthSession();
            const s3Client = new S3Client({
                region: "us-east-1",
                credentials: {
                    accessKeyId: credentials.accessKeyId,
                    secretAccessKey: credentials.secretAccessKey,
                    sessionToken: credentials.sessionToken
                }
            });

            const command = new DeleteObjectCommand({
                Bucket: "alumnireachresumestorage74831-dev",
                Key: versionToDelete.Key
            });

            await s3Client.send(command);
            await listAnalysisVersions();
            
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

    // Modified handleAnalyzeResume to use GraphQL mutation
    const handleAnalyzeResume = async () => {
        if (!resumeUrl || !userSub || !resumeName) {
            alert("Please upload a resume first.");
            return;
        }

        setIsAnalyzing(true);
        try {
            const { tokens } = await fetchAuthSession();
            const idToken = tokens.idToken.toString();

            const response = await fetch(awsmobile.aws_appsync_graphqlEndpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': idToken
                },
                body: JSON.stringify({
                    query: `
                        mutation AnalyzeResume($input: AnalyzeResumeInput!) {
                            analyzeResume(input: $input) {
                                analysis
                            }
                        }
                    `,
                    variables: {
                        input: {
                            userId: userSub,
                            s3Path: getResumeS3Path(resumeName)  // Use the same path function
                        }
                    }
                })
            });

            if (!response.ok) {
                throw new Error('Analysis request failed');
            }

            const data = await response.json();
            if (data.errors) {
                throw new Error(data.errors[0].message);
            }

            const result = data.data.analyzeResume;
            setAnalysisResult(result);

            // Save new version to S3
            const versionNumber = getNextVersionNumber();
            const { credentials } = await fetchAuthSession();
            const s3Client = new S3Client({
                region: "us-east-1",
                credentials: {
                    accessKeyId: credentials.accessKeyId,
                    secretAccessKey: credentials.secretAccessKey,
                    sessionToken: credentials.sessionToken
                }
            });

            const key = `private/${userSub}/analysis/${resumeName.replace(/\.[^/.]+$/, '')}_analysis_version_${versionNumber}.json`;
            const command = new PutObjectCommand({
                Bucket: "alumnireachresumestorage74831-dev",
                Key: key,
                Body: JSON.stringify(result),
                ContentType: 'application/json'
            });

            await s3Client.send(command);
            await listAnalysisVersions();
            setCurrentVersionIndex(0);
            setIsAnalysisOpen(true);
        } catch (error) {
            console.error('Error analyzing resume:', error);
            alert('Failed to analyze resume. Please try again.');
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

    const handleSwipeChange = (index) => {
        setActiveIndex(index);
        switch(index) {
            case 0:
                setActiveTab('welcome');
                break;
            case 1:
                setActiveTab('search');
                break;
            case 2:
                setActiveTab('analytics');
                break;
            case 3:
                setActiveTab('people');
                break;
            default:
                break;
        }
    };

    return (
        <>
            <Header navigate={navigate} isSignedIn={isSignedIn} />
            <div className="profile-setup-container">
                <div 
                    className={`left-sidebar ${isSidebarOpen ? 'open' : 'closed'}`}
                    onClick={() => !isSidebarOpen && setSidebarOpen(true)}
                >
                    {isSidebarOpen && (
                        <button 
                            className={`sidebar-toggle ${isSidebarOpen ? 'open' : ''}`}
                            onClick={(e) => {
                                e.stopPropagation();
                                setSidebarOpen(false);
                            }}
                        >
                            <FontAwesomeIcon icon={faChevronLeft} />
                        </button>
                    )}
                    <div className="navigation-section">
                        <div 
                            className={`sidebar-item ${activeTab === 'welcome' ? 'active' : ''}`}
                            onClick={() => {
                                setActiveTab('welcome');
                                setActiveIndex(0);
                            }}
                        >
                            <FontAwesomeIcon icon={faHome} />
                            <span>Welcome</span>
                        </div>
                        <div 
                            className={`sidebar-item ${activeTab === 'search' ? 'active' : ''}`}
                            onClick={() => {
                                setActiveTab('search');
                                setActiveIndex(1);
                            }}
                        >
                            <FontAwesomeIcon icon={faSearch} />
                            <span>Discover</span>
                        </div>
                        <div 
                            className={`sidebar-item ${activeTab === 'analytics' ? 'active' : ''}`}
                            onClick={() => {
                                setActiveTab('analytics');
                                setActiveIndex(2);
                            }}
                        >
                            <FontAwesomeIcon icon={faChartLine} />
                            <span>Analytics</span>
                        </div>
                        <div 
                            className={`sidebar-item ${activeTab === 'people' ? 'active' : ''}`}
                            onClick={() => {
                                setActiveTab('people');
                                setActiveIndex(3);
                            }}
                        >
                            <FontAwesomeIcon icon={faUserGroup} />
                            <span>People</span>
                        </div>
                    </div>
                    
                    <div className="profile-nav-section">
                        <div 
                            className={`sidebar-item ${activeTab === 'profile' ? 'active' : ''}`}
                            onClick={() => setActiveTab('profile')}
                        >
                            <FontAwesomeIcon icon={faUser} />
                            <span>Profile</span>
                        </div>
                    </div>
                </div>

                <div className="main-content">
                    {activeTab !== 'profile' ? (
                        <SwipeableViews 
                            activeIndex={activeIndex} 
                            showNavigation={activeTab !== 'welcome'}
                            onChangeIndex={handleSwipeChange}
                        >
                            <div className="tab-content">
                                <Home 
                                    isSignedIn={isSignedIn} 
                                    setActiveTab={setActiveTab}
                                    setActiveIndex={setActiveIndex}
                                />
                            </div>
                            <div className="tab-content">
                                <SearchOverview 
                                    isSignedIn={isSignedIn} 
                                    navigate={navigate}
                                    setActiveTab={setActiveTab}
                                    setActiveIndex={setActiveIndex}
                                />
                            </div>
                            <div className="tab-content">
                                <ResumeAnalysis 
                                    userSub={userSub}
                                    resumeName={resumeName}
                                    resumeUrl={resumeUrl}
                                    analysisResult={analysisResult}
                                    analysisVersions={analysisVersions}
                                    currentVersionIndex={currentVersionIndex}
                                    loadAnalysisVersion={loadAnalysisVersion}
                                    deleteAnalysisVersion={deleteAnalysisVersion}
                                    handleAnalyzeResume={handleAnalyzeResume}
                                    isAnalyzing={isAnalyzing}
                                    isAnalysisOpen={isAnalysisOpen}
                                    showDeleteConfirm={showDeleteConfirm}
                                    setShowDeleteConfirm={setShowDeleteConfirm}
                                />
                            </div>
                            <div className="tab-content">
                                <SearchResults embedded={true} />
                            </div>
                        </SwipeableViews>
                    ) : (
                        <div className="tab-content profile-tab-content">
                            {profileData ? (
                                <div className="profile-form">
                                    <h2>Your Profile</h2>
                                    <div className="profile-field">
                                        <label>Name:</label>
                                        <input
                                            type="text"
                                            value={profileData.fullname || ''}
                                            onChange={(e) => handleProfileChange('fullname', e.target.value)}
                                        />
                                    </div>
                                    <div className="profile-field">
                                        <label>Email:</label>
                                        <input
                                            type="email"
                                            value={profileData.email || ''}
                                            onChange={(e) => handleProfileChange('email', e.target.value)}
                                        />
                                    </div>
                                    <div className="profile-field">
                                        <label>Company:</label>
                                        <input
                                            type="text"
                                            value={profileData.company || ''}
                                            onChange={(e) => handleProfileChange('company', e.target.value)}
                                        />
                                    </div>
                                    <div className="profile-field">
                                        <label>Role:</label>
                                        <input
                                            type="text"
                                            value={profileData.role || ''}
                                            onChange={(e) => handleProfileChange('role', e.target.value)}
                                        />
                                    </div>

                                    <div className="resume-section">
                                        <h3>Resume</h3>
                                        {profileData.resumeName ? (
                                            <div className="resume-actions">
                                                <p>Current Resume: {profileData.resumeName}</p>
                                                <div className="resume-buttons">
                                                    <button 
                                                        onClick={() => window.open(resumeUrl, '_blank')}
                                                        className="view-button"
                                                    >
                                                        View Resume
                                                    </button>
                                                    <button 
                                                        onClick={handleDeleteResume} 
                                                        className="delete-button"
                                                    >
                                                        Delete Resume
                                                    </button>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="resume-upload">
                                                <input
                                                    type="file"
                                                    accept=".pdf,.doc,.docx"
                                                    onChange={handleFileUpload}
                                                    style={{ display: 'none' }}
                                                    id="resume-upload"
                                                />
                                                <label htmlFor="resume-upload" className="upload-button">
                                                    Upload Resume
                                                </label>
                                            </div>
                                        )}
                                    </div>

                                    <div className="profile-actions">
                                        <button onClick={handleSaveProfile} className="save-button">
                                            Save Profile
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <div className="profile-loading">Loading profile...</div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </>
    );
}

export default ProfileSetup;