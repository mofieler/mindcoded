<script setup lang="ts">
const { t } = useI18n()
const localePath = useLocalePath()
const studio = useStudio()
const currentYear = new Date().getFullYear()
</script>

<template>
  <footer class="border-t border-border">
    <div class="max-w-7xl mx-auto px-6 py-12 sm:py-14">
      <div class="flex flex-col sm:flex-row sm:items-end justify-between gap-8">
        <div>
          <p class="font-display font-semibold text-fg">{{ studio.studio }}</p>
          <p class="mt-1 font-body text-sm text-fg-muted">
            {{ studio.person }} · {{ studio.city }}
          </p>
          <p class="mt-3 flex flex-col sm:flex-row sm:gap-4 font-body text-sm text-fg-muted">
            <a :href="`mailto:${studio.email}`" class="hover:text-fg transition-colors break-all">{{ studio.email }}</a>
            <a :href="studio.phoneHref" class="hover:text-fg transition-colors">{{ studio.phone }}</a>
          </p>
        </div>
        <div class="flex flex-wrap gap-x-6 gap-y-2 text-sm font-body text-fg-muted">
          <NuxtLink :to="localePath('/solutions')" class="hover:text-fg transition-colors">
            {{ t('nav.solutions') }}
          </NuxtLink>
          <NuxtLink :to="localePath('/contact')" class="hover:text-fg transition-colors">
            {{ t('nav.contact') }}
          </NuxtLink>
          <NuxtLink :to="localePath('/imprint')" class="hover:text-fg transition-colors">
            {{ t('footer.imprint') }}
          </NuxtLink>
          <NuxtLink :to="localePath('/privacy')" class="hover:text-fg transition-colors">
            {{ t('footer.privacy') }}
          </NuxtLink>
        </div>
      </div>
      <p class="mt-10 text-xs font-body text-fg-muted">
        © {{ currentYear }} {{ studio.studio }}. {{ t('footer.rights') }}
      </p>
    </div>
  </footer>
</template>
