<script setup lang="ts">
import type { FitnessGoal, FitnessLevel, FitnessTimeOfDay } from '~/utils/fitnessData'
import {
  getFitnessClasses,
  getFitnessCopy,
  fitnessGoalLabel,
  fitnessLevelLabel,
  fitnessTimeLabel,
  timeOfDayFromHour,
} from '~/utils/fitnessData'
import { motion } from 'motion-v'

const { locale } = useI18n()
const loc = computed(() => (locale.value === 'en' ? 'en' : 'de') as 'de' | 'en')
const copy = computed(() => getFitnessCopy(loc.value))
const classes = getFitnessClasses()
const reduced = useReducedMotion()
const prefill = useTrialPrefill()

const level = ref<'all' | FitnessLevel>('all')
const goal = ref<'all' | FitnessGoal>('all')
const time = ref<'all' | FitnessTimeOfDay>('all')

const filtered = computed(() =>
  classes.filter((c) => {
    if (level.value !== 'all' && c.level !== level.value) return false
    if (goal.value !== 'all' && c.goal !== goal.value) return false
    if (time.value !== 'all' && timeOfDayFromHour(c.hour) !== time.value) return false
    return true
  }),
)

const book = (name: string) => {
  prefill.value = { ...prefill.value, course: name }
  document.getElementById('trial')?.scrollIntoView({ behavior: 'smooth' })
}

const chip = (active: boolean) =>
  active
    ? 'bg-lime-400 text-neutral-950 border-lime-400'
    : 'bg-neutral-900 text-neutral-300 border-neutral-800 hover:border-lime-400/40'
</script>

<template>
  <section id="classes" class="py-24 px-6 bg-neutral-950">
    <div class="max-w-6xl mx-auto">
      <p class="text-lime-400 text-xs font-display font-semibold tracking-[0.25em] uppercase mb-3 text-center">{{ copy.classesEyebrow }}</p>
      <h2 class="font-display font-bold text-3xl sm:text-4xl text-white text-center mb-3">{{ copy.classesTitle }}</h2>
      <p class="font-body text-neutral-400 text-center max-w-2xl mx-auto mb-10">{{ copy.classesSubtitle }}</p>

      <div class="flex flex-col gap-4 mb-10">
        <div>
          <p class="text-[10px] font-display tracking-[0.2em] uppercase text-neutral-500 mb-2">{{ copy.level }}</p>
          <div class="flex flex-wrap gap-2">
            <button type="button" class="h-11 px-4 rounded-full border text-sm font-display font-semibold" :class="chip(level === 'all')" @click="level = 'all'">{{ copy.all }}</button>
            <button v-for="l in (['beginner', 'intermediate', 'advanced'] as FitnessLevel[])" :key="l" type="button" class="h-11 px-4 rounded-full border text-sm font-display font-semibold" :class="chip(level === l)" @click="level = l">{{ fitnessLevelLabel(l, loc) }}</button>
          </div>
        </div>
        <div>
          <p class="text-[10px] font-display tracking-[0.2em] uppercase text-neutral-500 mb-2">{{ copy.goal }}</p>
          <div class="flex flex-wrap gap-2">
            <button type="button" class="h-11 px-4 rounded-full border text-sm font-display font-semibold" :class="chip(goal === 'all')" @click="goal = 'all'">{{ copy.all }}</button>
            <button v-for="g in (['muscle', 'fatburn', 'yoga'] as FitnessGoal[])" :key="g" type="button" class="h-11 px-4 rounded-full border text-sm font-display font-semibold" :class="chip(goal === g)" @click="goal = g">{{ fitnessGoalLabel(g, loc) }}</button>
          </div>
        </div>
        <div>
          <p class="text-[10px] font-display tracking-[0.2em] uppercase text-neutral-500 mb-2">{{ copy.time }}</p>
          <div class="flex flex-wrap gap-2">
            <button type="button" class="h-11 px-4 rounded-full border text-sm font-display font-semibold" :class="chip(time === 'all')" @click="time = 'all'">{{ copy.all }}</button>
            <button v-for="t in (['morning', 'midday', 'evening'] as FitnessTimeOfDay[])" :key="t" type="button" class="h-11 px-4 rounded-full border text-sm font-display font-semibold" :class="chip(time === t)" @click="time = t">{{ fitnessTimeLabel(t, loc) }}</button>
          </div>
        </div>
      </div>

      <div class="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <motion.article
          v-for="item in filtered"
          :key="item.id"
          class="rounded-2xl border border-neutral-800 bg-neutral-900 p-5 hover:border-lime-400/40 transition-colors"
          :initial="reduced ? false : { opacity: 0, y: 12 }"
          :animate="{ opacity: 1, y: 0 }"
        >
          <div class="flex items-start justify-between gap-3 mb-3">
            <div>
              <p class="text-lime-400 font-display font-bold text-lg leading-none">{{ item.time }}</p>
              <p class="text-xs text-neutral-500 mt-1">{{ item.duration }}</p>
            </div>
            <span class="text-[11px] px-2 py-1 rounded-md bg-orange-500/15 text-orange-300 border border-orange-500/20">{{ fitnessGoalLabel(item.goal, loc) }}</span>
          </div>
          <h3 class="font-display font-bold text-white text-lg mb-1">{{ item.name }}</h3>
          <p class="text-sm text-neutral-400 mb-4">{{ item.trainer }} · {{ fitnessLevelLabel(item.level, loc) }}</p>
          <div class="flex items-center justify-between gap-3">
            <span class="text-xs text-neutral-500">{{ item.spots }} {{ copy.spots }}</span>
            <button type="button" class="h-11 px-4 rounded-xl bg-lime-400 text-neutral-950 text-sm font-display font-bold hover:bg-lime-300" @click="book(item.name)">
              {{ copy.book }}
            </button>
          </div>
        </motion.article>
      </div>
    </div>
  </section>
</template>
