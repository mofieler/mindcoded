<template>
  <div class="w-full">
    <div v-if="state === 'success'" class="rounded-xl border border-green-500/30 bg-green-500/10 p-8 text-center">
      <div class="mb-4 text-4xl">✓</div>
      <p class="text-fg-muted leading-relaxed">{{ t('optin.success') }}</p>
    </div>

    <form v-else @submit.prevent="handleSubmit" class="space-y-6" novalidate>
      <!-- Honeypot: visually hidden, bots fill this, humans don't -->
      <div aria-hidden="true" style="position:absolute;left:-9999px;width:0;height:0;overflow:hidden">
        <input v-model="honeypot" name="website" type="text" tabindex="-1" autocomplete="off" />
      </div>

      <!-- Email Input -->
      <div>
        <div class="relative">
          <svg class="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-fg-muted" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
          </svg>
          <input
            id="optin-email"
            v-model="email"
            type="email"
            autocomplete="email"
            :disabled="state === 'loading'"
            :placeholder="t('optin.emailPlaceholder')"
            class="w-full rounded-lg border border-border bg-muted pl-11 pr-10 py-3 text-sm text-fg placeholder-fg-muted/50 outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/20 disabled:opacity-50 disabled:cursor-not-allowed"
            :class="{
              'border-red-500/50 focus:border-red-500 focus:ring-red-500/20': errors.email,
              'border-green-500/40 focus:border-green-500 focus:ring-green-500/20': emailValid && !errors.email
            }"
          />
          <div v-if="emailValid && !errors.email" class="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-green-500">
            <svg class="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" />
            </svg>
          </div>
        </div>
        <p v-if="errors.email" class="mt-1.5 text-xs text-red-500">{{ errors.email }}</p>
      </div>

      <div class="flex items-start gap-3">
        <input
          id="optin-gdpr"
          v-model="gdprConsent"
          type="checkbox"
          :disabled="state === 'loading'"
          class="mt-1 h-5 w-5 shrink-0 cursor-pointer rounded border-2 border-border accent-accent transition hover:border-accent disabled:opacity-50 disabled:cursor-not-allowed"
        />
        <label for="optin-gdpr" class="cursor-pointer text-sm text-fg-muted leading-relaxed transition hover:text-fg">
          {{ t('optin.checkboxLabel') }}
          <NuxtLink :to="localePath('/privacy')" class="font-medium text-accent underline hover:text-accent/80 transition" target="_blank">
            {{ t('footer.privacy') }}
          </NuxtLink>
        </label>
      </div>
      <p v-if="errors.gdpr" class="text-xs text-red-500 animate-pulse">{{ errors.gdpr }}</p>

      <p v-if="errors.general" class="rounded-lg border border-red-500/20 bg-red-500/5 px-4 py-3 text-sm text-red-500 animate-pulse">
        {{ errors.general }}
      </p>

      <button
        type="submit"
        :disabled="state === 'loading' || !emailValid || !gdprConsent"
        class="group relative w-full overflow-hidden rounded-lg bg-accent px-6 py-4 text-sm font-semibold text-white shadow-lg transition hover:shadow-xl hover:shadow-accent/20 disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none"
      >
        <div class="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent transition-transform group-hover:translate-x-full" style="transform: translateX(-100%)" />
        <span class="relative flex items-center justify-center gap-2">
          <svg v-if="state === 'loading'" class="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          {{ state === 'loading' ? t('optin.submitting') : t('optin.submit') }}
        </span>
      </button>
    </form>
  </div>
</template>

<script setup lang="ts">
const { t, locale } = useI18n()
const localePath = useLocalePath()

const { getToken } = useRecaptcha()

const email = ref('')
const gdprConsent = ref(false)
const honeypot = ref('')
const formLoadedAt = Date.now()
const state = ref<'idle' | 'loading' | 'success'>('idle')
const errors = ref<{ email?: string; gdpr?: string; general?: string }>({})

const emailValid = computed(() => {
  const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return email.value && emailRe.test(email.value)
})

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

  // Silent success for bots: honeypot filled or submitted too fast (< 1.5s)
  if (honeypot.value || Date.now() - formLoadedAt < 1500) {
    state.value = 'success'
    return
  }

  state.value = 'loading'
  try {
    const recaptchaToken = await getToken('contact_form')
    await $fetch('/api/request-contact', {
      method: 'POST',
      body: { email: email.value, locale: locale.value, website: honeypot.value, recaptchaToken },
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
