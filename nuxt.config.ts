// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  devtools: { enabled: process.env.NODE_ENV !== 'production' },

  modules: [
    '@nuxtjs/i18n',
    '@nuxtjs/seo',
    '@nuxtjs/tailwindcss',
    '@nuxtjs/color-mode',
    '@nuxt/image',
  ],

  // ─── Color Mode ───────────────────────────────────────────────
  colorMode: {
    classSuffix: '',          // uses .dark / .light on <html>
    preference: 'light',
    fallback: 'light',
  },

  // ─── i18n ─────────────────────────────────────────────────────
  i18n: {
    locales: [
      {
        code: 'de',
        language: 'de-DE',
        name: 'Deutsch',
      },
      {
        code: 'en',
        language: 'en-GB',
        name: 'English',
      },
    ],
    defaultLocale: 'de',
    strategy: 'prefix_except_default',
    baseUrl: 'https://mindcoded.studio',
    detectBrowserLanguage: false,
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
    url: 'https://mindcoded.studio',
    name: 'mindcoded',
    description: 'Wir gestalten und entwickeln Websites, Web-Apps, Buchungssysteme und Online-Shops für Studios, Praxen, Gastronomie und inhabergeführte Betriebe.',
    defaultLocale: 'de',
  },

  sitemap: {
    sitemaps: false,
    xsl: false,
    exclude: [
      '/optin', '/en/optin', '/confirm', '/en/confirm',
      '/beispiele/zahnarzt', '/en/beispiele/zahnarzt',
      '/beispiele/restaurant', '/en/beispiele/restaurant',
    ],
    urls: [
      {
        loc: '/projects/paquita-pilates',
        _i18nTransform: true,
      },
      {
        loc: '/beispiele/fitnessstudio',
        _i18nTransform: true,
      },
      {
        loc: '/beispiele/immobilien',
        _i18nTransform: true,
      },
    ],
  },

  robots: {
    disallow: ['/optin', '/confirm', '/beispiele/zahnarzt', '/beispiele/restaurant'],
  },

  // nuxt-og-image causes unenv path errors — disabled since we don't use it
  ogImage: { enabled: false },

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
          href: 'https://fonts.googleapis.com/css2?family=Instrument+Sans:wght@400;500;600;700&family=Source+Sans+3:ital,wght@0,400;0,500;0,600;1,400&family=Cormorant+Garamond:ital,wght@0,400;0,500;0,600;1,400&family=Poppins:wght@300;400;500;600&display=swap',
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

  // ─── Runtime Config ───────────────────────────────────────────
  runtimeConfig: {
    resendApiKey: process.env.RESEND_API_KEY,
    resendFromEmail: process.env.RESEND_FROM_EMAIL || 'noreply@mindcoded.studio',
    databaseUrl: process.env.DATABASE_URL,
    adminEmail: process.env.ADMIN_EMAIL || 'moritzfieler@icloud.com',
    siteUrl: process.env.SITE_URL || 'https://mindcoded.studio',
    recaptchaSecretKey: process.env.RECAPTCHA_SECRET_KEY,
    public: {
      recaptchaSiteKey: process.env.RECAPTCHA_SITE_KEY,
    },
  },
})
