<script setup lang="ts">
const { t } = useI18n()
const localePath = useLocalePath()
const { getAll } = useProjects()
const project = computed(() => getAll()[0])
</script>

<template>
  <section v-if="project" id="case" class="border-t border-border">
    <div class="max-w-6xl mx-auto px-6 pt-16 sm:pt-20 pb-16 sm:pb-20">
      <div class="grid lg:grid-cols-2 gap-10 lg:gap-16 items-center">
        <div>
          <p class="text-accent text-xs font-display font-semibold tracking-[0.28em] uppercase mb-4">
            {{ t('home.case_eyebrow') }}
          </p>
          <h2 class="font-display font-bold text-3xl sm:text-4xl text-fg leading-tight mb-4">
            {{ project.title }}
          </h2>
          <p class="font-body text-fg-muted leading-relaxed mb-4">
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

        <NuxtLink
          :to="localePath(`/projects/${project.slug}`)"
          class="case-frame group card-hover block"
        >
          <div class="case-chrome" aria-hidden="true">
            <span class="flex gap-[5px]">
              <span class="h-1.5 w-1.5 rounded-full bg-[#FF5F57]/80" />
              <span class="h-1.5 w-1.5 rounded-full bg-[#FEBC2E]/80" />
              <span class="h-1.5 w-1.5 rounded-full bg-[#28C840]/80" />
            </span>
            <span class="case-url">paquitapilatesreformer.com</span>
          </div>
          <div class="case-screen">
            <img
              :src="project.coverImage"
              :alt="project.title"
              class="ui-media-zoom w-full h-full object-cover object-top"
              width="720"
              height="480"
              loading="lazy"
            >
          </div>
        </NuxtLink>
      </div>
    </div>
  </section>
</template>

<style scoped>
.case-frame {
  max-width: 32rem;
  margin-inline: auto;
  overflow: hidden;
  border-radius: 1.15rem;
  border: 1px solid rgb(var(--color-border) / 0.85);
  background: rgb(var(--color-surface));
}

@media (min-width: 1024px) {
  .case-frame {
    max-width: none;
    margin-inline: 0;
  }
}

.case-chrome {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.55rem 0.75rem;
  border-bottom: 1px solid rgb(var(--color-border) / 0.8);
  background: rgb(var(--color-muted) / 0.7);
}

.case-url {
  flex: 1;
  min-width: 0;
  padding: 0.2rem 0.7rem;
  border-radius: 999px;
  background: rgb(var(--color-base) / 0.9);
  color: rgb(var(--color-fg-muted));
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  font-size: 10px;
  letter-spacing: 0.02em;
  text-align: center;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.case-screen {
  aspect-ratio: 16 / 11;
  overflow: hidden;
  background: rgb(var(--color-muted));
}
</style>
