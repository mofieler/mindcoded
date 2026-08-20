/**
 * Resolve an i18n array of objects (or strings) through `tm` + `rt`.
 * Keeps section copy in locale JSON instead of hardcoded in components.
 */
export function useI18nEntries<T extends Record<string, unknown>>(key: string) {
  const { tm, rt } = useI18n()

  const resolve = (value: unknown): unknown => {
    if (typeof value === 'string') return rt(value)
    if (Array.isArray(value)) return value.map(resolve)
    return value
  }

  return computed<T[]>(() => {
    const raw = tm(key) as unknown
    if (!Array.isArray(raw)) return []

    return raw.map((item) => {
      if (item && typeof item === 'object') {
        const out: Record<string, unknown> = {}
        for (const [k, v] of Object.entries(item as Record<string, unknown>)) {
          out[k] = resolve(v)
        }
        return out as T
      }
      return { value: resolve(item) } as T
    })
  })
}
