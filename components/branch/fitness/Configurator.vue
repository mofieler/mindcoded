<script setup lang="ts">
import { motion } from 'motion-v'
import { getFitnessCopy, getFitnessModules } from '~/utils/fitnessData'

const props = defineProps<{
  plans: { name: string; price: string; period: string; features: string[]; highlighted: boolean }[]
}>()

const { locale } = useI18n()
const loc = computed(() => (locale.value === 'en' ? 'en' : 'de') as 'de' | 'en')
const copy = computed(() => getFitnessCopy(loc.value))
const modules = computed(() => getFitnessModules(loc.value))
const reduced = useReducedMotion()
const prefill = useTrialPrefill()

const parsePrice = (raw: string) => Number(raw.replace(',', '.').replace(/[^\d.]/g, '')) || 0

const planIndex = ref(Math.max(0, props.plans.findIndex((p) => p.highlighted)))
const selected = ref<string[]>([])

const currentPlan = computed(() => props.plans[planIndex.value] ?? props.plans[0])
const addonTotal = computed(() =>
  modules.value.filter((m) => selected.value.includes(m.id)).reduce((sum, m) => sum + m.price, 0),
)
const total = computed(() => parsePrice(currentPlan.value?.price ?? '0') + addonTotal.value)

const totalLabel = computed(() =>
  loc.value === 'de'
    ? total.value.toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
    : total.value.toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
)

const toggle = (id: string) => {
  selected.value = selected.value.includes(id)
    ? selected.value.filter((x) => x !== id)
    : [...selected.value, id]
}

const checkout = () => {
  const extras = modules.value.filter((m) => selected.value.includes(m.id)).map((m) => m.name).join(', ')
  prefill.value = {
    ...prefill.value,
    plan: extras ? `${currentPlan.value.name} + ${extras}` : currentPlan.value.name,
  }
  document.getElementById('trial')?.scrollIntoView({ behavior: 'smooth' })
}
</script>

<template>
  <section id="membership" class="py-24 px-6 bg-neutral-900">
    <div class="max-w-5xl mx-auto">
      <p class="text-lime-400 text-xs font-display font-semibold tracking-[0.25em] uppercase mb-3 text-center">{{ copy.configuratorEyebrow }}</p>
      <h2 class="font-display font-bold text-3xl sm:text-4xl text-white text-center mb-3">{{ copy.configuratorTitle }}</h2>
      <p class="font-body text-neutral-400 text-center max-w-2xl mx-auto mb-12">{{ copy.configuratorSubtitle }}</p>

      <div class="grid lg:grid-cols-[1.2fr_0.8fr] gap-8 items-start">
        <div>
          <p class="text-[10px] font-display tracking-[0.2em] uppercase text-neutral-500 mb-3">{{ copy.basePlan }}</p>
          <input
            v-model.number="planIndex"
            type="range"
            min="0"
            :max="plans.length - 1"
            step="1"
            class="w-full accent-lime-400 mb-6 h-11"
          >
          <div class="grid grid-cols-3 gap-2 mb-10">
            <button
              v-for="(plan, i) in plans"
              :key="plan.name"
              type="button"
              class="min-h-[48px] rounded-xl border px-2 py-3 text-center transition-colors"
              :class="i === planIndex ? 'border-lime-400 bg-lime-400/10 text-lime-300' : 'border-neutral-800 text-neutral-400'"
              @click="planIndex = i"
            >
              <span class="block font-display font-bold text-sm">{{ plan.name }}</span>
              <span class="block text-xs mt-1">{{ plan.price }}</span>
            </button>
          </div>

          <p class="text-[10px] font-display tracking-[0.2em] uppercase text-neutral-500 mb-3">{{ copy.addons }}</p>
          <div class="grid sm:grid-cols-3 gap-3">
            <button
              v-for="mod in modules"
              :key="mod.id"
              type="button"
              class="min-h-[44px] rounded-2xl border p-4 text-left transition-all"
              :class="selected.includes(mod.id) ? 'border-orange-400 bg-orange-500/10 text-white' : 'border-neutral-800 bg-neutral-950 text-neutral-300 hover:border-orange-400/40'"
              @click="toggle(mod.id)"
            >
              <span class="flex items-center justify-between gap-2 mb-2">
                <span class="font-display font-bold">{{ mod.name }}</span>
                <span class="text-xs font-display" :class="selected.includes(mod.id) ? 'text-orange-300' : 'text-neutral-500'">{{ mod.priceLabel }}</span>
              </span>
              <span class="text-xs text-neutral-400">{{ mod.description }}</span>
            </button>
          </div>
        </div>

        <div class="rounded-3xl border border-lime-400/20 bg-neutral-950 p-8 text-center lg:sticky lg:top-24">
          <p class="text-xs font-display tracking-[0.2em] uppercase text-neutral-500 mb-2">{{ currentPlan.name }}</p>
          <motion.p
            class="font-display font-extrabold text-5xl text-lime-400"
            :animate="reduced ? undefined : { scale: [1, 1.04, 1] }"
            :transition="{ duration: 0.25 }"
            :key="totalLabel"
          >
            {{ totalLabel }}
          </motion.p>
          <p class="text-sm text-neutral-400 mt-1 mb-6">{{ copy.monthly }}</p>
          <ul class="text-left space-y-2 mb-8">
            <li v-for="feat in currentPlan.features" :key="feat" class="flex gap-2 text-sm text-neutral-300">
              <span class="text-lime-400">✓</span>{{ feat }}
            </li>
            <li v-for="mod in modules.filter(m => selected.includes(m.id))" :key="mod.id" class="flex gap-2 text-sm text-orange-200">
              <span class="text-orange-400">+</span>{{ mod.name }}
            </li>
          </ul>
          <button
            type="button"
            class="w-full min-h-[48px] rounded-xl bg-lime-400 text-neutral-950 font-display font-extrabold hover:bg-lime-300"
            @click="checkout"
          >
            {{ copy.cta }}
          </button>
        </div>
      </div>
    </div>
  </section>
</template>
