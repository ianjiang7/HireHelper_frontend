import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Auth, API, graphqlOperation } from "aws-amplify";
import bcrypt from "bcryptjs";
import "./Signup.css";

// Replace with your GraphQL mutation to create a user
const createUserMutation = `
  mutation CreateUserProfile($input: CreateUserProfileInput!) {
    createUserProfile(input: $input) {
      userId
      email
      fullname
      company
      role
      owner
    }
  }
`;

function Signup() {
    const navigate = useNavigate();
    const [email, setEmail] = useState("");
    const [name, setName] = useState("");
    const [company, setCompany] = useState(""); // Added company field
    const [role, setRole] = useState("student");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const handleSignup = async () => {
        if (password !== confirmPassword) {
            setError("Passwords do not match!");
            return;
        }

        setError(""); // Clear previous errors
        setLoading(true);

        try {
            // Hash the password using bcrypt
            const hashpassword = await bcrypt.hash(password, 10);

            // Sign up the user in Cognito
            const { user } = await Auth.signUp({
                username: email,
                password,
                attributes: {
                    email, // Required by Cognito
                    name,  // Optional custom attribute
                },
            });

            // Call your GraphQL API to create the user profile in DynamoDB
            const input = {
                userId: user.username, // Cognito user ID (unique identifier)
                email,
                fullname: name,
                company,
                hashpassword,
                role,
                owner: user.username, // Owner matches the Cognito user ID
            };

            await API.graphql(graphqlOperation(createUserMutation, { input }));

            // Store the user role in local storage
            localStorage.setItem("userRole", role);

            // Navigate based on the user's role
            // Navigate based on the role
            if (role === "student") {
                navigate("/profile-setup");
            } else if (role === "alumni") {
                navigate("/my-connections");
            }
        } catch (err) {
            console.error("Signup error:", err);
            setError(err.message || "An error occurred during signup.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="signup-container">
            <h2>Sign Up</h2>
            {error && <p className="error">{error}</p>}
            <input
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
            />
            <input
                type="text"
                placeholder="Name"
                value={name}
                onChange={(e) => setName(e.target.value)}
            />
            <input
                type="text"
                placeholder="Company"
                value={company}
                onChange={(e) => setCompany(e.target.value)}
            />
            <select value={role} onChange={(e) => setRole(e.target.value)}>
                <option value="student">Student</option>
                <option value="alumni">Alumni</option>
            </select>
            <input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
            />
            <input
                type="password"
                placeholder="Confirm Password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
            />
            <button onClick={handleSignup} disabled={loading}>
                {loading ? "Signing Up..." : "Sign Up"}
            </button>
        </div>
    );
}

export default Signup;
