<script setup lang="ts">
const { t } = useI18n()
const localePath = useLocalePath()
const { branches } = useBranchExamples()

const sectionEl = ref<HTMLElement | null>(null)
const slots: HTMLElement[] = []

const setSlotRef = (el: unknown, index: number) => {
  if (el instanceof HTMLElement) slots[index] = el
}

/**
 * Scroll-linked motion for the gallery.
 *
 * Two values per card, both eased with a frame-rate independent spring-ish
 * damping so the motion keeps gliding after the finger or wheel stops — that is
 * what makes it feel smooth on touch, where scroll events arrive in bursts:
 *
 *   enter   0 → 1  as the card rises into the viewport (all screen sizes)
 *   covered 0 → 1  while the next card slides over it (sticky stack, ≥ md)
 *
 * Reads are batched ahead of writes, and only transform/opacity are touched, so
 * no frame forces a layout.
 */
type CardMotion = { enter: number; covered: number }

const motion: CardMotion[] = []
const target: CardMotion[] = []

let raf = 0
let last = 0
let running = false
let stacked = false
let reduced = false
let primed = false

const clamp01 = (v: number) => (v < 0 ? 0 : v > 1 ? 1 : v)

const applyIdentity = () => {
  for (const slot of slots) {
    const card = slot?.firstElementChild as HTMLElement | null
    if (!card) continue
    card.style.transform = ''
    card.style.opacity = ''
  }
}

const tick = (now: number) => {
  raf = running ? requestAnimationFrame(tick) : 0

  const dt = Math.min(0.05, (now - last) / 1000 || 0.016)
  last = now

  // Frame-rate independent lerp: ~equivalent to lerp 0.14 at 60fps. The very
  // first frame snaps, so cards already on screen at boot don't flash.
  const alpha = primed ? 1 - Math.exp(-9 * dt) : 1
  primed = true
  const viewport = window.innerHeight

  // ── read ──────────────────────────────────────────────────────────
  const rects = slots.map((slot) => slot?.getBoundingClientRect() ?? null)

  // ── write ─────────────────────────────────────────────────────────
  for (let i = 0; i < slots.length; i++) {
    const card = slots[i]?.firstElementChild as HTMLElement | null
    const rect = rects[i]
    if (!card || !rect) continue

    const next = rects[i + 1]
    const t = target[i]
    t.enter = clamp01((viewport - rect.top) / (viewport * 0.55))
    t.covered = stacked && next
      ? clamp01((rect.bottom - next.top) / (rect.height || 1))
      : 0

    const m = motion[i]
    m.enter += (t.enter - m.enter) * alpha
    m.covered += (t.covered - m.covered) * alpha

    const rest = 1 - m.enter
    const scale = (1 - m.covered * 0.05) * (1 - rest * 0.035)
    const shift = m.covered * -10 + rest * 34

    card.style.transform = `translate3d(0, ${shift.toFixed(2)}px, 0) scale(${scale.toFixed(4)})`
    card.style.opacity = `${clamp01(1 - m.covered * 0.18 - rest * 0.85).toFixed(3)}`
  }
}

const start = () => {
  if (running || reduced) return
  running = true
  last = performance.now()
  raf = requestAnimationFrame(tick)
}

const stop = () => {
  running = false
  if (raf) cancelAnimationFrame(raf)
  raf = 0
}

let motionQuery: MediaQueryList | null = null
let stackQuery: MediaQueryList | null = null

const syncMedia = () => {
  reduced = !!motionQuery?.matches
  stacked = !!stackQuery?.matches && !reduced
  if (reduced) {
    stop()
    applyIdentity()
  }
}

onMounted(() => {
  for (let i = 0; i < slots.length; i++) {
    motion[i] = { enter: 0, covered: 0 }
    target[i] = { enter: 0, covered: 0 }
  }

  motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
  stackQuery = window.matchMedia('(min-width: 768px)')
  syncMedia()

  motionQuery.addEventListener('change', syncMedia)
  stackQuery.addEventListener('change', syncMedia)

  // Only spend frames while the gallery is actually on screen.
  const observer = new IntersectionObserver(
    ([entry]) => (entry?.isIntersecting ? start() : stop()),
    { rootMargin: '20% 0px 20% 0px' },
  )
  if (sectionEl.value) observer.observe(sectionEl.value)

  onBeforeUnmount(() => {
    observer.disconnect()
    motionQuery?.removeEventListener('change', syncMedia)
    stackQuery?.removeEventListener('change', syncMedia)
    stop()
  })
})
</script>

