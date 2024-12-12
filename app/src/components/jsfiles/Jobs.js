import React, { useState, useEffect } from 'react';
import "../cssfiles/Jobs.css";
import { COMPANIES } from '../constants/companies';

const INDUSTRIES = [
    "Accounting",
    "Advertising, PR & Marketing",
    "Aerospace",
    "Agriculture",
    "Animal & Wildlife",
    "Architecture and Planning",
    "Automotive",
    "Biotech & Life Sciences",
    "Civil Engineering",
    "Commercial Banking & Credit",
    "Computer Networking",
    "Construction",
    "CPG - Consumer Packaged Goods",
    "Defense",
    "Design",
    "Electronic & Computer Hardware",
    "Energy",
    "Engineering & Construction",
    "Environmental Services",
    "Farming, Ranching and Fishing",
    "Fashion",
    "Financial Services",
    "Food & Beverage",
    "Forestry",
    "Government - Consulting",
    "Government - Intelligence",
    "Government - Local, State & Federal",
    "Healthcare",
    "Higher Education",
    "Hotels & Accommodation",
    "Human Resources",
    "Information Technology",
    "Insurance",
    "Interior Design",
    "International Affairs",
    "Internet & Software",
    "Investment / Portfolio Management",
    "Investment Banking",
    "Journalism, Media & Publishing",
    "K-12 Education",
    "Landscaping",
    "Legal & Law Enforcement",
    "Library Services",
    "Management Consulting",
    "Manufacturing",
    "Medical Devices",
    "Movies, TV, Music",
    "Natural Resources",
    "NGO",
    "Non-Profit - Other",
    "Oil & Gas",
    "Other Education",
    "Other Industries",
    "Performing and Fine Arts",
    "Pharmaceuticals",
    "Politics",
    "Real Estate",
    "Religious Work",
    "Research",
    "Restaurants & Food Service",
    "Retail Stores",
    "Sales & Marketing",
    "Scientific and Technical Consulting",
    "Social Assistance",
    "Sports & Leisure",
    "Staffing & Recruiting",
    "Summer Camps/Outdoor Recreation",
    "Telecommunications",
    "Tourism",
    "Transportation & Logistics",
    "Utilities and Renewable Energy",
    "Veterinary",
    "Wholesale Trade"
];

