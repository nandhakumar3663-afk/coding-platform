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
        dark: {
          950: '#0a0d14',
          900: '#0f141f',
          850: '#131a29',
          800: '#182033',
          700: '#232d45',
          600: '#334155',
        },
        code: {
          bg: '#141824',
          gutter: '#101420',
          border: '#232a3e',
        },
        status: {
          pass: '#10b981',
          fail: '#ef4444',
          warn: '#f59e0b',
          info: '#3b82f6',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
    },
  },
  plugins: [],
}
