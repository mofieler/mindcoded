import type { Config } from 'tailwindcss'

export default {
  darkMode: 'class',
  content: [
    './components/**/*.{js,vue,ts}',
    './layouts/**/*.vue',
    './pages/**/*.vue',
    './composables/**/*.{js,ts}',
    './app.vue',
  ],
  theme: {
    extend: {
      // ── Fonts ───────────────────────────────────────────────
      fontFamily: {
        display: ['Instrument Sans', 'system-ui', 'sans-serif'],
        body: ['Source Sans 3', 'system-ui', 'sans-serif'],
        mono: ['ui-monospace', 'SFMono-Regular', 'Menlo', 'monospace'],
      },

      // ── Colors (mirror CSS variables for Tailwind utilities) ─
      colors: {
        accent: 'rgb(var(--color-accent) / <alpha-value>)',
        'on-accent': 'rgb(var(--color-on-accent) / <alpha-value>)',
        surface: 'rgb(var(--color-surface) / <alpha-value>)',
        base: 'rgb(var(--color-base) / <alpha-value>)',
        muted: 'rgb(var(--color-muted) / <alpha-value>)',
        border: 'rgb(var(--color-border) / <alpha-value>)',
        fg: 'rgb(var(--color-fg) / <alpha-value>)',
        'fg-muted': 'rgb(var(--color-fg-muted) / <alpha-value>)',
      },

      // ── Spacing ─────────────────────────────────────────────
      spacing: {
        'nav': '4.5rem',
      },

      // ── Animation ───────────────────────────────────────────
      keyframes: {
        fadeUp: {
          '0%': { opacity: '0', transform: 'translateY(16px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
      },
      animation: {
        'fade-up': 'fadeUp 0.7s cubic-bezier(0.16, 1, 0.3, 1) forwards',
        'fade-in': 'fadeIn 0.45s cubic-bezier(0.16, 1, 0.3, 1) forwards',
      },
    },
  },
  plugins: [],
  safelist: [
    // Branch accent colors (used dynamically in components/branch/*)
    { pattern: /^(bg|text|border|hover:border|hover:shadow)-(lime-400|sky-500|rose-500|amber-500|amber-600|indigo-600)(\/\d+)?$/ },
    'bg-lime-400/10', 'bg-lime-400/20', 'hover:shadow-lime-400/15',
    'bg-sky-500/10', 'bg-sky-500/20', 'hover:shadow-sky-500/15',
    'bg-rose-500/10', 'bg-rose-500/20', 'hover:shadow-rose-500/15',
    'bg-amber-500/10', 'bg-amber-500/20', 'hover:shadow-amber-500/15',
    'bg-amber-600/10', 'bg-amber-600/20', 'hover:shadow-amber-600/15',
    'bg-indigo-600/10', 'bg-indigo-600/20', 'hover:shadow-indigo-600/15',
  ],
} satisfies Config
