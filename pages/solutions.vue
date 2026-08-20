<script setup lang="ts">
const { t } = useI18n()
const localePath = useLocalePath()

useSeo({
  title: t('meta.solutions_title'),
  description: t('meta.solutions_desc'),
})
</script>

<template>
  <section>
    <div class="max-w-6xl mx-auto px-6 pt-8 sm:pt-12 pb-8">
      <UiSectionHeader
        heading="h1"
        :eyebrow="t('services.eyebrow')"
        :title="t('services.title')"
        :sub="t('services.sub')"
      />

      <div class="mt-10">
        <UiServiceList expandable heading="h2" />
      </div>
    </div>
  </section>

  <HomeProcess />

  <UiCtaBlock
    :eyebrow="t('nav.contact')"
    :title="t('services.cta_title')"
    :sub="t('services.cta_sub')"
    :to="localePath('/contact')"
    :cta="t('nav.cta')"
  />
</template>
