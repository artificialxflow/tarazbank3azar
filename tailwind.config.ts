import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './lib/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Shabnam', 'Tahoma', 'sans-serif'],
      },
      colors: {
        brand: {
          navy: '#0A2540',
          'navy-hover': '#1E3A8A',
          emerald: '#059669',
          amber: '#D97706',
          crimson: '#DC2626',
          canvas: '#F1F5F9',
          surface: '#FFFFFF',
          border: '#E2E8F0',
          'border-strong': '#CBD5E1',
          ink: '#0F172A',
          muted: '#475569',
        },
      },
    },
  },
  plugins: [],
};

export default config;
