/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        'rose-pale': '#FDF2F8',
        'rose-doux': '#FCE7F3',
        'rose-medium': '#FBCFE8',
        'brun-doux': '#78350F',
        'beige': '#FFFDF8',
        'theme-primary': 'var(--color-primary)',
        'theme-primary-hover': 'var(--color-primary-hover)',
        'theme-pale': 'var(--color-pale)',
        'theme-soft': 'var(--color-soft)',
        'theme-medium': 'var(--color-medium)',
        'theme-dark': 'var(--color-dark)',
        'theme-beige': 'var(--color-beige)',
      },
      fontFamily: {
        'playfair': ['"Playfair Display"', 'serif'],
        'lato': ['Lato', 'sans-serif'],
      },
      animation: {
        'float': 'float 3s ease-in-out infinite',
        'heartbeat': 'heartbeat 1.5s ease-in-out infinite',
      },
    },
  },
  plugins: [],
}
