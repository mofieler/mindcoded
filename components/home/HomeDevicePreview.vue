<script setup lang="ts">
const props = withDefaults(defineProps<{
  desktopSrc?: string
  mobileSrc?: string
  url?: string
  alt?: string
  priority?: boolean
}>(), {
  priority: false,
  url: 'ihre-marke.de',
  alt: '',
})

const { t } = useI18n()
const desktopFailed = ref(false)
const mobileFailed = ref(false)

const showDesktopImage = computed(() => Boolean(props.desktopSrc) && !desktopFailed.value)
const showMobileImage = computed(() => Boolean(props.mobileSrc) && !mobileFailed.value)
</script>

<template>
  <div
    class="preview-stage relative w-full max-w-lg mx-auto lg:max-w-none"
    role="img"
    :aria-label="alt"
  >
    <div class="preview-glow" aria-hidden="true" />

    <div class="preview-desktop relative rounded-xl border border-border/80 bg-surface overflow-hidden">
      <div class="flex items-center gap-2 px-3 py-2 border-b border-border/80 bg-muted/80">
        <span class="flex gap-[5px] pl-0.5" aria-hidden="true">
          <span class="h-[7px] w-[7px] rounded-full bg-[#FF5F57]/80" />
          <span class="h-[7px] w-[7px] rounded-full bg-[#FEBC2E]/80" />
          <span class="h-[7px] w-[7px] rounded-full bg-[#28C840]/80" />
        </span>
        <span class="flex-1 font-mono text-[10px] text-fg-muted tracking-wide truncate mx-6 px-3 py-[3px] rounded-md bg-base/90 text-center">
          {{ url }}
        </span>
        <span class="w-8" aria-hidden="true" />
      </div>

      <div class="aspect-[16/10] bg-base relative">
        <NuxtImg
          v-if="showDesktopImage"
          :src="desktopSrc"
          :alt="alt"
          class="w-full h-full object-cover object-top"
          :preload="priority"
          :loading="priority ? 'eager' : 'lazy'"
          format="webp"
          width="960"
          height="600"
          sizes="(min-width: 1024px) 520px, 90vw"
          @error="desktopFailed = true"
        />

        <div v-else class="absolute inset-0" aria-hidden="true">
          <HomeHeroMark />
          <p class="absolute left-4 bottom-3 sm:left-5 sm:bottom-4 font-display font-semibold text-sm sm:text-base text-fg leading-snug whitespace-pre-line max-w-[11rem] pointer-events-none">
            {{ t('home.hero_preview_line') }}
          </p>
        </div>
      </div>
    </div>

    <div class="preview-phone hidden sm:block" aria-hidden="true">
      <div class="rounded-[1.35rem] border border-border/80 bg-surface p-[3px] overflow-hidden">
        <div class="relative rounded-[1.15rem] overflow-hidden bg-base aspect-[9/19]">
          <div class="absolute top-1.5 left-1/2 -translate-x-1/2 h-2.5 w-8 rounded-full bg-muted z-10" />

          <NuxtImg
            v-if="showMobileImage"
            :src="mobileSrc"
            alt=""
            class="w-full h-full object-cover object-top"
            loading="lazy"
            format="webp"
            width="280"
            height="500"
            @error="mobileFailed = true"
          />

          <HomeHeroMark v-else />
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.preview-stage {
  perspective: 1600px;
  padding-right: 1.5rem;
  padding-bottom: 3rem;
}

.preview-glow {
  position: absolute;
  inset: 12% 8% 8% 18%;
  background: radial-gradient(ellipse at center, rgb(var(--color-accent) / 0.22), transparent 70%);
  filter: blur(32px);
  pointer-events: none;
  z-index: 0;
}

.preview-desktop {
  position: relative;
  z-index: 1;
  transform: rotateY(-10deg) rotateX(5deg);
  transform-origin: 50% 60%;
  box-shadow:
    0 2px 4px rgb(0 0 0 / 0.12),
    0 24px 40px -24px rgb(0 0 0 / 0.55),
    0 48px 80px -36px rgb(var(--color-accent) / 0.22);
  transition: transform 0.7s cubic-bezier(0.22, 1, 0.36, 1);
}

.preview-phone {
  position: absolute;
  z-index: 2;
  right: -0.35rem;
  top: 22%;
  width: 29%;
  transform: rotateY(-10deg) rotateX(5deg) translateZ(28px);
  transform-origin: center bottom;
  transition: transform 0.7s cubic-bezier(0.22, 1, 0.36, 1);
  filter:
    drop-shadow(0 16px 24px rgb(0 0 0 / 0.4))
    drop-shadow(0 0 20px rgb(var(--color-accent) / 0.12));
}

.preview-stage:hover .preview-desktop {
  transform: rotateY(-6deg) rotateX(3deg);
}

.preview-stage:hover .preview-phone {
  transform: rotateY(-6deg) rotateX(3deg) translateZ(36px) translateY(-4px);
}

@media (prefers-reduced-motion: reduce) {
  .preview-desktop,
  .preview-phone {
    transform: none;
    transition: none;
  }

  .preview-stage:hover .preview-desktop,
  .preview-stage:hover .preview-phone {
    transform: none;
  }
}
</style>
