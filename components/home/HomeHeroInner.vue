<script setup lang="ts">
const { t } = useI18n()
const localePath = useLocalePath()
</script>

<template>
  <div class="hero-inner relative z-[2] w-full max-w-3xl mx-auto px-6 py-28 text-center">
    <div class="hero-copy rounded-[2rem] px-6 py-10 sm:px-12 sm:py-14 bg-base/80 dark:bg-base/70 backdrop-blur-md border border-border/60">
      <p class="text-accent text-xs font-display font-semibold tracking-[0.28em] uppercase mb-5">
        {{ t('home.hero_eyebrow') }}
      </p>
      <h1 class="font-display font-bold text-4xl sm:text-5xl lg:text-[3.35rem] text-fg leading-[1.08] whitespace-pre-line mb-5">
        {{ t('home.hero_title') }}
      </h1>
      <p class="font-body text-lg text-fg-muted max-w-lg mx-auto mb-9">
        {{ t('home.hero_sub') }}
      </p>
      <div class="flex flex-wrap gap-3 justify-center">
        <NuxtLink :to="localePath('/contact')" class="btn-primary">
          {{ t('home.hero_cta_primary') }}
        </NuxtLink>
        <NuxtLink :to="localePath('/') + '#examples'" class="btn-ghost">
          {{ t('home.hero_cta_secondary') }}
        </NuxtLink>
      </div>
    </div>
  </div>
</template>
