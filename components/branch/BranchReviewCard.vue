<script setup lang="ts">
import type { BranchTheme } from '~/composables/useBranchExamples'

defineProps<{
  name: string
  info?: string
  text: string
  theme: BranchTheme
  light?: boolean
}>()
</script>

<template>
  <div
    class="rounded-2xl p-6 border transition-all"
    :class="light
      ? 'bg-white/10 border-white/10 text-white'
      : 'bg-white border-slate-200 text-slate-900'"
  >
    <div class="flex gap-1 mb-4">
      <svg v-for="i in 5" :key="i" class="w-4 h-4" :class="`text-${theme.accent}`" viewBox="0 0 20 20" fill="currentColor">
        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
      </svg>
    </div>
    <p class="font-body text-sm leading-relaxed mb-6" :class="light ? 'text-white/90' : 'text-slate-600'">
      "{{ text }}"
    </p>
    <div>
      <p class="font-display font-semibold text-sm" :class="light ? 'text-white' : 'text-slate-900'">{{ name }}</p>
      <p v-if="info" class="text-xs font-body opacity-70" :class="light ? 'text-white/70' : 'text-slate-500'">{{ info }}</p>
    </div>
  </div>
</template>
