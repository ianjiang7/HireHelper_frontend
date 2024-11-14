import { useState, useEffect } from 'react';
import Alumnus from './Alumnus';

function Alumni({ industry, job, customJob, jobSearch, company }) {
  const [alumni, setAlumni] = useState([]);
  const [page, setPage] = useState(1);
  function handlePrevious() {
    if (page !== 1) {
        setPage(page - 1)
    }
  }
  function handleNext() {
      setPage(page + 1)
  }
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
            <div className="flex justify-center space-x-4 mt-4">
                    <button className="bg-purple-600 text-white px-4 py-2 rounded" onClick={handlePrevious}>Previous</button>
                    {alumni.length > 0 && <button className="bg-purple-600 text-white px-4 py-2 rounded" onClick={handleNext}>Next</button>}
                </div>
        </div>
    );
}

export default Alumni;
