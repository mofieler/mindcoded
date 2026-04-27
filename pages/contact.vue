<script setup lang="ts">
import {
  EnvelopeIcon,
  PhoneIcon,
  MapPinIcon,
  ChatBubbleLeftEllipsisIcon,
  BellAlertIcon,
} from '@heroicons/vue/24/outline'

const { t, locale } = useI18n()
const localePath = useLocalePath()

useSeo({
  title: t('meta.contact_title'),
  description: t('contact.sub'),
})

const contact = {
  email: 'moritz@mindcoded.studio',
  phone: '+49 151 68456178',
  address: 'Sautterweg 30, 70565 Stuttgart',
}

type InquiryType = 'message' | 'newsletter'
const activeInquiry = ref<InquiryType>('message')

const inquiryOptions = computed(() => [
  {
    key: 'message' as InquiryType,
    icon: ChatBubbleLeftEllipsisIcon,
    label: locale.value === 'de' ? 'Nachricht senden' : 'Send a message',
  },
  {
    key: 'newsletter' as InquiryType,
    icon: BellAlertIcon,
    label: locale.value === 'de' ? 'Auf dem Laufenden bleiben' : 'Stay updated',
  },
])
</script>

<template>
  <div class="max-w-7xl mx-auto px-6 py-24">

    <!-- Header -->
    <div class="max-w-2xl mb-20">
      <p class="text-accent text-xs font-display font-semibold tracking-[0.3em] uppercase mb-4">
        {{ t('nav.contact') }}
      </p>
      <h1 class="font-display font-extrabold text-5xl sm:text-6xl text-fg mb-6 leading-tight">
        {{ t('contact.title') }}
      </h1>
      <p class="font-body text-lg text-fg-muted">
        {{ t('contact.sub') }}
      </p>
    </div>

    <!-- Contact Info Grid -->
    <div class="grid grid-cols-1 sm:grid-cols-3 gap-px bg-border mb-20">
      <div class="bg-base p-8 hover:bg-muted transition-colors">
        <p class="text-fg-muted text-xs font-display font-semibold tracking-widest uppercase mb-3">
          {{ t('contact.email_label') }}
        </p>
        <a
          :href="`mailto:${contact.email}`"
          class="font-display font-bold text-xl text-fg hover:text-accent transition-colors inline-flex items-center gap-2 min-w-0"
        >
          <EnvelopeIcon class="w-5 h-5 shrink-0" />
          <span class="break-all">{{ contact.email }}</span>
        </a>
      </div>

      <div class="bg-base p-8 hover:bg-muted transition-colors">
        <p class="text-fg-muted text-xs font-display font-semibold tracking-widest uppercase mb-3">
          {{ t('contact.phone_label') }}
        </p>
        <a
          :href="`tel:${contact.phone.replace(/\s/g, '')}`"
          class="font-display font-bold text-xl text-fg hover:text-accent transition-colors inline-flex items-center gap-2"
        >
          <PhoneIcon class="w-5 h-5" />
          {{ contact.phone }}
        </a>
      </div>

      <div class="bg-base p-8 hover:bg-muted transition-colors">
        <p class="text-fg-muted text-xs font-display font-semibold tracking-widest uppercase mb-3">
          {{ t('contact.location_label') }}
        </p>
        <a
          href="https://maps.google.com/?q=Sautterweg+30,+70565+Stuttgart"
          target="_blank"
          class="font-display font-bold text-xl text-fg hover:text-accent transition-colors inline-flex items-center gap-2"
        >
          <MapPinIcon class="w-5 h-5" />
          {{ contact.address }}
        </a>
      </div>
    </div>

    <!-- Consolidated Form with Inquiry Toggle -->
    <div class="max-w-2xl">

      <!-- Segmented Control -->
      <div class="inline-flex rounded-xl border border-border bg-muted p-1 mb-10 gap-1" role="tablist">
        <button
          v-for="option in inquiryOptions"
          :key="option.key"
          role="tab"
          :aria-selected="activeInquiry === option.key"
          @click="activeInquiry = option.key"
          class="flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-display font-semibold transition-all duration-200"
          :class="activeInquiry === option.key
            ? 'bg-surface text-fg shadow-sm border border-border/60'
            : 'text-fg-muted hover:text-fg'"
        >
          <component :is="option.icon" class="w-4 h-4 shrink-0" />
          {{ option.label }}
        </button>
      </div>

      <!-- Form Panel: Message -->
      <div v-if="activeInquiry === 'message'" role="tabpanel">
        <div class="w-8 h-px bg-accent mb-6" />
        <h2 class="font-display font-bold text-2xl text-fg mb-2">
          {{ t('contact.form_title') }}
        </h2>
        <p class="font-body text-sm text-fg-muted mb-8">{{ t('contact.form_sub') }}</p>
        <ClientOnly>
          <UiContactForm />
        </ClientOnly>
      </div>

      <!-- Form Panel: Newsletter -->
      <div v-else role="tabpanel">
        <div class="rounded-xl border border-border bg-surface p-8 relative overflow-hidden">
          <div class="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-accent to-transparent" />
          <div class="w-6 h-px bg-accent mb-5" />
          <h2 class="font-display font-bold text-2xl text-fg mb-2">
            {{ t('contact.optin_title') }}
          </h2>
          <p class="font-body text-sm text-fg-muted mb-6">{{ t('contact.optin_sub') }}</p>
          <ClientOnly>
            <UiOptInForm />
          </ClientOnly>
        </div>
      </div>

    </div>
  </div>
</template>
