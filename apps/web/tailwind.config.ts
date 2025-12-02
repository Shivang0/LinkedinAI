import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // LinkedIn brand colors
        linkedin: {
          blue: '#0A66C2',
          'blue-hover': '#004182',
        },
        // App colors
        primary: {
          50: '#eff6ff',
          100: '#dbeafe',
          200: '#bfdbfe',
          300: '#93c5fd',
          400: '#60a5fa',
          500: '#0A66C2', // LinkedIn blue
          600: '#004182',
          700: '#1d4ed8',
          800: '#1e40af',
          900: '#1e3a8a',
        },
        gray: {
          50: '#FAFAFA',
          100: '#F3F6F8',
          200: '#E5E7EB',
          300: '#D1D5DB',
          400: '#9CA3AF',
          500: '#666666',
          600: '#4B5563',
          700: '#374151',
          800: '#2D2D2D',
          900: '#111827',
        },
        success: '#057642',
        warning: '#E37400',
        error: '#CC1016',
        info: '#378FE9',
        border: '#E5E7EB',
        ring: '#0A66C2',
      },
      fontFamily: {
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
      fontSize: {
        tiny: '0.75rem',
        small: '0.875rem',
        body: '1rem',
        h3: '1.125rem',
        h2: '1.5rem',
        h1: '2rem',
      },
      boxShadow: {
        card: '0 2px 8px rgba(0, 0, 0, 0.08)',
        'card-hover': '0 4px 12px rgba(0, 0, 0, 0.12)',
      },
      borderRadius: {
        card: '8px',
      },
    },
  },
  plugins: [],
};

export default config;
