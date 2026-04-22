<script setup lang="ts">
const { locale } = useI18n()
const localePath = useLocalePath()
</script>

<template>
  <div class="min-h-screen flex flex-col items-center justify-center hero-grid text-center px-6">
    <div class="absolute inset-0 bg-gradient-to-b from-base/0 to-base pointer-events-none" />
    <div class="relative z-10">
      <p class="font-display font-bold text-[10rem] leading-none text-fg opacity-5 select-none">
        404
      </p>
      <p class="text-accent text-xs font-display font-semibold tracking-[0.3em] uppercase mb-4 -mt-8">
        {{ locale === 'de' ? 'Seite nicht gefunden' : 'Page not found' }}
      </p>
      <h1 class="font-display font-bold text-3xl text-fg mb-4">
        {{ locale === 'de' ? 'Diese Seite existiert nicht.' : 'This page does not exist.' }}
      </h1>
      <p class="font-body text-fg-muted mb-8">
        {{ locale === 'de'
          ? 'Vielleicht wurde sie verschoben oder gelöscht.'
          : 'It may have been moved or deleted.' }}
      </p>
      <NuxtLink
        :to="localePath('/')"
        class="inline-flex items-center gap-2 px-6 py-3 rounded-lg border border-border text-fg font-display font-semibold text-sm hover:border-accent hover:text-accent transition-all"
      >
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="w-4 h-4">
          <line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/>
        </svg>
        {{ locale === 'de' ? 'Zurück zur Startseite' : 'Back to Home' }}
      </NuxtLink>
    </div>
  </div>
</template>
