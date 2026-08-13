<script setup lang="ts">
import { getImmobilienListings, getImmobilienCopy, getImmobilienAgents } from '~/utils/immobilienData'

const { locale } = useI18n()
const loc = computed(() => (locale.value === 'en' ? 'en' : 'de') as 'de' | 'en')
const listings = computed(() => getImmobilienListings(loc.value))
const copy = computed(() => getImmobilienCopy(loc.value))
const agents = computed(() => getImmobilienAgents(loc.value))

const { filtered, hoveredId, selectedId, applyAndScroll } = usePropertySearch(listings)

const mobileView = ref<'list' | 'map'>('list')
const quickId = ref<string | null>(null)

const quickProperty = computed(() => listings.value.find((p) => p.id === quickId.value) ?? null)
const quickAgent = computed(() => agents.value.find((a) => a.id === quickProperty.value?.agentId))

const open = (id: string) => {
  selectedId.value = id
  quickId.value = id
}
</script>

<template>
  <section id="properties" class="bg-stone-50">
    <div class="max-w-[1400px] mx-auto px-4 sm:px-6 pt-10 pb-4">
      <div class="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-6">
        <div>
          <p class="text-xs font-display font-semibold tracking-[0.25em] uppercase text-amber-700 mb-2">Boeckler</p>
          <h2 class="font-display font-bold text-3xl text-stone-900">{{ filtered.length }} {{ copy.results }}</h2>
        </div>
        <div class="flex md:hidden rounded-xl border border-stone-200 overflow-hidden">
          <button type="button" class="h-11 px-5 text-sm font-display font-semibold" :class="mobileView === 'list' ? 'bg-stone-900 text-white' : 'bg-white text-stone-600'" @click="mobileView = 'list'">{{ copy.list }}</button>
          <button type="button" class="h-11 px-5 text-sm font-display font-semibold" :class="mobileView === 'map' ? 'bg-stone-900 text-white' : 'bg-white text-stone-600'" @click="mobileView = 'map'">{{ copy.map }}</button>
        </div>
      </div>

      <div class="rounded-2xl border border-stone-200 bg-white p-4 mb-6">
        <BranchImmobilienSearchBar
          :copy="copy"
          variant="solid"
          :locale="loc"
          @search="applyAndScroll()"
        />
      </div>
    </div>

    <div class="max-w-[1400px] mx-auto px-4 sm:px-6 pb-16">
      <div class="grid lg:grid-cols-2 gap-6 items-start">
        <div :class="mobileView === 'map' ? 'hidden lg:block' : 'block'">
          <p v-if="!filtered.length" class="text-sm font-body text-stone-500 py-16 text-center">{{ copy.noResults }}</p>
          <div v-else class="grid sm:grid-cols-2 gap-4">
            <BranchImmobilienCard
              v-for="property in filtered"
              :key="property.id"
              :property="property"
              :copy="copy"
              :active="hoveredId === property.id || selectedId === property.id"
              @open="open"
              @hover="hoveredId = $event"
            />
          </div>
        </div>

        <div
          class="lg:sticky lg:top-20 h-[55vh] lg:h-[calc(100vh-6rem)] rounded-2xl overflow-hidden border border-stone-200"
          :class="mobileView === 'list' ? 'hidden lg:block' : 'block'"
        >
          <ClientOnly>
            <BranchImmobilienMap
              :properties="filtered"
              :hovered-id="hoveredId"
              :selected-id="selectedId"
              @hover="hoveredId = $event"
              @select="open"
            />
            <template #fallback>
              <div class="w-full h-full bg-stone-200 animate-pulse" />
            </template>
          </ClientOnly>
        </div>
      </div>
    </div>

    <BranchImmobilienQuickView
      :property="quickProperty"
      :agent="quickAgent"
      :copy="copy"
      @close="quickId = null"
    />
  </section>
</template>
