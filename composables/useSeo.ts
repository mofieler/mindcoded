interface SeoOptions {
  title: string
  description: string
  image?: string
  type?: 'website' | 'article'
  locale?: string
}

export const useSeo = (options: SeoOptions) => {
  const { locale } = useI18n()
  const route = useRoute()
  const siteUrl = 'https://mindcoded.studio'

  const resolvedLocale = options.locale ?? locale.value
  const canonicalUrl = `${siteUrl}${route.path}`

  useSeoMeta({
    title: options.title,
    description: options.description,
    ogTitle: options.title,
    ogDescription: options.description,
    ogImage: options.image ?? `${siteUrl}/og-default.jpg`,
    ogType: options.type ?? 'website',
    ogUrl: canonicalUrl,
    ogLocale: resolvedLocale === 'de' ? 'de_DE' : 'en_US',
    twitterCard: 'summary_large_image',
    twitterTitle: options.title,
    twitterDescription: options.description,
    twitterImage: options.image ?? `${siteUrl}/og-default.jpg`,
  })

  useHead({
    link: [{ rel: 'canonical', href: canonicalUrl }],
  })
}
