import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { fetchAuthSession, getCurrentUser, signOut } from "aws-amplify/auth";
import awsmobile from "../../aws-exports";
import Header from "./Header"; // Import Header component

function Home() {
    const navigate = useNavigate();
    const [userName, setUserName] = useState(null);
    const [isSignedIn, setIsSignedIn] = useState(false);
    const [isAlumni, setIsAlumni] = useState(false);

    useEffect(() => {
        async function fetchUserData() {
            try {
                const { userId } = await getCurrentUser();
                const session = await fetchAuthSession();
                const { idToken } = session.tokens ?? {};

                if (!idToken) {
                    throw new Error("No ID token found.");
                }

                const response = await fetch(awsmobile.aws_appsync_graphqlEndpoint, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${idToken}`,
                    },
                    body: JSON.stringify({
                        query: `
                        query GetUserProfile($userId: ID!) {
                            getUserProfile(userId: $userId) {
                                fullname
                            }
                        }`,
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

        fetchUserData();
    }, []);

    const handleSignOut = async () => {
        try {
            await signOut();
            setIsSignedIn(false);
            setUserName(null);
            navigate("/");
        } catch (err) {
            console.error("Error signing out:", err);
        }
    };

    const handleLogIn = () => {
        navigate("/alumni-login");
    };

    return (
        <div
            style={{
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
                alignItems: "center",
                minHeight: "100vh",
                width: "100%",
                margin: "0",
                padding: "0",
                color: "white",
                fontFamily: "'Poppins', sans-serif",
                overflow: "hidden",
            }}
        >
            <Header
                navigate={navigate}
                isAlumni={isAlumni}
                isSignedIn={isSignedIn}
            />

            {/* Main Content */}
            <div
                style={{
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "center",
                    alignItems: "center",
                    textAlign: "center",
                    flexGrow: 1,
                    padding: "2rem",
                    width: "100%",
                }}
            >
                <h1 style={{ fontSize: "4rem", fontWeight: "bold", marginBottom: "1rem" }}>
                    Welcome to AlumniReach
                </h1>
                <p style={{ fontSize: "1.5rem", marginBottom: "3rem", maxWidth: "700px" }}>
                    Building meaningful connections between students and alumni to empower
                    collaboration and career growth.
                </p>
                <div style={{ display: "flex", gap: "2rem" }}>
                    <button
                        onClick={() => navigate("/search-results")}
                        style={{
                            padding: "1rem 3rem",
                            fontSize: "1.25rem",
                            backgroundColor: "#2575fc",
                            color: "white",
                            border: "none",
                            borderRadius: "50px",
                            cursor: "pointer",
                            transition: "transform 0.3s ease",
                        }}
                        onMouseOver={(e) => (e.target.style.transform = "scale(1.1)")}
                        onMouseOut={(e) => (e.target.style.transform = "scale(1)")}
                    >
                        Students
                    </button>
                    <button
                        onClick={() => navigate("/alumni-login")}
                        style={{
                            padding: "1rem 3rem",
                            fontSize: "1.25rem",
                            backgroundColor: "#6a11cb",
                            color: "white",
                            border: "none",
                            borderRadius: "50px",
                            cursor: "pointer",
                            transition: "transform 0.3s ease",
                        }}
                        onMouseOver={(e) => (e.target.style.transform = "scale(1.1)")}
                        onMouseOut={(e) => (e.target.style.transform = "scale(1)")}
                        disabled = {!isAlumni}
                    >
                        Alumni
                    </button>
                </div>
            </div>

            {/* User Status */}
            <div
                style={{
                    position: "fixed",
                    bottom: "10px",
                    right: "10px",
                    background: "rgba(255, 255, 255, 0.8)",
                    color: "#333",
                    border: "1px solid #ddd",
                    borderRadius: "10px",
                    padding: "1rem",
                    boxShadow: "0px 4px 8px rgba(0, 0, 0, 0.2)",
                }}
            >
                {isSignedIn ? (
                    <>
                        <p>Hi {userName}!</p>
                        <button
                            onClick={handleSignOut}
                            style={{
                                padding: "0.5rem 1rem",
                                background: "#2575fc",
                                color: "white",
                                border: "none",
                                borderRadius: "8px",
                                cursor: "pointer",
                            }}
                        >
                            Sign Out
                        </button>
                    </>
                ) : (
                    <>
                        <p>You are signed out.</p>
                        <button
                            onClick={handleLogIn}
                            style={{
                                padding: "0.5rem 1rem",
                                background: "#2575fc",
                                color: "white",
                                border: "none",
                                borderRadius: "8px",
                                cursor: "pointer",
                            }}
                        >
                            Log In
                        </button>
                    </>
                )}
            </div>

            {/* Footer */}
            <footer
                style={{
                    textAlign: "center",
                    padding: "1rem",
                    backgroundColor: "rgba(0, 0, 0, 0.6)",
                    color: "white",
                    width: "100%",
                }}
            >
                <p>&copy; 2024 AlumniReach for NYU. All rights reserved.</p>
            </footer>
        </div>
    );
}

export default Home;
