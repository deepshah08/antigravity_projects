/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: '#f48225',
        background: '#121212',
        surface: '#1e1e1e',
        textMain: '#ffffff',
        textMuted: '#a0a0a0',
      },
      fontFamily: {
        sans: ['Outfit', 'sans-serif'],
      },
      borderRadius: {
        DEFAULT: '0.75rem',
        'lg': '0.75rem',
        'xl': '1rem',
      },
      typography: (theme) => ({
        orange: {
          css: {
            '--tw-prose-body': theme('colors.textMain'),
            '--tw-prose-headings': '#ffffff',
            '--tw-prose-lead': theme('colors.textMuted'),
            '--tw-prose-links': theme('colors.primary'),
            '--tw-prose-bold': '#ffffff',
            '--tw-prose-counters': theme('colors.primary'),
            '--tw-prose-bullets': theme('colors.primary'),
            '--tw-prose-hr': theme('colors.surface'),
            '--tw-prose-quotes': theme('colors.textMuted'),
            '--tw-prose-quote-borders': theme('colors.primary'),
            '--tw-prose-captions': theme('colors.textMuted'),
            '--tw-prose-code': theme('colors.primary'),
            '--tw-prose-pre-code': theme('colors.textMain'),
            '--tw-prose-pre-bg': '#000000',
            '--tw-prose-th-borders': theme('colors.surface'),
            '--tw-prose-td-borders': theme('colors.surface'),
          },
        },
      }),
    },
  },
  plugins: [
    require('@tailwindcss/typography'),
  ],
}
