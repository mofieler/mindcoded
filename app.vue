<template>
  <NuxtLayout>
    <NuxtPage />
  </NuxtLayout>
</template>

<script setup lang="ts">
const { t, locale } = useI18n()
const studio = useStudio()

const i18nHead = useLocaleHead({ seo: true })

useHead(() => ({
  htmlAttrs: {
    lang: i18nHead.value.htmlAttrs?.lang,
  },
  link: [...(i18nHead.value.link || [])],
  meta: [...(i18nHead.value.meta || [])],
}))

useSchemaOrg([
  defineWebSite({
    name: 'mindcoded',
    description: () => t('meta.home_desc'),
    inLanguage: () => (locale.value === 'de' ? 'de-DE' : 'en-GB'),
  }),
  defineLocalBusiness({
    '@type': 'ProfessionalService',
    name: 'mindcoded',
    description: () => t('meta.home_desc'),
    url: 'https://mindcoded.studio',
    email: studio.email,
    telephone: studio.phone,
    address: {
      streetAddress: 'Sautterweg 30',
      addressLocality: 'Stuttgart',
      postalCode: '70565',
      addressCountry: 'DE',
    },
    areaServed: 'DE',
  }),
])
</script>
