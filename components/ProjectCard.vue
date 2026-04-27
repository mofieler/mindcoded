<script setup lang="ts">
import type { Project } from '~/composables/useProjects'

const props = defineProps<{
  project: Project
}>()

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
