import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Home from "./components/Home";
import ProfileSetup from "./components/ProfileSetup";
import StudentLogin from "./components/StudentLogin";
import AlumniLogin from "./components/AlumniLogin";
import Signup from "./components/Signup";
import MyConnections from "./components/MyConnections";
import MyJobPostings from "./components/MyJobPostings";
import SearchResults from "./components/SearchResults";
import "./App.css";
import RoleBasedRedirect from "./components/RoleBasedRedirect"; // Import the component
import { Amplify } from 'aws-amplify';
import awsExports from './aws-exports';

console.log('Amplify Configuration', awsExports)
Amplify.configure(awsExports);

function App() {
    return (
        <Router>
            <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/student-login" element={<StudentLogin />} />
                <Route path="/alumni-login" element={<AlumniLogin />} />
                <Route path="/signup" element={<Signup />} />
                <Route path="/profile-setup" element={<ProfileSetup />} />
                <Route path="/my-connections" element={<MyConnections />} />
                <Route path="/my-job-postings" element={<MyJobPostings />} />
                <Route path="/search-results" element={<SearchResults />} />
                {/* Redirect for authenticated users */}
                <Route path="*" element={<RoleBasedRedirect />} />
            </Routes>
        </Router>
    );
}

export default App;
