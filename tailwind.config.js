/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        success: {
          DEFAULT: '#166534', // Dark Green
        },
        danger: {
          DEFAULT: '#991b1b', // Dark Red
        },
        warning: {
          DEFAULT: '#b45309', // Dark Amber
        }
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
