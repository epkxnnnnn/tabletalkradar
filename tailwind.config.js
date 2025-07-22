/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // TableTalk Radar Dark Red Brand Colors
        brand: {
          'primary': '#8B0000',      // Dark Red
          'light': '#DC143C',        // Light Red
          'deep': '#660000',         // Deep Red
          'accent': '#FF6B6B',       // Accent Red
          'error': '#FF0000',        // Error Red
        },
        // Dark theme colors
        slate: {
          50: '#f8fafc',
          100: '#f1f5f9',
          200: '#e2e8f0',
          300: '#cbd5e1',
          400: '#94a3b8',
          500: '#64748b',
          600: '#475569',
          700: '#334155',
          800: '#1e293b',
          900: '#0f172a',
        },
        // Supporting colors
        gray: {
          'primary': '#2D3748',      // Primary text
          'secondary': '#4A5568',    // Secondary text
          'light': '#F7FAFC',        // Background
        },
        success: '#38A169',          // Success indicators
        warning: '#F6AD55',          // Warning states
        info: '#3182CE',             // Information and links
      },
      fontFamily: {
        'inter': ['Inter', 'sans-serif'],
      },
      fontSize: {
        'display': '2.5rem',         // 40px - H1
        'heading': '2rem',           // 32px - H2
        'subheading': '1.5rem',      // 24px - H3
        'card-title': '1.25rem',     // 20px - H4
      },
      borderRadius: {
        'card': '12px',
        'button': '8px',
      },
      boxShadow: {
        'card': '0 4px 12px rgba(0, 0, 0, 0.3)',
        'brand': '0 0 0 1px rgba(139, 0, 0, 0.1)',
      },
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
    require('@tailwindcss/typography'),
  ],
}