<script setup lang="ts">
withDefaults(defineProps<{
  as?: string
  hover?: boolean
  padding?: boolean
  size?: 'md' | 'lg'
}>(), {
  as: 'div',
  hover: false,
  padding: false,
  size: 'md',
})
</script>

<template>
  <component
    :is="as"
    class="card"
    :class="{
      'card-hover': hover,
      'card-lg': size === 'lg',
      'p-6 sm:p-8': padding,
    }"
  >
    <slot />
  </component>
</template>
