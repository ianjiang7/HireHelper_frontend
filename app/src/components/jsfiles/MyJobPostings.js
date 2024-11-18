import React from "react";
import "../cssfiles/MyJobPostings.css";

function MyJobPostings() {
    const jobPostings = [
        { title: "Software Engineer", company: "Tech Corp", status: "Active" },
        { title: "Data Analyst", company: "Data Inc.", status: "Closed" }
    ];

    return (
        <div className="job-postings-container">
            <h2>My Job Postings</h2>
            <ul>
                {jobPostings.map((job, index) => (
                    <li key={index}>
                        <strong>{job.title}</strong> - {job.company} ({job.status})
                    </li>
                ))}
            </ul>
        </div>
    );
}

export default MyJobPostings;