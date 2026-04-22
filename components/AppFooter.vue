<script setup lang="ts">
const { t } = useI18n()
const localePath = useLocalePath()
const currentYear = new Date().getFullYear()
</script>

<template>
  <footer class="border-t border-border mt-32">
    <div class="max-w-7xl mx-auto px-6 py-12 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm font-body text-fg-muted">
      <span>© {{ currentYear }} Mindcoded. {{ t('footer.rights') }}</span>
      <div class="flex gap-6">
        <NuxtLink :to="localePath('/solutions')" class="hover:text-fg transition-colors">
          {{ t('nav.solutions') }}
        </NuxtLink>
        <NuxtLink :to="localePath('/imprint')" class="hover:text-fg transition-colors">
          {{ t('footer.imprint') }}
        </NuxtLink>
        <NuxtLink :to="localePath('/privacy')" class="hover:text-fg transition-colors">
          {{ t('footer.privacy') }}
        </NuxtLink>
      </div>
    </div>
  </footer>
</template>
