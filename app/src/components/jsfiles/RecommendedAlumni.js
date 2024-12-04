import React, { useState, useEffect } from "react";
import Alumnus from "./Alumnus";
import "../cssfiles/Alumni.css";

function RecommendedAlumni({ searchCombinations }) {
  const [alumni, setAlumni] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [isSearchStarted, setIsSearchStarted] = useState(false);
  const [selectedTitle, setSelectedTitle] = useState(null);

  useEffect(() => {
    // Reset pagination when search parameters change
    setCurrentPage(1);
    setHasMore(true);
    setAlumni([]);
    setIsSearchStarted(false);
  }, [searchCombinations]);

  const getAlumni = async () => {
    console.log("Search Combinations received:", searchCombinations);
    
    if (!searchCombinations || searchCombinations.length === 0) {
      console.log("Search Combinations is empty or undefined");
      alert("No search parameters available. Please analyze a resume first.");
      return;
    }

    setLoading(true);
    try {
      const allResults = new Map(); // Use Map to deduplicate by some unique identifier

      // Process each search combination
      for (const combo of searchCombinations) {
        const response = await fetch(
          `https://api.alumnireach.org/person/search/?industry=&job=${combo.role || ''}&page=${currentPage}&title=${combo.title || ''}&company=${combo.company || ''}&role-${combo.role || ''}`
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
      
      setAlumni(prev => [...prev, ...combinedResults]);
    } catch (error) {
      console.error("Error fetching data:", error);
      setHasMore(false);
      alert("Error loading recommendations. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleStartSearch = () => {
    setIsSearchStarted(true);
    setAlumni([]);
    setCurrentPage(1);
    setHasMore(true);
    getAlumni();
  };

  const handleLoadMore = () => {
    setCurrentPage(prev => prev + 1);
    getAlumni();
  };

  const handleTitleSelect = (titleWord) => {
    setSelectedTitle(titleWord);
    const combinations = searchCombinations.filter(combo => combo.title === titleWord);
    if (combinations.length > 0) {
      setAlumni([]);
      setCurrentPage(1);
      setHasMore(true);
      getAlumni();
    }
  };

  const filteredAlumni = alumni.filter((alumnus) =>
    Object.values(alumnus).some((value) =>
      value.toString().toLowerCase().includes(searchTerm.toLowerCase())
    )
  );

  return (
    <div className="alumni-container">
      <div className="title-buttons-container">
        {Array.from(new Set(searchCombinations.map(combo => combo.title))).map((titleWord) => (
          <button
            key={titleWord}
            className={`title-button ${selectedTitle === titleWord ? 'selected' : ''}`}
            onClick={() => handleTitleSelect(titleWord)}
          >
            Load recommendations for "{titleWord}"
          </button>
        ))}
      </div>

      {!isSearchStarted ? (
        <div className="text-center my-4">
          <button 
            onClick={handleStartSearch}
            className="bg-purple-600 text-white px-6 py-2 rounded-lg hover:bg-purple-700 transition-colors"
            disabled={loading}
          >
            Start Loading Recommendations
          </button>
        </div>
      ) : (
        <>
          {loading && <div className="loading">Loading...</div>}
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr className="bg-gray-100">
                  <th className="py-3 px-4 text-left">Name</th>
                  <th className="py-3 px-4 text-left">Title</th>
                  <th className="py-3 px-4 text-center">LinkedIn</th>
                  <th className="py-3 px-4 text-left">Company</th>
                  <th className="py-3 px-4 text-center"></th>
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
            <div className="load-more text-center my-4">
              <button 
                onClick={handleLoadMore}
                className="bg-purple-600 text-white px-6 py-2 rounded-lg hover:bg-purple-700 transition-colors"
              >
                Load More
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default RecommendedAlumni;
