import { useState, useEffect } from 'react';
import Alumnus from './Alumnus';

function Alumni({ industry, job, customJob, page, jobSearch, company }) {
    const [alumni, setAlumni] = useState([]);

    // Set customJob to job if job is not "Other"
    if (job !== "Other") {
        customJob = job;
    }

    // Fetch alumni data when component mounts or dependencies change
    useEffect(() => {
        const getAlumni = async () => {
            try {
                const response = await fetch(
                    `/person/search/?industry=${industry}&job=${customJob}&page=${page}&title=${jobSearch}&company=${company}`
                );
                if (!response.ok) {
                    throw new Error("Network response was not ok");
                }
                const data = await response.json();
                const alumniArray = Object.values(data);
                console.log(alumniArray)
                setAlumni(alumniArray);
            } catch (error) {
                console.error("Error fetching data:", error);
            }
        };

        getAlumni();
    }, [industry, customJob, page, jobSearch, company]); // Dependencies

    return (
        <div>
            <table className="w-full bg-white shadow-md rounded-lg" style={{ borderCollapse: 'collapse' }}>
                <thead className="bg-gray-200 text-gray-700">
                    <tr className="border-t border-gray-200">
                        <th>Name</th>
                        <th>Title</th>
                        <th>LinkedIn</th>
                        <th>Industry</th>
                        <th>Company</th>
                        <th>Role</th>
                    </tr>
                </thead>
                <tbody>
                    {alumni.length > 0 ? (
                        alumni.map((alumnus, index) => (
                            <Alumnus key={index} alumnus={alumnus} />
                        ))
                    ) : (
                        <tr>
                            <td colSpan="6" style={{ textAlign: 'center' }}>No data available</td>
                        </tr>
                    )}
                </tbody>
            </table>
        </div>
    );
}

export default Alumni;
