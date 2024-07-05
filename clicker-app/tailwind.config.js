/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        "dark-gray": "#333",
        "dark-bg": "#1a202c",
        "dark-blue": "#2b6cb0",
      },
    },
  },
  plugins: [],
};
