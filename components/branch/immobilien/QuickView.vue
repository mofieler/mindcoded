<script setup lang="ts">
import type { PropertyListing, PropertyAgent, ImmobilienCopy } from '~/utils/immobilienData'
import { motion } from 'motion-v'

const props = defineProps<{
  property: PropertyListing | null
  agent?: PropertyAgent
  copy: ImmobilienCopy
}>()

const emit = defineEmits<{
  close: []
}>()

const { has, toggle } = useFavorites()
const reduced = useReducedMotion()
const index = ref(0)

watch(() => props.property?.id, () => { index.value = 0 })

const gallery = computed(() => props.property?.gallery?.length ? props.property.gallery : (props.property ? [props.property.image] : []))

const next = () => { index.value = (index.value + 1) % gallery.value.length }
const prev = () => { index.value = (index.value - 1 + gallery.value.length) % gallery.value.length }

const onKey = (e: KeyboardEvent) => {
  if (e.key === 'Escape') emit('close')
  if (e.key === 'ArrowRight') next()
  if (e.key === 'ArrowLeft') prev()
}

watch(() => props.property, (p) => {
  if (!import.meta.client) return
  if (p) document.addEventListener('keydown', onKey)
  else document.removeEventListener('keydown', onKey)
}, { immediate: true })

onBeforeUnmount(() => {
  if (import.meta.client) document.removeEventListener('keydown', onKey)
})
</script>

<template>
  <Teleport to="body">
    <div v-if="property" class="fixed inset-0 z-[80] flex items-end sm:items-center justify-center p-0 sm:p-6">
      <button type="button" class="absolute inset-0 bg-stone-950/55 backdrop-blur-sm" :aria-label="copy.close" @click="emit('close')" />
      <motion.div
        class="relative z-10 w-full sm:max-w-3xl bg-white rounded-t-3xl sm:rounded-3xl overflow-hidden shadow-2xl max-h-[92vh] overflow-y-auto"
        :initial="reduced ? false : { opacity: 0, y: 28 }"
        :animate="{ opacity: 1, y: 0 }"
        :transition="{ duration: 0.35, ease: 'easeOut' }"
      >
        <div class="relative aspect-[16/10] bg-stone-200">
          <img :src="gallery[index]" :alt="property.title" class="w-full h-full object-cover">
          <button v-if="gallery.length > 1" type="button" class="absolute left-3 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-white/90 text-stone-800" @click="prev">‹</button>
          <button v-if="gallery.length > 1" type="button" class="absolute right-3 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-white/90 text-stone-800" @click="next">›</button>
          <button type="button" class="absolute top-3 right-3 w-11 h-11 rounded-full bg-white/90 text-stone-800 font-display" :aria-label="copy.close" @click="emit('close')">×</button>
          <div v-if="gallery.length > 1" class="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
            <span v-for="(_, i) in gallery" :key="i" class="w-1.5 h-1.5 rounded-full" :class="i === index ? 'bg-white' : 'bg-white/40'" />
          </div>
        </div>

        <div class="p-6 sm:p-8">
          <div class="flex items-start justify-between gap-4 mb-4">
            <div>
              <p class="text-xs font-body text-stone-500 mb-1">{{ property.location }} · {{ property.typeLabel }}</p>
              <h3 class="font-display font-bold text-2xl text-stone-900">{{ property.title }}</h3>
            </div>
            <button
              type="button"
              class="shrink-0 w-11 h-11 rounded-full border border-stone-200 flex items-center justify-center"
              @click="toggle(property.id)"
            >
              <svg class="w-5 h-5" :class="has(property.id) ? 'text-rose-500' : 'text-stone-400'" :fill="has(property.id) ? 'currentColor' : 'none'" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.8">
                <path stroke-linecap="round" stroke-linejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
              </svg>
            </button>
          </div>

          <p class="font-display font-bold text-xl text-amber-700 mb-4">{{ property.priceLabel }}</p>
          <p class="font-body text-sm text-stone-600 leading-relaxed mb-6">{{ property.description }}</p>

          <div class="grid grid-cols-3 gap-3 mb-6">
            <div class="rounded-xl bg-stone-50 border border-stone-100 p-3">
              <p class="text-[10px] uppercase tracking-wider text-stone-400 font-display">{{ copy.details }}</p>
              <p class="font-display font-semibold text-stone-900 mt-1">{{ property.roomsLabel }}</p>
            </div>
            <div class="rounded-xl bg-stone-50 border border-stone-100 p-3">
              <p class="text-[10px] uppercase tracking-wider text-stone-400 font-display">Fläche</p>
              <p class="font-display font-semibold text-stone-900 mt-1">{{ property.area }}</p>
            </div>
            <div class="rounded-xl bg-stone-50 border border-stone-100 p-3">
              <p class="text-[10px] uppercase tracking-wider text-stone-400 font-display">{{ copy.type }}</p>
              <p class="font-display font-semibold text-stone-900 mt-1">{{ property.typeLabel }}</p>
            </div>
          </div>

          <div v-if="agent" class="flex items-center gap-4 rounded-2xl border border-stone-200 p-4">
            <img :src="agent.image" :alt="agent.name" class="w-14 h-14 rounded-full object-cover">
            <div class="min-w-0 flex-1">
              <p class="font-display font-semibold text-stone-900">{{ agent.name }}</p>
              <p class="text-xs text-stone-500">{{ agent.role }}</p>
              <p class="text-xs mt-1 flex items-center gap-1.5" :class="agent.availableToday ? 'text-emerald-700' : 'text-stone-400'">
                <span class="w-1.5 h-1.5 rounded-full" :class="agent.availableToday ? 'bg-emerald-500' : 'bg-stone-300'" />
                {{ agent.availableToday ? copy.availableToday : copy.unavailable }}
              </p>
            </div>
            <a :href="`#contact`" class="shrink-0 h-11 px-4 rounded-xl bg-amber-600 text-white text-sm font-display font-bold flex items-center" @click="emit('close')">
              {{ copy.contactAgent }}
            </a>
          </div>
        </div>
      </motion.div>
    </div>
  </Teleport>
</template>
