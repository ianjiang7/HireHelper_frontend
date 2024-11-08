import React from "react";
import { useNavigate } from "react-router-dom";

function ProfileSetup() {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen flex flex-col items-center bg-gradient-to-br from-purple-100 to-purple-300 text-gray-900">
            <header className="bg-gray-800 text-white w-full py-4 text-lg font-semibold text-center">
                NYU Alumni Connect
            </header>
            <main className="flex flex-col items-center space-y-4 mt-10 w-11/12 max-w-4xl">
                <h2 className="text-3xl font-semibold">Hey Bob</h2>
                <p className="text-gray-700 text-center mb-6">Welcome to the NYU Alumni connect app. Please tell us more about yourself</p>
                
                <div className="flex flex-col lg:flex-row w-full space-y-6 lg:space-y-0 lg:space-x-8">
                    {/* Attach Resume Section */}
                    <div className="bg-white rounded-lg p-6 shadow-md flex-grow">
                        <h3 className="text-xl font-semibold mb-4">Attach Resume</h3>
                        <p className="text-gray-600 mb-4">You can upload and manage course materials here, including lecture notes, readings, assignments, and multimedia content.</p>
                        <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                            <label htmlFor="resume-upload" className="text-gray-500 cursor-pointer">Drag & drop files or <span className="text-blue-500">Browse</span></label>
                            <input type="file" id="resume-upload" name="resume" className="hidden" />
                        </div>
                        <div className="mt-4 text-gray-700">Bob's Resume.pdf</div>
                    </div>

                    {/* Search Criteria Section */}
                    <div className="bg-white rounded-lg p-6 shadow-md flex-grow">
                        <h3 className="text-xl font-semibold mb-4">Who are you looking for?</h3>
                        <form className="space-y-4">
                            <div>
                                <label htmlFor="industry" className="block text-gray-600">Industry*</label>
                                <input type="text" id="industry" name="industry" defaultValue="Finance" className="w-full border border-gray-300 rounded-md p-2 mt-1" />
                            </div>
                            <div>
                                <label htmlFor="job" className="block text-gray-600">Job*</label>
                                <input type="text" id="job" name="job" defaultValue="Financial Analyst" className="w-full border border-gray-300 rounded-md p-2 mt-1" />
                            </div>
                            <div>
                                <label htmlFor="location" className="block text-gray-600">Location*</label>
                                <input type="text" id="location" name="location" defaultValue="New York" className="w-full border border-gray-300 rounded-md p-2 mt-1" />
                            </div>
                            <div>
                                <label htmlFor="company" className="block text-gray-600">Company</label>
                                <input type="text" id="company" name="company" defaultValue="JP Morgan" className="w-full border border-gray-300 rounded-md p-2 mt-1" />
                            </div>
                            <button 
                                type="button" 
                                onClick={() => navigate("/search-results")}
                                className="w-full bg-gradient-to-r from-purple-600 to-blue-500 text-white py-2 px-6 rounded-lg font-medium shadow-lg hover:bg-blue-600 transform hover:scale-105 transition-transform"
                            >
                                Proceed
                            </button>
                        </form>
                    </div>
                </div>
            </main>
        </div>
    );
}

export default ProfileSetup;
