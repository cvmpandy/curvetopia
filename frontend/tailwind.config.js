/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html", // Important for Vite
    "./src/**/*.{js,jsx,ts,tsx}", // Look for classes in these files
  ],
  theme: {
    extend: {
        // You can extend the default theme here if needed
         fontFamily: {
             sans: ['Inter', 'sans-serif'], // Example: Using Inter
             mono: ['Fira Code', 'monospace'], // Example: Fira Code
         },
    },
  },
  plugins: [],
}

