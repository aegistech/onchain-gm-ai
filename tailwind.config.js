/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Space Grotesk"', 'sans-serif'],
      },
      colors: {
        brand: {
          50: '#f0f9ff',
          400: '#38bdf8',
          500: '#0ea5e9',
          600: '#0284c7',
          accent: '#3b82f6', // Electric Blue
        },
        party: {
          // Using rgb(var(...) / <alpha>) syntax allows Tailwind opacity utilities like bg-party-bg/50
          bg: 'rgb(var(--bg-color) / <alpha-value>)',
          card: 'rgb(var(--card-color) / <alpha-value>)',
          border: 'rgb(var(--border-color) / <alpha-value>)',
          text: 'rgb(var(--text-color) / <alpha-value>)',
          muted: 'rgb(var(--muted-color) / <alpha-value>)',
          input: 'rgb(var(--input-bg) / <alpha-value>)'
        }
      },
      boxShadow: {
        'party': '0 0 0 1px var(--border-color)',
        'glow': '0 0 20px -5px rgba(59, 130, 246, 0.5)'
      }
    }
  },
  plugins: [],
}