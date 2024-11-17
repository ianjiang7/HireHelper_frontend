import React, { useState } from 'react';

const LinkedInPopup = ({ isOpen, onClose, onVerificationComplete }) => {
  const [isLoading, setIsLoading] = useState(false);

  const handleLinkedInAuth = async () => {
    setIsLoading(true);
  
    const clientId = '86hcrtio8qosdf';
    const redirectUri = 'https://alumnireach.org/'; // Replace with your actual redirect URI
    const scope = 'r_liteprofile r_emailaddress';
    const authUrl = `https://www.linkedin.com/oauth/v2/authorization?response_type=code&client_id=${clientId}&redirect_uri=${redirectUri}&scope=${scope}`;
  
    // Open LinkedIn OAuth in a new tab
    const authWindow = window.open(authUrl, '_blank', 'width=500,height=600');
  
    // Poll the window for the authorization code
    const interval = setInterval(() => {
      try {
        if (authWindow.location && authWindow.location.search) {
          const params = new URLSearchParams(authWindow.location.search);
          const authCode = params.get('code');
  
          if (authCode) {
            clearInterval(interval);
            authWindow.close();
            onVerificationComplete(authCode); // Pass the auth code back to parent
          }
        }
      } catch (err) {
        // Continue polling until access is granted or the user closes the window
      }
    }, 1000);
  
    setIsLoading(false);
  };
}  

export default LinkedInPopup;
