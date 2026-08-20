export function useFocusSet(length: MaybeRefOrGetter<number>, initial = 0) {
  const selected = ref(initial)
  const hovered = ref<number | null>(null)
  const focused = ref<number | null>(null)
  const finePointer = ref(false)

  const count = computed(() => toValue(length))
  const active = computed(() => {
    if (finePointer.value && hovered.value !== null) return hovered.value
    if (focused.value !== null) return focused.value
    return selected.value
  })

  onMounted(() => {
    const mq = window.matchMedia('(hover: hover) and (pointer: fine)')
    const sync = () => {
      finePointer.value = mq.matches
      if (!mq.matches) hovered.value = null
    }
    sync()
    mq.addEventListener('change', sync)
    onUnmounted(() => mq.removeEventListener('change', sync))
  })

  watch(count, (n) => {
    if (selected.value > n - 1) selected.value = Math.max(0, n - 1)
  })

  const onEnter = (index: number) => {
    if (finePointer.value) hovered.value = index
  }

  const onLeave = () => {
    hovered.value = null
  }

  const onFocus = (index: number) => {
    focused.value = index
  }

  const onBlur = () => {
    focused.value = null
  }

  const onSelect = (index: number) => {
    selected.value = index
  }

  return { selected, active, onEnter, onLeave, onFocus, onBlur, onSelect }
}
