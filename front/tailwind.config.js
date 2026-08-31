/*
 * Simorgh Iranian Smart Technology Co.
 * شرکت سیمرغ فناوری هوشمند ایرانیان
 *
 * Municipal Project Portfolio Management System
 * Copyright (c) 2025 Simorgh Iranian Smart Technology Co. All rights reserved.
 */

export default {content: [
  './index.html',
  './src/**/*.{js,ts,jsx,tsx}'
],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans: ['Vazirmatn', 'IRANYekan', 'system-ui', 'sans-serif'],
      },
      colors: {
        navy: {
          50: '#E8EAF6',
          100: '#C5CAE9',
          200: '#9FA8DA',
          300: '#7986CB',
          400: '#5C6BC0',
          500: '#3F51B5',
          600: '#303F9F',
          700: '#283593',
          800: '#1A237E',
          900: '#121A5C',
        },
        amber: {
          50: '#FFF8E1',
          100: '#FFECB3',
          200: '#FFE082',
          300: '#FFD54F',
          400: '#FFB300',
          500: '#FF8F00',
          600: '#EF6C00',
          700: '#E65100',
          800: '#BF360C',
          900: '#8C2A00',
        },
        canvas: '#F5F7FA',
        surface: '#FFFFFF',
        ink: {
          900: '#0F1535',
          700: '#3A4066',
          500: '#6B7290',
          300: '#A7ADC4',
        },
        night: {
          900: '#121212',
          800: '#181A20',
          700: '#1F2229',
          600: '#2A2E38',
        },
      },
      borderRadius: {
        DEFAULT: '12px',
        lg: '12px',
        xl: '16px',
        '2xl': '20px',
      },
      boxShadow: {
        soft: '0 4px 20px rgba(0,0,0,0.05)',
        card: '0 2px 10px rgba(16,24,64,0.06)',
        lift: '0 12px 32px rgba(16,24,64,0.12)',
        glow: '0 0 0 4px rgba(255,143,0,0.18), 0 8px 24px rgba(255,143,0,0.35)',
      },
      spacing: {
        18: '4.5rem',
        70: '17.5rem',
      },
    },
  },
  plugins: [],
}
