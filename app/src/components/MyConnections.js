import React from "react";
import "./MyConnections.css";

function MyConnections() {
    const connections = [
        { name: "John Doe", email: "john@example.com", status: "Pending" },
        { name: "Jane Smith", email: "jane@example.com", status: "Connected" }
    ];

    return (
        <div className="connections-container">
            <h2>My Connections</h2>
            <ul>
                {connections.map((conn, index) => (
                    <li key={index}>
                        <strong>{conn.name}</strong> - {conn.email} ({conn.status})
                    </li>
                ))}
            </ul>
        </div>
    );
}

export default MyConnections;