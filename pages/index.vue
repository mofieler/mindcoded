<script setup lang="ts">
const { t, locale } = useI18n()
const localePath = useLocalePath()
const { getAll } = useProjects()
const projects = getAll()

useSeo({
  title: t('meta.home_title'),
  description: t('meta.home_desc'),
})
</script>

<template>
  <!-- ─── HERO ──────────────────────────────────────────────────── -->
  <section
    class="relative min-h-[85vh] flex flex-col items-center justify-center hero-grid overflow-hidden"
  >
    <!-- Vignette -->
    <div class="absolute inset-0 bg-gradient-to-b from-base/0 via-base/0 to-base pointer-events-none z-20" />

    <!-- Electric Lines - Light Mode -->
    <div class="dark:hidden absolute inset-0 overflow-hidden pointer-events-none z-0">
      <!-- Horizontal electric lines -->
      <div class="absolute top-[120px] left-0 w-full h-px electric-line-h" />
      <div class="absolute top-[240px] left-0 w-full h-px electric-line-h" style="animation-delay: 2s;" />
      <div class="absolute top-[360px] left-0 w-full h-px electric-line-h" style="animation-delay: 4s;" />
      <!-- Vertical electric lines -->
      <div class="absolute top-0 left-[180px] w-px h-full electric-line-v" style="animation-delay: 1s;" />
      <div class="absolute top-0 left-[480px] w-px h-full electric-line-v" style="animation-delay: 3s;" />
      <div class="absolute top-0 left-[720px] w-px h-full electric-line-v" style="animation-delay: 5s;" />
    </div>

    <!-- Electric Lines - Dark Mode -->
    <div class="hidden dark:block absolute inset-0 overflow-hidden pointer-events-none z-0">
      <!-- Horizontal electric lines -->
      <div class="absolute top-[120px] left-0 w-full h-px electric-line-h-dark" />
      <div class="absolute top-[240px] left-0 w-full h-px electric-line-h-dark" style="animation-delay: 2s;" />
      <div class="absolute top-[360px] left-0 w-full h-px electric-line-h-dark" style="animation-delay: 4s;" />
      <!-- Vertical electric lines -->
      <div class="absolute top-0 left-[180px] w-px h-full electric-line-v-dark" style="animation-delay: 1s;" />
      <div class="absolute top-0 left-[480px] w-px h-full electric-line-v-dark" style="animation-delay: 3s;" />
      <div class="absolute top-0 left-[720px] w-px h-full electric-line-v-dark" style="animation-delay: 5s;" />
    </div>

    <!-- Content Container -->
    <div class="relative z-10 max-w-4xl mx-auto px-6 text-center">
      <!-- Eyebrow -->
      <p class="animate-fade-up text-accent text-xs font-display font-semibold tracking-[0.3em] uppercase mb-6">
        {{ t('home.hero_eyebrow') }}
      </p>

      <!-- Headline -->
      <h1
        class="animate-fade-up [animation-delay:100ms] opacity-0 font-display font-extrabold text-5xl sm:text-6xl lg:text-7xl text-fg leading-[1.05] whitespace-pre-line mb-6"
      >
        {{ t('home.hero_title') }}
      </h1>

      <!-- Sub -->
      <p
        class="animate-fade-up [animation-delay:200ms] opacity-0 font-body text-lg text-fg-muted max-w-xl mx-auto mb-10"
      >
        {{ t('home.hero_sub') }}
      </p>

      <!-- CTAs -->
      <div class="animate-fade-up [animation-delay:300ms] opacity-0 flex flex-wrap gap-4 justify-center">
        <NuxtLink
          :to="localePath('/#projects')"
          class="px-8 py-4 rounded-xl bg-accent text-white font-display font-bold text-base shadow-lg hover:shadow-xl hover:shadow-accent/30 transition-all hover:scale-110 hover:bg-accent/95"
        >
          {{ t('home.hero_cta_primary') }}
        </NuxtLink>
        <NuxtLink
          :to="localePath('/optin')"
          class="px-8 py-4 rounded-xl border-2 border-accent text-accent font-display font-bold text-base shadow-lg hover:shadow-xl hover:bg-accent hover:text-white transition-all hover:scale-110 dark:border-accent/60 dark:text-fg dark:bg-accent/20 dark:hover:bg-accent/40 dark:hover:border-accent dark:hover:text-fg"
        >
          {{ t('home.hero_cta_secondary') }}
        </NuxtLink>
      </div>
    </div>

    <!-- Scroll Indicator -->
    <div class="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 opacity-40 z-20">
      <span class="text-xs font-body text-fg-muted tracking-widest uppercase">{{ locale === 'de' ? 'Scollen' : 'Scroll' }}</span>
      <div class="w-px h-8 bg-fg-muted animate-pulse" />
    </div>
  </section>

  <!-- ─── PROJECTS GRID ─────────────────────────────────────────── -->
  <section id="projects" class="max-w-7xl mx-auto px-6 py-24">
    <!-- Section Header -->
    <div class="text-center mb-12">
      <h2 class="font-display font-bold text-3xl sm:text-4xl text-fg">
        {{ t('home.projects_title') }}
      </h2>
      <span class="text-fg-muted font-body text-sm block">
        {{ projects.length }} {{ locale === 'de' ? 'Projekte' : 'Projects' }}
      </span>
    </div>

    <!-- Grid -->
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6 max-w-4xl mx-auto">
      <ProjectCard
        v-for="project in projects"
        :key="project.slug"
        :project="project"
      />
    </div>
  </section>

  <!-- ─── SERVICES ─────────────────────────────────────────────── -->
  <section class="border-t border-border">
    <div class="max-w-7xl mx-auto px-6 py-24">
      <h2 class="font-display font-bold text-3xl sm:text-4xl text-fg mb-16">
        {{ t('home.services_title') }}
      </h2>
      <div class="grid grid-cols-1 sm:grid-cols-3 gap-px bg-border">
        <div
          v-for="(service, key) in ['ux', 'dev', 'seo']"
          :key="key"
          class="bg-base p-8 hover:bg-muted transition-colors group"
        >
          <div class="w-8 h-px bg-accent mb-8 group-hover:w-16 transition-all duration-300" />
          <h3 class="font-display font-bold text-xl text-fg mb-3">
            {{ t(`home.services.${service}_title`) }}
          </h3>
          <p class="font-body text-fg-muted text-sm leading-relaxed">
            {{ t(`home.services.${service}_desc`) }}
          </p>
        </div>
      </div>
    </div>
  </section>

  <!-- ─── CONTACT CTA ──────────────────────────────────────────── -->
  <section class="max-w-7xl mx-auto px-6 py-24">
    <div class="rounded-2xl dark:bg-gradient-to-br dark:from-blue-600 dark:via-blue-800 dark:to-black bg-gradient-to-br from-accent/8 via-surface to-accent/5 border border-border p-12 sm:p-16 text-center relative overflow-hidden shadow-xl dark:shadow-2xl transform transition-all duration-300 hover:scale-[1.02] dark:hover:shadow-blue-900/20 hover:shadow-accent/10">
      <!-- Accent top border line -->
      <div class="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-accent to-transparent rounded-t-2xl pointer-events-none"></div>
      <!-- Inner shadow for depth -->
      <div class="absolute inset-0 rounded-2xl shadow-inner pointer-events-none"></div>

      <div class="relative z-10 w-full">
        <h2 class="font-display font-extrabold text-3xl sm:text-4xl dark:text-white text-fg mb-4">
          {{ t('contact.title') }}
        </h2>
        <p class="font-body dark:text-white/90 text-fg-muted mb-10">{{ t('contact.sub') }}</p>
        <div class="max-w-md mx-auto">
          <ClientOnly>
            <UiOptInForm />
          </ClientOnly>
        </div>
      </div>
    </div>
  </section>
</template>
