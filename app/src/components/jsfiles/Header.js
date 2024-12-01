import React from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faHouse, faUser, faRightFromBracket } from "@fortawesome/free-solid-svg-icons";
import { signOut } from "aws-amplify/auth";

function Header({ navigate, isAlumni, isSignedIn }) {
    const handleSignOut = async () => {
        try {
            await signOut();
            navigate("/alumni-login");
        } catch (err) {
            console.error("Error signing out: ", err);
        }
    };

    return (
        <nav
            style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                width: "100vw",
                padding: "1rem 3rem",
                background: "white",
                backdropFilter: "blur(10px)",
                borderRadius: "10px",
                boxShadow: "0 4px 8px rgba(0, 0, 0, 0.2)",
                border: "1px solid rgba(255, 255, 255, 0.2)",
                position: "sticky",
                top: 0,
                left: 0,
                zIndex: 1000,
                boxSizing: "border-box",
            }}
        >
            <h1
                style={{
                    fontSize: "1.75rem",
                    fontWeight: "bold",
                    cursor: "pointer",
                    color: "#8a2be2",
                }}
                onClick={() => navigate("/")}
            >
                AlumniReach for NYU
            </h1>
            <div style={{ display: "flex", gap: "1.5rem" }}>
                <button
                    onClick={() => navigate("/")}
                    style={{
                        fontSize: "1rem",
                        padding: "0.5rem",
                        color: "purple",
                        background: "none",
                        border: "none",
                        cursor: "pointer",
                    }}
                >
                   <FontAwesomeIcon icon={faHouse} style={{ color: "#8a2be2", fontSize: "1.5rem" }} />
                </button>
                <button
                    onClick={() => navigate("/profile-setup")}
                    style={{
                        fontSize: "1rem",
                        padding: "0.5rem",
                        color: "purple",
                        background: "none",
                        border: "none",
                        cursor: "pointer",
                    }}
                >
                    <FontAwesomeIcon icon={faUser} style={{ color: "#8a2be2", fontSize: "1.5rem" }} />
                </button>
                <button
                    onClick={handleSignOut}
                    style={{
                        fontSize: "1rem",
                        padding: "0.5rem",
                        color: "purple",
                        background: "none",
                        border: "none",
                        cursor: "pointer",
                    }}
                >
                    <FontAwesomeIcon icon={faRightFromBracket} style={{ color: "#8a2be2", fontSize: "1.5rem" }} />
                </button>
            </div>
        </nav>
    );
}

export default Header;
