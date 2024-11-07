import {useState, useEffect} from 'react'
import Alumni from './Alumni'

function Database({alumni}) {
    const [filteredAlumni, setFilteredAlumni] = useState(alumni)
    const [searchQuery, setSearchQuery] = useState("");
    const [job, setJob] = useState("");
    const [customJob, setCustomJob] = useState("");

     // Function to apply filters and update the displayed list
     function updateFilteredAlumni() {
        let result = alumni;

        // Filter by industry if searchQuery is not empty
        if (searchQuery) {
            result = result.filter((item) =>
                item.industry.toLowerCase().includes(searchQuery.toLowerCase())
            );
        }

        // Filter by job if job is selected
        if (job && job !== "Other") {
            result = result.filter((item) =>
                item.job.toLowerCase().includes(job.toLowerCase())
            );
        }

        // Filter by custom job if "Other" is selected and customJob is not empty
        if (job === "Other" && customJob) {
            result = result.filter((item) =>
                item.job.toLowerCase().includes(customJob.toLowerCase())
            );
        }

        setFilteredAlumni(result);
    }

    // useEffect to reapply filters whenever searchQuery, job, or customJob changes
    useEffect(() => {
        updateFilteredAlumni();
    }, [searchQuery, job, customJob]);

    function handleSearchChange(e) {
        setSearchQuery(e.target.value);
    }

    function handleJobChange(e) {
        const selectedJob = e.target.value;
        setJob(selectedJob);

        // Clear custom job if the selected job is not "Other"
        if (selectedJob !== "Other") {
            setCustomJob("");
        }
    }

    function handleCustomJobChange(e) {
        setCustomJob(e.target.value);
    }


    return (
        <div>
            <input type="text" placeholder="Search by Industry" value={searchQuery} onChange={handleSearchChange}/>
            <label>
                Job:
                <select value={job} onChange={handleJobChange}>
                    <option value="">Select Job</option>
                    <option value="Employee">Employee</option>
                    <option value="Director">Director</option>
                    <option value="Manager">Manager</option>
                    <option value="Other">Other</option>
                </select>
            </label>
            {job === 'Other' && <input
                    type="text"
                    placeholder="Enter custom job"
                    value={customJob}
                    onChange={handleCustomJobChange}
                />}
            <Alumni alumni={filteredAlumni} />
        </div>
    );
    }

export default Database;
