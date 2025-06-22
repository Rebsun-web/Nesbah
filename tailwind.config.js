const flowbiteReact = require("flowbite-react/plugin/tailwindcss");

/* @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}', ".flowbite-react/class-list.json"],
  theme: {
    extend: {
      fontFamily: {
        sans: 'Switzer, system-ui, sans-serif',
      },
      borderRadius: {
        '4xl': '2rem',
      },
    },
  },
  plugins: [flowbiteReact],
}