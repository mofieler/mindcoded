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
        display: ['Inter', 'system-ui', 'sans-serif'],
        body: ['DM Sans', 'sans-serif'],
      },

      // ── Colors (mirror CSS variables for Tailwind utilities) ─
      colors: {
        accent: 'rgb(var(--color-accent) / <alpha-value>)',
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
          '0%': { opacity: '0', transform: 'translateY(24px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        kenburns: {
          '0%': { transform: 'scale(1) translate(0, 0)' },
          '100%': { transform: 'scale(1.14) translate(-2%, -1.5%)' },
        },
        pulseGlow: {
          '0%, 100%': { boxShadow: '0 0 0 0 rgba(163, 230, 53, 0.45)' },
          '50%': { boxShadow: '0 0 28px 6px rgba(163, 230, 53, 0.28)' },
        },
        heartPop: {
          '0%': { transform: 'scale(1)' },
          '40%': { transform: 'scale(1.25)' },
          '100%': { transform: 'scale(1)' },
        },
      },
      animation: {
        'fade-up': 'fadeUp 0.6s ease forwards',
        'fade-in': 'fadeIn 0.4s ease forwards',
        kenburns: 'kenburns 18s ease-in-out infinite alternate',
        'pulse-glow': 'pulseGlow 2.4s ease-in-out infinite',
        'heart-pop': 'heartPop 0.45s ease',
      },
    },
  },
  plugins: [],
  safelist: [
    // Branch accent colors (used dynamically in components/branch/*)
    { pattern: /^(bg|text|border|hover:border|hover:shadow)-(lime-400|orange-500|sky-500|rose-500|amber-500|amber-600|indigo-600)(\/\d+)?$/ },
    'bg-lime-400/10', 'bg-lime-400/20', 'hover:shadow-lime-400/15',
    'bg-orange-500/10', 'bg-orange-500/20', 'text-orange-400', 'border-orange-500/30',
    'bg-sky-500/10', 'bg-sky-500/20', 'hover:shadow-sky-500/15',
    'bg-rose-500/10', 'bg-rose-500/20', 'hover:shadow-rose-500/15',
    'bg-amber-500/10', 'bg-amber-500/20', 'hover:shadow-amber-500/15',
    'bg-amber-600/10', 'bg-amber-600/20', 'hover:shadow-amber-600/15',
    'bg-indigo-600/10', 'bg-indigo-600/20', 'hover:shadow-indigo-600/15',
  ],
} satisfies Config
