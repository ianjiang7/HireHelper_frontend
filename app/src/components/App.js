import React from "react";
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

export default App;
