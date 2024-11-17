import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import SlideshowModal from "./SlideshowModal";
import { fetchAuthSession, getCurrentUser, signOut } from "aws-amplify/auth";
import awsmobile from "../aws-exports";
import "./Home.css";

const getUserProfileQuery = `
query GetUserProfile($userId: ID!) {
  getUserProfile(userId: $userId) {
    fullname
    email
    role
  }
}
`;

function Home() {
    const navigate = useNavigate();
    const [showSlideshow, setShowSlideshow] = useState(true);
    const [userName, setUserName] = useState(null);
    const [isSignedIn, setIsSignedIn] = useState(false);
    const [isAlumni, setIsAlumni] = useState(false);
    const userRole = localStorage.getItem("userRole");

    useEffect(() => {
        async function fetchUserData() {
            try {
                // Get current user info
                const { userId } = await getCurrentUser();

                // Fetch the authentication session
                const session = await fetchAuthSession();
                const { idToken } = session.tokens ?? {};

                if (!idToken) {
                    throw new Error("No ID token found.");
                }

                // Call GraphQL API to fetch user profile
                const response = await fetch(awsmobile.aws_appsync_graphqlEndpoint, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${idToken}`,
                    },
                    body: JSON.stringify({
                        query: getUserProfileQuery,
                        variables: { userId },
                    }),
                });

                const responseData = await response.json();

                if (responseData.errors) {
                    console.error("GraphQL Errors:", responseData.errors);
                    setIsSignedIn(false);
                    return;
                }

                const userProfile = responseData.data?.getUserProfile;

                if (userProfile) {
                    setUserName(userProfile.fullname);
                    setIsSignedIn(true);
                }
            } catch (err) {
                console.error("Error fetching user data:", err);
                setIsSignedIn(false);
            }
        }
        async function handleRole() {
            if (userRole === "student") {
                setIsAlumni(false)
            }
        }

        fetchUserData();
        handleRole();
    }, []);

    const handleSignOut = async () => {
        try {
            await signOut();
            setIsSignedIn(false);
            setUserName(null);
            navigate("/"); // Redirect to the home page after sign-out
        } catch (err) {
            console.error("Error signing out:", err);
        }
    };

    const handleSlideClose = (userType) => {
        setShowSlideshow(false);
        if (userType === "student") {
            navigate("/alumni-login");
        } else if (userType === "alumni") {
            navigate("/alumni-login");
        }
    };

    const handleCloseModal = () => {
        setShowSlideshow(false); // Close the modal when the close button is clicked
    };


    return (
        <div className="home-container">
            {showSlideshow && <SlideshowModal onClose={handleSlideClose} onRequestClose={handleCloseModal} />}
            <nav className="navbar">
                <h1 className="navbar-title" onClick={() => navigate("/")}>AlumniReach for NYU</h1>
                <div className="navbar-links">
                    <button onClick={() => navigate("/alumni-login")} className="navbar-link">Students</button>
                    <button onClick={() => navigate("/my-connections")} className="navbar-link" disabled = {!isAlumni}>Alumni</button>
                    <button
                        onClick={() => navigate("/profile-setup")}
                        className="navbar-link"
                        disabled={!isSignedIn} // Disable button if not signed in
                        style={!isSignedIn ? { opacity: 0.5, cursor: "not-allowed" } : {}} // Optional styling for disabled button
                    >
                        Profile Setup
                    </button>
                </div>
            </nav>
            <footer className="footer">
                <p>AlumniReach for NYU</p>
            </footer>
            <div className="user-status">
                {isSignedIn ? (
                    <>
                        <p>Hi {userName}!</p>
                        <button onClick={handleSignOut} className="sign-out-button">
                            Sign Out
                        </button>
                    </>
                ) : (
                    <p>You are currently signed out.</p>
                )}
            </div>
        </div>
    );
}

export default Home;
