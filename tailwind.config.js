/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{js,jsx,ts,tsx}", "./components/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: "#FF6F00", // Action Orange (Neo-Pop)
        secondary: "#93C47D", // Pistachio Green (Neo-Pop)
        background: "#FDFDFD", // Off-white
        surface: "#FFFFFF",
        text: "#1E1E1E",
        "text-secondary": "#757575",
        border: "#E0E0E0",
        danger: "#D32F2F",
      },
    },
  },
  plugins: [],
}