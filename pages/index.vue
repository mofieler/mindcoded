<script setup lang="ts">
const { t, tm, rt } = useI18n()

definePageMeta({
  keepalive: true,
})

useSeo({
  title: t('meta.home_title'),
  description: t('meta.home_desc'),
})

const faqItems = computed(() => {
  const raw = tm('home.faq.items') as Array<{ q: string; a: string }>
  if (!Array.isArray(raw)) return []
  return raw.map((item) => ({
    q: typeof item.q === 'string' ? rt(item.q) : String(item.q),
    a: typeof item.a === 'string' ? rt(item.a) : String(item.a),
  }))
})

useSchemaOrg([
  defineWebPage({
    '@type': 'FAQPage',
  }),
  ...faqItems.value.map((item) =>
    defineQuestion({
      name: item.q,
      acceptedAnswer: item.a,
    }),
  ),
])
</script>

<template>
  <HomeHero />
  <LazyHomeCase hydrate-on-visible />
  <LazyBranchShowcase hydrate-on-visible />
  <LazyHomeServices hydrate-on-visible />
  <LazyHomeProcess hydrate-on-visible />
  <LazyHomeFaq hydrate-on-visible />
  <LazyHomeContact hydrate-on-visible />
</template>
