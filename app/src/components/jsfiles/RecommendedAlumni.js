import React, { useState, useEffect } from "react";
import Alumnus from "./Alumnus";
import "../cssfiles/Alumni.css";

function RecommendedAlumni({ searchCombinations }) {
  const [alumni, setAlumni] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [hasMore, setHasMore] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    // Reset pagination when search parameters change
    setCurrentPage(1);
    setHasMore(true);
    setAlumni([]);
  }, [searchCombinations]);

  useEffect(() => {
    const getAlumni = async () => {
      setLoading(true);
      try {
        const allResults = new Map(); // Use Map to deduplicate by some unique identifier

        // Process each search combination
        for (const combo of searchCombinations) {
          const response = await fetch(
            `https://api.alumnireach.org/person/search/?industry=${combo.industry || ''}&job=${combo.job || ''}&page=${currentPage}&title=${combo.title || ''}&company=${combo.company || ''}&role-${combo.role || ''}`
          );
          
          if (!response.ok) {
            throw new Error("Network response was not ok");
          }
          
          const data = await response.json();
          const results = Object.values(data);
          
          // Add results to Map using LinkedIn URL as unique identifier
          results.forEach(person => {
            if (person.linkedin) {
              allResults.set(person.linkedin, person);
            }
          });
        }
        
        // Convert Map values back to array
        const combinedResults = Array.from(allResults.values());
        
        // If we get no results, assume we've reached the end
        if (combinedResults.length === 0) {
          setHasMore(false);
        }
        
        setAlumni(combinedResults);
      } catch (error) {
        console.error("Error fetching data:", error);
        setHasMore(false);
      } finally {
        setLoading(false);
      }
    };

    if (searchCombinations && searchCombinations.length > 0) {
      getAlumni();
    }
  }, [searchCombinations, currentPage]);

  const filteredAlumni = alumni.filter((alumnus) =>
    Object.values(alumnus).some((value) =>
      value.toString().toLowerCase().includes(searchTerm.toLowerCase())
    )
  );

  return (
    <div className="alumni-container">
      {loading && <div className="loading">Loading...</div>}
      <div className="overflow-x-auto">
        <table className="min-w-full">
          <thead>
            <tr className="bg-gray-100">
              <th className="py-3 px-4 text-left">Name</th>
              <th className="py-3 px-4 text-left">Title</th>
              <th className="py-3 px-4 text-center">LinkedIn</th>
              <th className="py-3 px-4 text-left">Company</th>
              <th className="py-3 px-4 text-center">Action</th>
            </tr>
          </thead>
          <tbody>
            {filteredAlumni.map((alumnus) => (
              <Alumnus key={alumnus.linkedin} alumnus={alumnus} />
            ))}
          </tbody>
        </table>
      </div>
      {hasMore && !loading && (
        <div className="load-more">
          <button onClick={() => setCurrentPage(prev => prev + 1)}>
            Load More
          </button>
        </div>
      )}
    </div>
  );
}

export default RecommendedAlumni;
