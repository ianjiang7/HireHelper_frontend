import React from "react";

function Header({ navigate, isAlumni, isSignedIn }) {
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
                    color: "#8a2be2", // Dark blue text color
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
                        fontWeight: 500,
                        color: "purple",
                        background: "none",
                        border: "none",
                        cursor: "pointer",
                    }}
                >
                    Home
                </button>
                <button
                    onClick={() => navigate("/search-results")}
                    style={{
                        fontSize: "1rem",
                        fontWeight: 500,
                        color: "purple",
                        background: "none",
                        border: "none",
                    }}
                >
                    Search
                </button>
                <button
                    onClick={() => navigate("/profile-setup")}
                    style={{
                        fontSize: "1rem",
                        fontWeight: 500,
                        color: "purple",
                        background: "none",
                        border: "none",
                        cursor: "pointer",
                    }}
                >
                    Profile
                </button>
                <button
                    onClick={() => navigate("/my-connections")}
                    disabled={!isAlumni}
                    style={{
                        fontSize: "1rem",
                        fontWeight: 500,
                        color: "purple",
                        cursor: isAlumni ? "pointer" : "not-allowed",
                        opacity: isAlumni ? 1 : 0.5,
                        background: "none",
                        border: "none",
                    }}
                >
                    Alumni
                </button>
            </div>
        </nav>
    );
}

export default Header;
