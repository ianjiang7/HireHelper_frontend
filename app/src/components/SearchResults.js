import React from "react";
import { useNavigate } from "react-router-dom";

function SearchResults() {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen bg-gradient-to-br from-purple-100 to-purple-300 text-gray-900">
            <header className="bg-gray-800 text-white w-full py-4 text-lg font-semibold text-center">
                NYU Alumni Connect
            </header>
            <main className="w-11/12 max-w-5xl mx-auto mt-10">
                <div className="flex justify-between items-center mb-6">
                    <p className="text-xl">Showing Results for Financial Analysts in New York</p>
                    <input 
                        type="text" 
                        placeholder="Search..." 
                        className="border border-gray-300 rounded-md p-2"
                    />
                </div>
                <table className="w-full bg-white shadow-md rounded-lg">
                    <thead className="bg-gray-200 text-gray-700">
                        <tr>
                            <th className="p-3">Name</th>
                            <th className="p-3">Job Title</th>
                            <th className="p-3">Company</th>
                            <th className="p-3">Industry</th>
                            <th className="p-3">Level</th>
                            <th className="p-3">Action</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr className="border-t border-gray-200">
                            <td className="p-3">Jane Doe</td>
                            <td className="p-3">Financial Analyst</td>
                            <td className="p-3">JP Morgan</td>
                            <td className="p-3">Financial Services</td>
                            <td className="p-3">Class of 2020</td>
                            <td className="p-3 text-blue-500 cursor-pointer">Edit</td>
                        </tr>
                        {/* Repeat rows as necessary */}
                    </tbody>
                </table>
                <div className="flex justify-center space-x-4 mt-4">
                    <button className="bg-purple-600 text-white px-4 py-2 rounded">Previous</button>
                    <button className="bg-purple-600 text-white px-4 py-2 rounded">1</button>
                    <button className="bg-purple-600 text-white px-4 py-2 rounded">2</button>
                    <button className="bg-purple-600 text-white px-4 py-2 rounded">Next</button>
                </div>
                <button onClick={() => navigate("/")} className="mt-6 block mx-auto bg-gray-800 text-white px-4 py-2 rounded-lg">
                    Back
                </button>
            </main>
        </div>
    );
}

export default SearchResults;
