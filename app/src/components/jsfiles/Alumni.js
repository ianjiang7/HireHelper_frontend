import React, { useState, useEffect } from "react";
import Alumnus from "./Alumnus";
import "../cssfiles/Alumni.css";

function Alumni({ industry, job, customJob, jobSearch, company, searchTerm }) {
  const [alumni, setAlumni] = useState([]);
  const [page, setPage] = useState(1);
  const [resultsPerPage] = useState(25); // Set results per page
  const [loading, setLoading] = useState(true);

  if (job !== "Other") {
    customJob = job;
  }

  useEffect(() => {
    const getAlumni = async () => {
      setLoading(true);
      try {
        const response = await fetch(
          `https://api.alumnireach.org/person/search/?industry=${industry}&job=${customJob}&page=${page}&title=${jobSearch}&company=${company}&role-${job}`
        );
        if (!response.ok) {
          throw new Error("Network response was not ok");
        }
        const data = await response.json();
        setAlumni(Object.values(data));
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    };

    getAlumni();
  }, [industry, customJob, page, jobSearch, company]);

  const filteredAlumni = alumni.filter((alumnus) =>
    Object.values(alumnus).some((value) =>
      value.toString().toLowerCase().includes(searchTerm.toLowerCase())
    )
  );

  const startIndex = (page - 1) * resultsPerPage;
  const endIndex = startIndex + resultsPerPage;
  const paginatedAlumni = filteredAlumni.slice(startIndex, endIndex);

  return (
    <div className="alumni-container">
      <div className="table-wrapper">
        <table className="alumni-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Title</th>
              <th>LinkedIn</th>
              <th>Company</th>
              <th>Contact</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="6" className="text-center py-4">
                  Loading...
                </td>
              </tr>
            ) : paginatedAlumni.length > 0 ? (
              paginatedAlumni.map((alumnus, index) => (
                <Alumnus key={index} alumnus={alumnus} />
              ))
            ) : (
              <tr>
                <td colSpan="6" className="text-center py-4 text-gray-500">
                  No data available
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <div className="pagination-container">
        <button
          className="pagination-button"
          onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
          disabled={page === 1 || loading}
        >
          Previous
        </button>
        {endIndex < filteredAlumni.length && (
          <button
            className="pagination-button"
            onClick={() => setPage((prev) => prev + 1)}
            disabled={loading}
          >
            Next
          </button>
        )}
      </div>
    </div>
  );
}

export default Alumni;