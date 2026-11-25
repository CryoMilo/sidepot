/** @type {import('tailwindcss').Config} */
export default {
  future: {
    hoverOnlyWhenSupported: true,
  },
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'creamy-bg-start': '#FFFDF9',
        'creamy-bg-end': '#FFF2D5',
        'creamy-border': '#FFE4A0',
        'jar-gold-start': '#FEF08A',
        'jar-gold-end': '#D97706',
      },
      fontFamily: {
        sans: ['Plus Jakarta Sans', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
