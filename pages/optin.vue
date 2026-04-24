<template>
  <div class="min-h-screen px-6 py-32">
    <div class="mx-auto max-w-md">
      <!-- Confirmed state (from email link redirect) -->
      <div v-if="confirmed" class="text-center">
        <div class="mb-6 inline-flex h-16 w-16 items-center justify-center rounded-full bg-green-500/10">
          <svg class="h-8 w-8 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h1 class="mb-4 text-3xl font-bold text-fg">{{ t('optin.confirmed') }}</h1>
        <NuxtLink :to="localePath('/')" class="mt-8 inline-block text-sm text-fg-muted underline hover:text-fg transition-colors">
          ← {{ t('project.back').replace('Portfolio', 'Home') }}
        </NuxtLink>
      </div>

      <!-- Opt-in form -->
      <div v-else>
        <p class="mb-3 text-sm font-medium uppercase tracking-widest text-accent">mindcoded</p>
        <h1 class="mb-4 text-4xl font-bold leading-tight text-fg md:text-5xl">
          {{ t('optin.headline') }}
        </h1>
        <p class="mb-12 text-lg text-fg-muted leading-relaxed">{{ t('optin.subline') }}</p>
        <ClientOnly>
          <UiOptInForm />
        </ClientOnly>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const { t, locale } = useI18n()
const localePath = useLocalePath()
const route = useRoute()

const confirmed = computed(() => route.query.confirmed === 'true' || route.query.confirmed === 'already')

useSeo({
  title: t('optin.pageTitle'),
  description: t('optin.subline'),
  locale: locale.value,
})
</script>