<template>
  <section ref="sectionEl" class="border-t border-border">
    <div class="max-w-7xl mx-auto px-6 pt-24 pb-12">
      <!-- Section header -->
      <div class="text-center max-w-2xl mx-auto">
        <p class="text-accent text-xs font-display font-semibold tracking-[0.3em] uppercase mb-4">
          {{ t('home.design_studios_eyebrow') }}
        </p>
        <h2 class="font-display font-bold text-3xl sm:text-4xl text-fg mb-4">
          {{ t('home.design_studios_title') }}
        </h2>
        <p class="font-body text-fg-muted leading-relaxed">
          {{ t('home.design_studios_sub') }}
        </p>
      </div>
    </div>

    <!-- Vertical scroll gallery: sticky cards that stack as you scroll -->
    <div class="branch-stack max-w-6xl mx-auto px-6">
      <div
        v-for="(branch, index) in branches"
        :key="branch.id"
        :ref="(el) => setSlotRef(el, index)"
        class="branch-slot"
        :style="{ '--i': index, zIndex: index + 1 }"
      >
        <NuxtLink
          :to="localePath(`/beispiele/${branch.id}`)"
          class="branch-card group grid md:grid-cols-2 rounded-3xl border border-border bg-surface overflow-hidden shadow-2xl shadow-black/20 hover:border-accent/40 transition-colors duration-300"
        >
          <!-- Image -->
          <div class="relative overflow-hidden bg-muted aspect-[16/10] md:aspect-auto md:min-h-[26rem]">
            <NuxtImg
              :src="branch.image"
              :alt="branch.name"
              class="absolute inset-0 w-full h-full object-cover object-top transition-transform duration-700 ease-out group-hover:scale-[1.04]"
              loading="lazy"
              format="webp"
              width="900"
              height="600"
            />
            <div class="absolute inset-0 bg-gradient-to-t from-surface/50 via-transparent to-transparent pointer-events-none" />
            <span
              class="absolute top-5 left-5 inline-flex items-center justify-center px-2.5 py-1 rounded-lg text-[11px] font-display font-bold tracking-widest border backdrop-blur-sm"
              :class="branch.accentClass"
            >
              {{ String(index + 1).padStart(2, '0') }}
            </span>
          </div>

          <!-- Content -->
          <div class="flex flex-col justify-center p-8 sm:p-10">
            <p class="text-accent text-[11px] font-display font-semibold tracking-[0.25em] uppercase mb-3">
              {{ branch.category }}
            </p>

            <h3 class="font-display font-bold text-2xl sm:text-3xl text-fg group-hover:text-accent transition-colors mb-3">
              {{ branch.name }}
            </h3>

            <p class="branch-desc font-body text-sm sm:text-base leading-relaxed mb-6">
              {{ branch.description }}
            </p>

            <ul class="space-y-2 mb-6">
              <li
                v-for="feature in branch.features"
                :key="feature"
                class="branch-feature flex items-start gap-2 font-body text-sm"
              >
                <svg class="w-4 h-4 mt-0.5 shrink-0 text-accent" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
                </svg>
                {{ feature }}
              </li>
            </ul>

            <div class="flex flex-wrap gap-1.5 mb-7">
              <span
                v-for="tag in branch.tags"
                :key="tag"
                class="px-2.5 py-0.5 rounded-full text-[10px] font-body bg-muted text-fg-muted border border-border"
              >
                {{ tag }}
              </span>
            </div>

            <span class="inline-flex items-center gap-1.5 text-sm font-body font-semibold text-accent">
              {{ t('home.design_studios_view') }}
              <svg class="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </span>
          </div>
        </NuxtLink>
      </div>
    </div>

    <!-- Footer / disclaimer -->
    <div class="max-w-7xl mx-auto px-6 pt-16 pb-24">
      <div class="flex flex-col sm:flex-row items-center justify-between gap-6 rounded-2xl border border-border bg-surface p-6 sm:p-8">
        <p class="text-sm font-body text-fg-muted max-w-xl text-center sm:text-left">
          {{ t('home.design_studios_disclaimer') }}
        </p>
        <NuxtLink
          :to="localePath('/contact')"
          class="inline-flex items-center gap-2 shrink-0 px-6 py-3 rounded-xl bg-accent text-white font-display font-bold text-sm shadow-lg hover:shadow-xl hover:shadow-accent/30 transition-all hover:scale-105"
        >
          {{ t('home.design_studios_cta') }}
          <svg class="h-4 w-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
          </svg>
        </NuxtLink>
      </div>
    </div>
  </section>
</template>

<style scoped>
.branch-stack {
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

.branch-slot {
  position: relative;
}

.branch-card {
  transform-origin: 50% 0%;
  will-change: transform, opacity;
  backface-visibility: hidden;
}

/* Body copy is set straight off the theme tokens rather than via Tailwind
   opacity modifiers, so it can never end up unreadable if a utility is missing
   — and it tracks light/dark automatically. */
.branch-desc {
  color: rgb(var(--color-fg) / 0.82);
}

.branch-feature {
  color: rgb(var(--color-fg) / 0.78);
}

@media (min-width: 768px) {
  .branch-stack {
    gap: 4rem;
  }

  /* Each card parks slightly lower than the one before it, so the stack keeps a
     visible edge of every card underneath. */
  .branch-slot {
    position: sticky;
    top: calc(6rem + var(--i) * 1.25rem);
  }

  /* Room for the last card to settle before the disclaimer arrives. */
  .branch-stack::after {
    content: '';
    display: block;
    height: 20vh;
  }
}

@media (prefers-reduced-motion: reduce) {
  .branch-slot {
    position: static;
  }

  .branch-card {
    will-change: auto;
    transition: none;
  }
}
</style>
