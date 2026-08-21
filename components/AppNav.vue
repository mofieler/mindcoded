<script setup lang="ts">
const { locale, locales, t } = useI18n()
const colorMode = useColorMode()
const localePath = useLocalePath()
const switchLocalePath = useSwitchLocalePath()
const { items: services } = useServices()

const route = useRoute()

const navLinks = computed(() => [
  { key: 'nav.portfolio', to: localePath('/') + '#case' },
  { key: 'nav.solutions', to: localePath('/solutions') },
  { key: 'nav.process', to: localePath('/') + '#process' },
  { key: 'nav.contact', to: localePath('/contact') },
])

const ctaTo = computed(() => {
  const home = localePath('/')
  return route.path === home ? `${home}#contact` : localePath('/contact')
})

const isActive = (to: string) => {
  const hashAt = to.indexOf('#')
  if (hashAt !== -1) {
    return route.path === localePath('/') && route.hash === to.slice(hashAt)
  }
  return route.path === to
}

const linksBeforeSolutions = computed(() =>
  navLinks.value.slice(0, navLinks.value.findIndex(l => l.key === 'nav.solutions'))
)
const linksAfterSolutions = computed(() =>
  navLinks.value.slice(navLinks.value.findIndex(l => l.key === 'nav.solutions') + 1)
)

const otherLocale = computed(() =>
  locales.value.find((l) => l.code !== locale.value)
)

const otherLocalePath = computed(() =>
  otherLocale.value ? switchLocalePath(otherLocale.value.code) : ''
)

const toggleColorMode = () => {
  const nextMode = colorMode.value === 'dark' ? 'light' : 'dark'
  colorMode.preference = nextMode
}

const mobileOpen = ref(false)
const servicesDropdownOpen = ref(false)
</script>

