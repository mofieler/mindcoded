import Lenis from 'lenis'
import 'lenis/dist/lenis.css'

/**
 * Smooth scrolling for the whole site.
 *
 * Wheel and keyboard input is interpolated by Lenis. Touch input deliberately
 * keeps its native momentum (`syncTouch: false`) — re-synthesising it on
 * iOS/Android feels heavier and less predictable than the real thing. The
 * scroll-linked animations get their smoothness from their own damping, so they
 * feel the same on both input types.
 */
export default defineNuxtPlugin((nuxtApp) => {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

  const lenis = new Lenis({
    autoRaf: true,
    lerp: 0.08,
    smoothWheel: true,
    syncTouch: false,
    touchMultiplier: 1.5,
    // Lenis turns off native `scroll-behavior: smooth`, so let it animate
    // same-page anchors instead. Offset clears the fixed nav (h-16).
    anchors: { offset: -80 },
    stopInertiaOnNavigate: true,
  })

  // Page content changes height — let Lenis recalculate its limits.
  nuxtApp.hook('page:finish', () => {
    requestAnimationFrame(() => lenis.resize())
  })

  nuxtApp.hook('app:unmounted', () => lenis.destroy())

  return {
    provide: { lenis },
  }
})
