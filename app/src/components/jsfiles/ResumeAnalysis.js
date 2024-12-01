import React, { useState, useEffect } from 'react';
import { S3Client, PutObjectCommand, DeleteObjectCommand, GetObjectCommand, ListObjectsV2Command } from "@aws-sdk/client-s3";
import { fetchAuthSession } from "aws-amplify/auth";
import ReactMarkdown from 'react-markdown';
import awsmobile from "../../aws-exports";
import "../cssfiles/ResumeAnalysis.css";

function ResumeAnalysis({ userSub, resumeName, resumeUrl }) {
    const [analysisResult, setAnalysisResult] = useState(null);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [isAnalysisOpen, setIsAnalysisOpen] = useState(false);
    const [analysisVersions, setAnalysisVersions] = useState([]);
    const [currentVersionIndex, setCurrentVersionIndex] = useState(0);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

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
            if (versions.length > 0) {
                if (currentVersionIndex >= versions.length) {
                    setCurrentVersionIndex(0);
                }
                await loadAnalysisVersion(0);
                setIsAnalysisOpen(true);
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
                            s3Path: `private/${userSub}/resumes/${resumeName}`
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

    // Load versions when component mounts or resume changes
    useEffect(() => {
        if (resumeName && userSub) {
            listAnalysisVersions();
        }
    }, [resumeName, userSub]);

    const formatAnalysis = (analysis) => {
        if (!analysis) return '';
        
        let formatted = analysis
            .replace(/\*\*\*(.*?)\*\*\*/g, '### $1')
            .replace(/\*\*(.*?)\*\*/g, '## $1')
            .replace(/\*(.*?)\*/g, '*$1*');
            
        return formatted;
    };

    if (!resumeName) {
        return (
            <div className="upload-prompt">
                <p>Please upload your resume first to view analytics.</p>
            </div>
        );
    }

    if (isAnalyzing) {
        return (
            <div className="analyzing-message">
                <p>Analyzing your resume...</p>
            </div>
        );
    }

    return (
        <div className="analysis-section">
            {!isAnalysisOpen || !analysisResult ? (
                <div className="analysis-actions">
                    <button 
                        onClick={handleAnalyzeResume}
                        className="analyze-btn"
                    >
                        Analyze Resume
                    </button>
                </div>
            ) : (
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
            )}
        </div>
    );
}

export default ResumeAnalysis;
