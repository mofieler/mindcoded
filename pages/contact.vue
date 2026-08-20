<script setup lang="ts">
import {
  EnvelopeIcon,
  PhoneIcon,
  MapPinIcon,
} from '@heroicons/vue/24/outline'

const { t } = useI18n()
const studio = useStudio()

useSeo({
  title: t('meta.contact_title'),
  description: t('contact.sub'),
})
</script>

<template>
  <div class="px-6 py-20 sm:py-24">
    <div class="max-w-xl mx-auto text-center">
      <p class="text-accent text-xs font-display font-semibold tracking-[0.28em] uppercase mb-4">
        {{ t('nav.contact') }}
      </p>
      <h1 class="font-display font-extrabold text-4xl sm:text-5xl text-fg mb-4 leading-tight">
        {{ t('contact.title') }}
      </h1>
      <p class="font-body text-fg-muted mb-10">
        {{ t('contact.form_sub') }}
      </p>

      <ul class="flex flex-col sm:flex-row sm:flex-wrap sm:justify-center gap-x-6 gap-y-3 text-sm font-body text-fg-muted mb-12">
        <li>
          <a :href="`mailto:${studio.email}`" class="inline-flex items-center gap-2 hover:text-fg transition-colors">
            <EnvelopeIcon class="w-4 h-4 text-accent shrink-0" />
            <span class="break-all">{{ studio.email }}</span>
          </a>
        </li>
        <li>
          <a :href="studio.phoneHref" class="inline-flex items-center gap-2 hover:text-fg transition-colors">
            <PhoneIcon class="w-4 h-4 text-accent shrink-0" />
            {{ studio.phone }}
          </a>
        </li>
        <li>
          <a :href="studio.mapsUrl" target="_blank" rel="noopener noreferrer" class="inline-flex items-center gap-2 hover:text-fg transition-colors">
            <MapPinIcon class="w-4 h-4 text-accent shrink-0" />
            {{ studio.city }}
          </a>
        </li>
      </ul>
    </div>

    <div class="max-w-xl mx-auto">
      <ClientOnly>
        <UiContactForm />
      </ClientOnly>
    </div>
  </div>
</template>
