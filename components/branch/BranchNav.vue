<script setup lang="ts">
import type { BranchPageContent, BranchTheme } from '~/composables/useBranchExamples'

const props = defineProps<{
  nav: BranchPageContent['nav']
  theme: BranchTheme
}>()

const { t } = useI18n()
const localePath = useLocalePath()
const scrolled = ref(false)

onMounted(() => {
  const onScroll = () => { scrolled.value = window.scrollY > 40 }
  window.addEventListener('scroll', onScroll, { passive: true })
  onScroll()
  onUnmounted(() => window.removeEventListener('scroll', onScroll))
})

const isDarkPage = computed(() => props.theme.pageBg.includes('neutral-950'))
const scrolledSurface = computed(() => isDarkPage.value ? 'bg-neutral-900/95 border-neutral-800' : 'bg-white/95 border-slate-200/80')
const scrolledText = computed(() => isDarkPage.value ? 'text-white' : props.theme.pageText)
</script>

<template>
  <nav
    class="fixed top-0 left-0 right-0 z-50 transition-all duration-300 border-b backdrop-blur-md"
    :class="scrolled ? [scrolledSurface, scrolledText] : ['bg-transparent border-transparent text-white']"
  >
    <div class="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between gap-4">
      <div class="flex items-center gap-3">
        <NuxtLink
          :to="localePath('/')"
          class="inline-flex items-center gap-1.5 text-sm font-body font-medium opacity-90 hover:opacity-100 transition-opacity"
        >
          <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
          </svg>
          {{ t('branch.back') }}
        </NuxtLink>
        <span class="w-px h-4 bg-current opacity-20" />
        <span class="font-display font-bold text-lg tracking-tight">{{ nav.brand }}</span>
      </div>

      <div class="hidden md:flex items-center gap-6">
        <a
          v-for="link in nav.links"
          :key="link.href"
          :href="link.href"
          class="text-sm font-body opacity-85 hover:opacity-100 transition-opacity"
        >
          {{ link.label }}
        </a>
      </div>

      <a
        href="#contact"
        class="px-4 py-2 rounded-lg text-sm font-display font-semibold transition-all hover:scale-105 shadow-sm"
        :class="`bg-${theme.accent} ${theme.accentText}`"
      >
        {{ nav.cta }}
      </a>
    </div>
  </nav>
</template>
