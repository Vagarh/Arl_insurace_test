/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        /* SURA Brand — alineado con Stitch design system */
        sura: {
          navy:    '#00216e',
          deep:    '#26328C',
          blue:    '#0049cb',
          action:  '#085efe',
          light:   '#659FFF',
          pale:    '#91B8FF',
          ice:     '#dce1ff',
          frost:   '#f4f2ff',
          mist:    '#BECDDB',
          yellow:  '#e6eb2d',
        },
        brand: {
          dark:     '#191b29',
          charcoal: '#2e2f3f',
          muted:    '#444653',
          gray1:    '#747684',
          gray2:    '#c4c5d5',
          gray3:    '#e1e1f6',
          gray4:    '#edecff',
          surface:  '#fbf8ff',
          low:      '#f4f2ff',
          mid:      '#edecff',
          hi:       '#e7e6fb',
        },
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui'],
      },
      borderRadius: {
        DEFAULT: '0.25rem',
        lg: '0.5rem',
        xl: '0.75rem',
        '2xl': '1rem',
        full: '9999px',
      },
      boxShadow: {
        'card':    '0 20px 40px rgba(25,27,41,0.04)',
        'card-md': '0 8px 24px rgba(25,27,41,0.08)',
        'card-lg': '0 16px 48px rgba(0,33,110,0.12)',
        'nav':     '0 1px 3px rgba(0,33,110,0.08)',
      },
    },
  },
  plugins: [],
}
