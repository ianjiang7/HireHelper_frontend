import React, { useState, useEffect } from "react";
import Alumnus from "./Alumnus";
import "../cssfiles/Alumni.css";
import "../cssfiles/RecommendedAlumni.css";
import { S3Client, PutObjectCommand, GetObjectCommand, ListObjectsV2Command } from "@aws-sdk/client-s3";
import { fetchAuthSession, getCurrentUser } from "aws-amplify/auth";

function LoadingBar({ message }) {
    return (
        <div className="loading-bar-container">
            <div className="loading-bar">
                <div className="loading-progress"></div>
            </div>
            <p className="loading-message">{message}</p>
        </div>
    );
}

function RecommendedAlumni({ searchCombinations }) {
  const [alumni, setAlumni] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [isSearchStarted, setIsSearchStarted] = useState(false);
  const [savedPresets, setSavedPresets] = useState([]);
  const [userSub, setUserSub] = useState("");
  const [loadingMessage, setLoadingMessage] = useState('');
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const initUser = async () => {
      try {
        const user = await getCurrentUser();
        setUserSub(user.userId);
        listSavedPresets(user.userId);
      } catch (err) {
        console.error("Error getting user:", err);
      }
    };
    initUser();
  }, []);

  const listSavedPresets = async (userId) => {
    try {
      const { credentials } = await fetchAuthSession();
      const s3Client = new S3Client({
        region: "us-east-1",
        credentials: {
          accessKeyId: credentials.accessKeyId,
          secretAccessKey: credentials.secretAccessKey,
          sessionToken: credentials.sessionToken
        }
      });

      const prefix = `private/${userId}/recommendations/`;
      const command = new ListObjectsV2Command({
        Bucket: "alumnireachresumestorage74831-dev",
        Prefix: prefix
      });

      const response = await s3Client.send(command);
      const presets = response.Contents || [];
      presets.sort((a, b) => b.LastModified - a.LastModified);
      setSavedPresets(presets);
    } catch (error) {
      console.error('Error listing saved presets:', error);
    }
  };

  const saveCurrentRecommendations = async () => {
    if (!userSub || alumni.length === 0) return;
    
    try {
      const { credentials } = await fetchAuthSession();
      const s3Client = new S3Client({
        region: "us-east-1",
        credentials: {
          accessKeyId: credentials.accessKeyId,
          secretAccessKey: credentials.secretAccessKey,
          sessionToken: credentials.sessionToken
        }
      });

      const presetNumber = savedPresets.length + 1;
      const key = `private/${userSub}/recommendations/preset_${presetNumber}.json`;
      
      const data = {
        alumni: alumni,
        searchCombinations: searchCombinations,
        timestamp: new Date().toISOString()
      };

      const command = new PutObjectCommand({
        Bucket: "alumnireachresumestorage74831-dev",
        Key: key,
        Body: JSON.stringify(data),
        ContentType: 'application/json'
      });

      await s3Client.send(command);
      await listSavedPresets(userSub);
      alert(`Recommendations saved as Preset ${presetNumber}`);
    } catch (error) {
      console.error('Error saving recommendations:', error);
      alert('Failed to save recommendations. Please try again.');
    }
  };

  const loadPreset = async (preset) => {
    try {
      const { credentials } = await fetchAuthSession();
      const s3Client = new S3Client({
        region: "us-east-1",
        credentials: {
          accessKeyId: credentials.accessKeyId,
          secretAccessKey: credentials.secretAccessKey,
          sessionToken: credentials.sessionToken
        }
      });

      const command = new GetObjectCommand({
        Bucket: "alumnireachresumestorage74831-dev",
        Key: preset.Key
      });

      const response = await s3Client.send(command);
      const presetData = JSON.parse(await response.Body.transformToString());
      
      setAlumni(presetData.alumni);
      setIsSearchStarted(true);
    } catch (error) {
      console.error('Error loading preset:', error);
      alert('Failed to load preset. Please try again.');
    }
  };

  useEffect(() => {
    // Reset pagination when search parameters change
    setCurrentPage(1);
    setHasMore(true);
    setAlumni([]);
    setIsSearchStarted(false);
    setProgress(0);
  }, [searchCombinations]);

  const getAlumni = async () => {
    console.log("Search Combinations received:", searchCombinations);
    
    if (!searchCombinations || searchCombinations.length === 0) {
      console.log("Search Combinations is empty or undefined");
      alert("No search parameters available. Please analyze a resume first.");
      return;
    }

    setLoading(true);
    setProgress(0);
    try {
      const allResults = new Map(); // Use Map to deduplicate by some unique identifier

      // Process each search combination
      for (let i = 0; i < searchCombinations.length; i++) {
        const combo = searchCombinations[i];
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

        // Update progress
        setProgress(((i + 1) / searchCombinations.length) * 100);
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
      setProgress(100);
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

  const fetchRecommendations = async () => {
    setLoading(true);
    try {
      setLoadingMessage('Searching NYU Alumni Database...');
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Your existing fetch logic here
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
      
      setLoadingMessage('Finding Relevant People...');
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Process results
    } catch (error) {
      console.error('Error fetching recommendations:', error);
    } finally {
      setLoading(false);
      setLoadingMessage('');
    }
  };

  const filteredAlumni = alumni.filter((alumnus) =>
    Object.values(alumnus).some((value) =>
      value.toString().toLowerCase().includes(searchTerm.toLowerCase())
    )
  );

  return (
    <div className="alumni-container">
      {!isSearchStarted ? (
        <div className="start-search-container">
          <div className="recommendations-header">
            <h1>Alumni for You</h1>
            <p></p>
          </div>
          <button 
            className="start-search-btn"
            onClick={handleStartSearch}
          >
            Search
          </button>
        </div>
      ) : (
        <>
          {loading && (
            <div className="loading-container">
              <div className="progress-bar">
                <div 
                  className="progress-bar-fill" 
                  style={{ width: `${progress}%` }}
                ></div>
              </div>
              <p>Searching for alumni... {Math.round(progress)}%</p>
            </div>
          )}
          
          {!loading && alumni.length > 0 && (
            <div className="recommendation-count">
              Found {alumni.length} People you may want to connect with
            </div>
          )}
          
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
      {/* Save and Load Presets */}
      <div className="presets-container">
        <button
          onClick={saveCurrentRecommendations}
          className="save-preset-btn"
          disabled={!isSearchStarted || alumni.length === 0}
        >
          Save Current Recommendations
        </button>
        
        {savedPresets.length > 0 && (
          <div className="saved-presets">
            <h3>Saved Presets</h3>
            <div className="preset-buttons">
              {savedPresets.map((preset, index) => (
                <button
                  key={preset.Key}
                  onClick={() => loadPreset(preset)}
                  className="load-preset-btn"
                >
                  Load Preset {index + 1}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default RecommendedAlumni;
