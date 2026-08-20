<script setup lang="ts">
withDefaults(defineProps<{
  eyebrow?: string
  title: string
  sub?: string
  align?: 'left' | 'center'
  heading?: 'h1' | 'h2'
}>(), {
  align: 'left',
  heading: 'h2',
})
</script>

<template>
  <header
    class="max-w-2xl"
    :class="align === 'center' ? 'mx-auto text-center' : ''"
  >
    <p
      v-if="eyebrow"
      class="text-accent text-xs font-display font-semibold tracking-[0.28em] uppercase mb-4"
    >
      {{ eyebrow }}
    </p>
    <component
      :is="heading"
      class="font-display font-bold text-3xl sm:text-4xl text-fg leading-tight"
    >
      {{ title }}
    </component>
    <p
      v-if="sub"
      class="font-body text-fg-muted leading-relaxed mt-4"
    >
      {{ sub }}
    </p>
  </header>
</template>
