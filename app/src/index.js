// index.js
import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import { Amplify } from "aws-amplify";
import awsmobile from "./aws-exports";

// Configure Amplify
Amplify.configure(awsmobile);

// Render the app
const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
    <React.StrictMode>
        <App />
    </React.StrictMode>
);