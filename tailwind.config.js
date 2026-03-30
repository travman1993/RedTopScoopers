/** @type {import('tailwindcss').Config} */
module.exports = {
    content: [
      './src/**/*.{js,ts,jsx,tsx,mdx}',
    ],
    theme: {
      extend: {
        colors: {
          brand: {
            red: '#c41e2a',
            'red-dark': '#a11620',
            green: '#1b5e20',
            'green-light': '#2e7d32',
            'green-pale': '#e8f5e9',
          },
        },
        fontFamily: {
          heading: ['Oswald', 'sans-serif'],
          body: ['Source Sans Pro', 'sans-serif'],
        },
      },
    },
    plugins: [],
  };