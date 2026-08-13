<script setup lang="ts">
import type { BranchPageContent, BranchTheme } from '~/composables/useBranchExamples'
import { motion } from 'motion-v'
import { getImmobilienCopy } from '~/utils/immobilienData'

const props = defineProps<{
  hero: BranchPageContent['hero']
  theme: BranchTheme
}>()

const { locale } = useI18n()
const reduced = useReducedMotion()
const { applyAndScroll } = usePropertySearch([])
const copy = computed(() => getImmobilienCopy(locale.value === 'en' ? 'en' : 'de'))

const slides = computed(() => props.hero.gallery?.length ? props.hero.gallery : [props.hero.image].filter(Boolean))
const slide = ref(0)
const showVideo = ref(false)

onMounted(async () => {
  if (props.hero.video) {
    try {
      const res = await fetch(props.hero.video, { method: 'HEAD' })
      showVideo.value = res.ok
    } catch {
      showVideo.value = false
    }
  }

  if (reduced.value || slides.value.length < 2) return
  const timer = window.setInterval(() => {
    slide.value = (slide.value + 1) % slides.value.length
  }, 7000)
  onBeforeUnmount(() => clearInterval(timer))
})
</script>

<template>
  <section class="relative min-h-[100svh] flex items-end justify-center overflow-hidden pt-16 pb-8">
    <div class="absolute inset-0 z-0">
      <video
        v-if="showVideo && hero.video"
        class="absolute inset-0 w-full h-full object-cover"
        autoplay
        muted
        loop
        playsinline
        :poster="hero.image"
      >
        <source :src="hero.video" type="video/mp4">
      </video>
      <template v-else>
        <div
          v-for="(src, i) in slides"
          :key="src"
          class="absolute inset-0 transition-opacity duration-[1600ms]"
          :class="i === slide ? 'opacity-100' : 'opacity-0'"
        >
          <img
            :src="src"
            :alt="hero.headline.join(' ')"
            class="w-full h-full object-cover"
            :class="reduced ? '' : 'animate-kenburns'"
          >
        </div>
      </template>
      <div class="absolute inset-0 bg-gradient-to-t from-stone-950 via-stone-950/55 to-stone-900/25" />
      <div class="absolute inset-0 bg-gradient-to-r from-stone-950/70 via-transparent to-amber-950/20" />
    </div>

    <div class="relative z-10 w-full max-w-6xl mx-auto px-4 sm:px-6">
      <motion.div
        class="max-w-2xl mb-8 sm:mb-10"
        :initial="reduced ? false : { opacity: 0, y: 24 }"
        :animate="{ opacity: 1, y: 0 }"
        :transition="{ duration: 0.7, ease: 'easeOut' }"
      >
        <span class="inline-block px-3 py-1 rounded-full text-[11px] font-body font-semibold mb-5 backdrop-blur-sm bg-white/15 text-white border border-white/25">
          {{ hero.badge }}
        </span>
        <h1 class="font-display font-extrabold text-4xl sm:text-6xl lg:text-7xl leading-[1.05] text-white mb-5">
          <span v-for="(line, i) in hero.headline" :key="i" class="block">{{ line }}</span>
        </h1>
        <p class="max-w-xl text-base sm:text-lg font-body text-white/85">
          {{ hero.sub }}
        </p>
      </motion.div>

      <motion.div
        class="glass-search rounded-3xl p-4 sm:p-5"
        :initial="reduced ? false : { opacity: 0, y: 32 }"
        :animate="{ opacity: 1, y: 0 }"
        :transition="{ duration: 0.7, delay: 0.15, ease: 'easeOut' }"
      >
        <BranchImmobilienSearchBar
          :copy="copy"
          variant="glass"
          :locale="locale === 'en' ? 'en' : 'de'"
          @search="applyAndScroll()"
        />
      </motion.div>
    </div>
  </section>
</template>
