/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#165DFF',
          light: '#4080FF',
          dark: '#0040CC',
        },
        secondary: '#FF7D00',
        success: '#00B42A',
        danger: '#F53F3F',
        warning: '#FF7D00',
        info: '#14C9C9',
        dark: '#1D2129',
        gray: {
          50: '#F7F8FA',
          100: '#F2F3F5',
          200: '#E5E6EB',
          300: '#C9CDD4',
          400: '#A9ACB4',
          500: '#86909C',
          600: '#4E596B',
          700: '#303633',
          800: '#1D2129',
          900: '#0E1114'
        }
      },
      fontFamily: {
        sans: ['"Source Han Sans CN"', '"Microsoft YaHei"', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
