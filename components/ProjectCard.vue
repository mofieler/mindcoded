<script setup lang="ts">
import type { Project } from '~/composables/useProjects'

const props = defineProps<{
  project: Project
}>()

const { t } = useI18n()
const localePath = useLocalePath()
</script>

<template>
  <NuxtLink
    :to="localePath(`/projects/${project.slug}`)"
    class="group block rounded-xl overflow-hidden border border-border bg-surface shadow-sm dark:shadow-none hover:border-accent transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-accent/15 dark:hover:shadow-black/40"
  >
    <!-- Cover Image -->
    <div class="relative aspect-[16/9] overflow-hidden bg-muted">
      <NuxtImg
        :src="project.coverImage"
        :alt="project.title"
        class="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
        loading="lazy"
        format="webp"
        width="800"
        height="500"
      />
      <!-- Overlay on hover -->
      <div class="absolute inset-0 bg-accent/0 group-hover:bg-accent/10 transition-all duration-300" />
    </div>

    <!-- Card Content -->
    <div class="p-6">
      <div class="flex items-center gap-2 mb-2">
        <span
          v-if="project.type === 'real'"
          class="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-body font-semibold bg-accent/10 text-accent border border-accent/20"
        >
          <svg class="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12c0 1.268-.63 2.39-1.593 3.068a3.745 3.745 0 01-1.043 3.296 3.745 3.745 0 01-3.296 1.043A3.745 3.745 0 0112 21c-1.268 0-2.39-.63-3.068-1.593a3.746 3.746 0 01-3.296-1.043 3.745 3.745 0 01-1.043-3.296A3.745 3.745 0 013 12c0-1.268.63-2.39 1.593-3.068a3.745 3.745 0 011.043-3.296 3.745 3.745 0 013.296-1.043A3.745 3.745 0 0112 3c1.268 0 2.39.63 3.068 1.593a3.745 3.745 0 013.296 1.043 3.745 3.745 0 011.043 3.296A3.745 3.745 0 0121 12z" />
          </svg>
          {{ t('project.real_reference') }}
        </span>
        <span
          v-else-if="project.type === 'example'"
          class="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-body font-semibold bg-muted text-fg-muted border border-border"
        >
          {{ t('project.example_project') }}
        </span>
      </div>

      <!-- Category Label -->
      <p class="text-accent text-xs font-display font-semibold tracking-widest uppercase mb-2">
        {{ project.category }}
      </p>

      <!-- Title -->
      <h3 class="font-display font-bold text-xl text-fg group-hover:text-accent transition-colors mb-2">
        {{ project.title }}
      </h3>

      <!-- Tagline -->
      <p class="text-fg-muted text-sm font-body leading-relaxed mb-4">
        {{ project.tagline }}
      </p>

      <!-- Tags -->
      <div class="flex flex-wrap gap-1.5">
        <span
          v-for="tag in project.tags.slice(0, 4)"
          :key="tag"
          class="px-2 py-0.5 rounded-full text-xs font-body bg-muted text-fg-muted border border-border"
        >
          {{ tag }}
        </span>
      </div>

      <!-- Client + Year -->
      <div class="mt-4 pt-4 border-t border-border flex items-center justify-between">
        <span class="text-xs font-body text-fg-muted">{{ project.client }}</span>
        <span class="text-xs font-body text-fg-muted">{{ project.year }}</span>
      </div>
    </div>
  </NuxtLink>
</template>
