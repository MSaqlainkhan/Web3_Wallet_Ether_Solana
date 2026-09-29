/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ['class'],
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        obsidian: {
          950: '#06080B',
          900: '#090B0E',
          850: '#0E121A',
          800: '#141A26',
          750: '#1B2333',
          700: '#232E43',
          600: '#31415F',
        },
        brand: {
          emerald: '#10B981',
          'emerald-glow': 'rgba(16, 185, 129, 0.15)',
          cyan: '#06B6D4',
          'cyan-glow': 'rgba(6, 182, 212, 0.15)',
          amber: '#F59E0B',
          'amber-glow': 'rgba(245, 158, 11, 0.15)',
          ruby: '#EF4444',
          'ruby-glow': 'rgba(239, 68, 68, 0.15)',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['JetBrains Mono', 'Menlo', 'Monaco', 'Courier New', 'monospace'],
      },
      boxShadow: {
        'glow-emerald': '0 0 24px -4px rgba(16, 185, 129, 0.3)',
        'glow-amber': '0 0 24px -4px rgba(245, 158, 11, 0.3)',
        'glow-cyan': '0 0 24px -4px rgba(6, 182, 212, 0.3)',
        'card-subtle': '0 4px 20px -2px rgba(0, 0, 0, 0.6), 0 0 0 1px rgba(255, 255, 255, 0.06)',
      },
    },
  },
  plugins: [],
};
