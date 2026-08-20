<script setup lang="ts">
const { t } = useI18n()

definePageMeta({
  keepalive: true,
})

useSeo({
  title: t('meta.home_title'),
  description: t('meta.home_desc'),
})
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
