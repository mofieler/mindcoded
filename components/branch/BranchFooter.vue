<script setup lang="ts">
import type { BranchTheme } from '~/composables/useBranchExamples'

const props = defineProps<{
  brand: string
  theme: BranchTheme
}>()

const { locale } = useI18n()
const isDark = computed(() => props.theme.pageBg.includes('neutral-950'))
</script>

<template>
  <footer class="py-8 px-6 border-t" :class="isDark ? 'bg-neutral-950 border-neutral-800 text-neutral-400' : 'bg-slate-50 border-slate-200 text-slate-500'">
    <div class="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
      <p class="text-sm font-body text-center sm:text-left">
        © {{ new Date().getFullYear() }} {{ brand }}. {{ locale === 'de' ? 'Entwurf von Mindcoded.' : 'A design study by Mindcoded.' }}
      </p>
      <NuxtLink
        to="/"
        class="inline-flex items-center gap-1.5 text-sm font-body font-medium hover:underline"
        :class="isDark ? 'text-neutral-300' : 'text-slate-600'"
      >
        <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
          <path stroke-linecap="round" stroke-linejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
        </svg>
        {{ locale === 'de' ? 'Zurück zur Mindcoded-Website' : 'Back to the Mindcoded website' }}
      </NuxtLink>
    </div>
  </footer>
</template>
