<script setup lang="ts">
const { t } = useI18n()
const localePath = useLocalePath()
</script>

<template>
  <section id="services" class="border-t border-border">
    <div class="max-w-6xl mx-auto px-6 pt-16 sm:pt-20 pb-8">
      <UiSectionHeader
        :eyebrow="t('services.eyebrow')"
        :title="t('services.title')"
        :sub="t('services.sub')"
      />

      <div class="mt-10">
        <UiServiceList />
      </div>

      <UiTextLink :to="localePath('/solutions')" class="mt-8">
        {{ t('services.more') }}
      </UiTextLink>
    </div>
  </section>
</template>
