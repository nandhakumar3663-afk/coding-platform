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
          950: 'rgb(var(--dark-950) / <alpha-value>)',
          900: 'rgb(var(--dark-900) / <alpha-value>)',
          850: 'rgb(var(--dark-850) / <alpha-value>)',
          800: 'rgb(var(--dark-800) / <alpha-value>)',
          700: 'rgb(var(--dark-700) / <alpha-value>)',
          600: 'rgb(var(--dark-600) / <alpha-value>)',
        },
        strong: 'rgb(var(--text-strong) / <alpha-value>)',
        slate: Object.fromEntries([50,100,200,300,400,500,600,700,800,900,950].map(n => [n, `rgb(var(--slate-${n}) / <alpha-value>)`])),
        ...Object.fromEntries(['indigo','cyan','emerald','amber','rose','orange','yellow','purple'].map(color => [color, Object.fromEntries([200,300,400].map(n => [n, `rgb(var(--${color}-${n}) / <alpha-value>)`]))])),
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