<template>
  <header class="app-nav-header fixed top-0 inset-x-0 z-[9999] pt-4 px-4">
    <div class="max-w-5xl mx-auto">
    <nav
      class="app-nav-bar h-[3.35rem] px-2 sm:px-3 flex items-center justify-between gap-3 rounded-full border border-black/[0.08] shadow-[0_10px_40px_rgb(22_20_18/0.12)] dark:border-white/12 dark:shadow-[0_10px_40px_rgb(0_0_0/0.45)]"
    >

      <!-- Logo -->
      <NuxtLink :to="localePath('/')" class="flex items-center gap-2.5 shrink-0">
        <NuxtImg
          src="/logo-transparent.png"
          alt="Mindcoded Logo"
          class="w-8 h-8 rounded-full"
          width="32"
          height="32"
        />
        <span class="font-display font-bold text-fg text-[0.9375rem] tracking-tight hidden sm:block">
          Mindcoded
        </span>
      </NuxtLink>

      <!-- Desktop Links -->
      <ul class="hidden md:flex items-center gap-1">
        <!-- Links before Solutions -->
        <li v-for="link in linksBeforeSolutions" :key="link.key">
          <NuxtLink
            :to="link.to"
            class="px-3.5 py-1.5 h-8 rounded-full text-sm font-body text-fg hover:bg-muted/80 transition-all inline-flex items-center justify-center"
            :class="isActive(link.to) ? 'text-accent bg-accent/10 font-semibold' : ''"
          >
            {{ t(link.key) }}
          </NuxtLink>
        </li>

        <!-- Services Dropdown -->
        <li
          class="relative"
          @mouseenter="servicesDropdownOpen = true"
          @mouseleave="servicesDropdownOpen = false"
        >
          <button
            class="px-3.5 py-1.5 h-8 rounded-full text-sm font-body text-fg hover:bg-muted/80 transition-all flex items-center justify-center gap-1"
            :class="{ 'text-accent bg-accent/10 font-semibold': $route.path.startsWith('/solutions') }"
          >
            {{ t('nav.solutions') }}
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              viewBox="0 0 24 24" 
              fill="none" 
              stroke="currentColor" 
              stroke-width="2" 
              class="w-3 h-3 transition-transform duration-200"
              :class="{ 'rotate-180': servicesDropdownOpen }"
            >
              <polyline points="6,9 12,15 18,9"></polyline>
            </svg>
          </button>
          
          <!-- Dropdown Menu -->
          <Transition name="dropdown">
            <div
              v-if="servicesDropdownOpen"
              class="absolute top-full left-0 mt-3 w-96 bg-surface/90 backdrop-blur-2xl border border-border/80 rounded-3xl shadow-[0_16px_50px_rgb(22_20_18/0.14)] overflow-hidden"
            >
              <div class="p-2">
                <NuxtLink
                  v-for="service in services"
                  :key="service.id"
                  :to="`${localePath('/solutions')}#${service.id}`"
                  class="block p-3 rounded-2xl hover:bg-muted transition-colors"
                  @click="servicesDropdownOpen = false"
                >
                  <p class="font-display font-semibold text-sm text-fg">
                    {{ service.title }}
                  </p>
                  <p class="font-body text-xs text-fg-muted leading-relaxed mt-1">
                    {{ service.teaser }}
                  </p>
                </NuxtLink>
              </div>
              
              <!-- All Solutions Button -->
              <div class="border-t border-border p-2">
                <NuxtLink
                  :to="localePath('/solutions')"
                  class="btn-primary btn-sm w-full"
                  @click="servicesDropdownOpen = false"
                >
                  {{ t('nav.solutions') }}
                  <svg 
                    xmlns="http://www.w3.org/2000/svg" 
                    viewBox="0 0 24 24" 
                    fill="none" 
                    stroke="currentColor" 
                    stroke-width="2" 
                    class="w-4 h-4"
                  >
                    <polyline points="9,18 15,12 9,6"></polyline>
                  </svg>
                </NuxtLink>
              </div>
            </div>
          </Transition>
        </li>
        
        <!-- Links after Services -->
        <li v-for="link in linksAfterSolutions" :key="link.key">
          <NuxtLink
            :to="link.to"
            class="px-3.5 py-1.5 h-8 rounded-full text-sm font-body text-fg hover:bg-muted/80 transition-all inline-flex items-center justify-center"
            :class="isActive(link.to) ? 'text-accent bg-accent/10 font-semibold' : ''"
          >
            {{ t(link.key) }}
          </NuxtLink>
        </li>
      </ul>

      <!-- Right Controls -->
      <div class="flex items-center gap-2">
        <!-- Dark / Light Toggle -->
        <ClientOnly>
          <button
            @click="toggleColorMode"
            class="w-9 h-9 rounded-full flex items-center justify-center text-fg hover:bg-muted transition-all"
            :aria-label="colorMode.value === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'"
          >
            <svg v-if="colorMode.value === 'dark'" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="w-4 h-4">
              <circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
            </svg>
            <svg v-else xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="w-4 h-4">
              <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
            </svg>
          </button>
        </ClientOnly>

        <!-- Language Toggle — crawlable link for Google -->
        <NuxtLink
          v-if="otherLocale && otherLocalePath"
          :to="otherLocalePath"
          class="px-3 py-1.5 rounded-full text-xs font-display font-semibold text-fg hover:bg-muted transition-all tracking-widest"
          :aria-label="otherLocale.code === 'en' ? 'Switch to English' : 'Zu Deutsch wechseln'"
        >
          {{ otherLocale.code.toUpperCase() }}
        </NuxtLink>

        <NuxtLink
          :to="ctaTo"
          class="btn-primary btn-sm hidden md:inline-flex"
        >
          {{ t('nav.cta') }}
        </NuxtLink>

        <!-- Mobile Burger -->
        <ClientOnly>
          <button
            class="md:hidden w-9 h-9 flex flex-col items-center justify-center gap-1.5"
            @click="mobileOpen = !mobileOpen"
            aria-label="Toggle menu"
          >
            <span
              class="block h-px w-5 bg-fg transition-all duration-300"
              :class="mobileOpen ? 'rotate-45 translate-y-[5px]' : ''"
            />
            <span
              class="block h-px w-5 bg-fg transition-all duration-300"
              :class="mobileOpen ? 'opacity-0' : ''"
            />
            <span
              class="block h-px w-5 bg-fg transition-all duration-300"
              :class="mobileOpen ? '-rotate-45 -translate-y-[5px]' : ''"
            />
          </button>
        </ClientOnly>
      </div>
    </nav>

    <!-- Mobile Menu -->
    <ClientOnly>
      <Transition name="slide-down">
        <div
          v-if="mobileOpen"
          class="md:hidden mt-2 rounded-3xl border border-border/80 bg-surface/90 backdrop-blur-2xl px-5 py-4 flex flex-col gap-1 shadow-[0_16px_40px_rgb(22_20_18/0.12)]"
        >
          <!-- Links before Services -->
          <NuxtLink
            v-for="link in linksBeforeSolutions"
            :key="link.key"
            :to="link.to"
            class="py-2.5 text-sm font-body hover:text-fg transition-colors"
            :class="isActive(link.to) ? 'text-accent font-semibold' : 'text-fg-muted'"
            @click="mobileOpen = false"
          >
            {{ t(link.key) }}
          </NuxtLink>

          <!-- Services Mobile Section -->
          <div class="py-2.5">
            <button
              @click="servicesDropdownOpen = !servicesDropdownOpen"
              class="w-full flex items-center justify-between text-sm font-body text-fg-muted hover:text-fg transition-colors"
            >
              {{ t('nav.solutions') }}
              <svg 
                xmlns="http://www.w3.org/2000/svg" 
                viewBox="0 0 24 24" 
                fill="none" 
                stroke="currentColor" 
                stroke-width="2" 
                class="w-4 h-4 transition-transform duration-200"
                :class="{ 'rotate-180': servicesDropdownOpen }"
              >
                <polyline points="6,9 12,15 18,9"></polyline>
              </svg>
            </button>
            
            <Transition name="slide-down">
              <div v-if="servicesDropdownOpen" class="mt-2 space-y-1 pl-3">
                <NuxtLink
                  v-for="service in services"
                  :key="service.id"
                  :to="`${localePath('/solutions')}#${service.id}`"
                  class="block py-2"
                  @click="mobileOpen = false; servicesDropdownOpen = false"
                >
                  <p class="font-display font-semibold text-sm text-fg">
                    {{ service.title }}
                  </p>
                  <p class="font-body text-xs text-fg-muted leading-relaxed mt-0.5">
                    {{ service.teaser }}
                  </p>
                </NuxtLink>
              </div>
            </Transition>
          </div>
          
          <!-- Links after Services -->
          <NuxtLink
            v-for="link in linksAfterSolutions"
            :key="link.key"
            :to="link.to"
            class="py-2.5 text-sm font-body hover:text-fg transition-colors"
            :class="isActive(link.to) ? 'text-accent font-semibold' : 'text-fg-muted'"
            @click="mobileOpen = false"
          >
            {{ t(link.key) }}
          </NuxtLink>

          <NuxtLink
            :to="ctaTo"
            class="btn-primary btn-sm mt-3 self-start"
            @click="mobileOpen = false"
          >
            {{ t('nav.cta') }}
          </NuxtLink>
        </div>
      </Transition>
    </ClientOnly>
    </div>
  </header>
</template>

<style scoped>
.app-nav-header {
  isolation: isolate;
  transform: translateZ(0);
}

.app-nav-bar {
  position: relative;
  isolation: isolate;
  transform: translateZ(0);
  background-color: rgb(var(--color-surface));
  backdrop-filter: none;
  -webkit-backdrop-filter: none;
}

.slide-down-enter-active,
.slide-down-leave-active {
  transition: all 0.25s ease;
}
.slide-down-enter-from,
.slide-down-leave-to {
  opacity: 0;
  transform: translateY(-8px);
}

.dropdown-enter-active,
.dropdown-leave-active {
  transition: all 0.2s ease;
}
.dropdown-enter-from {
  opacity: 0;
  transform: translateY(-10px) scale(0.95);
}
.dropdown-leave-to {
  opacity: 0;
  transform: translateY(-10px) scale(0.95);
}

.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>