function Jobs({ recommendations, autoSearch, initialFilters, hideHeader, hideSearch, propJobs, propLoading, propTotalCount }) {
    const [jobs, setJobs] = useState(propJobs || []);
    const [loading, setLoading] = useState(propLoading || false);
    const [lastEvaluatedKey, setLastEvaluatedKey] = useState(null);
    const [hasMore, setHasMore] = useState(true);
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage] = useState(10);
    const [sortOrder, setSortOrder] = useState('newest');
    const [filters, setFilters] = useState({
        company: initialFilters?.company || '',
        industry: '',
        daysAgo: '',
        jobTitle: initialFilters?.jobTitle || ''
    });
    const [filteredCompanies, setFilteredCompanies] = useState([]);
    const [showCompanyDropdown, setShowCompanyDropdown] = useState(false);

    // Update jobs when propJobs changes
    useEffect(() => {
        if (propJobs) {
            setJobs(propJobs);
            setLoading(propLoading);
        }
    }, [propJobs, propLoading]);

    useEffect(() => {
        if (autoSearch && recommendations) {
            if (recommendations.titles && recommendations.titles.length > 0) {
                const newFilters = {
                    ...filters,
                    jobTitle: recommendations.titles[0],
                    company: ''
                };
                setFilters(newFilters);
                fetchJobs(newFilters, true);
            }
        }
    }, [recommendations, autoSearch]);

    useEffect(() => {
        if (initialFilters && !propJobs) {  
            const newFilters = {
                ...filters,
                company: initialFilters.company || '',
                jobTitle: initialFilters.jobTitle || ''
            };
            setFilters(newFilters);
            fetchJobs(newFilters, true);
        }
    }, [initialFilters?.company, initialFilters?.jobTitle]);

    const handleFilterChange = (e) => {
        const { name, value } = e.target;
        setFilters(prev => ({
            ...prev,
            [name]: value
        }));

        if (name === 'company') {
            const filtered = COMPANIES.filter(company => 
                company.toLowerCase().includes(value.toLowerCase())
            ).slice(0, 10); // Limit to 10 suggestions
            setFilteredCompanies(filtered);
            setShowCompanyDropdown(!!value);
        }
    };

    const handleCompanySelect = (company) => {
        setFilters(prev => ({
            ...prev,
            company
        }));
        setShowCompanyDropdown(false);
    };

    // Close dropdown when clicking outside
    const handleClickOutside = (e) => {
        if (!e.target.closest('.company-filter')) {
            setShowCompanyDropdown(false);
        }
    };

    React.useEffect(() => {
        document.addEventListener('click', handleClickOutside);
        return () => {
            document.removeEventListener('click', handleClickOutside);
        };
    }, []);

    const fetchJobs = async (filters, reset = false) => {
        try {
            setLoading(true);
            
            // Build query parameters
            const queryParams = new URLSearchParams();
            if (filters.company) queryParams.append('companyName', filters.company);
            if (filters.industry) queryParams.append('industry', filters.industry);
            if (filters.daysAgo) queryParams.append('daysAgo', parseInt(filters.daysAgo));
            if (filters.jobTitle) queryParams.append('jobTitle', filters.jobTitle);
            if (lastEvaluatedKey && !reset) {
                queryParams.append('lastEvaluatedKey', lastEvaluatedKey);
            }

            const url = `https://sqw6c6n5eb.execute-api.us-east-1.amazonaws.com/prod/jobs?${queryParams.toString()}`;
            console.log('Fetching jobs with URL:', url);
            console.log('Filters:', filters);

            const response = await fetch(url, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                },
                mode: 'cors'
            });
            
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ error: response.statusText }));
                console.error('Server error:', errorData);
                throw new Error(`Failed to fetch jobs: ${errorData.details || errorData.error || response.statusText}`);
            }

            const data = await response.json();
            console.log('Response data:', data);
            
            if (data.message) {
                console.log('Server message:', data.message);
            }
            
            setJobs(prevJobs => reset ? (data.jobs || []) : [...prevJobs, ...(data.jobs || [])]);
            setLastEvaluatedKey(data.lastEvaluatedKey);
            setHasMore(!!data.lastEvaluatedKey);
        } catch (error) {
            console.error('Error fetching jobs:', error);
            console.error('Error details:', error.message);
            setJobs([]);
            setHasMore(false);
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = () => {
        setLastEvaluatedKey(null);
        setJobs([]);
        setCurrentPage(1);
        fetchJobs(filters, true);
    };

    const loadMore = () => {
        if (!loading && hasMore) {
            fetchJobs(filters, false);
        }
    };

    // Get current jobs for pagination
    const indexOfLastJob = currentPage * itemsPerPage;
    const indexOfFirstJob = indexOfLastJob - itemsPerPage;
    
    // Sort jobs before pagination
    const sortedJobs = [...jobs].sort((a, b) => {
        if (sortOrder === 'newest') {
            return a.daysAgo - b.daysAgo;
        } else {
            return b.daysAgo - a.daysAgo;
        }
    });
    
    const currentJobs = sortedJobs.slice(indexOfFirstJob, indexOfLastJob);
    const totalPages = Math.ceil(jobs.length / itemsPerPage);

    // Change page
    const paginate = (pageNumber) => {
        setCurrentPage(pageNumber);
        window.scrollTo(0, 0);
    };

    return (
        <div className="jobs-page">
            {!hideHeader && (
                <div className="jobs-hero">
                    <div className="jobs-container">
                        <div className="jobs-header">
                            {autoSearch ? (
                                <>
                                    <h1>Job Recommendations</h1>
                                    <p>Based on your resume analysis</p>
                                </>
                            ) : (
                                <>
                                    <h1>Find and Apply to Internships</h1>
                                    <p>9,000+ internships in any industry or company</p>
                                </>
                            )}
                        </div>
                        <div className="jobs-filters">
                            <div className="filters-row">
                                <div className="title-filter">
                                    <input
                                        type="text"
                                        name="jobTitle"
                                        value={filters.jobTitle}
                                        onChange={handleFilterChange}
                                        placeholder="Search by job title..."
                                        className="title-input"
                                    />
                                </div>
                                <div className="company-filter">
                                    <input
                                        type="text"
                                        name="company"
                                        value={filters.company}
                                        onChange={handleFilterChange}
                                        placeholder="Filter by company..."
                                        className="company-input"
                                        onFocus={() => filters.company && setShowCompanyDropdown(true)}
                                    />
                                    {showCompanyDropdown && filteredCompanies.length > 0 && (
                                        <div className="company-dropdown">
                                            {filteredCompanies.map((company, index) => (
                                                <div
                                                    key={index}
                                                    onClick={() => handleCompanySelect(company)}
                                                >
                                                    {company}
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                                <select
                                    name="industry"
                                    value={filters.industry}
                                    onChange={handleFilterChange}
                                    className="industry-select"
                                >
                                    <option value="">All Industries</option>
                                    {INDUSTRIES.map(industry => (
                                        <option key={industry} value={industry}>
                                            {industry}
                                        </option>
                                    ))}
                                </select>
                                <select
                                    name="daysAgo"
                                    value={filters.daysAgo}
                                    onChange={handleFilterChange}
                                    className="days-select"
                                >
                                    <option value="">All time</option>
                                    <option value="7">Last 7 days</option>
                                    <option value="30">Last 30 days</option>
                                    <option value="90">Last 90 days</option>
                                </select>
                                <select
                                    value={sortOrder}
                                    onChange={(e) => setSortOrder(e.target.value)}
                                    className="sort-select"
                                >
                                    <option value="newest">Newest First</option>
                                    <option value="oldest">Oldest First</option>
                                </select>
                                <button onClick={handleSearch} className="search-button">
                                    Search Jobs
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
            <div className="jobs-container jobs-results">
                <div className="jobs-list">
                    {loading ? (
                        <div className="loading-spinner">Loading...</div>
                    ) : jobs.length === 0 ? (
                        <div className="no-jobs-message">
                            No jobs found matching your criteria. Try adjusting your filters.
                        </div>
                    ) : (
                        <>
                            <div className="results-count">
                                Found {propTotalCount || jobs.length} jobs
                            </div>
                            {currentJobs.map((job, index) => (
                                <div key={job.jobId || index} className="job-card">
                                    <h3>{job.jobTitle}</h3>
                                    <h4>{job.companyName}</h4>
                                    <p>{job.industry}</p>
                                    <div className="job-meta">
                                        <span>{job.daysAgo} days ago</span>
                                        <a href={job.jobLink} target="_blank" rel="noopener noreferrer" className="apply-button">
                                            Apply Now
                                        </a>
                                    </div>
                                </div>
                            ))}
                            
                            {!propJobs && hasMore && jobs.length > 0 && currentPage === totalPages && (
                                <button onClick={loadMore} className="load-more-button">
                                    Load More Jobs
                                </button>
                            )}

                            {jobs.length > itemsPerPage && (
                                <div className="pagination">
                                    <button 
                                        onClick={() => paginate(currentPage - 1)}
                                        disabled={currentPage === 1}
                                        className="pagination-button"
                                    >
                                        Previous
                                    </button>
                                    <span className="page-info">
                                        Page {currentPage} of {totalPages}
                                    </span>
                                    <button 
                                        onClick={() => paginate(currentPage + 1)}
                                        disabled={currentPage === totalPages}
                                        className="pagination-button"
                                    >
                                        Next
                                    </button>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}

export default Jobs;
