import React, { useState } from 'react';
import "../cssfiles/Jobs.css";
import { COMPANIES } from '../constants/companies';

const INDUSTRIES = [
    "Accounting",
    "Advertising",
    "Aerospace",
    "Agriculture",
    "AI/Machine Learning",
    "Architecture",
    "Automotive",
    "Banking",
    "Biotechnology",
    "Chemical",
    "Cloud Computing",
    "Construction",
    "Consulting",
    "Consumer Goods",
    "Cybersecurity",
    "Defense",
    "E-commerce",
    "Education",
    "Energy",
    "Engineering",
    "Entertainment",
    "Environmental",
    "Fashion",
    "Financial Services",
    "Food & Beverage",
    "Gaming",
    "Government",
    "Healthcare",
    "Hospitality",
    "Human Resources",
    "Industrial",
    "Information Technology",
    "Insurance",
    "Internet",
    "Legal",
    "Logistics",
    "Manufacturing",
    "Marketing",
    "Media",
    "Medical Devices",
    "Mining",
    "Music",
    "Nonprofit",
    "Oil & Gas",
    "Pharmaceutical",
    "Public Relations",
    "Publishing",
    "Real Estate",
    "Retail",
    "Robotics",
    "Social Media",
    "Software",
    "Sports",
    "Telecommunications",
    "Transportation",
    "Travel",
    "Utilities",
    "Venture Capital",
    "Web Development"
];

function Jobs() {
    const [jobs, setJobs] = useState([]);
    const [loading, setLoading] = useState(false);
    const [lastEvaluatedKey, setLastEvaluatedKey] = useState(null);
    const [hasMore, setHasMore] = useState(true);
    const [filters, setFilters] = useState({
        company: '',
        industry: '',
        daysAgo: ''
    });
    const [filteredCompanies, setFilteredCompanies] = useState([]);
    const [showCompanyDropdown, setShowCompanyDropdown] = useState(false);

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
        fetchJobs(filters, true);
    };

    const loadMore = () => {
        if (!loading && hasMore) {
            fetchJobs(filters, false);
        }
    };

    return (
        <div className="jobs-page">
            <div className="jobs-hero">
                <div className="jobs-container">
                    <div className="jobs-header">
                        <h1>Find and Apply to Internships</h1>
                        <p>9,000+ internships in any industry or company</p>
                    </div>
                    <div className="jobs-filters">
                        <div className="filters-row">
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
                                                className="company-option"
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
                            <button onClick={handleSearch} className="search-button">
                                Search Jobs
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <div className="jobs-container jobs-results">
                <div className="jobs-list">
                    {jobs.length === 0 && !loading && (
                        <div className="no-jobs-message">
                            No jobs found matching your criteria. Try adjusting your filters.
                        </div>
                    )}
                    
                    {jobs.map((job, index) => (
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
                    
                    {loading && (
                        <div className="loading-spinner">Loading...</div>
                    )}
                    
                    {!loading && hasMore && jobs.length > 0 && (
                        <button onClick={loadMore} className="load-more-button">
                            Load More Jobs
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}

export default Jobs;
