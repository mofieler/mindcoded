<script setup lang="ts">
const route = useRoute()
const localePath = useLocalePath()
const isHome = computed(() => route.path === localePath('/'))
</script>

<template>
  <div class="min-h-screen flex flex-col bg-base text-fg">
    <AppNav />
    <main class="flex-1" :class="isHome ? '' : 'pt-24'">
      <slot />
    </main>
    <AppFooter />
  </div>
</template>
