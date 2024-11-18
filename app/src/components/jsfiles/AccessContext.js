import React, { createContext, useState, useContext } from "react";

// Create the Context
const AccessContext = createContext();

// Create a custom hook to easily use the context in other components
export const useAccess = () => useContext(AccessContext);

// Create a provider component
export const AccessProvider = ({ children }) => {
    const [hasAccess, setHasAccess] = useState(false); // Track if user has access

    return (
        <AccessContext.Provider value={{ hasAccess, setHasAccess }}>
            {children}
        </AccessContext.Provider>
    );
};
