<script setup lang="ts">
import type { PropertyListing, ImmobilienCopy } from '~/utils/immobilienData'

const props = defineProps<{
  property: PropertyListing
  copy: ImmobilienCopy
  active?: boolean
}>()

const emit = defineEmits<{
  open: [id: string]
  hover: [id: string | null]
}>()

const { has, toggle } = useFavorites()
const reduced = useReducedMotion()
const popping = ref(false)

const onFav = (e: Event) => {
  e.stopPropagation()
  popping.value = true
  toggle(props.property.id)
  window.setTimeout(() => { popping.value = false }, 450)
}
</script>

<template>
  <article
    class="group rounded-2xl overflow-hidden border bg-white border-stone-200 shadow-sm hover:shadow-xl hover:-translate-y-0.5 transition-all cursor-pointer"
    :class="active ? 'ring-2 ring-amber-600' : ''"
    @click="emit('open', property.id)"
    @mouseenter="emit('hover', property.id)"
    @mouseleave="emit('hover', null)"
  >
    <div class="relative aspect-[4/3] overflow-hidden">
      <img :src="property.image" :alt="property.title" class="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105">
      <span class="absolute top-3 left-3 px-2.5 py-1 rounded-md text-[11px] font-body font-semibold bg-white/92 text-stone-900">{{ property.tag }}</span>
      <button
        type="button"
        class="absolute top-3 right-3 w-11 h-11 rounded-full bg-white/90 text-stone-700 flex items-center justify-center hover:bg-white"
        :class="popping ? 'animate-heart-pop' : ''"
        :aria-label="has(property.id) ? copy.unfavorite : copy.favorite"
        @click="onFav"
      >
        <svg class="w-5 h-5" :class="has(property.id) ? 'text-rose-500' : 'text-stone-500'" :fill="has(property.id) ? 'currentColor' : 'none'" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.8">
          <path stroke-linecap="round" stroke-linejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
        </svg>
      </button>
    </div>
    <div class="p-4 sm:p-5">
      <p class="text-xs font-body text-stone-500 mb-1">{{ property.location }} · {{ property.typeLabel }}</p>
      <h3 class="font-display font-bold text-lg text-stone-900 mb-2">{{ property.title }}</h3>
      <div class="flex items-center gap-3 text-xs font-body text-stone-500 mb-3">
        <span>{{ property.roomsLabel }}</span>
        <span>{{ property.area }}</span>
      </div>
      <div class="flex items-center justify-between gap-3">
        <p class="font-display font-bold text-amber-700">{{ property.priceLabel }}</p>
        <span class="text-xs font-display font-semibold text-amber-700 group-hover:underline">{{ copy.expose }}</span>
      </div>
    </div>
  </article>
</template>
