<script setup lang="ts">
import type { BranchPageContent, BranchTheme } from '~/composables/useBranchExamples'

const props = defineProps<{
  hero: BranchPageContent['hero']
  theme: BranchTheme
}>()

const isDark = computed(() => props.theme.pageBg.includes('neutral-950'))
</script>

<template>
  <section class="relative min-h-[90vh] flex items-center justify-center overflow-hidden pt-16">
    <div v-if="hero.image" class="absolute inset-0 z-0">
      <NuxtImg
        :src="hero.image"
        :alt="hero.headline.join(' ')"
        class="w-full h-full object-cover"
        format="webp"
        width="1600"
        height="900"
      />
      <div class="absolute inset-0" :class="theme.heroGradient" />
    </div>
    <div v-else class="absolute inset-0 z-0" :class="theme.heroGradient" />

    <div class="relative z-10 max-w-5xl mx-auto px-6 text-center">
      <span
        class="inline-block px-3 py-1 rounded-full text-xs font-body font-semibold mb-6 backdrop-blur-sm"
        :class="isDark ? 'bg-white/10 text-white border border-white/20' : 'bg-white/20 text-white border border-white/30'"
      >
        {{ hero.badge }}
      </span>

      <h1 class="font-display font-extrabold text-5xl sm:text-6xl lg:text-7xl leading-[1.05] mb-6" :class="theme.heroText">
        <span v-for="(line, i) in hero.headline" :key="i" class="block">{{ line }}</span>
      </h1>

      <p class="max-w-2xl mx-auto text-lg sm:text-xl font-body mb-10 opacity-90" :class="theme.heroText">
        {{ hero.sub }}
      </p>

      <div class="flex flex-wrap items-center justify-center gap-4">
        <a
          v-for="(cta, i) in hero.ctas"
          :key="i"
          href="#contact"
          class="px-8 py-4 rounded-xl font-display font-bold text-base transition-all hover:scale-105"
          :class="cta.primary
            ? `bg-${theme.accent} ${theme.accentText} shadow-lg`
            : `border-2 border-white/60 ${theme.heroText} hover:bg-white/10`"
        >
          {{ cta.text }}
        </a>
      </div>
    </div>
  </section>
</template>
