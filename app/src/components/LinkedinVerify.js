import React, { useState } from "react";
import "./LinkedinVerify.css"; // Import the CSS file

const LinkedInPopup = ({ isOpen, onClose, onVerificationComplete }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [verificationComplete, setVerificationComplete] = useState(false); // State to track if verification is done

  const handleLinkedInAuth = () => {
    setIsLoading(true);

    const clientId = "86hcrtio8qosdf"; // Replace with your LinkedIn Client ID
    const redirectUri = "https://alumnireach.org"; // Redirect back to your main app domain
    const scope = "openid profile email";
    const authUrl = `https://www.linkedin.com/oauth/v2/authorization?response_type=code&client_id=${clientId}&redirect_uri=${redirectUri}&scope=${scope}`;

    // Open LinkedIn OAuth in a popup
    const authWindow = window.open(authUrl, "_blank", "width=500,height=600");

    // Poll the popup for the authorization code
    const interval = setInterval(() => {
      try {
          console.log(authWindow)
          // Check if the popup's URL has been redirected to your domain
          console.log("Redirected")
          const params = new URLSearchParams(authWindow.location.search);
          console.log(params)
          const authCode = params.get("code");
          console.log(authCode)

          if (authCode) {
            clearInterval(interval);
            setVerificationComplete(true); // Mark verification as complete
            onVerificationComplete(authCode); // Pass the auth code back to the parent
          }
      } catch (err) {
        console.error("Cross-origin or security error", err.message)
        // Cross-origin errors are expected until the popup redirects to your domain
      }

      // Detect if the popup is manually closed by the user
      if (authWindow.closed) {
        clearInterval(interval);
        setIsLoading(false);
      }
    }, 1000);
  };

  if (!isOpen) return null; // Don't render anything if the popup is not open

  return (
    <div className="popup-overlay">
      <div className="popup-content">
        <h3>Verify Your LinkedIn Profile</h3>
        <p>Connect your LinkedIn profile to verify your identity.</p>
        <button onClick={handleLinkedInAuth} disabled={isLoading || verificationComplete}>
          {isLoading ? "Redirecting..." : verificationComplete ? "Verification Complete" : "Sign in with LinkedIn"}
        </button>
        <button onClick={onClose}>Cancel</button>
        {verificationComplete && (
          <p className="success-message">
            Verification complete! Please close this popup window to continue.
          </p>
        )}
      </div>
    </div>
  );
};

export default LinkedInPopup;

