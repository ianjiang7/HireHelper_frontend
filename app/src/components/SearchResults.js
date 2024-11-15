import React from "react";
import { useNavigate, useLocation } from "react-router-dom";
import Alumni from "./Alumni";

function SearchResults() {
  const navigate = useNavigate();
  const { state } = useLocation();
  const { industry, role, customJob, jobSearch, company } = state;

  return (
    <div>
      {/* Navbar */}
      <nav className="bg-gray-800 text-white py-4 px-6">
        <div className="flex justify-between items-center">
          <h1
            className="text-xl font-bold cursor-pointer"
            onClick={() => navigate("/")}
          >
            AlumniReach for NYU
          </h1>
          <div className="space-x-4">
            <button
              onClick={() => navigate("/")}
              className="text-sm hover:underline"
            >
              Home
            </button>
            <button
              onClick={() => navigate("/profile-setup")}
              className="text-sm hover:underline"
            >
              Profile Setup
            </button>
            <button
              onClick={() => navigate("/searchresults")}
              className="text-sm hover:underline"
            >
              Results
            </button>
          </div>
        </div>
      </nav>
      <main className="p-6">
        <div className="flex justify-between items-center mb-4">
          <p className="text-lg font-medium">
            Showing Results for <span className="font-bold">{role}</span> in{" "}
            <span className="font-bold">{industry}</span>
          </p>
          <input
            type="text"
            placeholder="Search..."
            className="border px-4 py-2 rounded-md"
          />
        </div>
        <Alumni
          industry={industry}
          job={role}
          customJob={customJob}
          jobSearch={jobSearch}
          company={company}
        />
        <button
          onClick={() => navigate("/")}
          className="mt-6 bg-gray-500 text-white px-4 py-2 rounded-md"
        >
          Back
        </button>
      </main>
    </div>
  );
}

export default SearchResults;
