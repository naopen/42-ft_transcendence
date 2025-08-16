/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        'futura': ['Futura PT', 'Futura', 'system-ui', 'sans-serif'],
      },
      colors: {
        '42-primary': '#00BABC',
        '42-secondary': '#FF6B6B',
        '42-dark': '#1A1A1A',
        '42-gray': '#2B2B2B',
        '42-light': '#F5F5F5',
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'float': 'float 3s ease-in-out infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        }
      }
    },
  },
  plugins: [],
}
