import React, { useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, useNavigate } from "react-router-dom";
import Home from "./components/Home";
import ProfileSetup from "./components/ProfileSetup";
import StudentLogin from "./components/StudentLogin";
import AlumniLogin from "./components/AlumniLogin";
import Signup from "./components/Signup";
import MyConnections from "./components/MyConnections";
import MyJobPostings from "./components/MyJobPostings";
import "./App.css"

function App() {
    /*
    const navigate = useNavigate();

    useEffect(() => {
        const userRole = localStorage.getItem("userRole");
        if (userRole === "student") {
            navigate("/profile-setup");
        } else if (userRole === "alumni") {
            navigate("/my-connections");
        }
    }, [navigate]);*/

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
            </Routes>
        </Router>
    );
}

export default App;



















/*import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Home from "./Home";
import AccessCode from "./AccessCodeModal";
import ProfileSetup from "./ProfileSetup";
import { AccessProvider } from "./AccessContext";
import "./App.css";
import SearchResults from "./SearchResults";

function App() {
    return (
        <AccessProvider>
            <Router>
                <Routes>
                    <Route path="/" element={<Home />} />
                    <Route path="/access-code" element={<AccessCode />} />
                    <Route path="/profile-setup" element={<ProfileSetup />} />
                    <Route path="/search-results" element={<SearchResults/>} />
                </Routes>
            </Router>
        </AccessProvider>
    );
}

export default App;*/
