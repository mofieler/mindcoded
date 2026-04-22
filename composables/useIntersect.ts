/**
 * useIntersect – einfacher Composable für Scroll-Triggered Animationen.
 * Nutzung: const { el, isVisible } = useIntersect()
 *          <div ref="el" :class="isVisible ? 'animate-fade-up' : 'opacity-0'">
 */
export const useIntersect = (options?: IntersectionObserverInit) => {
  const el = ref<HTMLElement | null>(null)
  const isVisible = ref(false)

  onMounted(() => {
    if (!el.value) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          isVisible.value = true
          observer.disconnect() // once only – kein Toggle
        }
      },
      { threshold: 0.15, ...options }
    )
    observer.observe(el.value)
  })

  return { el, isVisible }
}
