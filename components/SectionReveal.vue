<!--
  SectionReveal – wiederverwendbarer Wrapper für Scroll-Animationen.
  Nutzung:
    <SectionReveal>
      <h2>Mein Inhalt</h2>
    </SectionReveal>
  Props:
    delay – optionale CSS Animation-Delay in ms (default: 0)
-->
<script setup lang="ts">
const props = withDefaults(defineProps<{
  delay?: number
}>(), { delay: 0 })

const { el, isVisible } = useIntersect()
</script>

<template>
  <div
    ref="el"
    :style="{ animationDelay: `${props.delay}ms` }"
    :class="[
      'transition-all duration-700',
      isVisible
        ? 'opacity-100 translate-y-0'
        : 'opacity-0 translate-y-6'
    ]"
  >
    <slot />
  </div>
</template>
