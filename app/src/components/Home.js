import React from "react";
import { useNavigate } from "react-router-dom";

function Home() {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-purple-100 to-purple-300 text-center">
            <header className="bg-gray-800 text-white w-full py-4 text-lg font-semibold">
                NYU Alumni Connect
            </header>
            <main className="flex flex-col items-center space-y-6 mt-10">
                <h2 className="text-4xl font-bold text-gray-900">Connect with NYU Alumnus</h2>
                <button 
                    onClick={() => navigate("/profile-setup")} 
                    className="bg-gradient-to-r from-purple-600 to-blue-500 text-white py-2 px-6 rounded-lg text-lg font-medium shadow-lg transform hover:scale-105 transition-transform"
                >
                    Start Now
                </button>
                <p className="text-lg text-gray-600">Unlock a whole new network of exclusive connections</p>
            </main>
        </div>
    );
}

export default Home;
