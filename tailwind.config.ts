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
        'warm-gold': '#E8A317',
        'deep-red': '#8B1A1A',
        'cream': '#FFFFFF',
        'rich-black': '#1C1410',
        'charcoal': '#2B2219',
        'smoke': '#4A3D32',
        'muted': '#B0A898',
      },
      fontFamily: {
        sans: ['-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
      borderRadius: {
        'card': '12px',
        'btn': '8px',
        'input': '8px',
      },
    },
  },
  plugins: [],
};

export default config;
