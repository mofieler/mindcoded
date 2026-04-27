<template>
  <div class="w-full">
    <!-- Success -->
    <div v-if="state === 'success'" class="rounded-xl border border-green-500/20 bg-green-500/5 p-10 text-center">
      <div class="inline-flex h-14 w-14 items-center justify-center rounded-full bg-green-500/10 mb-4">
        <svg class="h-7 w-7 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
          <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
        </svg>
      </div>
      <h3 class="font-display font-bold text-xl text-fg mb-2">{{ t('contact.success_title') }}</h3>
      <p class="font-body text-sm text-fg-muted">{{ t('contact.success_sub') }}</p>
    </div>

    <!-- Form -->
    <form v-else @submit.prevent="handleSubmit" class="space-y-5" novalidate>
      <!-- Honeypot -->
      <div aria-hidden="true" style="position:absolute;left:-9999px;width:0;height:0;overflow:hidden">
        <input v-model="honeypot" name="website" type="text" tabindex="-1" autocomplete="off" />
      </div>

      <!-- Name + Email row -->
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
            class="w-full rounded-lg border border-border bg-muted px-4 py-3 text-sm text-fg placeholder-fg-muted/40 outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/20 disabled:opacity-50"
            :class="{ 'border-red-500/50': errors.name }"
          />
          <p v-if="errors.name" class="mt-1 text-xs text-red-500">{{ errors.name }}</p>
        </div>

        <div>
          <label for="contact-email" class="mb-1.5 block text-xs font-semibold uppercase tracking-widest text-fg-muted">
            {{ t('contact.email_label') }}
          </label>
          <div class="relative">
            <input
              id="contact-email"
              v-model="form.email"
              type="email"
              autocomplete="email"
              :placeholder="t('contact.email_placeholder')"
              :disabled="state === 'loading'"
              class="w-full rounded-lg border border-border bg-muted px-4 py-3 text-sm text-fg placeholder-fg-muted/40 outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/20 disabled:opacity-50"
              :class="{
                'border-red-500/50': errors.email,
                'border-green-500/40': emailValid && !errors.email
              }"
            />
            <div v-if="emailValid && !errors.email" class="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-green-500">
              <svg class="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" />
              </svg>
            </div>
          </div>
          <p v-if="errors.email" class="mt-1 text-xs text-red-500">{{ errors.email }}</p>
        </div>
      </div>

      <!-- Subject -->
      <div>
        <label for="contact-subject" class="mb-1.5 block text-xs font-semibold uppercase tracking-widest text-fg-muted">
          {{ t('contact.subject_label') }}
        </label>
        <input
          id="contact-subject"
          v-model="form.subject"
          type="text"
          :placeholder="t('contact.subject_placeholder')"
          :disabled="state === 'loading'"
          class="w-full rounded-lg border border-border bg-muted px-4 py-3 text-sm text-fg placeholder-fg-muted/40 outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/20 disabled:opacity-50"
          :class="{ 'border-red-500/50': errors.subject }"
        />
        <p v-if="errors.subject" class="mt-1 text-xs text-red-500">{{ errors.subject }}</p>
      </div>

      <!-- Message -->
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
          class="w-full resize-none rounded-lg border border-border bg-muted px-4 py-3 text-sm text-fg placeholder-fg-muted/40 outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/20 disabled:opacity-50"
          :class="{ 'border-red-500/50': errors.message }"
        />
        <p v-if="errors.message" class="mt-1 text-xs text-red-500">{{ errors.message }}</p>
      </div>

      <!-- GDPR -->
      <div class="flex items-start gap-3">
        <input
          id="contact-gdpr"
          v-model="form.gdpr"
          type="checkbox"
          :disabled="state === 'loading'"
          class="mt-1 h-4 w-4 shrink-0 cursor-pointer rounded border-2 border-border accent-accent transition hover:border-accent disabled:opacity-50"
        />
        <label for="contact-gdpr" class="cursor-pointer text-sm text-fg-muted leading-relaxed">
          {{ t('contact.gdpr_label') }}
          <NuxtLink :to="localePath('/privacy')" class="font-medium text-accent underline hover:text-accent/80 transition" target="_blank">
            {{ t('footer.privacy') }}
          </NuxtLink>
        </label>
      </div>
      <p v-if="errors.gdpr" class="text-xs text-red-500">{{ errors.gdpr }}</p>

      <!-- General error -->
      <p v-if="errors.general" class="rounded-lg border border-red-500/20 bg-red-500/5 px-4 py-3 text-sm text-red-500">
        {{ errors.general }}
      </p>

      <!-- Submit -->
      <button
        type="submit"
        :disabled="state === 'loading'"
        class="group relative w-full overflow-hidden rounded-lg bg-accent px-6 py-3.5 text-sm font-semibold text-white shadow-md transition hover:shadow-lg hover:shadow-accent/20 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <span class="relative flex items-center justify-center gap-2">
          <svg v-if="state === 'loading'" class="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          {{ state === 'loading' ? t('contact.submitting') : t('contact.submit') }}
        </span>
      </button>
    </form>
  </div>
</template>

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
  subject: '',
  message: '',
  gdpr: false,
})

const emailValid = computed(() => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email))

function validate(): boolean {
  errors.value = {}
  const de = locale.value === 'de'
  if (!form.name.trim()) errors.value.name = de ? 'Bitte gib deinen Namen ein.' : 'Please enter your name.'
  if (!form.email || !emailValid.value) errors.value.email = de ? 'Bitte gib eine gültige Email-Adresse ein.' : 'Please enter a valid email address.'
  if (!form.subject.trim()) errors.value.subject = de ? 'Bitte gib einen Betreff ein.' : 'Please enter a subject.'
  if (!form.message.trim()) errors.value.message = de ? 'Bitte schreib eine Nachricht.' : 'Please write a message.'
  if (!form.gdpr) errors.value.gdpr = de ? 'Bitte stimme der Datenschutzerklärung zu.' : 'Please agree to the privacy policy.'
  return Object.keys(errors.value).length === 0
}

async function handleSubmit() {
  if (!validate()) return

  // Silent bot rejection
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
        subject: form.subject,
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
        ? 'Zu viele Anfragen. Bitte versuche es später erneut.'
        : 'Too many requests. Please try again later.'
    } else {
      errors.value.general = t('contact.error')
    }
  }
}
</script>
