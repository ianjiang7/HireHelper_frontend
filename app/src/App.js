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
import { Amplify } from 'aws-amplify';
import awsExports from './aws-exports';
import ProtectedRoute from "./components/jsfiles/ProtectedRoute";
import { AuthProvider } from './components/jsfiles/AuthContext'

Amplify.configure(awsExports);

function App() {
    return (
        <AuthProvider>
            <Router>
                <Routes>
                    <Route path="/" element={<Home />} />
                    <Route path="/alumni-login" element={<AlumniLogin />} />
                    <Route path="/signup" element={<Signup />} />
                    <Route path="/profile-setup" element={<ProfileSetup />} />
                    <Route path="/my-connections" element={<ProtectedRoute><MyConnections /></ProtectedRoute>} />
                    <Route path="/my-job-postings" element={<ProtectedRoute><MyJobPostings /></ProtectedRoute>} />
                    <Route path="/search-results" element={<SearchResults />} />
                </Routes>
            </Router>
        </AuthProvider>
    );
}

export default App;
