import React from "react";
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import Home from "./components/Home";
import ProfileSetup from "./components/ProfileSetup";
import SearchResults from "./components/SearchResults";
import './App.css';

function App() {
    return (
        <Router>
            <div className="app">
                <Routes>
                    {/* <Route path="/" element={<Home />} /> */}
                    <Route path="/" element={<Home/>}/>

                    <Route path="/profile-setup" element={<ProfileSetup />} />
                    <Route path="/search-results" element={<SearchResults />} />
                </Routes>
            </div>
        </Router>        

    );
}

export default App;
