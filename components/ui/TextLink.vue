<script setup lang="ts">
defineProps<{
  to: string
}>()
</script>

<template>
  <NuxtLink
    :to="to"
    class="inline-flex items-center gap-1.5 text-sm font-display font-semibold text-accent hover:underline"
  >
    <slot />
    <svg class="h-4 w-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24" aria-hidden="true">
      <path stroke-linecap="round" stroke-linejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
    </svg>
  </NuxtLink>
</template>
