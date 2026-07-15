import type { Config } from 'tailwindcss';

/**
 * Design tokens for the Kerala Ayurveda Ashwagandha PDP. Warm, botanical, and
 * editorial — clay + forest with a saffron accent for primary actions — to read
 * as premium for an Ayurvedic brand without copying any single reference site.
 * Marcellus (display) over Figtree (body) via CSS vars (see globals.css).
 */
const config: Config = {
  content: ['./src/**/*.{ts,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        // Warm neutrals / paper.
        clay: {
          50: '#faf6f1',
          100: '#f2e9df',
          200: '#e4d3c1',
          300: '#d0b298',
          400: '#b98d6d',
          500: '#a67352',
          600: '#8f5d41',
          700: '#754a37',
          800: '#5f3d30',
          900: '#4f342a',
        },
        // Botanical greens (trust, benefit accents).
        forest: {
          50: '#f3f6f2',
          100: '#e2ebe0',
          200: '#c5d7c2',
          300: '#9cba97',
          400: '#6f976a',
          500: '#4f7a4a',
          600: '#3c6138',
          700: '#314e2f',
          800: '#293f28',
          900: '#233522',
        },
        // Saffron — primary CTA + selected states.
        saffron: {
          50: '#fdf6ec',
          100: '#f8e6c8',
          200: '#f0cd90',
          300: '#e6ad55',
          400: '#dd9333',
          500: '#c9781f',
          600: '#a95d19',
          700: '#874619',
          800: '#6f391a',
          900: '#5d3018',
        },
      },
      fontFamily: {
        sans: ['var(--font-sans)', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        serif: ['var(--font-serif)', 'ui-serif', 'Georgia', 'serif'],
      },
      borderRadius: {
        xl: '0.875rem',
        '2xl': '1.25rem',
        '3xl': '1.75rem',
      },
      boxShadow: {
        soft: '0 1px 2px rgba(79,52,42,0.04), 0 8px 24px -12px rgba(79,52,42,0.18)',
        lift: '0 2px 4px rgba(79,52,42,0.06), 0 18px 40px -16px rgba(79,52,42,0.28)',
        ring: '0 0 0 3px rgba(221,147,51,0.35)',
      },
      transitionTimingFunction: {
        'out-expo': 'cubic-bezier(0.16, 1, 0.3, 1)',
        emphasized: 'cubic-bezier(0.05, 0.7, 0.1, 1)',
      },
      keyframes: {
        shimmer: {
          '100%': { transform: 'translateX(100%)' },
        },
      },
      animation: {
        shimmer: 'shimmer 1.4s infinite',
      },
    },
  },
  plugins: [],
};

export default config;
