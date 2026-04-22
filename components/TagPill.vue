<!--
  TagPill – wiederverwendbares Tag-Element.
  Props:
    variant: 'default' | 'accent' | 'outline'
-->
<script setup lang="ts">
withDefaults(defineProps<{
  variant?: 'default' | 'accent' | 'outline'
}>(), { variant: 'default' })
</script>

<template>
  <span
    class="inline-block px-2.5 py-0.5 rounded-full text-xs font-body"
    :class="{
      'bg-muted border border-border text-fg-muted': variant === 'default',
      'bg-accent/10 border border-accent/30 text-accent': variant === 'accent',
      'bg-transparent border border-fg-muted/30 text-fg-muted': variant === 'outline',
    }"
  >
    <slot />
  </span>
</template>
