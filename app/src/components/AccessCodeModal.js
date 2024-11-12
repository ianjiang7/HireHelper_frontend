import React, { useState } from "react";
import "./AccessCodeModal.css"; // Import CSS for styling the modal

function AccessCodeModal({ onClose, onAccessGranted }) {
    const [code, setCode] = useState("");
    const [error, setError] = useState("");

    const handleCodeSubmit = () => {
        const accessCode = "9520"; // Replace with your actual access code
        if (code === accessCode) {
            onAccessGranted(); // Call the function passed from Home.js to grant access
        } else {
            setError("Invalid access code. Please try again.");
        }
    };

    return (
        <div className="modal-overlay">
            <div className="modal-content">
                <h2>Enter Access Code</h2>
                <input
                    type="text"
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    placeholder="Enter your access code"
                    className="modal-input"
                />
                {error && <p className="modal-error">{error}</p>}
                <div className="modal-buttons">
                    <button onClick={handleCodeSubmit} className="modal-submit-button">
                        Submit
                    </button>
                    <button onClick={onClose} className="modal-close-button">
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
}

export default AccessCodeModal;
