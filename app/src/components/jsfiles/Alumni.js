import React, { useState, useEffect } from "react";
import Alumnus from "./Alumnus";
import "../cssfiles/Alumni.css";

function Alumni({ industry, job, customJob, jobSearch, company, searchTerm }) {
  const [alumni, setAlumni] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [hasMore, setHasMore] = useState(true);

  if (job !== "Other") {
    customJob = job;
  }

  useEffect(() => {
    // Reset pagination when search parameters change
    setCurrentPage(1);
    setHasMore(true);
    setAlumni([]);
  }, [industry, customJob, jobSearch, company]);

  useEffect(() => {
    const getAlumni = async () => {
      setLoading(true);
      try {
        const response = await fetch(
          `https://api.alumnireach.org/person/search/?industry=${industry}&job=${customJob}&page=${currentPage}&title=${jobSearch}&company=${company}&role-${job}`
        );
        if (!response.ok) {
          throw new Error("Network response was not ok");
        }
        const data = await response.json();
        const results = Object.values(data);
        
        // If we get less results than expected or no results, assume we've reached the end
        if (results.length === 0) {
          setHasMore(false);
        }
        
        setAlumni(results);
      } catch (error) {
        console.error("Error fetching data:", error);
        setHasMore(false);
      } finally {
        setLoading(false);
      }
    };

    getAlumni();
  }, [industry, customJob, currentPage, jobSearch, company]);

  const filteredAlumni = alumni.filter((alumnus) =>
    Object.values(alumnus).some((value) =>
      value.toString().toLowerCase().includes(searchTerm.toLowerCase())
    )
  );

  const handleNextPage = () => {
    if (hasMore && !loading) {
      setCurrentPage(prev => prev + 1);
    }
  };

  const handlePreviousPage = () => {
    if (currentPage > 1 && !loading) {
      setCurrentPage(prev => prev - 1);
    }
  };

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
              <th></th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="6" className="text-center py-4">
                  Loading...
                </td>
              </tr>
            ) : filteredAlumni.length > 0 ? (
              filteredAlumni.map((alumnus, index) => (
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
          onClick={handlePreviousPage}
          disabled={currentPage === 1 || loading}
        >
          Previous
        </button>
        <span className="page-number">Page {currentPage}</span>
        <button
          className="pagination-button"
          onClick={handleNextPage}
          disabled={!hasMore || loading}
        >
          Next
        </button>
      </div>
    </div>
  );
}

export default Alumni;