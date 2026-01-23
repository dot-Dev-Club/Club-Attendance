/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        // Primary color family (based on uploaded blues)
        primary: {
          50: '#F3F6FB',
          100: '#E6EEF7',
          200: '#C6DAF0',
          300: '#97BFE5',
          400: '#5E88D3',
          500: '#0F3460',
          600: '#0D2B51',
          700: '#0B213F',
          800: '#16213E',
          900: '#1A1A2E',
        },

        // Keep `blue` for compatibility but map to primary
        blue: {
          50: '#F3F6FB',
          100: '#E6EEF7',
          200: '#C6DAF0',
          300: '#97BFE5',
          400: '#5E88D3',
          500: '#0F3460',
          600: '#0D2B51',
          700: '#0B213F',
          800: '#16213E',
          900: '#1A1A2E',
        },

        // Accent (vibrant pink) from uploaded palette
        accent: {
          50: '#FFF3F6',
          100: '#FFE6EC',
          200: '#FFBCCF',
          300: '#FF8AAE',
          400: '#F65A83',
          500: '#E94560',
          600: '#D43853',
          700: '#B92F47',
          800: '#992539',
          900: '#7A1B2C',
        },

        // Harmonious supporting colors (not exact palette matches)
        success: {
          50: '#ECFDF5',
          100: '#D1FAE5',
          200: '#A7F3D0',
          300: '#6EE7B7',
          400: '#34D399',
          500: '#10B981',
          600: '#059669',
          700: '#047857',
          800: '#065F46',
          900: '#064E3B',
        },

        danger: {
          50: '#FFF3F4',
          100: '#FFE6EA',
          200: '#FFBDBF',
          300: '#FF8A8E',
          400: '#F65A63',
          500: '#DC3F55',
          600: '#C8344B',
          700: '#A92C3F',
          800: '#88222F',
          900: '#69171F',
        },

        warning: {
          50: '#FFF9F3',
          100: '#FFF2E6',
          200: '#FFE0C6',
          300: '#FFCC97',
          400: '#FFA94F',
          500: '#F97316',
          600: '#EA580C',
          700: '#C2410C',
          800: '#9A3412',
          900: '#7C2D0A',
        },

        purple: {
          50: '#FAF5FF',
          100: '#F3E8FF',
          200: '#E9D5FF',
          300: '#D8B4FE',
          400: '#C084FC',
          500: '#7C3AED',
          600: '#6D28D9',
          700: '#5B21B6',
          800: '#4C1D9E',
          900: '#32166F',
        },

        // Neutral / gray family tuned to the palette
        gray: {
          50: '#F8FAFC',
          100: '#F1F5F9',
          200: '#E2E8F0',
          300: '#CBD5E1',
          400: '#94A3B8',
          500: '#64748B',
          600: '#475569',
          700: '#334155',
          800: '#1F2937',
          900: '#0B1220',
        },
      },
    },
  },
  plugins: [],
};
