<script setup lang="ts">
const videoEl = ref<HTMLVideoElement | null>(null)
const useVideo = ref(false)
const failed = ref(false)
const playing = ref(false)

const base = useRuntimeConfig().app.baseURL
const mp4Src = `${base}media/hero.mp4`
const posterJpg = `${base}media/hero-poster.jpg`

const canPlayVideo = () => {
  if (typeof window === 'undefined') return false
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return false
  // Real phones only — a narrow desktop pane still gets the clip
  if (window.matchMedia('(max-width: 767px) and (pointer: coarse)').matches) return false
  const conn = (navigator as Navigator & { connection?: { saveData?: boolean; effectiveType?: string } }).connection
  if (conn?.saveData) return false
  if (conn?.effectiveType === 'slow-2g' || conn?.effectiveType === '2g') return false
  return true
}

const tryPlay = async () => {
  const el = videoEl.value
  if (!el || !useVideo.value || failed.value) return
  try {
    await el.play()
    playing.value = true
  } catch {
    playing.value = false
  }
}

onMounted(() => {
  if (!canPlayVideo()) return
  useVideo.value = true

  nextTick(() => {
    const el = videoEl.value
    if (!el) return

    const io = new IntersectionObserver(([entry]) => {
      if (!entry || !videoEl.value) return
      if (entry.isIntersecting) tryPlay()
      else videoEl.value.pause()
    }, { threshold: 0.08 })

    io.observe(el)
    tryPlay()
    onBeforeUnmount(() => io.disconnect())
  })
})
</script>

<template>
  <div class="hero-media pointer-events-none" aria-hidden="true">
    <img
      class="hero-media-poster"
      :src="posterJpg"
      alt=""
      width="960"
      height="540"
      fetchpriority="high"
    >

    <video
      v-if="useVideo"
      ref="videoEl"
      class="hero-media-video"
      :class="{ 'is-on': playing }"
      muted
      loop
      playsinline
      autoplay
      preload="auto"
      :poster="posterJpg"
      @error="failed = true; useVideo = false"
      @playing="playing = true"
    >
      <source :src="mp4Src" type="video/mp4">
    </video>

    <div class="hero-media-tint" />
    <div class="hero-media-fade" />
  </div>
</template>

<style scoped>
.hero-media {
  position: absolute;
  inset: 0;
  overflow: hidden;
  z-index: 0;
  background: #07080c;
}

.hero-media-poster,
.hero-media-video {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: center;
}

.hero-media-video {
  opacity: 0;
  transition: opacity 0.7s ease;
}

.hero-media-video.is-on {
  opacity: 1;
}

/* Dark clip: lift so cyan lines read on cream and on charcoal */
.hero-media-poster,
.hero-media-video {
  filter: brightness(1.22) contrast(1.1) saturate(1.15);
}

.dark .hero-media-poster,
.dark .hero-media-video {
  filter: brightness(1.45) contrast(1.14) saturate(1.22);
}

.hero-media-tint {
  position: absolute;
  inset: 0;
  background:
    linear-gradient(
      to bottom,
      rgb(var(--color-base) / 0.14) 0%,
      transparent 20%,
      transparent 64%,
      rgb(var(--color-base) / 0.22) 100%
    ),
    rgb(var(--color-accent) / 0.08);
}

.dark .hero-media-tint {
  background:
    linear-gradient(
      to bottom,
      rgb(var(--color-base) / 0.12) 0%,
      transparent 22%,
      transparent 58%,
      rgb(var(--color-base) / 0.4) 100%
    ),
    rgb(var(--color-accent) / 0.14);
}

.hero-media-fade {
  position: absolute;
  inset: auto 0 0;
  height: 28%;
  background: linear-gradient(to bottom, transparent, rgb(var(--color-base)));
}
</style>
