import React, { useState } from 'react';
import Jobs from './Jobs';
import "../cssfiles/JobRecommendations.css";

function JobRecommendations({ recommendations }) {
    const [jobs, setJobs] = useState([]);
    const [loading, setLoading] = useState(false);
    const [recommendationType, setRecommendationType] = useState('titles');
    const [hasSearched, setHasSearched] = useState(false);
    const [progress, setProgress] = useState(0);
    const [totalCombinations, setTotalCombinations] = useState(0);
    const [completedCombinations, setCompletedCombinations] = useState(0);
    const [totalCount, setTotalCount] = useState(0);

    const getRecommendedTitles = () => {
        if (!recommendations || !recommendations.fullJobTitles) return [];
        return recommendations.fullJobTitles;
    };

    const getRecommendedCompanies = () => {
        if (!recommendations || !recommendations.companies) return [];
        return recommendations.companies;
    };

    const fetchJobs = async (type) => {
        setLoading(true);
        setHasSearched(true);
        setJobs([]);
        setTotalCount(0);
        setProgress(0);

        try {
            const searchTerms = type === 'titles' ? getRecommendedTitles() : getRecommendedCompanies();
            console.log(`Starting search for ${type}:`, searchTerms);
            setTotalCombinations(searchTerms.length);

            let allJobs = [];
            let seenJobIds = new Set();

            for (let i = 0; i < searchTerms.length; i++) {
                const term = searchTerms[i];
                const queryParam = type === 'titles' ? 'jobTitle' : 'companyName';
                const url = `https://sqw6c6n5eb.execute-api.us-east-1.amazonaws.com/prod/jobs?${queryParam}=${encodeURIComponent(term)}`;
                console.log(`Fetching jobs for ${type} "${term}" from:`, url);

                const response = await fetch(url);
                const data = await response.json();
                console.log(`Received ${data?.jobs?.length || 0} jobs for ${type} "${term}":`, data);
                
                if (data && data.jobs) {
                    if (type === 'titles') {
                        // Only deduplicate for title searches
                        const newJobs = data.jobs.filter(newJob => {
                            if (seenJobIds.has(newJob.jobId)) {
                                console.log(`Duplicate jobId found: ${newJob.jobId} for ${newJob.title}`);
                                return false;
                            }
                            seenJobIds.add(newJob.jobId);
                            return true;
                        });
                        allJobs = [...allJobs, ...newJobs];
                        console.log(`Added ${newJobs.length} new unique jobs from title "${term}"`);
                    } else {
                        // For company searches, add all jobs
                        allJobs = [...allJobs, ...data.jobs];
                        console.log(`Added ${data.jobs.length} jobs from company "${term}"`);
                    }
                    console.log('Current total jobs:', allJobs.length);
                }

                setProgress(((i + 1) / searchTerms.length) * 100);

                // Add delay between searches for titles to handle throughput
                if (type === 'titles' && i < searchTerms.length - 1) {
                    await new Promise(resolve => setTimeout(resolve, 4000)); // 4 second delay
                }
            }

            console.log('Final job list:', allJobs);
            setJobs(allJobs);
            setTotalCount(allJobs.length);
        } catch (error) {
            console.error('Error fetching jobs:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = () => {
        fetchJobs(recommendationType);
    };

    return (
        <div className="job-recommendations">
            <div className="recommendations-header">
                <h1>Jobs for You</h1>
                <p></p>
            </div>
            <div className="recommendation-controls">
                <select 
                    className="recommendation-type-select"
                    value={recommendationType}
                    onChange={(e) => {
                        setRecommendationType(e.target.value);
                        setHasSearched(false);
                        setJobs([]);
                        setProgress(0);
                    }}
                >
                    <option value="titles">Search by Title</option>
                    <option value="companies">Search by Company</option>
                </select>
                <button
                    className="search-button"
                    onClick={() => fetchJobs(recommendationType)}
                    disabled={loading || (recommendationType === 'titles' && getRecommendedTitles().length === 0) || 
                             (recommendationType === 'companies' && getRecommendedCompanies().length === 0)}
                >
                    {loading ? 'Searching...' : 'Search Jobs'}
                </button>
            </div>

            {loading && (
                <div className="progress-container">
                    <div className="progress-bar">
                        <div 
                            className="progress-fill" 
                            style={{ width: `${progress}%` }}
                        ></div>
                    </div>
                </div>
            )}

            {!hasSearched ? (
                <div className="no-search-message">
                    Click the search button to find recommended jobs based on your resume
                </div>
            ) : (
                <Jobs 
                    initialFilters={{}}
                    propJobs={jobs}
                    propLoading={loading}
                    propTotalCount={jobs.length}
                    hideHeader={true}
                    hideSearch={true}
                    hideFilters={true}
                />
            )}
        </div>
    );
}

export default JobRecommendations;
