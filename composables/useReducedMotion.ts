export const useReducedMotion = () => {
  const reduced = ref(false)

  onMounted(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    reduced.value = mq.matches
    const onChange = () => { reduced.value = mq.matches }
    mq.addEventListener('change', onChange)
    onBeforeUnmount(() => mq.removeEventListener('change', onChange))
  })

  return reduced
}
