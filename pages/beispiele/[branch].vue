<script setup lang="ts">
const route = useRoute()
const { locale, t } = useI18n()
const { getById } = useBranchExamples()

const branchId = computed(() => route.params.branch as string)
const branch = computed(() => getById(branchId.value))

if (!branch.value) {
  throw createError({ statusCode: 404, statusMessage: 'Branch not found' })
}

const isDark = computed(() => branch.value?.theme.pageBg.includes('neutral-950') ?? false)

useSeoMeta({
  title: `${branch.value?.name} — ${t('branch.design_studio')} — Mindcoded`,
  description: branch.value?.descriptionDe ?? '',
})

definePageMeta({
  layout: 'branch',
})
</script>

<template>
  <div v-if="branch" :class="[branch.theme.pageBg, branch.theme.pageText]">
    <BranchNav :nav="branch.content.nav" :theme="branch.theme" />

    <BranchHero :hero="branch.content.hero" :theme="branch.theme" />

    <!-- Stats -->
    <section v-if="branch.content.stats" class="py-10 px-6 border-y" :class="isDark ? 'border-neutral-800 bg-neutral-900/50' : 'border-slate-200 bg-white/50'">
      <div class="max-w-5xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-6">
        <div v-for="stat in branch.content.stats" :key="stat.label" class="text-center">
          <p class="font-display font-extrabold text-3xl" :class="`text-${branch.theme.accent}`">{{ stat.value }}</p>
          <p class="text-xs font-body opacity-70 mt-1" :class="isDark ? 'text-neutral-400' : 'text-slate-600'">{{ stat.label }}</p>
        </div>
      </div>
    </section>

    <!-- Zahnarzt: trust banner -->
    <section v-if="branchId === 'zahnarzt'" class="py-6 px-6 text-center" :class="isDark ? 'bg-neutral-900' : 'bg-sky-50'">
      <p class="font-body text-sm" :class="isDark ? 'text-neutral-300' : 'text-sky-800'">
        <span class="font-semibold">Angstfreie Behandlung:</span> Wir nehmen uns Zeit und erklaeren jeden Schritt.
      </p>
    </section>

    <!-- Branch-specific special sections (appear before generic services where it makes sense) -->
    <BranchRestaurantMenu v-if="branch.content.special?.type === 'menu'" :data="branch.content.special.data" :theme="branch.theme" />
    <BranchImmobilienFilter v-if="branch.content.special?.type === 'properties'" :data="branch.content.special.data" :theme="branch.theme" />
    <BranchFitnessPricing v-if="branchId === 'fitnessstudio' && branch.content.special?.type === 'pricing'" :data="branch.content.special.data" :theme="branch.theme" />

    <!-- Services -->
    <section v-if="branch.content.services?.items?.length" id="services" class="py-24 px-6" :class="isDark ? 'bg-neutral-900/30' : ''">
      <div class="max-w-7xl mx-auto">
        <BranchSectionHeader :light="isDark" :eyebrow="branch.content.services.eyebrow" :title="branch.content.services.title" :subtitle="branch.content.services.subtitle" />
        <div class="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          <BranchServiceCard
            v-for="service in branch.content.services.items"
            :key="service.title"
            :icon="service.icon"
            :title="service.title"
            :description="service.description"
            :theme="branch.theme"
          />
        </div>
      </div>
    </section>

    <!-- Fitness: pricing after services on non-fitness pages (not applicable) -->
    <BranchFitnessPricing v-if="branchId !== 'fitnessstudio' && branch.content.special?.type === 'pricing'" :data="branch.content.special.data" :theme="branch.theme" />

    <!-- Process / Projects / Target groups -->
    <section v-if="branch.content.process" id="process" class="py-24 px-6" :class="isDark ? 'bg-neutral-950' : 'bg-slate-50/50'">
      <div class="max-w-6xl mx-auto">
        <BranchSectionHeader :light="isDark" :eyebrow="branch.content.process.eyebrow" :title="branch.content.process.title" :subtitle="branch.content.process.subtitle" />
        <div class="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div
            v-for="(step, idx) in branch.content.process.steps"
            :key="step.title"
            class="rounded-2xl p-6 border transition-all hover:-translate-y-1 relative overflow-hidden"
            :class="isDark ? 'bg-neutral-900 border-neutral-800' : 'bg-white border-slate-200'"
          >
            <div
              class="absolute top-0 right-0 w-20 h-20 -mr-6 -mt-6 rounded-full opacity-10"
              :class="`bg-${branch.theme.accent}`"
            />
            <div
              class="relative w-12 h-12 rounded-xl flex items-center justify-center font-display font-bold text-sm mb-4"
              :class="`bg-${branch.theme.accent}/10 text-${branch.theme.accent}`"
            >
              {{ String(idx + 1).padStart(2, '0') }}
            </div>
            <h4 class="relative font-display font-bold text-lg mb-2" :class="isDark ? 'text-white' : 'text-slate-900'">{{ step.title }}</h4>
            <p class="relative font-body text-sm opacity-70" :class="isDark ? 'text-neutral-400' : 'text-slate-600'">{{ step.desc }}</p>
          </div>
        </div>
      </div>
    </section>

    <!-- Team -->
    <section v-if="branch.content.team" id="team" class="py-24 px-6">
      <div class="max-w-5xl mx-auto">
        <BranchSectionHeader :light="isDark" :eyebrow="branch.content.team.eyebrow" :title="branch.content.team.title" :subtitle="branch.content.team.subtitle" />
        <div class="flex flex-wrap justify-center gap-8">
          <div
            v-for="member in branch.content.team.members"
            :key="member.name"
            class="text-center max-w-[220px]"
          >
            <div class="w-32 h-32 mx-auto rounded-full overflow-hidden mb-4 border-4 shadow-md" :class="`border-${branch.theme.accent}/20`">
              <NuxtImg :src="member.image" :alt="member.name" class="w-full h-full object-cover" width="220" height="220" />
            </div>
            <h4 class="font-display font-bold text-lg" :class="isDark ? 'text-white' : 'text-slate-900'">{{ member.name }}</h4>
            <p class="text-sm font-body opacity-80" :class="isDark ? 'text-neutral-300' : 'text-slate-700'">{{ member.role }}</p>
            <p v-if="member.focus" class="text-xs font-body opacity-60 mt-1" :class="isDark ? 'text-neutral-400' : 'text-slate-500'">{{ member.focus }}</p>
          </div>
        </div>
      </div>
    </section>

    <!-- Reviews -->
    <section v-if="branch.content.reviews" class="py-24 px-6" :class="branch.theme.reviewsBg ?? branch.theme.heroGradient">
      <div class="max-w-6xl mx-auto">
        <BranchSectionHeader light :eyebrow="branch.content.reviews.eyebrow" :title="branch.content.reviews.title" :subtitle="branch.content.reviews.subtitle" />
        <div class="grid md:grid-cols-3 gap-6">
          <BranchReviewCard
            v-for="review in branch.content.reviews.items"
            :key="review.name"
            :name="review.name"
            :info="review.info"
            :text="review.text"
            :theme="branch.theme"
            light
          />
        </div>
      </div>
    </section>

    <!-- Contact -->
    <BranchContact :contact="branch.content.contact" :theme="branch.theme" :dark="isDark" />

    <!-- Footer -->
    <BranchFooter :brand="branch.content.nav.brand" :theme="branch.theme" />
  </div>
</template>
