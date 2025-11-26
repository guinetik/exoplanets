/** @type {import('tailwindcss').Config} */
module.exports = {
  mode: 'jit',
  darkMode: 'class',
  content: [
    './src/**/*.{js,jsx,ts,tsx}',
    'node_modules/flowbite-react/**/*.{js,jsx,ts,tsx}',
  ],
  theme: {
    extend: {
      animation: {
        bounce_x: 'bounce_x 1s ease-in-out infinite',
        bounce_y: 'bounce_y 1s ease-in-out infinite',
      },
      keyframes: {
        bounce_x: {
          '0%, 100%': { transform: 'translateX(0)' },
          '50%': { transform: 'translateX(70%)' },
        },
        bounce_y: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-50%)' },
        },
      },
    },
  },
  plugins: [require('flowbite/plugin')],
};
