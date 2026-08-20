<script setup lang="ts">
withDefaults(defineProps<{
  variant?: 'default' | 'accent' | 'outline'
}>(), { variant: 'default' })
</script>

<template>
  <span
    class="tag"
    :class="{
      'tag-muted': variant === 'default',
      'tag-accent': variant === 'accent',
      'tag-outline': variant === 'outline',
    }"
  >
    <slot />
  </span>
</template>
