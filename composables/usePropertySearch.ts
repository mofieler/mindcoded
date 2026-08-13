import type { ListingType, PropertyListing } from '~/utils/immobilienData'
import { immobilienOrigin } from '~/utils/immobilienData'

export interface PropertyFilters {
  location: string
  radius: number
  listingType: 'all' | ListingType
  rooms: number
  priceMax: number
}

export const defaultPropertyFilters = (): PropertyFilters => ({
  location: '',
  radius: 0,
  listingType: 'all',
  rooms: 0,
  priceMax: 0,
})

const toRad = (deg: number) => (deg * Math.PI) / 180

export const haversineKm = (
  a: { lat: number; lng: number },
  b: { lat: number; lng: number },
) => {
  const R = 6371
  const dLat = toRad(b.lat - a.lat)
  const dLng = toRad(b.lng - a.lng)
  const sinLat = Math.sin(dLat / 2)
  const sinLng = Math.sin(dLng / 2)
  const h = sinLat * sinLat + Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * sinLng * sinLng
  return 2 * R * Math.asin(Math.min(1, Math.sqrt(h)))
}

export const usePropertySearch = (properties: MaybeRefOrGetter<PropertyListing[]>) => {
  const filters = useState<PropertyFilters>('boeckler-filters', defaultPropertyFilters)
  const hoveredId = useState<string | null>('boeckler-hovered', () => null)
  const selectedId = useState<string | null>('boeckler-selected', () => null)

  const origin = computed(() => {
    const list = toValue(properties)
    if (filters.value.location) {
      const match = list.find((p) => p.location === filters.value.location)
      if (match) return { lat: match.lat, lng: match.lng }
    }
    return immobilienOrigin
  })

  const filtered = computed(() => {
    const list = toValue(properties)
    const f = filters.value
    return list.filter((p) => {
      if (f.location && p.location !== f.location) return false
      if (f.listingType !== 'all' && p.listingType !== f.listingType) return false
      if (f.rooms > 0 && p.rooms > 0 && p.rooms < f.rooms) return false
      if (f.priceMax > 0 && p.price > f.priceMax) return false
      if (f.radius > 0 && haversineKm(origin.value, p) > f.radius) return false
      return true
    })
  })

  const applyAndScroll = (partial?: Partial<PropertyFilters>) => {
    if (partial) filters.value = { ...filters.value, ...partial }
    if (import.meta.client) {
      document.getElementById('properties')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }

  return { filters, filtered, hoveredId, selectedId, origin, applyAndScroll }
}

export const useTrialPrefill = () =>
  useState<{ course: string; plan: string }>('ironpulse-prefill', () => ({ course: '', plan: '' }))
