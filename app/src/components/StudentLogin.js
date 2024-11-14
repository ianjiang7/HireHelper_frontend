import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./Login.css";

function StudentLogin() {
    const navigate = useNavigate();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");

    const handleLogin = () => {
        // Simulate login logic
        localStorage.setItem("userRole", "student");
        navigate("/profile-setup");
    };

    return (
        <div className="login-container">
            <h2>Student Login</h2>
            <input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
            <input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} />
            <button onClick={handleLogin}>Login</button>
            <p onClick={() => navigate("/signup")} className="signup-link">I don't have an account</p>
        </div>
    );
}

export default StudentLogin;