<script setup lang="ts">
import type { BranchPageContent, BranchTheme } from '~/composables/useBranchExamples'
import { getImmobilienCopy, getImmobilienAgents } from '~/utils/immobilienData'

const props = defineProps<{
  team: NonNullable<BranchPageContent['team']>
  theme: BranchTheme
}>()

const { locale } = useI18n()
const copy = computed(() => getImmobilienCopy(locale.value === 'en' ? 'en' : 'de'))
const extras = computed(() => getImmobilienAgents(locale.value === 'en' ? 'en' : 'de'))

const members = computed(() =>
  props.team.members.map((m) => {
    const extra = extras.value.find((a) => a.name === m.name)
    return {
      ...m,
      availableToday: m.availableToday ?? extra?.availableToday ?? false,
      phone: m.phone ?? extra?.phone,
    }
  }),
)
</script>

<template>
  <section id="team" class="py-24 px-6 bg-white">
    <div class="max-w-5xl mx-auto">
      <BranchSectionHeader :eyebrow="team.eyebrow" :title="team.title" :subtitle="team.subtitle" />
      <div class="grid sm:grid-cols-2 gap-8 max-w-3xl mx-auto">
        <article
          v-for="member in members"
          :key="member.name"
          class="rounded-3xl border border-stone-200 bg-stone-50 p-6 text-center shadow-sm"
        >
          <div class="relative w-32 h-32 mx-auto mb-4">
            <img :src="member.image" :alt="member.name" class="w-32 h-32 rounded-full object-cover border-4 border-amber-600/20">
            <span
              class="absolute bottom-1 right-2 w-4 h-4 rounded-full border-2 border-white"
              :class="member.availableToday ? 'bg-emerald-500' : 'bg-stone-300'"
            />
          </div>
          <h3 class="font-display font-bold text-lg text-stone-900">{{ member.name }}</h3>
          <p class="text-sm font-body text-stone-600">{{ member.role }}</p>
          <p v-if="member.focus" class="text-xs font-body text-stone-400 mt-1">{{ member.focus }}</p>
          <p class="mt-3 inline-flex items-center gap-1.5 text-xs font-display font-semibold" :class="member.availableToday ? 'text-emerald-700' : 'text-stone-400'">
            <span class="w-1.5 h-1.5 rounded-full" :class="member.availableToday ? 'bg-emerald-500' : 'bg-stone-300'" />
            {{ member.availableToday ? copy.availableToday : copy.unavailable }}
          </p>
          <a
            v-if="member.phone"
            :href="`tel:${member.phone.replace(/\s/g, '')}`"
            class="mt-4 inline-flex h-11 items-center px-4 rounded-xl bg-amber-600 text-white text-sm font-display font-bold"
          >
            {{ member.phone }}
          </a>
        </article>
      </div>
    </div>
  </section>
</template>
