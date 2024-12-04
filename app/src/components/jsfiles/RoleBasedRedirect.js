import React, { useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";

function RoleBasedRedirect() {
    const navigate = useNavigate();
    const location = useLocation();

    useEffect(() => {
        const userRole = localStorage.getItem("role");

        // Do not redirect on login, signup, home, or profile-setup routes
        const publicRoutes = ["/", "/alumni-login", "/student-login", "/signup", "/profile-setup"];
        if (publicRoutes.includes(location.pathname)) {
            return;
        }

        // Redirect if role is found
        if (userRole === "student") {
            navigate("/profile-setup");
        } else if (userRole === "alumni") {
            navigate("/my-connections");
        }
    }, [navigate, location]);

    return null;
}

export default RoleBasedRedirect;
