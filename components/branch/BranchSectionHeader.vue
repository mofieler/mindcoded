<script setup lang="ts">
defineProps<{
  eyebrow: string
  title: string
  subtitle?: string
  light?: boolean
}>()
</script>

<template>
  <div class="text-center mb-12 max-w-2xl mx-auto">
    <p class="text-xs font-display font-semibold tracking-[0.25em] uppercase mb-3 opacity-80" :class="light ? 'text-white/70' : 'text-accent'">
      {{ eyebrow }}
    </p>
    <h2 class="font-display font-bold text-3xl sm:text-4xl mb-4" :class="light ? 'text-white' : 'text-fg'">
      {{ title }}
    </h2>
    <p v-if="subtitle" class="font-body opacity-70" :class="light ? 'text-white/80' : 'text-fg-muted'">
      {{ subtitle }}
    </p>
  </div>
</template>
