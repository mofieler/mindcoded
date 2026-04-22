// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  devtools: { enabled: true },

  modules: [
    '@nuxtjs/tailwindcss',
    '@nuxtjs/color-mode',
    '@nuxtjs/i18n',
    '@nuxt/image',
  ],

  // ─── Color Mode ───────────────────────────────────────────────
  colorMode: {
    classSuffix: '',          // uses .dark / .light on <html>
    preference: 'system',
    fallback: 'dark',
  },

  // ─── i18n ─────────────────────────────────────────────────────
  i18n: {
    locales: [
      {
        code: 'de',
        name: 'Deutsch'
      },
      {
        code: 'en',
        name: 'English'
      }
    ],
    defaultLocale: 'de',
    strategy: 'prefix_except_default',
    bundle: {
      optimizeTranslationDirective: false,
    },
  },

  // ─── Nuxt Image ───────────────────────────────────────────────
  image: {
    format: ['avif', 'webp'],
    quality: 80,
    screens: {
      xs: 320,
      sm: 640,
      md: 768,
      lg: 1024,
      xl: 1280,
      '2xl': 1536,
    },
  },

  // ─── SEO ──────────────────────────────────────────────────────
  site: {
    url: 'https://www.yoursite.de',
    name: 'Studio Name',
    description: 'Web Design & Development Studio',
    defaultLocale: 'de',
  },

  // ─── CSS ──────────────────────────────────────────────────────
  css: ['~/assets/css/main.css'],

  // ─── App Head ─────────────────────────────────────────────────
  app: {
    head: {
      link: [
        {
          rel: 'preconnect',
          href: 'https://fonts.googleapis.com',
        },
        {
          rel: 'preconnect',
          href: 'https://fonts.gstatic.com',
          crossorigin: '',
        },
        {
          rel: 'stylesheet',
          href: 'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;1,9..40,300&family=Cormorant+Garamond:ital,wght@0,400;0,500;0,600;1,400&family=Poppins:wght@300;400;500;600&display=swap',
        },
        {
          rel: 'icon',
          type: 'image/png',
          href: '/favicon.png',
        },
      ],
    },
  },

  compatibilityDate: '2025-01-01',
})
