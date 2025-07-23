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
        // TableTalk Radar Ultra-Dark SaaS Theme
        brand: {
          'primary': '#8B0000',      // Dark Red
          'light': '#DC143C',        // Light Red
          'deep': '#660000',         // Deep Red
          'accent': '#FF6B6B',       // Accent Red
          'error': '#FF0000',        // Error Red
          'gradient': 'linear-gradient(135deg, #8B0000 0%, #DC143C 100%)',
        },
        // Ultra-dark theme colors
        dark: {
          50: '#0a0a0a',            // Almost black
          100: '#121212',           // True dark background
          200: '#1a1a1a',           // Card backgrounds
          300: '#262626',           // Borders and dividers
          400: '#404040',           // Disabled text
          500: '#525252',           // Secondary text
          600: '#737373',           // Primary text light
          700: '#a3a3a3',           // Very light text
          800: '#d4d4d4',           // Near white
          900: '#f5f5f5',           // Pure white
        },
        // Enhanced slate for depth
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
          850: '#1a202c',           // Extra dark
          900: '#0f1419',           // Ultra dark
          950: '#020617',           // Nearly black
        },
        // Modern glass effect colors
        glass: {
          'bg': 'rgba(18, 18, 18, 0.8)',
          'border': 'rgba(255, 255, 255, 0.1)',
          'hover': 'rgba(255, 255, 255, 0.05)',
        },
        success: '#10b981',          // Modern green
        warning: '#f59e0b',          // Modern amber
        info: '#3b82f6',             // Modern blue
        purple: '#8b5cf6',           // Modern purple accent
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