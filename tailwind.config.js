/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'cyber-black': '#050505',
        'cyber-gray': '#1a1a1a',
        'neon-blue': '#00f3ff',
        'neon-pink': '#ff0055',
        'neon-green': '#00ff41',
        'neon-yellow': '#fcee0a',
      },
      boxShadow: {
        'neon': '0 0 10px rgba(0, 243, 255, 0.7), 0 0 20px rgba(0, 243, 255, 0.5)',
      }
    },
  },
  plugins: [],
}