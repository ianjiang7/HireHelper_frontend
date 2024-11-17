import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./Login.css";
import {
  signIn,
  fetchAuthSession,
  signInWithRedirect,
  signOut,
  getCurrentUser
} from "aws-amplify/auth";
import awsmobile from "../aws-exports"; // Ensure correct path to aws-exports.js

function AlumniLogin() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    
    async function fetchUserRole() {
    try {
        // Check if the user is already signed in
        const session = await fetchAuthSession();
        if (session.tokens?.idToken) {
            console.log("User already signed in. Redirecting...");
            const userRole = localStorage.getItem("userRole");
            navigate(userRole === "student" ? "/profile-setup" : "/my-connections");
            return;
        }
    } catch {
            console.log("No active session found. Proceeding with login...");
            // Ignored if no session exists
    }

    }
    fetchUserRole();
  }, []);

  // GraphQL query to fetch user profile
  const getUserProfileQuery = `
    query GetUserProfile($userId: ID!) {
      getUserProfile(userId: $userId) {
        fullname
        email
        role
      }
    }
  `;

  const handleSignOut = async () => {
    try {
      setLoading(true);
      await signOut(); // Signs out the current session
      localStorage.removeItem("userRole"); // Clear user-related local data
      console.log("User signed out.");
      navigate("/alumni-login"); // Redirect to login page
    } catch (err) {
      console.error("Error during sign-out:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async () => {
    setLoading(true);
    setError("");

    try {
      // Authenticate the user with Cognito
      await signIn({ username: email, password: password });

      // Get userId
      const { userId } = await getCurrentUser();
      console.log(userId)

      // Fetch the authentication session
      const session = await fetchAuthSession();
      const { idToken } = session.tokens ?? {};

      if (!idToken) {
        throw new Error("Unable to retrieve session token.");
      }

      // Call GraphQL API to fetch user profile
      const response = await fetch(awsmobile.aws_appsync_graphqlEndpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${idToken}`, // Use token from the session
        },
        body: JSON.stringify({
          query: getUserProfileQuery, // GraphQL query
          variables: { userId }, // Pass the userId variable
        }),
      });

      const responseData = await response.json();
      const userProfile = responseData.data?.getUserProfile;

      if (!userProfile) {
        // If no profile is found, redirect to signup page
        setError("Account not found. Please sign up.");
        navigate("/signup");
        return;
      }

      // Store the user's role in localStorage
      const userRole = userProfile.role;
      localStorage.setItem("userRole", userRole);

      // Navigate to appropriate page based on role
      navigate(userRole === "student" ? "/profile-setup" : "/my-connections");
    } catch (err) {
      console.error("Login error:", err);

      // Handle specific errors from Cognito
      if (err.code === "UserNotFoundException") {
        setError("Account does not exist. Please sign up.");
      } else if (err.code === "NotAuthorizedException") {
        setError("Incorrect email or password.");
      } else {
        setError(err.message || "An error occurred during login.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setLoading(true);
    setError("");

    try {
      // Initiate the Google Sign-In flow
      await signInWithRedirect({ provider: "Google" });
      // Cognito will redirect back to the callback URL and issue tokens
    } catch (err) {
      console.error("Google Sign-In Error:", err);
      setError("An error occurred during Google Sign-In.");
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
      <button
        onClick={handleGoogleSignIn}
        className="google-login"
        disabled={loading}
      >
        {loading ? "Signing In with Google..." : "Sign In with Google"}
      </button>
      <p onClick={() => navigate("/signup")} className="signup-link">
        I don't have an account
      </p>
    </div>
  );
}

export default AlumniLogin;