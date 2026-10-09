/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // PokéVerse brand palette — extend in later phases
        primary: {
          50:  '#f0fdf4',
          100: '#dcfce7',
          500: '#22c55e',
          600: '#16a34a',
          700: '#15803d',
          900: '#14532d',
        },
        pokemon: {
          fire:    '#ff6b35',
          water:   '#4fc3f7',
          grass:   '#81c784',
          electric:'#ffd54f',
          psychic: '#f48fb1',
          ice:     '#80deea',
          dragon:  '#7c4dff',
          dark:    '#455a64',
          fairy:   '#f8bbd9',
          normal:  '#bcaaa4',
          fighting:'#ef9a9a',
          flying:  '#b39ddb',
          poison:  '#ce93d8',
          ground:  '#ffcc80',
          rock:    '#bcaaa4',
          bug:     '#aed581',
          ghost:   '#9575cd',
          steel:   '#90a4ae',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      animation: {
        'fade-in': 'fadeIn 0.3s ease-in-out',
        'slide-up': 'slideUp 0.4s ease-out',
        'bounce-soft': 'bounceSoft 0.6s ease-in-out',
        'spin-slow': 'spin 3s linear infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        bounceSoft: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-6px)' },
        },
      },
    },
  },
  plugins: [],
}
