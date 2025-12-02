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
        // Retro game colors
        retro: {
          red: '#e43b44',
          blue: '#0099db',
          green: '#63c74d',
          yellow: '#feae34',
          white: '#f4f4f4',
          black: '#1a1c2c',
          'dark-blue': '#262b44',
          purple: '#b55088',
          muted: '#3a4466',
        },
        // Keep linkedin blue for compatibility (maps to retro-blue)
        linkedin: {
          blue: '#0099db',
          'blue-hover': '#0077a8',
        },
        // App semantic colors
        background: '#1a1c2c',
        foreground: '#f4f4f4',
        card: '#262b44',
        'card-foreground': '#f4f4f4',
        primary: {
          DEFAULT: '#e43b44',
          foreground: '#ffffff',
        },
        secondary: {
          DEFAULT: '#3e8948',
          foreground: '#ffffff',
        },
        muted: {
          DEFAULT: '#3a4466',
          foreground: '#94a3b8',
        },
        accent: {
          DEFAULT: '#feae34',
          foreground: '#1a1c2c',
        },
        destructive: {
          DEFAULT: '#e43b44',
          foreground: '#ffffff',
        },
        border: '#3a4466',
        input: '#262b44',
        ring: '#63c74d',
        success: '#63c74d',
        warning: '#feae34',
        error: '#e43b44',
        info: '#0099db',
      },
      fontFamily: {
        sans: ['var(--font-vt323)', 'VT323', 'monospace'],
        pixel: ['var(--font-press-start)', 'Press Start 2P', 'monospace'],
        retro: ['var(--font-vt323)', 'VT323', 'monospace'],
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
        card: '6px 6px 0 #1a1c2c',
        'card-hover': '4px 4px 0 #1a1c2c',
        pixel: '4px 4px 0 #1a1c2c',
        'pixel-sm': '2px 2px 0 #1a1c2c',
        'pixel-lg': '8px 8px 0 #1a1c2c',
      },
      borderRadius: {
        card: '0px',
        DEFAULT: '0px',
      },
    },
  },
  plugins: [],
};

export default config;
