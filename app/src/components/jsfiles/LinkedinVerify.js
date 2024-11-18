import React, { useState, useEffect } from "react";
import "../cssfiles/LinkedinVerify.css"; // Import the CSS file

const LinkedInPopup = ({ isOpen, onClose, onVerificationComplete }) => {
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const handleMessage = (event) => {
      // Ensure the message is from the correct origin
      if (event.origin !== window.location.origin) return;

      if (event.data?.type === "authCode") {
        const authCode = event.data.authCode;
        if (authCode) {
          console.log("Authorization Code Received:", authCode);
          onVerificationComplete(authCode); // Pass the code to the parent component
        }
      }
    };

    // Listen for messages from the popup
    window.addEventListener("message", handleMessage);

    return () => {
      // Clean up the event listener
      window.removeEventListener("message", handleMessage);
    };
  }, [onVerificationComplete]);

  const handleLinkedInAuth = () => {
    setIsLoading(true);

    const clientId = "86hcrtio8qosdf"; // Replace with your LinkedIn Client ID
    const redirectUri = "https://www.alumnireach.org"; // Ensure this matches LinkedIn's Redirect URI
    const scope = "openid profile email";
    const authUrl = `https://www.linkedin.com/oauth/v2/authorization?response_type=code&client_id=${clientId}&redirect_uri=${redirectUri}&scope=${scope}`;

    // Open LinkedIn OAuth in a popup
    window.open(authUrl, "_blank", "width=500,height=600");
    setIsLoading(false);
  };

  if (!isOpen) return null;

  return (
    <div className="popup-overlay">
      <div className="popup-content">
        <h3>Verify Your LinkedIn Profile</h3>
        <p>Connect your LinkedIn profile to verify your identity.</p>
        <button onClick={handleLinkedInAuth} disabled={isLoading}>
          {isLoading ? "Redirecting..." : "Sign in with LinkedIn"}
        </button>
        <button onClick={onClose}>Cancel</button>
      </div>
    </div>
  );
};

export default LinkedInPopup;
