/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/frontend-ui/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-conic':
          'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',
        'gradient-shine': 'linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent)',
        'horse-pattern': 'url("/horse-bg.jpg")',
        'football-pattern': 'url("/football-bg.jpg")'
      },
      colors: {
        primary: {
          50: '#f0f9ff',
          100: '#e0f2fe',
          200: '#bae6fd',
          300: '#7dd3fc',
          400: '#38bdf8',
          500: '#0ea5e9',
          600: '#0284c7',
          700: '#0369a1',
          800: '#075985',
          900: '#0c4a6e',
        },
        racing: {
          50: '#f0fdf4',
          100: '#dcfce7',
          200: '#bbf7d0',
          300: '#86efac',
          400: '#4ade80',
          500: '#22c55e',
          600: '#16a34a',
          700: '#15803d',
          800: '#166534',
          900: '#14532d',
        },
        charcoal: {
          50: '#f8f9fa',
          100: '#ebedef',
          200: '#d0d3d8',
          300: '#b0b4bc',
          400: '#888c96',
          500: '#6e7177',
          600: '#52555c',
          700: '#3f4146',
          800: '#313238', /* Racing theme background */
          900: '#1f2023',
        },
        'racing': {
          '50': '#e6f7ff',
          '100': '#b3e5fc',
          '200': '#81d4fa',
          '300': '#4fc3f7',
          '400': '#29b6f6',
          '500': '#03a9f4',
          '600': '#039be5',
          '700': '#0288d1',
          '800': '#0277bd',
          '900': '#01579b',
        },
        'charcoal': {
          '50': '#f8f9fa',
          '100': '#e9ecef',
          '200': '#dee2e6',
          '300': '#ced4da',
          '400': '#adb5bd',
          '500': '#6c757d',
          '600': '#495057',
          '700': '#343a40',
          '800': '#212529',
          '900': '#121314',
        },
        'betting': {
          'dark': '#1A1F2C',
          'green': '#2ECE60',
          'secondary': '#26A65B',
          'gray': '#8E9196',
          'light': '#F1F1F1',
          'accent': '#F97316',
          'blue': '#0EA5E9',
          'purple': '#8B5CF6'
        }
      },
      boxShadow: {
        'inner-light': 'inset 0 2px 4px 0 rgba(0, 0, 0, 0.06)',
        'inner-dark': 'inset 0 2px 4px 0 rgba(255, 255, 255, 0.1)',
      },
      borderRadius: {
        'investment': '0.375rem',
      },
      fontFamily: {
        sans: ['Montserrat', 'sans-serif'],
        heading: ['Playfair Display', 'serif'],
        racing: ['Spartan', 'sans-serif']
      },
      keyframes: {
        'accordion-down': {
          from: {
            height: '0'
          },
          to: {
            height: 'var(--radix-accordion-content-height)'
          }
        },
        'accordion-up': {
          from: {
            height: 'var(--radix-accordion-content-height)'
          },
          to: {
            height: '0'
          }
        },
        'fade-in': {
          '0%': {
            opacity: '0',
            transform: 'translateY(10px)'
          },
          '100%': {
            opacity: '1',
            transform: 'translateY(0)'
          }
        },
        'fade-out': {
          '0%': {
            opacity: '1',
            transform: 'translateY(0)'
          },
          '100%': {
            opacity: '0',
            transform: 'translateY(10px)'
          }
        },
        'scale-in': {
          '0%': {
            transform: 'scale(0.95)',
            opacity: '0'
          },
          '100%': {
            transform: 'scale(1)',
            opacity: '1'
          }
        },
        'slide-in': {
          '0%': { 
            transform: 'translateX(-100%)', 
            opacity: '0' 
          },
          '100%': { 
            transform: 'translateX(0)', 
            opacity: '1' 
          }
        },
        float: {
          '0%, 100%': {
            transform: 'translateY(0)'
          },
          '50%': {
            transform: 'translateY(-5px)'
          }
        },
        shine: {
          '0%': { backgroundPosition: '200% 0' },
          '100%': { backgroundPosition: '-200% 0' }
        }
      },
      animation: {
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out',
        'fade-in': 'fade-in 0.6s ease-out',
        'fade-out': 'fade-out 0.6s ease-out',
        'scale-in': 'scale-in 0.6s ease-out',
        'slide-in': 'slide-in 0.6s ease-out',
        'float': 'float 3s ease-in-out infinite',
        'shine': 'shine 8s ease-in-out infinite'
      },
    },
  },
  plugins: [],
  // Enable dark mode variant based on class
  darkMode: 'class',
}; 