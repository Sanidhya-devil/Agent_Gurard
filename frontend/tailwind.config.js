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
        guard: {
          dark: '#0B0F19',
          card: '#111827',
          border: '#1F2937',
          accent: '#3B82F6',
          success: '#10B981',
          warning: '#F59E0B',
          danger: '#EF4444'
        }
      }
    },
  },
  plugins: [],
}
