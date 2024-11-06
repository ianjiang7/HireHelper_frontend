import {useState} from 'react'
import Alumni from './Alumni'

function Database({alumni}) {
    const [filteredAlumni, setFilteredAlumni] = useState(alumni)
    const [searchQuery, setSearchQuery] = useState("");
    const [job, setJob] = useState("");
    const [customJob, setCustomJob] = useState("");

    function handleSearchChange(e) {
        const query = e.target.value;
        setSearchQuery(query)
        setFilteredAlumni(alumni.filter((item) =>
            item.industry.toLowerCase().includes(query.toLowerCase()))
        )
    }
    function handleJobChange(e) {
        const selectedJob = e.target.value;
        setJob(selectedJob);

        // Clear custom job if the selected job is not "Other"
        if (selectedJob !== "Other") {
            setCustomJob("");
        }
        setFilteredAlumni(alumni.filter((item) =>
            item.job.toLowerCase().includes(job.toLowerCase()))
        )
    }

    function handleCustomJobChange(e) {
        setCustomJob(e.target.value);
        setFilteredAlumni(alumni.filter((item) =>
            item.job.toLowerCase().includes(customJob.toLowerCase()))
        )
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
