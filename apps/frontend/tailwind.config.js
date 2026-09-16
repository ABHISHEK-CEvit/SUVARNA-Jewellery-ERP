/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        gold: {
          50: '#fffdf0',
          100: '#fffab8',
          500: '#d9a726',
          600: '#b8860b',
          700: '#8b6508',
          900: '#4a3604',
        }
      }
    },
  },
  plugins: [],
}
