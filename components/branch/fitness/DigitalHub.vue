<script setup lang="ts">
import { getFitnessCopy } from '~/utils/fitnessData'

const { locale } = useI18n()
const copy = computed(() => getFitnessCopy(locale.value === 'en' ? 'en' : 'de'))

const items = computed(() =>
  locale.value === 'en'
    ? [
        { title: 'On-demand workouts', text: 'Follow programming anywhere — HIIT, strength, yoga, filmed in-studio.' },
        { title: 'Member community', text: 'Challenges, PRs and trainer AMAs. Your club, unlocked on the phone.' },
        { title: 'Progress tracking', text: 'Classes booked, load logged, streaks that actually mean something.' },
      ]
    : [
        { title: 'On-Demand-Workouts', text: 'Train wo du willst — HIIT, Kraft, Yoga, gefilmt im Studio.' },
        { title: 'Member-Community', text: 'Challenges, PRs und Trainer-AMAs. Dein Club, in der Hosentasche.' },
        { title: 'Fortschritt tracken', text: 'Kurse, Last und Streaks, die wirklich etwas zaehlen.' },
      ],
)
</script>

<template>
  <section id="hub" class="py-24 px-6 bg-neutral-950">
    <div class="max-w-6xl mx-auto">
      <div class="relative overflow-hidden rounded-3xl border border-lime-400/20 bg-gradient-to-br from-neutral-900 via-neutral-950 to-lime-950/40 p-8 sm:p-12">
        <div class="absolute -top-16 right-0 w-64 h-64 rounded-full bg-lime-400/10 blur-3xl pointer-events-none" />
        <div class="absolute bottom-0 left-10 w-40 h-40 rounded-full bg-orange-500/10 blur-3xl pointer-events-none" />

        <div class="relative grid lg:grid-cols-2 gap-10 items-center">
          <div>
            <span class="inline-flex items-center gap-2 px-3 py-1 rounded-full text-[11px] font-display font-bold tracking-widest uppercase bg-lime-400/10 text-lime-300 border border-lime-400/25 mb-5">
              {{ copy.hubBadge }}
            </span>
            <p class="text-orange-300 text-xs font-display font-semibold tracking-[0.25em] uppercase mb-3">{{ copy.hubEyebrow }}</p>
            <h2 class="font-display font-extrabold text-3xl sm:text-5xl text-white mb-4">{{ copy.hubTitle }}</h2>
            <p class="font-body text-neutral-300 mb-8 max-w-md">{{ copy.hubSubtitle }}</p>
            <a href="#trial" class="inline-flex min-h-[48px] items-center px-6 rounded-xl border border-white/20 text-white font-display font-bold hover:border-lime-400 hover:text-lime-300">
              {{ copy.hubCta }}
            </a>
          </div>

          <div class="grid gap-4">
            <div
              v-for="item in items"
              :key="item.title"
              class="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-md p-5"
            >
              <h3 class="font-display font-bold text-white mb-1">{{ item.title }}</h3>
              <p class="text-sm font-body text-neutral-400">{{ item.text }}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>
