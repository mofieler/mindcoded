<template>
  <div class="min-h-screen flex items-center justify-center px-6 py-32">
    <div class="mx-auto max-w-lg text-center">

      <!-- SUCCESS -->
      <template v-if="status === 'success'">
        <div class="mb-8 inline-flex h-20 w-20 items-center justify-center rounded-full bg-green-500/10">
          <svg class="h-10 w-10 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <p class="mb-3 text-sm font-medium uppercase tracking-widest text-accent">mindcoded</p>
        <h1 class="mb-4 text-4xl font-bold text-white">
          {{ de ? 'E-Mail bestätigt!' : 'Email confirmed!' }}
        </h1>
        <p class="mb-10 text-lg text-white/50 leading-relaxed">
          {{ de
            ? 'Danke! Deine Anfrage ist bei mir eingegangen. Ich melde mich so bald wie möglich bei dir.'
            : 'Thank you! Your request has been received. I will get back to you as soon as possible.' }}
        </p>
        <NuxtLink
          :to="de ? '/' : '/en'"
          class="inline-block rounded-lg bg-accent px-8 py-3 text-sm font-semibold text-white transition hover:bg-accent/90"
        >
          {{ de ? 'Zurück zur Startseite' : 'Back to homepage' }}
        </NuxtLink>
      </template>

      <!-- ALREADY CONFIRMED -->
      <template v-else-if="status === 'already'">
        <div class="mb-8 inline-flex h-20 w-20 items-center justify-center rounded-full bg-blue-500/10">
          <svg class="h-10 w-10 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M13 16h-1v-4h-1m1-4h.01M12 2a10 10 0 100 20A10 10 0 0012 2z" />
          </svg>
        </div>
        <p class="mb-3 text-sm font-medium uppercase tracking-widest text-accent">mindcoded</p>
        <h1 class="mb-4 text-4xl font-bold text-white">
          {{ de ? 'Bereits bestätigt' : 'Already confirmed' }}
        </h1>
        <p class="mb-10 text-lg text-white/50 leading-relaxed">
          {{ de
            ? 'Diese E-Mail-Adresse wurde bereits bestätigt. Ich melde mich bald bei dir.'
            : 'This email address has already been confirmed. I will be in touch soon.' }}
        </p>
        <NuxtLink
          :to="de ? '/' : '/en'"
          class="inline-block rounded-lg bg-accent px-8 py-3 text-sm font-semibold text-white transition hover:bg-accent/90"
        >
          {{ de ? 'Zurück zur Startseite' : 'Back to homepage' }}
        </NuxtLink>
      </template>

      <!-- EXPIRED -->
      <template v-else-if="status === 'expired'">
        <div class="mb-8 inline-flex h-20 w-20 items-center justify-center rounded-full bg-yellow-500/10">
          <svg class="h-10 w-10 text-yellow-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <p class="mb-3 text-sm font-medium uppercase tracking-widest text-accent">mindcoded</p>
        <h1 class="mb-4 text-4xl font-bold text-white">
          {{ de ? 'Link abgelaufen' : 'Link expired' }}
        </h1>
        <p class="mb-10 text-lg text-white/50 leading-relaxed">
          {{ de
            ? 'Der Bestätigungslink ist abgelaufen (gültig für 24 Stunden). Bitte sende deine Anfrage erneut.'
            : 'The confirmation link has expired (valid for 24 hours). Please submit your request again.' }}
        </p>
        <NuxtLink
          :to="de ? '/optin' : '/en/optin'"
          class="inline-block rounded-lg bg-accent px-8 py-3 text-sm font-semibold text-white transition hover:bg-accent/90"
        >
          {{ de ? 'Erneut versuchen' : 'Try again' }}
        </NuxtLink>
      </template>

      <!-- INVALID / FALLBACK -->
      <template v-else>
        <div class="mb-8 inline-flex h-20 w-20 items-center justify-center rounded-full bg-red-500/10">
          <svg class="h-10 w-10 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </div>
        <p class="mb-3 text-sm font-medium uppercase tracking-widest text-accent">mindcoded</p>
        <h1 class="mb-4 text-4xl font-bold text-white">
          {{ de ? 'Ungültiger Link' : 'Invalid link' }}
        </h1>
        <p class="mb-10 text-lg text-white/50 leading-relaxed">
          {{ de
            ? 'Dieser Bestätigungslink ist ungültig oder wurde bereits verwendet.'
            : 'This confirmation link is invalid or has already been used.' }}
        </p>
        <NuxtLink
          :to="de ? '/optin' : '/en/optin'"
          class="inline-block rounded-lg bg-accent px-8 py-3 text-sm font-semibold text-white transition hover:bg-accent/90"
        >
          {{ de ? 'Erneut versuchen' : 'Try again' }}
        </NuxtLink>
      </template>

    </div>
  </div>
</template>

<script setup lang="ts">
const route = useRoute()

const status = computed(() => route.query.status as string || 'invalid')
const de = computed(() => (route.query.locale as string) !== 'en')

useSeoMeta({ robots: 'noindex, nofollow' })
</script>
