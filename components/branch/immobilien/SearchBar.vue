<script setup lang="ts">
import type { ListingType } from '~/utils/immobilienData'
import type { ImmobilienCopy } from '~/utils/immobilienData'
import { getImmobilienLocations } from '~/utils/immobilienData'

const props = defineProps<{
  copy: ImmobilienCopy
  variant?: 'glass' | 'solid'
  locale: 'de' | 'en'
}>()

const emit = defineEmits<{
  search: []
}>()

const { filters } = usePropertySearch([])

const locations = getImmobilienLocations()
const radii = [2, 5, 10, 25]
const roomOptions = [1, 2, 3, 4, 5]

const types: { id: 'all' | ListingType; de: string; en: string }[] = [
  { id: 'all', de: 'Alle', en: 'All' },
  { id: 'buy', de: 'Kauf', en: 'Buy' },
  { id: 'rent', de: 'Miete', en: 'Rent' },
  { id: 'commercial', de: 'Gewerbe', en: 'Commercial' },
]

const priceCeiling = computed(() => {
  if (filters.value.listingType === 'rent' || filters.value.listingType === 'commercial') return 8000
  return 3000000
})

const priceStep = computed(() => (priceCeiling.value > 20000 ? 50000 : 250))

watch(() => filters.value.listingType, () => {
  if (filters.value.priceMax > priceCeiling.value) filters.value.priceMax = 0
})

const formatMax = computed(() => {
  if (!filters.value.priceMax) return props.locale === 'de' ? 'offen' : 'open'
  return props.locale === 'de'
    ? filters.value.priceMax.toLocaleString('de-DE') + ' EUR'
    : 'EUR ' + filters.value.priceMax.toLocaleString('en-GB')
})

const fieldClass = computed(() =>
  props.variant === 'solid'
    ? 'bg-white border-stone-200 text-stone-900'
    : 'bg-white/10 border-white/20 text-white placeholder-white/60',
)

const labelClass = computed(() =>
  props.variant === 'solid' ? 'text-stone-500' : 'text-white/70',
)
</script>

<template>
  <form
    class="grid grid-cols-2 lg:grid-cols-6 gap-3 items-end"
    @submit.prevent="emit('search')"
  >
    <label class="flex flex-col gap-1.5 min-h-[44px]">
      <span class="text-[10px] font-display font-semibold tracking-[0.18em] uppercase" :class="labelClass">{{ copy.location }}</span>
      <select v-model="filters.location" class="h-11 w-full rounded-xl border px-3 text-sm font-body bg-transparent" :class="fieldClass">
        <option value="">{{ copy.locationAll }}</option>
        <option v-for="loc in locations" :key="loc" :value="loc">{{ loc }}</option>
      </select>
    </label>

    <label class="flex flex-col gap-1.5 min-h-[44px]">
      <span class="text-[10px] font-display font-semibold tracking-[0.18em] uppercase" :class="labelClass">{{ copy.radius }}</span>
      <select v-model.number="filters.radius" class="h-11 w-full rounded-xl border px-3 text-sm font-body bg-transparent" :class="fieldClass">
        <option :value="0">{{ copy.radiusAny }}</option>
        <option v-for="r in radii" :key="r" :value="r">{{ r }} km</option>
      </select>
    </label>

    <label class="flex flex-col gap-1.5 min-h-[44px]">
      <span class="text-[10px] font-display font-semibold tracking-[0.18em] uppercase" :class="labelClass">{{ copy.type }}</span>
      <select v-model="filters.listingType" class="h-11 w-full rounded-xl border px-3 text-sm font-body bg-transparent" :class="fieldClass">
        <option v-for="t in types" :key="t.id" :value="t.id">{{ locale === 'de' ? t.de : t.en }}</option>
      </select>
    </label>

    <label class="flex flex-col gap-1.5 min-h-[44px]">
      <span class="text-[10px] font-display font-semibold tracking-[0.18em] uppercase" :class="labelClass">{{ copy.rooms }}</span>
      <select v-model.number="filters.rooms" class="h-11 w-full rounded-xl border px-3 text-sm font-body bg-transparent" :class="fieldClass">
        <option :value="0">{{ copy.roomsAny }}</option>
        <option v-for="n in roomOptions" :key="n" :value="n">{{ n }}+</option>
      </select>
    </label>

    <label class="flex flex-col gap-1.5 min-h-[44px] col-span-2 lg:col-span-1">
      <span class="text-[10px] font-display font-semibold tracking-[0.18em] uppercase" :class="labelClass">{{ copy.price }} · {{ formatMax }}</span>
      <input
        v-model.number="filters.priceMax"
        type="range"
        min="0"
        :max="priceCeiling"
        :step="priceStep"
        class="h-11 w-full accent-amber-600"
      >
    </label>

    <button
      type="submit"
      class="col-span-2 lg:col-span-1 h-11 min-h-[44px] rounded-xl bg-amber-600 text-white font-display font-bold text-sm shadow-lg shadow-amber-900/30 hover:bg-amber-500 transition-colors"
    >
      {{ copy.search }}
    </button>
  </form>
</template>

<style scoped>
select option {
  color: #1c1917;
  background: #fff;
}
</style>
