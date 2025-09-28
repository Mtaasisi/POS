/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // LATS Brand Colors - Modern Professional Palette
        primary: {
          50: '#f0f9ff',   // Light blue tint
          100: '#e0f2fe',  // Very light blue
          200: '#bae6fd',  // Light blue
          300: '#7dd3fc',  // Medium light blue
          400: '#38bdf8',  // Medium blue
          500: '#0ea5e9',  // Primary blue (main brand)
          600: '#0284c7',  // Darker blue
          700: '#0369a1',  // Dark blue
          800: '#075985',  // Very dark blue
          900: '#0c4a6e',  // Darkest blue
          950: '#082f49',  // Ultra dark blue
        },
        
        // Secondary Colors - Complementary Palette
        secondary: {
          50: '#f8fafc',   // Light slate
          100: '#f1f5f9',  // Very light slate
          200: '#e2e8f0',  // Light slate
          300: '#cbd5e1',  // Medium light slate
          400: '#94a3b8',  // Medium slate
          500: '#64748b',  // Primary slate
          600: '#475569',  // Darker slate
          700: '#334155',  // Dark slate
          800: '#1e293b',  // Very dark slate
          900: '#0f172a',  // Darkest slate
          950: '#020617',  // Ultra dark slate
        },
        
        // Accent Colors - Success, Warning, Error
        success: {
          50: '#f0fdf4',   // Light green
          100: '#dcfce7',  // Very light green
          200: '#bbf7d0',  // Light green
          300: '#86efac',  // Medium light green
          400: '#4ade80',  // Medium green
          500: '#22c55e',  // Primary green
          600: '#16a34a',  // Darker green
          700: '#15803d',  // Dark green
          800: '#166534',  // Very dark green
          900: '#14532d',  // Darkest green
          950: '#052e16',  // Ultra dark green
        },
        
        warning: {
          50: '#fffbeb',   // Light amber
          100: '#fef3c7',  // Very light amber
          200: '#fde68a',  // Light amber
          300: '#fcd34d',  // Medium light amber
          400: '#fbbf24',  // Medium amber
          500: '#f59e0b',  // Primary amber
          600: '#d97706',  // Darker amber
          700: '#b45309',  // Dark amber
          800: '#92400e',  // Very dark amber
          900: '#78350f',  // Darkest amber
          950: '#451a03',  // Ultra dark amber
        },
        
        error: {
          50: '#fef2f2',   // Light red
          100: '#fee2e2',  // Very light red
          200: '#fecaca',  // Light red
          300: '#fca5a5',  // Medium light red
          400: '#f87171',  // Medium red
          500: '#ef4444',  // Primary red
          600: '#dc2626',  // Darker red
          700: '#b91c1c',  // Dark red
          800: '#991b1b',  // Very dark red
          900: '#7f1d1d',  // Darkest red
          950: '#450a0a',  // Ultra dark red
        },
        
        // Neutral Colors - Enhanced grays
        neutral: {
          50: '#fafafa',   // Light gray
          100: '#f5f5f5',  // Very light gray
          200: '#e5e5e5',  // Light gray
          300: '#d4d4d4',  // Medium light gray
          400: '#a3a3a3',  // Medium gray
          500: '#737373',  // Primary gray
          600: '#525252',  // Darker gray
          700: '#404040',  // Dark gray
          800: '#262626',  // Very dark gray
          900: '#171717',  // Darkest gray
          950: '#0a0a0a',  // Ultra dark gray
        },
        
        // Specialized Colors for LATS
        lats: {
          // Customer Care Colors
          'customer-care': {
            50: '#f0f9ff',
            100: '#e0f2fe',
            500: '#0ea5e9',
            600: '#0284c7',
            700: '#0369a1',
          },
          
          // POS Colors
          'pos': {
            50: '#f0fdf4',
            100: '#dcfce7',
            500: '#22c55e',
            600: '#16a34a',
            700: '#15803d',
          },
          
          // Inventory Colors
          'inventory': {
            50: '#faf5ff',
            100: '#f3e8ff',
            500: '#8b5cf6',
            600: '#7c3aed',
            700: '#6d28d9',
          },
          
          // Analytics Colors
          'analytics': {
            50: '#fff7ed',
            100: '#ffedd5',
            500: '#f97316',
            600: '#ea580c',
            700: '#c2410c',
          },
          
          // Finance Colors
          'finance': {
            50: '#ecfdf5',
            100: '#d1fae5',
            500: '#10b981',
            600: '#059669',
            700: '#047857',
          },
        },
        
        // Status Colors - Semantic
        status: {
          active: '#22c55e',      // Green
          inactive: '#6b7280',    // Gray
          pending: '#f59e0b',     // Amber
          processing: '#3b82f6',  // Blue
          completed: '#10b981',   // Emerald
          cancelled: '#ef4444',   // Red
          warning: '#f59e0b',     // Amber
          error: '#ef4444',       // Red
          info: '#3b82f6',        // Blue
        },
      },
      
      // Enhanced spacing for better design system
      spacing: {
        '18': '4.5rem',
        '88': '22rem',
        '128': '32rem',
      },
      
      // Enhanced shadows for modern design
      boxShadow: {
        'soft': '0 2px 15px -3px rgba(0, 0, 0, 0.07), 0 10px 20px -2px rgba(0, 0, 0, 0.04)',
        'medium': '0 4px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
        'large': '0 10px 40px -10px rgba(0, 0, 0, 0.15), 0 2px 10px -2px rgba(0, 0, 0, 0.05)',
        'glow': '0 0 20px rgba(59, 130, 246, 0.15)',
        'glow-green': '0 0 20px rgba(34, 197, 94, 0.15)',
        'glow-red': '0 0 20px rgba(239, 68, 68, 0.15)',
      },
      
      // Enhanced border radius
      borderRadius: {
        'xl': '0.75rem',
        '2xl': '1rem',
        '3xl': '1.5rem',
      },
      
      // Enhanced typography
      fontSize: {
        '2xs': ['0.625rem', { lineHeight: '0.75rem' }],
        '3xl': ['1.875rem', { lineHeight: '2.25rem' }],
        '4xl': ['2.25rem', { lineHeight: '2.5rem' }],
      },
      
      // Enhanced animations
      animation: {
        'fade-in': 'fadeIn 0.5s ease-in-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'slide-down': 'slideDown 0.3s ease-out',
        'scale-in': 'scaleIn 0.2s ease-out',
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
      
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        slideDown: {
          '0%': { transform: 'translateY(-10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        scaleIn: {
          '0%': { transform: 'scale(0.95)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
      },
    },
  },
  plugins: [],
}