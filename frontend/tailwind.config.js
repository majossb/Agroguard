/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        cream: {
          DEFAULT: '#F8F4E6',
          dark: '#EFE9D7',
          light: '#FCFAF2',
        },
        surface: {
          DEFAULT: '#FFFCF3',
          card: '#FFFFFF',
          muted: '#F3EDE0',
        },
        border: {
          DEFAULT: '#E4DDC8',
          dark: '#D0C6AD',
        },
        forest: {
          DEFAULT: '#1E3B2C',
          dark: '#14291F',
          light: '#284E3B',
        },
        accent: {
          DEFAULT: '#2F7A45',
          dark: '#246137',
          light: '#EAF4ED',
        },
        granate: {
          DEFAULT: '#7A1F14',
          dark: '#5C170E',
          light: '#FBECEB',
        },
        amber: {
          DEFAULT: '#B7791F',
          dark: '#8C5B14',
          light: '#FDF6E9',
        },
        'text-main': '#1F2A24',
        'text-muted': '#6B7466',
        'text-subtle': '#8E9789',
      },
      fontFamily: {
        serif: ['Newsreader', 'Playfair Display', 'Georgia', 'serif'],
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        mono: ['JetBrains Mono', 'IBM Plex Mono', 'Menlo', 'monospace'],
      },
      boxShadow: {
        card: '0 2px 8px -2px rgba(30, 59, 44, 0.06), 0 1px 4px -1px rgba(30, 59, 44, 0.04)',
        modal: '0 20px 25px -5px rgba(30, 59, 44, 0.1), 0 10px 10px -5px rgba(30, 59, 44, 0.04)',
      },
    },
  },
  plugins: [],
};
