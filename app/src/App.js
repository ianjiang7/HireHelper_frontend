import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Home from "./components/jsfiles/Home";
import ProfileSetup from "./components/jsfiles/ProfileSetup";
import AlumniLogin from "./components/jsfiles/AlumniLogin";
import Signup from "./components/jsfiles/Signup";
import MyConnections from "./components/jsfiles/MyConnections";
import MyJobPostings from "./components/jsfiles/MyJobPostings";
import SearchResults from "./components/jsfiles/SearchResults";
import "./App.css";
import RoleBasedRedirect from "./components/jsfiles/RoleBasedRedirect"; // Import the component
import { Amplify } from 'aws-amplify';
import awsExports from './aws-exports';

console.log('Amplify Configuration', awsExports)
Amplify.configure(awsExports);

function App() {
    return (
        <Router>
            <Routes>
                <Route path="/" element={<Home />} />
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
