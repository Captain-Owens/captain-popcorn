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
        'cream': '#FAF3E0',
        'rich-black': '#1C1410',
        'charcoal': '#2B2219',
        'smoke': '#3D3228',
        'muted': '#8A8A7A',
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
