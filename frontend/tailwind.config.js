/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: ['class', '[data-theme="dark"]'],
  theme: {
    extend: {
      colors: {
        // UnitWise Soft Neumorphic Design Tokens (Mapped to CSS variables)
        primary: {
          DEFAULT: 'var(--primary)',
          hover: 'var(--primary-hover)',
          light: 'var(--lavender-soft)',
          dark: 'var(--primary)',
          50: 'var(--lavender-soft)',
          100: 'var(--glow)',
          200: 'var(--lavender-soft)',
          500: 'var(--accent)',
          600: 'var(--primary)',
          700: 'var(--primary-hover)',
          800: 'var(--text)',
          900: 'var(--text)',
          950: 'var(--bg)',
        },
        accent: {
          DEFAULT: 'var(--accent)',
          hover: 'var(--primary-hover)',
          light: 'var(--lavender-soft)',
        },
        lavender: {
          soft: 'var(--lavender-soft)',
          glow: 'var(--glow)',
        },
        surface: {
          DEFAULT: 'var(--surface)',
          muted: 'var(--bg)',
        },
        page: {
          DEFAULT: 'var(--bg)',
        },
        bg: {
          DEFAULT: 'var(--bg)',
        },
        neu: {
          primary: 'var(--primary)',
          accent: 'var(--accent)',
          lavender: 'var(--lavender-soft)',
          bg: 'var(--bg)',
          glow: 'var(--glow)',
          surface: 'var(--surface)',
          text: 'var(--text)',
          muted: 'var(--text-muted)',
          border: 'var(--border)',
        },
        border: {
          DEFAULT: 'var(--border)',
          subtle: 'var(--border)',
        },
        text: {
          DEFAULT: 'var(--text)',
          muted: 'var(--text-muted)',
        },
        academic: {
          primary: 'var(--primary)',
          primaryHover: 'var(--primary-hover)',
          teal: 'var(--accent)',
          tealLight: 'var(--lavender-soft)',
          paleBlue: 'var(--lavender-soft)',
          bg: 'var(--bg)',
          card: 'var(--surface)',
          text: 'var(--text)',
          textSecondary: 'var(--text-muted)',
          border: 'var(--border)',
        },
      },
      borderRadius: {
        'card': '24px',
        'button': '16px',
        'input': '16px',
        '2xl': '16px',
        '3xl': '24px',
      },
      boxShadow: {
        'raised': 'var(--shadow-raised)',
        'raised-sm': 'var(--shadow-raised-sm)',
        'hover': 'var(--shadow-hover)',
        'inset': 'var(--shadow-inset)',
        'primary': 'var(--shadow-primary)',
        'card': 'var(--shadow-raised)',
        'card-hover': 'var(--shadow-hover)',
      },
      fontFamily: {
        sans: ['Plus Jakarta Sans', 'Inter', 'system-ui', '-apple-system', 'sans-serif'],
        display: ['Plus Jakarta Sans', 'Inter', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
