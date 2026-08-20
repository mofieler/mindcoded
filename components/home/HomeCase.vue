<script setup lang="ts">
const { t } = useI18n()
const localePath = useLocalePath()
const { getAll } = useProjects()
const project = computed(() => getAll()[0])
</script>

<template>
  <section v-if="project" id="case" class="border-t border-border">
    <div class="max-w-7xl mx-auto px-6 py-24">
      <div class="grid lg:grid-cols-12 gap-10 lg:gap-14 items-center">
        <div class="lg:col-span-7">
          <UiCard as="NuxtLink" hover :to="localePath(`/projects/${project.slug}`)" class="group block">
            <div class="relative aspect-[16/10] overflow-hidden bg-muted">
              <img
                :src="project.coverImage"
                :alt="project.title"
                class="ui-media-zoom absolute inset-0 w-full h-full object-cover object-center"
                width="1200"
                height="750"
                loading="lazy"
              />
            </div>
          </UiCard>
        </div>

        <div class="lg:col-span-5">
          <p class="text-accent text-xs font-display font-semibold tracking-[0.28em] uppercase mb-4">
            {{ t('home.case_eyebrow') }}
          </p>
          <h2 class="font-display font-bold text-3xl sm:text-4xl text-fg leading-tight mb-4">
            {{ project.title }}
          </h2>
          <p class="font-body text-fg-muted leading-relaxed mb-6">
            {{ project.tagline }}
          </p>
          <p class="font-body text-sm text-fg-muted mb-8">
            {{ t('home.case_body') }}
          </p>
          <div class="flex flex-wrap gap-3">
            <NuxtLink :to="localePath(`/projects/${project.slug}`)" class="btn-primary">
              {{ t('home.case_cta') }}
            </NuxtLink>
            <a
              href="https://paquitapilatesreformer.com"
              target="_blank"
              rel="noopener noreferrer"
              class="btn-ghost"
            >
              {{ t('home.case_live') }}
            </a>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>
