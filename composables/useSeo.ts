interface SeoOptions {
  title: string
  description: string
  image?: string
  type?: 'website' | 'article'
}

export const useSeo = (options: SeoOptions) => {
  const { locale } = useI18n()
  const site = useSiteConfig()
  const siteUrl = (site.url as string) || 'https://mindcoded.studio'
  const ogImage = options.image
    ? (options.image.startsWith('http') ? options.image : `${siteUrl}${options.image.startsWith('/') ? '' : '/'}${options.image}`)
    : `${siteUrl}/media/hero-poster.webp`

  useSeoMeta({
    title: options.title,
    description: options.description,
    ogTitle: options.title,
    ogDescription: options.description,
    ogImage,
    ogType: options.type ?? 'website',
    ogLocale: locale.value === 'de' ? 'de_DE' : 'en_GB',
    twitterCard: 'summary_large_image',
    twitterTitle: options.title,
    twitterDescription: options.description,
    twitterImage: ogImage,
  })
}
