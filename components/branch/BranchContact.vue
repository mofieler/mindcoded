<script setup lang="ts">
import type { BranchPageContent, BranchTheme } from '~/composables/useBranchExamples'

const props = defineProps<{
  contact: BranchPageContent['contact']
  theme: BranchTheme
  dark?: boolean
  sectionId?: string
}>()

const prefill = useTrialPrefill()

const iconMap: Record<string, string> = {
  MapPin: 'M15 10.5a3 3 0 11-6 0 3 3 0 016 0z M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z',
  Phone: 'M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 6.75z',
  Mail: 'M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75',
  Clock: 'M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z',
}

const isDark = computed(() => props.dark || props.theme.pageBg.includes('neutral-950'))
const sectionBg = computed(() => isDark.value ? 'bg-neutral-900' : 'bg-white')
const textClass = computed(() => isDark.value ? 'text-white' : 'text-slate-900')
const mutedClass = computed(() => isDark.value ? 'text-neutral-400' : 'text-slate-600')
const borderClass = computed(() => isDark.value ? 'border-neutral-800' : 'border-slate-200')
</script>

<template>
  <section :id="sectionId ?? 'contact'" class="py-24 px-6">
    <div v-if="sectionId === 'trial'" id="contact" class="sr-only" aria-hidden="true" />
    <div class="max-w-6xl mx-auto">
      <BranchSectionHeader :light="isDark" :eyebrow="contact.eyebrow" :title="contact.title" :subtitle="contact.subtitle" />

      <div class="grid md:grid-cols-2 gap-10">
        <!-- Info -->
        <div class="space-y-6">
          <div
            v-for="item in contact.info"
            :key="item.label"
            class="flex items-start gap-4"
          >
            <div class="w-10 h-10 rounded-lg flex items-center justify-center shrink-0" :class="`bg-${theme.accent}/10 text-${theme.accent}`">
              <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
                <path stroke-linecap="round" stroke-linejoin="round" :d="iconMap[item.icon] ?? iconMap.Phone" />
              </svg>
            </div>
            <div>
              <p class="text-xs font-body uppercase tracking-wider opacity-60" :class="mutedClass">{{ item.label }}</p>
              <p class="font-body font-medium" :class="textClass">{{ item.value }}</p>
            </div>
          </div>

          <div
            v-if="contact.emergency"
            class="rounded-2xl p-6 border mt-8"
            :class="`bg-red-50 border-red-100 ${textClass}`"
          >
            <h4 class="font-display font-bold text-lg text-red-700 mb-1">{{ contact.emergency.title }}</h4>
            <p class="font-body text-sm text-red-600 mb-3">{{ contact.emergency.desc }}</p>
            <a :href="`tel:${contact.emergency.phone}`" class="inline-flex items-center gap-2 font-display font-bold text-red-700 hover:underline">
              <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" :d="iconMap.Phone" />
              </svg>
              {{ contact.emergency.phone }}
            </a>
          </div>
        </div>

        <!-- Form -->
        <form class="rounded-2xl p-8 border" :class="[sectionBg, borderClass]" @submit.prevent>
          <div
            v-if="prefill.course || prefill.plan"
            class="mb-5 rounded-xl border px-4 py-3 text-sm font-body"
            :class="isDark ? 'border-lime-400/30 bg-lime-400/10 text-lime-200' : 'border-amber-200 bg-amber-50 text-amber-900'"
          >
            <p v-if="prefill.course">{{ prefill.course }}</p>
            <p v-if="prefill.plan">{{ prefill.plan }}</p>
          </div>
          <div class="grid sm:grid-cols-2 gap-4 mb-4">
            <div v-for="field in contact.form.fields.filter(f => f.type !== 'textarea')" :key="field.name" :class="field.type === 'select' || field.type === 'date' ? 'sm:col-span-2' : ''">
              <label class="block text-xs font-body font-medium mb-1.5" :class="mutedClass">{{ field.label }}</label>
              <select
                v-if="field.type === 'select'"
                class="w-full px-4 py-3 rounded-xl border bg-transparent font-body text-sm focus:outline-none focus:ring-2"
                :class="[borderClass, textClass]"
              >
                <option v-for="opt in field.options" :key="opt" :value="opt">{{ opt }}</option>
              </select>
              <input
                v-else
                :type="field.type"
                :placeholder="field.placeholder"
                class="w-full px-4 py-3 rounded-xl border bg-transparent font-body text-sm focus:outline-none focus:ring-2"
                :class="[borderClass, textClass]"
              >
            </div>
          </div>
          <div
            v-for="field in contact.form.fields.filter(f => f.type === 'textarea')"
            :key="field.name"
            class="mb-6"
          >
            <label class="block text-xs font-body font-medium mb-1.5" :class="mutedClass">{{ field.label }}</label>
            <textarea
              :placeholder="field.placeholder"
              rows="4"
              class="w-full px-4 py-3 rounded-xl border bg-transparent font-body text-sm focus:outline-none focus:ring-2"
              :class="[borderClass, textClass]"
            />
          </div>
          <button
            type="submit"
            class="w-full px-6 py-4 rounded-xl font-display font-bold transition-all hover:scale-[1.02]"
            :class="`bg-${theme.accent} ${theme.accentText}`"
          >
            {{ contact.form.submit }}
          </button>
        </form>
      </div>
    </div>
  </section>
</template>
