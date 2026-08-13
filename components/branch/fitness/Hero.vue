<script setup lang="ts">
import type { BranchPageContent, BranchTheme } from '~/composables/useBranchExamples'
import { motion } from 'motion-v'
import { getFitnessCopy } from '~/utils/fitnessData'

const props = defineProps<{
  hero: BranchPageContent['hero']
  theme: BranchTheme
}>()

const { locale } = useI18n()
const reduced = useReducedMotion()
const copy = computed(() => getFitnessCopy(locale.value === 'en' ? 'en' : 'de'))
const slides = computed(() => props.hero.gallery?.length ? props.hero.gallery : [props.hero.image].filter(Boolean))
const slide = ref(0)

onMounted(() => {
  if (reduced.value || slides.value.length < 2) return
  const timer = window.setInterval(() => {
    slide.value = (slide.value + 1) % slides.value.length
  }, 6500)
  onBeforeUnmount(() => clearInterval(timer))
})
</script>

<template>
  <section class="relative min-h-[100svh] flex items-center overflow-hidden pt-16 bg-neutral-950">
    <div class="absolute inset-0">
      <div
        v-for="(src, i) in slides"
        :key="src"
        class="absolute inset-0 transition-opacity duration-[1400ms]"
        :class="i === slide ? 'opacity-100' : 'opacity-0'"
      >
        <img :src="src" :alt="hero.headline.join(' ')" class="w-full h-full object-cover" :class="reduced ? '' : 'animate-kenburns'">
      </div>
      <div class="absolute inset-0 bg-neutral-950/70" />
      <div class="absolute inset-0 bg-gradient-to-t from-neutral-950 via-neutral-950/40 to-lime-400/5" />
      <div class="absolute -bottom-24 -right-16 w-80 h-80 rounded-full bg-lime-400/15 blur-3xl pointer-events-none" />
      <div class="absolute top-24 -left-10 w-56 h-56 rounded-full bg-orange-500/10 blur-3xl pointer-events-none" />
    </div>

    <div class="relative z-10 max-w-6xl mx-auto px-6 w-full py-20">
      <span class="inline-flex items-center gap-2 px-3 py-1 rounded-full text-[11px] font-body font-semibold mb-8 border border-lime-400/30 bg-lime-400/10 text-lime-300">
        <span class="w-1.5 h-1.5 rounded-full bg-lime-400 animate-pulse" />
        {{ hero.badge }}
      </span>

      <h1 class="font-display font-extrabold text-5xl sm:text-7xl lg:text-8xl leading-[0.92] text-white mb-6">
        <motion.span
          v-for="(line, i) in hero.headline"
          :key="line"
          class="block"
          :initial="reduced ? false : { opacity: 0, y: 40, skewY: 4 }"
          :animate="{ opacity: 1, y: 0, skewY: 0 }"
          :transition="{ duration: 0.55, delay: i * 0.12, ease: 'easeOut' }"
        >
          <span :class="i === hero.headline.length - 1 ? 'text-lime-400' : ''">{{ line }}</span>
        </motion.span>
      </h1>

      <motion.p
        class="max-w-xl text-lg sm:text-xl font-body text-neutral-300 mb-10"
        :initial="reduced ? false : { opacity: 0, y: 16 }"
        :animate="{ opacity: 1, y: 0 }"
        :transition="{ delay: 0.4, duration: 0.5 }"
      >
        {{ hero.sub }}
      </motion.p>

      <motion.div
        class="flex flex-col sm:flex-row gap-3"
        :initial="reduced ? false : { opacity: 0, y: 16 }"
        :animate="{ opacity: 1, y: 0 }"
        :transition="{ delay: 0.5, duration: 0.5 }"
      >
        <a
          href="#trial"
          class="inline-flex items-center justify-center min-h-[48px] px-7 rounded-xl bg-lime-400 text-neutral-950 font-display font-extrabold text-sm sm:text-base animate-pulse-glow hover:bg-lime-300 transition-colors"
        >
          {{ copy.trialCta }}
        </a>
        <a
          href="#membership"
          class="inline-flex items-center justify-center min-h-[48px] px-7 rounded-xl border border-white/20 text-white font-display font-bold text-sm hover:border-orange-400 hover:text-orange-300 transition-colors"
        >
          {{ copy.trialSecondary }}
        </a>
      </motion.div>
    </div>
  </section>
</template>
