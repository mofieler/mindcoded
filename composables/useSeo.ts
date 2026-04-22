/**
 * useSeo – zentrale SEO-Logik.
 * Einmal hier konfiguriert, überall wiederverwendbar.
 */

interface SeoOptions {
  title: string
  description: string
  image?: string
  type?: 'website' | 'article'
}

export const useSeo = (options: SeoOptions) => {
  const { locale } = useI18n()

  useSeoMeta({
    title: options.title,
    description: options.description,
    ogTitle: options.title,
    ogDescription: options.description,
    ogImage: options.image ?? '/og-default.jpg',
    ogType: options.type ?? 'website',
    ogLocale: locale.value === 'de' ? 'de_DE' : 'en_US',
    twitterCard: 'summary_large_image',
    twitterTitle: options.title,
    twitterDescription: options.description,
    twitterImage: options.image ?? '/og-default.jpg',
  })
}
