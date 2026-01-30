/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          primary: '#1e40af',
          secondary: '#10b981',
          accent: '#8b5cf6',
        },
        node: {
          traffic: '#3b82f6',
          campaign: '#10b981',
          audience: '#8b5cf6',
          result: '#6b7280',
        }
      },
    },
  },
  plugins: [],
}
