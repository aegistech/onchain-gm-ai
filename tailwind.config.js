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
        mono: ['ui-monospace', 'SFMono-Regular', 'Menlo', 'Monaco', 'Consolas', "Liberation Mono", "Courier New", 'monospace'],
      },
      boxShadow: {
        'brutal': '4px 4px 0px 0px currentColor',
        'brutal-sm': '2px 2px 0px 0px currentColor',
        'brutal-lg': '8px 8px 0px 0px currentColor',
      },
      colors: {
        paper: '#f0f0f0',
        terminal: '#0d1117',
        neon: {
          green: '#00ff41',
          orange: '#ff5f00',
        }
      },
      animation: {
        'marquee': 'marquee 20s linear infinite',
      },
      keyframes: {
        marquee: {
          '0%': { transform: 'translateX(0%)' },
          '100%': { transform: 'translateX(-100%)' },
        }
      }
    },
  },
  plugins: [],
}