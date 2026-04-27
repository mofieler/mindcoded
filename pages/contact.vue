<script setup lang="ts">
import {
  EnvelopeIcon,
  PhoneIcon,
  MapPinIcon
} from '@heroicons/vue/24/outline'

const { t } = useI18n()
const localePath = useLocalePath()

useSeo({
  title: t('meta.contact_title'),
  description: t('contact.sub'),
})

const contact = {
  email: 'moritzfieler@icloud.com',
  phone: '+49 151 68456178',
  address: 'Sautterweg 30, 70565 Stuttgart',
}
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

    <!-- Two-column layout: form + secondary -->
    <div class="grid grid-cols-1 lg:grid-cols-5 gap-16">

      <!-- Primary: Direct contact form (3/5) -->
      <div class="lg:col-span-3">
        <div class="w-8 h-px bg-accent mb-6" />
        <h2 class="font-display font-bold text-2xl text-fg mb-2">
          {{ t('contact.form_title') }}
        </h2>
        <p class="font-body text-sm text-fg-muted mb-8">{{ t('contact.form_sub') }}</p>
        <ClientOnly>
          <UiContactForm />
        </ClientOnly>
      </div>

      <!-- Secondary: Quick opt-in (2/5) -->
      <div class="lg:col-span-2">
        <div class="sticky top-32">
          <div class="rounded-xl border border-border bg-surface p-8 relative overflow-hidden">
            <div class="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-accent to-transparent" />
            <div class="w-6 h-px bg-accent mb-5" />
            <h3 class="font-display font-bold text-lg text-fg mb-2">
              {{ t('contact.optin_title') }}
            </h3>
            <p class="font-body text-sm text-fg-muted mb-6">{{ t('contact.optin_sub') }}</p>
            <ClientOnly>
              <UiOptInForm />
            </ClientOnly>
          </div>
        </div>
      </div>

    </div>
  </div>
</template>
