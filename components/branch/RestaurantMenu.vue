<script setup lang="ts">
import type { BranchTheme } from '~/composables/useBranchExamples'

const props = defineProps<{
  data: {
    eyebrow: string
    title: string
    subtitle: string
    categories: string[]
    items: Record<string, { name: string; desc: string; price: string }[]>
  }
  theme: BranchTheme
}>()

const activeCategory = ref(props.data.categories[0] ?? '')
const isDark = computed(() => props.theme.pageBg.includes('neutral-950'))
</script>

<template>
  <section id="menu" class="py-24 px-6" :class="theme.pageBg">
    <div class="max-w-4xl mx-auto">
      <BranchSectionHeader :eyebrow="data.eyebrow" :title="data.title" :subtitle="data.subtitle" />

      <div class="flex flex-wrap justify-center gap-2 mb-10">
        <button
          v-for="cat in data.categories"
          :key="cat"
          type="button"
          class="px-4 py-2 rounded-full text-sm font-body font-medium border transition-all"
          :class="activeCategory === cat
            ? `bg-${theme.accent} ${theme.accentText} border-${theme.accent}`
            : (isDark ? 'bg-neutral-900 border-neutral-800 text-neutral-300 hover:border-neutral-600' : 'bg-white border-slate-200 text-slate-600 hover:border-slate-400')"
          @click="activeCategory = cat"
        >
          {{ cat }}
        </button>
      </div>

      <div class="space-y-4">
        <div
          v-for="item in data.items[activeCategory] ?? []"
          :key="item.name"
          class="flex items-end justify-between gap-4 p-4 rounded-xl border transition-colors"
          :class="isDark ? 'bg-neutral-900 border-neutral-800' : 'bg-white border-slate-100 hover:border-slate-200'"
        >
          <div>
            <h4 class="font-display font-bold" :class="isDark ? 'text-white' : 'text-slate-900'">{{ item.name }}</h4>
            <p class="text-sm font-body opacity-70" :class="isDark ? 'text-neutral-400' : 'text-slate-500'">{{ item.desc }}</p>
          </div>
          <span class="font-display font-bold whitespace-nowrap" :class="`text-${theme.accent}`">{{ item.price }}</span>
        </div>
      </div>
    </div>
  </section>
</template>
