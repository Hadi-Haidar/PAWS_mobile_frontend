/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{js,jsx,ts,tsx}", "./components/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: "#FF6B00", // Pop Orange
        secondary: "#CCFF66", // Pop Green/Pistachio
        background: "#FFFAF0", // Pop Background (warm white)
        surface: "#FFFFFF",
        text: "#1E1E1E",
        "text-secondary": "#757575",
        border: "#E0E0E0",
        danger: "#D32F2F",
        // Neo-Pop specific
        "pop-orange": "#FF6B00",
        "pop-green": "#CCFF66",
        "pop-bg": "#FFFAF0",
      },
      fontFamily: {
        display: ["SpaceGrotesk", "sans-serif"],
        body: ["Manrope", "sans-serif"],
      },
    },
  },
  plugins: [],
}