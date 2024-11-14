import React from "react";
import { useNavigate , useLocation} from "react-router-dom";
import { useState } from "react";
import Alumni from "./Alumni";
function SearchResults() {
    const navigate = useNavigate();
    const {state} = useLocation();
    const {industry, role, customJob, jobSearch, company} = state;
    
    return (
        <div className="min-h-screen bg-gradient-to-br from-purple-100 to-purple-300 text-gray-900">
            <header className="bg-gray-800 text-white w-full py-4 text-lg font-semibold text-center">
                AlumniReach for NYU
            </header>
            <main className="w-11/12 max-w-5xl mx-auto mt-10">
                <div className="flex justify-between items-center mb-6">
                    <p className="text-xl">Showing Results for {role} in {industry}</p>
                    <input 
                        type="text" 
                        placeholder="Search..." 
                        className="border border-gray-300 rounded-md p-2"
                    />
                </div>
                <Alumni industry={industry} job={role} customJob={customJob} jobSearch={jobSearch} company={company}/>
                
                <button onClick={() => navigate("/")} className="mt-6 block mx-auto bg-gray-800 text-white px-4 py-2 rounded-lg">
                    Back
                </button>
            </main>
        </div>
    );
}

export default SearchResults;
