/** @type {import('tailwindcss').Config} */
// tailwind.config.js

module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
      extend: {
          animation: {
              gradient: "gradient 15s ease infinite",
              "text-cycle": "text-cycle 9s linear infinite",
          },
          keyframes: {
              gradient: {
                  "0%": { "background-position": "0% 50%" },
                  "50%": { "background-position": "100% 50%" },
                  "100%": { "background-position": "0% 50%" },
              },
              "text-cycle": {
                  "0%, 100%": { transform: "translateY(100%)" },
                  "33%, 66%": { transform: "translateY(0)" },
              },
          },
      },
  },
  plugins: [],
};

