<template>
  <div class="w-full">
    <div v-if="state === 'success'" class="rounded-xl border border-green-500/30 bg-green-500/10 p-8 text-center">
      <div class="mb-4 text-4xl">✓</div>
      <p class="text-fg-muted leading-relaxed">{{ t('optin.success') }}</p>
    </div>

    <form v-else @submit.prevent="handleSubmit" class="space-y-5" novalidate>
      <div>
        <label for="optin-email" class="mb-2 block text-sm font-medium text-fg-muted">
          {{ t('optin.emailLabel') }}
        </label>
        <input
          id="optin-email"
          v-model="email"
          type="email"
          autocomplete="email"
          :placeholder="t('optin.emailPlaceholder')"
          :disabled="state === 'loading'"
          class="w-full rounded-lg border border-border bg-muted px-4 py-3 text-sm text-fg placeholder-fg-muted/50 outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/20 disabled:opacity-50"
          :class="{ 'border-red-500/50': errors.email }"
        />
        <p v-if="errors.email" class="mt-1 text-xs text-red-500">{{ errors.email }}</p>
      </div>

      <div class="flex items-start gap-3">
        <input
          id="optin-gdpr"
          v-model="gdprConsent"
          type="checkbox"
          :disabled="state === 'loading'"
          class="mt-0.5 h-4 w-4 shrink-0 cursor-pointer rounded border-border accent-accent disabled:opacity-50"
        />
        <label for="optin-gdpr" class="cursor-pointer text-sm text-fg-muted leading-relaxed">
          {{ t('optin.checkboxLabel') }}
          <NuxtLink :to="localePath('/privacy')" class="underline hover:text-fg transition-colors" target="_blank">
            {{ t('footer.privacy') }}
          </NuxtLink>
        </label>
      </div>
      <p v-if="errors.gdpr" class="text-xs text-red-500">{{ errors.gdpr }}</p>

      <p v-if="errors.general" class="rounded-lg border border-red-500/20 bg-red-500/5 px-4 py-3 text-sm text-red-500">
        {{ errors.general }}
      </p>

      <button
        type="submit"
        :disabled="state === 'loading'"
        class="w-full rounded-lg bg-accent px-6 py-3 text-sm font-semibold text-white transition hover:bg-accent/90 disabled:opacity-60 disabled:cursor-not-allowed"
      >
        {{ state === 'loading' ? t('optin.submitting') : t('optin.submit') }}
      </button>
    </form>
  </div>
</template>

<script setup lang="ts">
const { t, locale } = useI18n()
const localePath = useLocalePath()

const email = ref('')
const gdprConsent = ref(false)
const state = ref<'idle' | 'loading' | 'success'>('idle')
const errors = ref<{ email?: string; gdpr?: string; general?: string }>({})

function validate(): boolean {
  errors.value = {}
  const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!email.value || !emailRe.test(email.value)) {
    errors.value.email = locale.value === 'de' ? 'Bitte gib eine gültige Email-Adresse ein.' : 'Please enter a valid email address.'
  }
  if (!gdprConsent.value) {
    errors.value.gdpr = locale.value === 'de' ? 'Bitte stimme der Datenschutzerklärung zu.' : 'Please agree to the privacy policy.'
  }
  return Object.keys(errors.value).length === 0
}

async function handleSubmit() {
  if (!validate()) return
  state.value = 'loading'
  try {
    await $fetch('/api/request-contact', {
      method: 'POST',
      body: { email: email.value, locale: locale.value },
    })
    state.value = 'success'
  } catch (err: any) {
    state.value = 'idle'
    const msg = err?.data?.message || err?.message || ''
    if (msg.includes('Too many')) {
      errors.value.general = locale.value === 'de'
        ? 'Zu viele Anfragen. Bitte versuche es später erneut.'
        : 'Too many requests. Please try again later.'
    } else {
      errors.value.general = t('optin.error')
    }
  }
}
</script>
