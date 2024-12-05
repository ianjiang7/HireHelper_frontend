import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import bcrypt from "bcryptjs";
import "../cssfiles/Signup.css";
import { signUp, confirmSignUp, fetchAuthSession,signIn, signOut, getCurrentUser } from "aws-amplify/auth";
import awsmobile from "../../aws-exports";
import LinkedInPopup from "./LinkedinVerify";

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
  const [signupData, setsignupData] = useState("")
  const [isVerified, setIsVerified] = useState()
  const [isPopupOpen, setIsPopupOpen] = useState(false);
  const [isStudent, setIsStudent] = useState(false);
  const toggleLinkedInPopup = (state) => setIsPopupOpen(state);
  

  useEffect(() => {
    async function checkStudentStatus() {
          const email = form.email
          const role = form.role
          if (role === "student" && email.toLowerCase().includes("nyu")) {
            setIsStudent(true);
          }
    }
    checkStudentStatus();

  }, [form]);

  /* linkedin verification for alumni - need to fix later, for now only use nyu emails
  {!isStudent ? (
          <div>
                {!isVerified ? (
                    <>
                    <button onClick={() => toggleLinkedInPopup(true)}>Verify with LinkedIn</button> 
                    </>
                    
                ) : (
                    <p>Your LinkedIn profile is verified!</p>
                )}
            <LinkedInPopup
                isOpen={isPopupOpen}
                onClose={() => toggleLinkedInPopup(false)}
                onVerificationComplete={handleVerificationComplete}
            />
    </div> ) : null}
    */


  function hasMatchingWords(string1, string2) {
    // Split strings into arrays of words
    const words1 = string1.toLowerCase().split(/\s+/); // Split by whitespace
    const words2 = string2.toLowerCase().split(/\s+/); // Split by whitespace

    // Check if any word in words1 exists in words2
    return words1.some(word => words2.includes(word));
  }

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
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
      setsignupData(JSON.parse(localStorage.getItem("signupData")));
      setStep("confirm");
    } catch (err) {
      console.error("Signup error:", err);
      setError(err.message || "An error occurred during signup.");
    } finally {
      setLoading(false);
    }
  };
  //Linkedin Verification not working right now
  const handleVerificationComplete = async (authCode) => {
    try {
      // Replace '/api/verify-linkedin' with your Lambda function's API Gateway endpoint
      const response = await fetch('https://1pg39hypyh.execute-api.us-east-1.amazonaws.com/default/linkedinOAuth-dev', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: authCode }),
      });

      console.log(response)
  
      if (!response.ok) {
        throw new Error('Failed to fetch LinkedIn details');
      }
  
      const data = await response.json();
      const storedName = form["name"]; // Replace with the variable holding the expected full name
      console.log('Name:', data.user.fullName)
      if (hasMatchingWords(data.user.fullName, storedName)) {
        setIsVerified(true); // Update verification state
        toggleLinkedInPopup(false);
        alert('Verification successful!');
      } else {
        alert('Verification failed: Names do not match.');
      }
    } catch (error) {
      console.error('Verification Error:', error);
      alert('Verification failed: Unable to fetch LinkedIn details.');
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
      navigate(signupData.role === "student" ? "/" : "/my-connections");
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
          <p> Please fill all fields to the best of your ability </p>
          {error && <p className="error">{error}</p>}
          <input
            type="email"
            name="email"
            placeholder="NYU Email*"
            value={form.email}
            onChange={handleChange}
          />
          <input
            type="text"
            name="name"
            placeholder="Full Name*"
            value={form.name}
            onChange={handleChange}
          />
          <input
            type="text"
            name="company"
            placeholder="Company*"
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
            placeholder="Password*"
            value={form.password}
            onChange={handleChange}
          />
          <input
            type="password"
            name="confirmPassword"
            placeholder="Confirm Password*"
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
          <div>
            {(isVerified || isStudent) && <button onClick={handleSignup} disabled={loading}>
              {loading ? "Signing Up..." : "Complete Sign Up"}
            </button>}
          </div>
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
