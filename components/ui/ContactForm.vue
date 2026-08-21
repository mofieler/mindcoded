<script setup lang="ts">
const { t, locale } = useI18n()
const localePath = useLocalePath()
const { getToken } = useRecaptcha()

const honeypot = ref('')
const formLoadedAt = Date.now()
const state = ref<'idle' | 'loading' | 'success'>('idle')
const errors = ref<Record<string, string>>({})

const form = reactive({
  name: '',
  email: '',
  message: '',
  gdpr: false,
})

const emailValid = computed(() => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email))

function validate(): boolean {
  errors.value = {}
  const de = locale.value === 'de'
  if (!form.name.trim()) errors.value.name = de ? 'Bitte geben Sie Ihren Namen ein.' : 'Please enter your name.'
  if (!form.email || !emailValid.value) errors.value.email = de ? 'Bitte geben Sie eine gültige E-Mail-Adresse ein.' : 'Please enter a valid email address.'
  if (!form.message.trim()) errors.value.message = de ? 'Bitte schreiben Sie eine Nachricht.' : 'Please write a message.'
  if (!form.gdpr) errors.value.gdpr = de ? 'Bitte stimmen Sie der Datenschutzerklärung zu.' : 'Please agree to the privacy policy.'
  return Object.keys(errors.value).length === 0
}

async function handleSubmit() {
  if (!validate()) return

  if (honeypot.value || Date.now() - formLoadedAt < 1500) {
    state.value = 'success'
    return
  }

  state.value = 'loading'
  try {
    const recaptchaToken = await getToken('contact_form')
    await $fetch('/api/contact', {
      method: 'POST',
      body: {
        name: form.name,
        email: form.email,
        subject: t('contact.mail_subject'),
        message: form.message,
        locale: locale.value,
        website: honeypot.value,
        recaptchaToken,
      },
    })
    state.value = 'success'
  } catch (err: any) {
    state.value = 'idle'
    const msg = err?.data?.message || err?.message || ''
    if (msg.includes('Too many')) {
      errors.value.general = locale.value === 'de'
        ? 'Zu viele Anfragen. Bitte versuchen Sie es später erneut.'
        : 'Too many requests. Please try again later.'
    } else {
      errors.value.general = t('contact.error')
    }
  }
}
</script>

<template>
  <div class="w-full">
    <div v-if="state === 'success'">
      <h3 class="font-display font-bold text-xl text-fg mb-2">{{ t('contact.success_title') }}</h3>
      <p class="font-body text-sm text-fg-muted">{{ t('contact.success_sub') }}</p>
    </div>

    <form v-else class="relative space-y-5" novalidate @submit.prevent="handleSubmit">
      <div aria-hidden="true" class="absolute -left-[9999px] w-0 h-0 overflow-hidden">
        <input v-model="honeypot" name="website" type="text" tabindex="-1" autocomplete="off">
      </div>

      <div class="grid grid-cols-1 sm:grid-cols-2 gap-5">
        <div>
          <label for="contact-name" class="mb-1.5 block text-xs font-semibold uppercase tracking-widest text-fg-muted">
            {{ t('contact.name_label') }}
          </label>
          <input
            id="contact-name"
            v-model="form.name"
            type="text"
            autocomplete="name"
            :placeholder="t('contact.name_placeholder')"
            :disabled="state === 'loading'"
            class="w-full rounded-xl border border-border bg-muted px-4 py-3 text-sm text-fg placeholder-fg-muted/40 outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/20 disabled:opacity-50"
            :class="{ 'border-red-500/50': errors.name }"
          >
          <p v-if="errors.name" class="mt-1 text-xs text-red-500">{{ errors.name }}</p>
        </div>

        <div>
          <label for="contact-email" class="mb-1.5 block text-xs font-semibold uppercase tracking-widest text-fg-muted">
            {{ t('contact.email_label') }}
          </label>
          <input
            id="contact-email"
            v-model="form.email"
            type="email"
            autocomplete="email"
            :placeholder="t('contact.email_placeholder')"
            :disabled="state === 'loading'"
            class="w-full rounded-xl border border-border bg-muted px-4 py-3 text-sm text-fg placeholder-fg-muted/40 outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/20 disabled:opacity-50"
            :class="{ 'border-red-500/50': errors.email }"
          >
          <p v-if="errors.email" class="mt-1 text-xs text-red-500">{{ errors.email }}</p>
        </div>
      </div>

      <div>
        <label for="contact-message" class="mb-1.5 block text-xs font-semibold uppercase tracking-widest text-fg-muted">
          {{ t('contact.message_label') }}
        </label>
        <textarea
          id="contact-message"
          v-model="form.message"
          rows="5"
          :placeholder="t('contact.message_placeholder')"
          :disabled="state === 'loading'"
          class="w-full resize-none rounded-xl border border-border bg-muted px-4 py-3 text-sm text-fg placeholder-fg-muted/40 outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/20 disabled:opacity-50"
          :class="{ 'border-red-500/50': errors.message }"
        />
        <p v-if="errors.message" class="mt-1 text-xs text-red-500">{{ errors.message }}</p>
      </div>

      <div class="flex items-start gap-3">
        <input
          id="contact-gdpr"
          v-model="form.gdpr"
          type="checkbox"
          :disabled="state === 'loading'"
          class="mt-1 h-4 w-4 shrink-0 cursor-pointer rounded border-2 border-border accent-accent disabled:opacity-50"
        >
        <label for="contact-gdpr" class="cursor-pointer text-sm text-fg-muted leading-relaxed">
          {{ t('contact.gdpr_label') }}
          <NuxtLink :to="localePath('/privacy')" class="font-medium text-accent underline hover:text-accent/80" target="_blank">
            {{ t('footer.privacy') }}
          </NuxtLink>
        </label>
      </div>
      <p v-if="errors.gdpr" class="text-xs text-red-500">{{ errors.gdpr }}</p>
      <p v-if="errors.general" class="text-sm text-red-500">{{ errors.general }}</p>

      <button
        type="submit"
        :disabled="state === 'loading'"
        class="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {{ state === 'loading' ? t('contact.submitting') : t('contact.submit') }}
      </button>
    </form>
  </div>
</template>
