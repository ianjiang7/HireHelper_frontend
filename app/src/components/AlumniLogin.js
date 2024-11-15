import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Auth, API, graphqlOperation } from "aws-amplify";
import "./Login.css";

// GraphQL query to get a user profile by userId
const getUserProfileQuery = `
  query GetUserProfile($userId: ID!) {
    getUserProfile(userId: $userId) {
      userId
      email
      fullname
      role
    }
  }
`;

function AlumniLogin() {
    const navigate = useNavigate();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const handleLogin = async () => {
        setLoading(true);
        setError("");

        try {
            // Authenticate the user with Cognito
            const user = await Auth.signIn(email, password);

            // Retrieve the Cognito userId (sub)
            const userId = user.attributes.sub;

            // Fetch the user profile from the database using userId
            const result = await API.graphql(
                graphqlOperation(getUserProfileQuery, { userId })
            );
            const userProfile = result.data.getUserProfile;

            if (!userProfile) {
                // If no profile is found, redirect to signup page
                setError("Account not found. Please sign up.");
                navigate("/signup");
                return;
            }

            // Store the user's role and navigate based on it
            const userRole = userProfile.role;
            localStorage.setItem("userRole", userRole);
            navigate(userRole === "student" ? "/profile-setup" : "/my-connections");
        } catch (err) {
            console.error("Login error:", err);
            setError(err.message || "An error occurred during login.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="login-container">
            <h2>Login</h2>
            {error && <p className="error">{error}</p>}
            <input
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
            />
            <input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
            />
            <button onClick={handleLogin} disabled={loading}>
                {loading ? "Logging In..." : "Login"}
            </button>
            <p onClick={() => navigate("/signup")} className="signup-link">
                I don't have an account
            </p>
        </div>
    );
}

export default AlumniLogin;