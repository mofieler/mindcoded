<script setup lang="ts">
import type { BranchTheme } from '~/composables/useBranchExamples'

const props = defineProps<{
  data: {
    eyebrow: string
    title: string
    subtitle: string
    plans: { name: string; price: string; period: string; features: string[]; highlighted: boolean }[]
  }
  theme: BranchTheme
}>()

const isDark = computed(() => props.theme.pageBg.includes('neutral-950'))
</script>

<template>
  <section id="pricing" class="py-24 px-6" :class="theme.pageBg">
    <div class="max-w-5xl mx-auto">
      <BranchSectionHeader :light="isDark" :eyebrow="data.eyebrow" :title="data.title" :subtitle="data.subtitle" />

      <div class="grid md:grid-cols-3 gap-6 items-stretch">
        <div
          v-for="plan in data.plans"
          :key="plan.name"
          class="rounded-2xl p-6 border transition-all hover:-translate-y-1"
          :class="plan.highlighted
            ? `bg-${theme.accent} text-slate-900 border-${theme.accent} shadow-xl`
            : (isDark ? 'bg-neutral-900 border-neutral-800 text-white' : 'bg-white border-slate-200 text-slate-900')"
        >
          <h4 class="font-display font-bold text-lg mb-2">{{ plan.name }}</h4>
          <div class="flex items-baseline gap-1 mb-6">
            <span class="font-display font-extrabold text-4xl">{{ plan.price }}</span>
            <span class="font-body text-sm opacity-80">{{ plan.period }}</span>
          </div>
          <ul class="space-y-3 mb-8">
            <li v-for="feature in plan.features" :key="feature" class="flex items-center gap-2 text-sm font-body">
              <svg class="w-4 h-4 shrink-0" :class="plan.highlighted ? 'text-slate-900' : `text-${theme.accent}`" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="3">
                <path stroke-linecap="round" stroke-linejoin="round" d="M4.5 12.75l6 6 9-13.5" />
              </svg>
              {{ feature }}
            </li>
          </ul>
          <button
            class="w-full py-3 rounded-xl font-display font-bold text-sm transition-all hover:scale-[1.02]"
            :class="plan.highlighted
              ? `bg-${theme.accent} ${theme.accentText}`
              : `bg-${theme.accent}/10 text-${theme.accent} hover:bg-${theme.accent}/20`"
          >
            Jetzt starten
          </button>
        </div>
      </div>
    </div>
  </section>
</template>
