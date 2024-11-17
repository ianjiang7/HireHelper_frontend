import React, { useState, useEffect } from "react";
import Alumnus from "./Alumnus";
import "./Alumni.css";

function Alumni({ industry, job, customJob, jobSearch, company }) {
  const [alumni, setAlumni] = useState([]);
  const [page, setPage] = useState(1);
  const [resultsPerPage] = useState(50); // Set results per page

  if (job !== "Other") {
    customJob = job;
  }

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
        setAlumni(Object.values(data));
      } catch (error) {
        console.error("Error fetching data:", error);
      }
    };

    getAlumni();
  }, [industry, customJob, page, jobSearch, company]);

  const startIndex = (page - 1) * resultsPerPage;
  const endIndex = startIndex + resultsPerPage;
  const paginatedAlumni = alumni.slice(startIndex, endIndex);

  return (
    <div className="alumni-container">
      <table className="alumni-table">
        <thead>
          <tr>
            <th>Name</th>
            <th>Title</th>
            <th>LinkedIn</th>
            <th>Industry</th>
            <th>Company</th>
            <th>Role</th>
          </tr>
        </thead>
        <tbody>
          {paginatedAlumni.length > 0 ? (
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
      <div className="flex justify-center mt-4 space-x-4">
        <button
          className="pagination-button"
          onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
          disabled={page === 1}
        >
          Previous
        </button>
        {endIndex < alumni.length && (
          <button
            className="pagination-button"
            onClick={() => setPage((prev) => prev + 1)}
          >
            Next
          </button>
        )}
      </div>
    </div>
  );
}

export default Alumni;
