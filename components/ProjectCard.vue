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
    class="group card card-hover block"
  >
    <!-- Cover Image -->
    <div class="relative aspect-[16/9] overflow-hidden bg-muted">
      <img
        :src="project.coverImage"
        :alt="project.title"
        class="ui-media-zoom w-full h-full object-cover object-center"
        width="800"
        height="500"
        loading="lazy"
      />
      <!-- Overlay on hover -->
      <div class="absolute inset-0 ui-hover-veil" />
    </div>

    <!-- Card Content -->
    <div class="p-6">
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
          class="tag tag-muted"
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
