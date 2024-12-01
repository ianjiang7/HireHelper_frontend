import React, { useState, useEffect, useCallback } from 'react';
import { S3Client, PutObjectCommand, DeleteObjectCommand, GetObjectCommand, ListObjectsV2Command } from "@aws-sdk/client-s3";
import { fetchAuthSession } from "aws-amplify/auth";
import ReactMarkdown from 'react-markdown';
import awsmobile from "../../aws-exports";
import { analyzeResume } from "../../graphql/mutations";
import "../cssfiles/ResumeAnalysis.css";

function ResumeAnalysis({ userSub, resumeName, resumeUrl }) {
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

        return (
            <div className="analysis-container">
                {analysisResult && showAnalysis && (
                    <div className="analysis-dropdown">
                        <div className="analysis-content">
                            <ReactMarkdown>{analysisResult.analysis}</ReactMarkdown>
                        </div>
                    </div>
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
                    View Analysis
                </button>
                <button 
                    onClick={() => setShowDeleteConfirm(true)}
                    className="delete-version-btn"
                    disabled={analysisVersions.length <= 1 || selectedVersion === null}
                >
                    Delete Version
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

    // Function to analyze resume
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
        } catch (error) {
            console.error('Error analyzing resume:', error);
            alert('Failed to analyze resume. Please try again.');
        } finally {
            setIsAnalyzing(false);
        }
    };

    const confirmAnalyzeResume = () => {
        setShowAnalyzeConfirm(true);
    };

    const handleConfirmedAnalysis = async () => {
        setShowAnalyzeConfirm(false);
        await handleAnalyzeResume();
    };

    return (
        <div className="resume-analysis">
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
                            <div className="loading-spinner" />
                            Analyzing...
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

            {renderAnalysisContent()}
        </div>
    );
}

export default ResumeAnalysis;
