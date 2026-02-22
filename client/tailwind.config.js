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
        primary: {
          50: '#ecfeff',
          100: '#cffafe',
          200: '#a5f3fc',
          300: '#67e8f9',
          400: '#22d3ee', // Cyan 400 - primary
          500: '#06b6d4', // Cyan 500 - primary-hover
          600: '#0891b2',
          700: '#0e7490',
          800: '#155e75',
          900: '#164e63',
        },
        accent: {
          400: '#a3e635', // Lime 400 - accent
          500: '#84cc16', // Lime 500
        },
        surface: {
          50: '#fafafa',  // Zinc 50
          100: '#f4f4f5', // Zinc 100
          200: '#e4e4e7', // Zinc 200
          700: '#3f3f46', // Zinc 700 - border dark
          800: '#27272a', // Zinc 800 - surface-alt dark
          900: '#18181b', // Zinc 900 - surface dark
          950: '#09090b', // Zinc 950
        },
      },
      fontFamily: {
        heading: ['Space Grotesk', 'sans-serif'],
        body: ['DM Sans', 'sans-serif'],
        mono: ['Fira Code', 'Consolas', 'Monaco', 'monospace'],
      },
    },
  },
  plugins: [],
}
