<script setup lang="ts">
const videoEl = ref<HTMLVideoElement | null>(null)
const reduced = ref(false)
const on = ref(false)

const src = '/media/hero.mp4'
const poster = '/media/hero-poster.jpg'

let retry = 0
let cap = 0

const arm = (el: HTMLVideoElement) => {
  el.muted = true
  el.defaultMuted = true
  el.loop = true
  el.autoplay = true
  el.playsInline = true
  el.setAttribute('playsinline', '')
  el.setAttribute('webkit-playsinline', '')
  el.setAttribute('muted', '')
}

const kick = async () => {
  const el = videoEl.value
  if (!el || reduced.value) return
  arm(el)
  if (el.ended) el.currentTime = 0
  try {
    await el.play()
    on.value = true
  } catch {
    on.value = !el.paused
  }
}

const onReady = () => kick()
const onEnded = () => {
  const el = videoEl.value
  if (!el) return
  el.currentTime = 0
  kick()
}
const onVisible = () => {
  if (!document.hidden) kick()
}
const onPointer = () => kick()

onMounted(() => {
  reduced.value = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  const el = videoEl.value
  if (!el) return

  if (reduced.value) {
    el.pause()
    return
  }

  kick()
  el.addEventListener('canplay', onReady)
  el.addEventListener('loadeddata', onReady)
  el.addEventListener('ended', onEnded)
  document.addEventListener('visibilitychange', onVisible)
  window.addEventListener('pointerdown', onPointer, { once: true })

  retry = window.setInterval(() => {
    if (!videoEl.value?.paused) {
      window.clearInterval(retry)
      return
    }
    kick()
  }, 500)
  cap = window.setTimeout(() => window.clearInterval(retry), 10000)
})

onActivated(() => kick())

onBeforeUnmount(() => {
  const el = videoEl.value
  el?.removeEventListener('canplay', onReady)
  el?.removeEventListener('loadeddata', onReady)
  el?.removeEventListener('ended', onEnded)
  document.removeEventListener('visibilitychange', onVisible)
  window.clearInterval(retry)
  window.clearTimeout(cap)
})
</script>

<template>
  <div class="hero-media pointer-events-none" aria-hidden="true">
    <img
      class="hero-media-poster"
      :src="poster"
      alt=""
      width="960"
      height="540"
      fetchpriority="high"
    >

    <video
      ref="videoEl"
      class="hero-media-video"
      :class="{ 'is-on': on && !reduced }"
      muted
      loop
      autoplay
      playsinline
      preload="auto"
      :src="src"
      :poster="poster"
      @playing="on = true"
      @play="on = true"
    />

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
  transition: opacity 0.45s ease;
}

.hero-media-video.is-on {
  opacity: 1;
}

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
