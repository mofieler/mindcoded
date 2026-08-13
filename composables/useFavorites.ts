export const useFavorites = (storageKey = 'boeckler-favorites') => {
  const ids = useState<string[]>(storageKey, () => [])
  const ready = useState(`${storageKey}-ready`, () => false)

  onMounted(() => {
    if (ready.value) return
    try {
      const raw = localStorage.getItem(storageKey)
      if (raw) ids.value = JSON.parse(raw) as string[]
    } catch {
      ids.value = []
    }
    ready.value = true
  })

  watch(ids, (next) => {
    if (!import.meta.client || !ready.value) return
    localStorage.setItem(storageKey, JSON.stringify(next))
  }, { deep: true })

  const has = (id: string) => ids.value.includes(id)

  const toggle = (id: string) => {
    ids.value = has(id) ? ids.value.filter((x) => x !== id) : [...ids.value, id]
  }

  return { ids, has, toggle, ready }
}
