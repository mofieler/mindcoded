<script setup lang="ts">
import type { BranchTheme } from '~/composables/useBranchExamples'

const props = defineProps<{
  data: {
    filters: string[]
    properties: {
      title: string
      location: string
      price: string
      type: string
      rooms: string
      area: string
      image: string
      tag: string
    }[]
  }
  theme: BranchTheme
}>()

const activeFilter = ref(props.data.filters[0] ?? '')
const isDark = computed(() => props.theme.pageBg.includes('neutral-950'))

const filtered = computed(() => {
  if (!activeFilter.value || activeFilter.value === props.data.filters[0]) return props.data.properties
  return props.data.properties.filter((p) => p.type === activeFilter.value)
})
</script>

<template>
  <section id="properties" class="py-24 px-6" :class="theme.pageBg">
    <div class="max-w-7xl mx-auto">
      <div class="flex flex-wrap justify-center gap-2 mb-10">
        <button
          v-for="filter in data.filters"
          :key="filter"
          type="button"
          class="px-4 py-2 rounded-full text-sm font-body font-medium border transition-all"
          :class="activeFilter === filter
            ? `bg-${theme.accent} ${theme.accentText} border-${theme.accent}`
            : (isDark ? 'bg-neutral-900 border-neutral-800 text-neutral-300 hover:border-neutral-600' : 'bg-white border-slate-200 text-slate-600 hover:border-slate-400')"
          @click="activeFilter = filter"
        >
          {{ filter }}
        </button>
      </div>

      <div class="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div
          v-for="property in filtered"
          :key="property.title"
          class="group rounded-2xl overflow-hidden border transition-all hover:-translate-y-1 hover:shadow-xl"
          :class="isDark ? 'bg-neutral-900 border-neutral-800' : 'bg-white border-slate-200'"
        >
          <div class="relative aspect-[4/3] overflow-hidden">
            <NuxtImg :src="property.image" :alt="property.title" class="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" format="webp" width="600" height="450" />
            <span class="absolute top-3 left-3 px-2.5 py-1 rounded-md text-xs font-body font-semibold bg-white/90 text-slate-900">{{ property.tag }}</span>
          </div>
          <div class="p-5">
            <p class="text-xs font-body opacity-60 mb-1" :class="isDark ? 'text-neutral-400' : 'text-slate-500'">{{ property.location }}</p>
            <h4 class="font-display font-bold text-lg mb-2" :class="isDark ? 'text-white' : 'text-slate-900'">{{ property.title }}</h4>
            <div class="flex items-center gap-4 text-xs font-body opacity-70 mb-3" :class="isDark ? 'text-neutral-400' : 'text-slate-500'">
              <span>{{ property.rooms }}</span>
              <span>{{ property.area }}</span>
            </div>
            <p class="font-display font-bold" :class="`text-${theme.accent}`">{{ property.price }}</p>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>
