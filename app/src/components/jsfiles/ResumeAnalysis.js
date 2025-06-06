import React, { useState, useEffect, useCallback } from 'react';
import { S3Client, PutObjectCommand, DeleteObjectCommand, GetObjectCommand, ListObjectsV2Command } from "@aws-sdk/client-s3";
import { fetchAuthSession } from "aws-amplify/auth";
import ReactMarkdown from 'react-markdown';
import awsmobile from "../../aws-exports";
import { analyzeResume } from "../../graphql/mutations";
import "../cssfiles/ResumeAnalysis.css";
import { useNavigate, Link } from 'react-router-dom';
import RecommendedAlumni from './RecommendedAlumni';
import JobRecommendations from './JobRecommendations';

function LoadingBar({ message }) {
    return (
        <div className="loading-bar-container">
            <div className="loading-bar">
                <div className="loading-progress"></div>
            </div>
            <p className="loading-message">{message}</p>
        </div>
    );
}

function ResumeAnalysis({ userSub, resumeName, resumeUrl, setActiveTab1, setActiveIndex1 }) {
    const [analysisResult, setAnalysisResult] = useState(null);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [analysisVersions, setAnalysisVersions] = useState([]);
    const [currentVersionIndex, setCurrentVersionIndex] = useState(0);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [showAnalysis, setShowAnalysis] = useState(false);
    const [versionsLoaded, setVersionsLoaded] = useState(false);
    const [selectedVersion, setSelectedVersion] = useState(null);
    const [showAnalyzeConfirm, setShowAnalyzeConfirm] = useState(false);
    const [activeTab, setActiveTab] = useState('analysis');
    const [loadingMessage, setLoadingMessage] = useState('');
    const navigate = useNavigate();

    // UI Components
    const NoResumeMessage = () => (
        <div className="no-resume-container">
            <h3 className="message-header">No Resume Found</h3>
            <p className="message-text">Please add a resume to your profile to begin analysis</p>
            <button 
                className="profile-link-button"
                onClick={() => [setActiveTab1('profile'), setActiveIndex1(5)]}
            >
                Go to Profile
            </button>
        </div>
    );

    const NoAnalysisSelected = () => (
        <div className="no-analysis-container">
            <h3 className="message-header">No Analysis Version Selected</h3>
            <p className="message-text">Please select and open an analysis version to view results</p>
        </div>
    );

    const NoRecommendations = () => (
        <div className="no-recommendations-container">
            <h3 className="message-header">Please Open an Analysis to View Recommendations</h3>
            <p className="message-text">Select and open an analysis version to see alumni recommendations</p>
        </div>
    );

    // Function to list all analysis versions
    const listAnalysisVersions = useCallback(async () => {
        if (!resumeName || !userSub) {
            return [];
        }
        
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
            setVersionsLoaded(true);
            return versions;
        } catch (error) {
            console.error('Error listing analysis versions:', error);
            setVersionsLoaded(true);
            return [];
        }
    }, [userSub, resumeName]);

    // Load versions when component mounts
    useEffect(() => {
        if (resumeName && userSub) {
            listAnalysisVersions();
        }
    }, [resumeName, userSub, listAnalysisVersions]);

    const FILTERED_WORDS = [
    ];

    const cleanText = (text) => {
        return text
            .replace(/[^a-zA-Z0-9\s]/g, '') // Remove all special characters
            .replace(/[\r\n]+/g, ' ') // Replace newlines with single space
            .replace(/\s+/g, ' ') // Replace multiple spaces with single space
            .trim(); // Remove leading/trailing spaces
    };

    // Function to parse job fit recommendations from analysis
    const parseJobFitRecommendations = (analysisText) => {
        try {
            // Find section 4 content
            const section4Match = analysisText.match(/4\. Job Fit Recommendations([\s\S]*?)(?=\d+\.|$)/);
            if (!section4Match) return null;

            const section4Content = section4Match[1];

            // Extract recommendations
            const recommendations = {
                role: '',
                jobTitles: [],
                fullJobTitles: [],
                companies: []
            };

            // Extract role
            const roleMatch = section4Content.match(/Role\s*([\s\S]*?)(?=Job Title|$)/i);
            if (roleMatch) {
                recommendations.role = cleanText(roleMatch[1]);
                // Convert 'Intern' to 'Employee' for search purposes
                if (recommendations.role.toLowerCase().includes('intern')) {
                    recommendations.role = 'Employee';
                }
            }

            // Extract job titles
            const jobTitleMatch = section4Content.match(/Job Title\s*([\s\S]*?)(?=Companies|$)/i);
            if (jobTitleMatch) {
                const titles = jobTitleMatch[1]
                    .split('\n')
                    .map(line => cleanText(line))
                    .filter(line => line.length > 0 && !FILTERED_WORDS.includes(line.toLowerCase()));

                // Store full titles after removing 'intern'/'internship'
                recommendations.fullJobTitles = titles.map(title => 
                    title.replace(/\s*(intern|internship)\s*/gi, '').trim()
                ).filter(title => title.length > 5);

                // Get meaningful words from titles (existing functionality)
                const titleWords = new Set();
                titles.forEach(title => {
                    const words = title.toLowerCase().split(/\s+/);
                    words.forEach(word => {
                        if (!FILTERED_WORDS.includes(word) && word.length > 0) {
                            titleWords.add(cleanText(word));
                        }
                    });
                });
                recommendations.jobTitles = Array.from(titleWords);
            }

            // Extract and clean companies
            const companiesMatch = section4Content.match(/Companies\s*([\s\S]*?)(?=\d+\.|$)/i);
            if (companiesMatch) {
                recommendations.companies = companiesMatch[1]
                    .split('\n')
                    .map(line => cleanText(line))
                    .filter(line => line.length > 0);
            }

            return recommendations;
        } catch (error) {
            console.error('Error parsing job fit recommendations:', error);
            return null;
        }
    };

    const loadAnalysisVersion = async (versionIndex) => {
        setIsLoading(true);
        try {
            const version = analysisVersions[versionIndex];
            if (!version) {
                return;
            }

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
            const parsedAnalysis = JSON.parse(analysisText);
            
            setAnalysisResult(parsedAnalysis);
            setCurrentVersionIndex(versionIndex);
            setShowAnalysis(true);
        } catch (error) {
            console.error('Error loading analysis version:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const generateSearchCombinations = (recommendations) => {
        if (!recommendations) return [];
        
        const combinations = [];
        const { role, jobTitles, companies } = recommendations;

        // Only generate combinations if we have both titles and companies
        if (jobTitles.length > 0 && companies.length > 0) {
            // Generate combinations for each job title word and company
            jobTitles.forEach(titleWord => {
                companies.forEach(company => {
                    combinations.push({
                        title: cleanText(titleWord),
                        role: cleanText(role || 'Employee'),
                        company: cleanText(company)
                    });
                });
            });
        }

        return combinations;
    };

     // Function to analyze resume
    const handleAnalyzeResume = async () => {
        if (!resumeUrl || !userSub || !resumeName) {
            alert("Please upload a resume first.");
            return;
        }

        setIsAnalyzing(true);
        try {
            setLoadingMessage('Sending to AI Algorithm... this will take a minute');
            // Initial delay for sending
            await new Promise(resolve => setTimeout(resolve, 1500));
            const { tokens } = await fetchAuthSession();
            const idToken = tokens.idToken.toString();
            
            const response = await fetch(awsmobile.aws_appsync_graphqlEndpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': idToken
                },
                body: JSON.stringify({
                    query: analyzeResume,
                    variables: {
                        input: {
                            userId: userSub,
                            s3Path: `private/${userSub}/${resumeName}`
                        }
                    }
                })
            });

            const data = await response.json();

            if (data.errors) {
                throw new Error(data.errors[0].message);
            }

            if (!data.data || !data.data.analyzeResume) {
                throw new Error('No analysis data received');
            }

            const result = data.data.analyzeResume;

            if (!result.analysis) {
                throw new Error('Analysis is empty');
            }

            const formattedResult = {
                analysis: result.analysis,
                success: result.success,
                error: result.error
            };

            setAnalysisResult(formattedResult);
            setShowAnalysis(true);

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
                Body: JSON.stringify(formattedResult),
                ContentType: 'application/json'
            });

            await s3Client.send(command);
            await listAnalysisVersions();
            setSelectedVersion(0);
            setCurrentVersionIndex(0);
        } catch (error) {
            console.error('Error analyzing resume:', error);
            alert('Failed to analyze resume. Please try again.');
        } finally {
            setIsAnalyzing(false);
            setLoadingMessage('');
        }
    };

    const confirmAnalyzeResume = () => {
        setShowAnalyzeConfirm(true);
    };

    const handleConfirmedAnalysis = async () => {
        setShowAnalyzeConfirm(false);
        await handleAnalyzeResume();
    };

    const renderAnalysisContent = () => {
        if (!versionsLoaded) {
            return (
                <div className="analysis-container">
                    <div className="loading-spinner" />
                    <p>Loading versions...</p>
                </div>
            );
        }

        if (versionsLoaded && analysisVersions.length === 0) {
            return (
                <div className="analysis-container">
                    <p>No analysis available yet. Click "New Analysis" to generate one.</p>
                </div>
            );
        }

        if (isLoading) {
            return (
                <div className="analysis-container">
                    <div className="loading-spinner" />
                    <p>Loading analysis...</p>
                </div>
            );
        }

        if (!showAnalysis) {
            return (
                <div className="analysis-container">
                    <NoAnalysisSelected />
                </div>
            );
        }

        return (
            <div className="analysis-container">
                {analysisResult && showAnalysis && (
                    <>
                        <div className="analysis-dropdown">
                            <div className="analysis-content">
                                <ReactMarkdown>{analysisResult.analysis}</ReactMarkdown>
                            </div>
                        </div>
                    </>
                )}
            </div>
        );
    };

    const renderVersionControls = () => {
        if (!versionsLoaded || analysisVersions.length === 0) return null;

        return (
            <div className="version-controls">
                <select 
                    value={selectedVersion === null ? "" : selectedVersion}
                    onChange={(e) => setSelectedVersion(parseInt(e.target.value))}
                    className="version-selector"
                >
                    <option value="">Select a version...</option>
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
                    onClick={() => loadAnalysisVersion(selectedVersion)}
                    className="view-button"
                    disabled={selectedVersion === null}
                >
                    View
                </button>
                <button 
                    onClick={() => setShowDeleteConfirm(true)}
                    className="delete-version-btn"
                    disabled={analysisVersions.length <= 1 || selectedVersion === null}
                >
                    Delete
                </button>
            </div>
        );
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

    // Function to delete a version
    const deleteAnalysisVersion = async () => {
        try {
            if (analysisVersions.length <= 1) {
                alert("Cannot delete the last remaining version.");
                return;
            }

            const versionToDelete = analysisVersions[selectedVersion];
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
                setSelectedVersion(0);
                loadAnalysisVersion(0);
            } else {
                setAnalysisResult(null);
            }
            
            setShowDeleteConfirm(false);
        } catch (error) {
            console.error('Error deleting analysis version:', error);
            alert('Failed to delete version. Please try again.');
        }
    };

    return (
        <div className="analysis-section">
            <div className="analysis-page-header">
                <h1>Analyze Your Resume and Receive Personalized Recommendations</h1>
                <p>Get AI-powered insights and connect with relevant NYU alumni</p>
            </div>
            
            {!resumeName && (
                <NoResumeMessage />
            )}
            
            {isAnalyzing && <LoadingBar message={loadingMessage} />}
            
            {showAnalyzeConfirm && (
                <div className="confirm-dialog">
                    <div className="confirm-content">
                        <h3>Create New Analysis</h3>
                        <p>Are you sure you want to create a new analysis version for resume "{resumeName}"?</p>
                        <div className="confirm-buttons">
                            <button onClick={handleConfirmedAnalysis} className="confirm-yes">Yes, Create New Analysis</button>
                            <button onClick={() => setShowAnalyzeConfirm(false)} className="confirm-no">Cancel</button>
                        </div>
                    </div>
                </div>
            )}

            <div className="analysis-header">
                <button
                    onClick={confirmAnalyzeResume}
                    className="new-analysis-btn"
                    disabled={isAnalyzing || !resumeName}
                >
                    {isAnalyzing ? (
                        <>

                        </>
                    ) : (
                        "New Analysis"
                    )}
                </button>
                {renderVersionControls()}
            </div>

            {showDeleteConfirm && (
                <div className="confirm-dialog">
                    <div className="confirm-content">
                        <h3>Delete Analysis Version</h3>
                        <p>Are you sure you want to delete this analysis version? This action cannot be undone.</p>
                        <div className="confirm-buttons">
                            <button onClick={deleteAnalysisVersion} className="confirm-yes">Yes, Delete</button>
                            <button onClick={() => setShowDeleteConfirm(false)} className="confirm-no">Cancel</button>
                        </div>
                    </div>
                </div>
            )}

            <div className="tabs">
                <button 
                    className={`tab ${activeTab === 'analysis' ? 'active' : ''}`}
                    onClick={() => setActiveTab('analysis')}
                >
                    Analysis
                </button>
                <button 
                    className={`tab ${activeTab === 'recommendations' ? 'active' : ''}`}
                    onClick={() => setActiveTab('recommendations')}
                >
                    Connection Recommendations
                </button>
                <button 
                    className={`tab ${activeTab === 'jobs' ? 'active' : ''}`}
                    onClick={() => setActiveTab('jobs')}
                >
                    Job Recommendations
                </button>
            </div>

            {activeTab === 'analysis' ? (
                renderAnalysisContent()
            ) : activeTab === 'recommendations' ? (
                <div className="recommendations-content">
                    {!resumeName ? (
                        <NoResumeMessage />
                    ) : !showAnalysis ? (
                        <NoRecommendations />
                    ) : (
                        analysisResult && analysisResult.analysis && (
                            <>
                                <RecommendedAlumni 
                                    searchCombinations={generateSearchCombinations(parseJobFitRecommendations(analysisResult.analysis))}
                                />
                            </>
                        )
                    )}
                </div>
            ) : (
                <div className="recommendations-content">
                    {!resumeName ? (
                        <NoResumeMessage />
                    ) : !showAnalysis ? (
                        <NoRecommendations />
                    ) : (
                        analysisResult && analysisResult.analysis && (
                            <JobRecommendations 
                                recommendations={parseJobFitRecommendations(analysisResult.analysis)}
                            />
                        )
                    )}
                </div>
            )}
        </div>
    );
}

export default ResumeAnalysis;
