import React from "react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";

function ProfileSetup() {
    const navigate = useNavigate();
    const [industry, setIndustry] = useState("")
    const [job, setJob] = useState("")
    const [customJob, setCustomJob] = useState("")

    function handleIndustryChange(e) {
        setIndustry(e.target.value);
    }
    function handleJobChange(e) {
        const selectedJob = e.target.value;
        setJob(selectedJob);

        // Clear custom job if the selected job is not "Other"
        if (selectedJob !== "Other") {
            setCustomJob("");
        }
    }

    function handleCustomJobChange(e) {
        setCustomJob(e.target.value);
    }
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
                                <select value={industry} onChange={handleIndustryChange}>
                                    <option value="Investment Banking">Investment Banking</option>
                                    <option value="Quantitative Trading">Quantitative Trading</option>
                                    <option value="Tax">Tax</option>
                                    <option value="Finance">Finance</option>
                                    <option value="Private Equity">Private Equity</option>
                                    <option value="Asset Management">Asset Management</option>
                                    <option value="Data Science">Data Science</option>
                                    <option value="Venture Capital">Venture Capital</option>
                                    <option value="Fund Management">Fund Management</option>
                                    <option value="Software Development">Software Development</option>
                                    <option value="Teaching">Teaching</option>
                                    <option value="Healthcare & Medical">Healthcare & Medical</option>
                                    <option value="Marketing">Marketing</option>
                                    <option value="Sales">Sales</option>
                                    <option value="Engineering & Manufacturing">Engineering & Manufacturing</option>
                                    <option value="Legal & Compliance">Legal & Compliance</option>
                                    <option value="Human Resources (HR)">Human Resources (HR)</option>
                                    <option value="Customer Service">Customer Service</option>
                                    <option value="Consulting & Advisory">Consulting & Advisory</option>
                                    <option value="Operations & Logistics">Operations & Logistics</option>
                                    <option value="Real Estate">Real Estate</option>
                                    <option value="Arts & Entertainment">Arts & Entertainment</option>
                                    <option value="Nonprofit & Social Services">Nonprofit & Social Services</option>
                                    <option value="Hospitality & Tourism">Hospitality & Tourism</option>
                                    <option value="Retail & E-commerce">Retail & E-commerce</option>
                                    <option value="Research & Development (R&D)">Research & Development (R&D)</option>
                                    <option value="Media & Communications">Media & Communications</option>
                                    <option value="Student">Student</option>
                                    <option value="Information Technology">Information Technology</option>
                                    <option value="Government & Public Service">Government & Public Service</option>
                                    <option value="Product Management">Product Management</option>
                                    <option value="Other">Other</option>

                                </select>
                            </div>
                            <div>
                                <label htmlFor="job" class  Name="block text-gray-600">Job*</label>
                                <input type="text" id="job" name="job" defaultValue="Financial Analyst" className="w-full border border-gray-300 rounded-md p-2 mt-1" />
                                <select value={job} onChange={handleJobChange}>
                                    <option value="">Select Job</option>
                                    <option value="Student">Student</option>
                                    <option value="Employee">Employee</option>
                                    <option value="Director">Director</option>
                                    <option value="Manager">Manager</option>
                                    <option value="Other">Other</option>
                                </select>
                                {job === 'Other' && <input
                                    type="text"
                                    placeholder="Enter custom job"
                                    value={customJob}
                                    onChange={handleCustomJobChange}
                                    className="w-full border border-gray-300 rounded-md p-2 mt-1"
                                />}
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
                                onClick={() => navigate("/search-results", {state: {industry: industry, job: job, customJob: customJob}})}
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
