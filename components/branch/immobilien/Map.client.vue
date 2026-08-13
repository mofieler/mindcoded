<script setup lang="ts">
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import type { PropertyListing } from '~/utils/immobilienData'

const props = defineProps<{
  properties: PropertyListing[]
  hoveredId: string | null
  selectedId: string | null
}>()

const emit = defineEmits<{
  hover: [id: string | null]
  select: [id: string]
}>()

const mapEl = ref<HTMLElement | null>(null)
let map: L.Map | null = null
const markers = new Map<string, L.Marker>()

const pinHtml = (active: boolean) =>
  `<div class="pin" style="${active ? 'transform:scale(1.3);background:#b45309' : ''}"></div>`

const makeIcon = (active: boolean) =>
  L.divIcon({
    className: `boeckler-pin${active ? ' is-active' : ''}`,
    html: pinHtml(active),
    iconSize: [18, 18],
    iconAnchor: [9, 9],
  })

const syncMarkers = () => {
  if (!map) return
  const keep = new Set(props.properties.map((p) => p.id))
  for (const [id, marker] of markers) {
    if (!keep.has(id)) {
      marker.remove()
      markers.delete(id)
    }
  }
  for (const p of props.properties) {
    const active = p.id === props.hoveredId || p.id === props.selectedId
    let marker = markers.get(p.id)
    if (!marker) {
      marker = L.marker([p.lat, p.lng], { icon: makeIcon(active) })
        .addTo(map)
        .bindTooltip(p.title, { direction: 'top', offset: [0, -10] })
      marker.on('mouseover', () => emit('hover', p.id))
      marker.on('mouseout', () => emit('hover', null))
      marker.on('click', () => emit('select', p.id))
      markers.set(p.id, marker)
    } else {
      marker.setIcon(makeIcon(active))
      marker.setLatLng([p.lat, p.lng])
    }
  }

  if (props.properties.length) {
    const bounds = L.latLngBounds(props.properties.map((p) => [p.lat, p.lng] as [number, number]))
    map.fitBounds(bounds, { padding: [32, 32], maxZoom: 14 })
  }
}

onMounted(() => {
  if (!mapEl.value) return
  map = L.map(mapEl.value, {
    zoomControl: true,
    scrollWheelZoom: false,
    attributionControl: true,
  }).setView([52.52, 13.4], 12)

  L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
    attribution: '&copy; OpenStreetMap &copy; CARTO',
    maxZoom: 19,
  }).addTo(map)

  syncMarkers()
  requestAnimationFrame(() => map?.invalidateSize())
})

watch(() => [props.properties, props.hoveredId, props.selectedId], syncMarkers, { deep: true })

onBeforeUnmount(() => {
  map?.remove()
  map = null
  markers.clear()
})
</script>

<template>
  <div ref="mapEl" class="w-full h-full min-h-[320px]" />
</template>
