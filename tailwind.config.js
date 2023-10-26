/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{html,js,svelte,ts}'],
  theme: {
    extend: {},
    colors: {
      'red': '#da2f11',
      'white': '#ffffff',
      'black': '#000000',
      'transparent': 'transparent',
      'yellow': '#e2c69a',
      'green': '#78c484',
      'firebolt': '#e94f2d',
      'pamphlet': '#f1eee4',
      'fog': '#474442',
      'berry': '#6f60ab',
      'darkvision': '#292827'
    },
    fontFamily: {
      'capitolina': ['capitolina', 'ui-serif', 'serif'],
      'merriweather': ['Merriweather', 'ui-serif', 'serif'],
      'nanum': ['Nanum Gothic Coding', 'ui-monospace', 'monospace'],
    }
  },
  plugins: [],
}