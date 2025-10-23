/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        futura: ["futura-pt", "system-ui", "sans-serif"],
      },
      colors: {
        "42-dark": "#1a1a1a",
        "42-darker": "#0d0d0d",
        "42-accent": "#00babc",
        "42-accent-dark": "#009a9c",
      },
    },
  },
  plugins: [],
}
