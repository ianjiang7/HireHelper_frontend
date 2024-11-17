import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import bcrypt from "bcryptjs";
import "./Signup.css";
import { signUp, confirmSignUp, fetchAuthSession,signIn, signOut, getCurrentUser } from "aws-amplify/auth";
import awsmobile from "../aws-exports";

// GraphQL mutation to create a user profile
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
  const [form, setForm] = useState({
    email: "",
    name: "",
    company: "",
    role: "student",
    password: "",
    confirmPassword: "",
    phone_number: "", // Optional phone number
  });
  const [verificationCode, setVerificationCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [step, setStep] = useState("signup");

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

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

  const handleSignup = async () => {
    const { email, password, confirmPassword, name, company, role, phone_number } = form;

    if (password !== confirmPassword) {
      setError("Passwords do not match!");
      return;
    }

    setError("");
    setLoading(true);

    try {
      // Hash the password using bcrypt
      const hashpassword = await bcrypt.hash(password, 10);

      // Sign up the user in Cognito
      const { userSub: userId } = await signUp({
        username: email, // Use email as username
        password,
        attributes: {
          email,
          phone_number, // Optional E.164 format
        },
      });

      // Save signup data for later use
      localStorage.setItem(
        "signupData",
        JSON.stringify({ userId, email, name, company, hashpassword, role })
      );

      setStep("confirm");
    } catch (err) {
      console.error("Signup error:", err);
      setError(err.message || "An error occurred during signup.");
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmSignup = async () => {
    const { email, password } = form;

    setLoading(true);
    setError("");

    try {
      // Confirm the user with the verification code
      await confirmSignUp({username : email, confirmationCode: verificationCode});
      // Authenticate the user with Cognito
      await signIn({username : email, password: password});
      // Retrieve signup data
      const signupData = JSON.parse(localStorage.getItem("signupData"));
      if (!signupData) {
        setError("Signup data is missing. Please try signing up again.");
        return;
      }
      // Fetch session to get idToken
      const session = await fetchAuthSession();
      const { idToken } = session.tokens ?? {};
      if (!idToken) {
        setError("Could not retrieve session details. Please try again.");
        return;
      }
      // Get userId
      const { userId } = await getCurrentUser();
      

      // Prepare GraphQL input
      const input = {
        userId,
        email: signupData.email,
        fullname: signupData.name,
        company: signupData.company,
        hashpassword: signupData.hashpassword,
        role: signupData.role,
        owner: userId,
      };

      // Call GraphQL API
      const response = await fetch(awsmobile.aws_appsync_graphqlEndpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify({
          query: createUserMutation,
          variables: { input },
        }),
      });

      const responseData = await response.json();
      if (responseData.errors) {
        console.error("GraphQL Error:", responseData.errors);
        setError("Failed to create user profile in database.");
        return;
      }

      // Save role in localStorage
      localStorage.setItem("userRole", signupData.role);

      // Navigate to appropriate page
      navigate(signupData.role === "student" ? "/profile-setup" : "/my-connections");
    } catch (err) {
      console.error("Confirmation error:", err);
      setError(err.message || "An error occurred during confirmation.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="signup-container">
      {step === "signup" && (
        <>
          <h2>Sign Up</h2>
          {error && <p className="error">{error}</p>}
          <input
            type="email"
            name="email"
            placeholder="Email"
            value={form.email}
            onChange={handleChange}
          />
          <input
            type="text"
            name="name"
            placeholder="Name"
            value={form.name}
            onChange={handleChange}
          />
          <input
            type="text"
            name="company"
            placeholder="Company"
            value={form.company}
            onChange={handleChange}
          />
          <select name="role" value={form.role} onChange={handleChange}>
            <option value="student">Student</option>
            <option value="alumni">Alumni</option>
          </select>
          <input
            type="password"
            name="password"
            placeholder="Password"
            value={form.password}
            onChange={handleChange}
          />
          <input
            type="password"
            name="confirmPassword"
            placeholder="Confirm Password"
            value={form.confirmPassword}
            onChange={handleChange}
          />
          <input
            type="text"
            name="phone_number"
            placeholder="Phone Number (optional)"
            value={form.phone_number}
            onChange={handleChange}
          />
          <button onClick={handleSignOut} disabled={loading}>
            {loading ? "Logging Out..." : "Log Out"}
          </button>
          <button onClick={handleSignup} disabled={loading}>
            {loading ? "Signing Up..." : "Sign Up"}
          </button>
        </>
      )}

      {step === "confirm" && (
        <>
          <h2>Confirm Sign Up</h2>
          {error && <p className="error">{error}</p>}
          <input
            type="text"
            placeholder="Verification Code"
            value={verificationCode}
            onChange={(e) => setVerificationCode(e.target.value)}
          />
          <button onClick={handleConfirmSignup} disabled={loading}>
            {loading ? "Confirming..." : "Confirm"}
          </button>
        </>
      )}
    </div>
  );
}

export default Signup;
