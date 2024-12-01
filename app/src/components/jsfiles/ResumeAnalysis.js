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
    const [isLoading, setIsLoading] = useState(true);
    const [analysisVersions, setAnalysisVersions] = useState([]);
    const [currentVersionIndex, setCurrentVersionIndex] = useState(0);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [showAnalysis, setShowAnalysis] = useState(false);
    const [versionsLoaded, setVersionsLoaded] = useState(false);

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

    // Load versions and latest analysis when component mounts
    useEffect(() => {
        const loadInitialAnalysis = async () => {
            if (!resumeName || !userSub) {
                setIsLoading(false);
                return;
            }
            
            try {
                setIsLoading(true);
                const versions = await listAnalysisVersions();
                
                if (versions.length > 0) {
                    await loadAnalysisVersion(0);
                    setShowAnalysis(true);
                }
            } catch (error) {
                console.error('Error loading initial analysis:', error);
            } finally {
                setIsLoading(false);
            }
        };

        loadInitialAnalysis();
    }, [resumeName, userSub, listAnalysisVersions]);

    const loadAnalysisVersion = async (versionIndex) => {
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
        } catch (error) {
            console.error('Error loading analysis version:', error);
        }
    };

    const renderAnalysisContent = () => {
        if (isLoading) {
            return (
                <div className="analysis-container">
                    <div className="loading-spinner" />
                    <p>Loading analysis...</p>
                </div>
            );
        }

        if (versionsLoaded && analysisVersions.length === 0) {
            return (
                <div className="analysis-container">
                    <p>No analysis available yet. Click "Analyze Resume" to generate one.</p>
                </div>
            );
        }

        if (!analysisResult && !isAnalyzing) {
            return (
                <div className="analysis-container">
                    <div className="loading-spinner" />
                    <p>Loading analysis...</p>
                </div>
            );
        }

        return (
            <div className="analysis-container">
                <button 
                    className="analysis-button"
                    onClick={() => setShowAnalysis(!showAnalysis)}
                >
                    {showAnalysis ? 'Hide Analysis' : 'View Analysis'}
                </button>
                
                {showAnalysis && (
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
            setCurrentVersionIndex(0);
        } catch (error) {
            console.error('Error analyzing resume:', error);
            alert('Failed to analyze resume. Please try again.');
        } finally {
            setIsAnalyzing(false);
        }
    };

    return (
        <div>
            <button 
                onClick={handleAnalyzeResume}
                disabled={isAnalyzing}
                className="analyze-button"
            >
                {isAnalyzing ? (
                    <>
                        Analyzing Resume
                        <div className="loading-spinner" />
                    </>
                ) : (
                    'Analyze Resume'
                )}
            </button>
            {renderVersionControls()}
            {renderAnalysisContent()}
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
    );
}

export default ResumeAnalysis;
