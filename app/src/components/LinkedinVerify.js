import React, { useState, useEffect } from "react";
import "./LinkedinVerify.css";

const LinkedInPopup = ({ isOpen, onClose, onVerificationComplete }) => {
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const handleMessage = (event) => {
      if (event.origin !== window.location.origin) return; // Ensure the message is from the same origin
      if (event.data?.type === "authCode") {
        const authCode = event.data.authCode;
        if (authCode) {
          onVerificationComplete(authCode); // Pass the auth code to the parent
        }
      }
    };

    // Listen for the postMessage event
    window.addEventListener("message", handleMessage);

    return () => {
      // Clean up the event listener
      window.removeEventListener("message", handleMessage);
    };
  }, [onVerificationComplete]);

  const handleLinkedInAuth = () => {
    setIsLoading(true);

    const clientId = "86hcrtio8qosdf"; // Replace with your LinkedIn Client ID
    const redirectUri = "https://alumnireach.org/redirect"; // Redirect to same-origin page
    const scope = "openid profile email";
    const authUrl = `https://www.linkedin.com/oauth/v2/authorization?response_type=code&client_id=${clientId}&redirect_uri=${redirectUri}&scope=${scope}`;

    // Open LinkedIn OAuth in a popup
    window.open(authUrl, "_blank", "width=500,height=600");
    setIsLoading(false);
  };

  if (!isOpen) return null; // Don't render the popup if it's not open

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
