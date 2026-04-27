<script setup lang="ts">
import { 
  LightBulbIcon, 
  CodeBracketIcon, 
  ChartBarIcon, 
  CalendarDaysIcon
} from '@heroicons/vue/24/outline'

const { locale, locales, setLocale, t } = useI18n()
const colorMode = useColorMode()
const localePath = useLocalePath()

const navLinks = computed(() => [
  { key: 'nav.portfolio', to: localePath('/') + '#projects' },
  { key: 'nav.solutions', to: localePath('/solutions') },
  { key: 'nav.contact', to: localePath('/contact') },
])

const linksBeforeSolutions = computed(() =>
  navLinks.value.slice(0, navLinks.value.findIndex(l => l.key === 'nav.solutions'))
)
const linksAfterSolutions = computed(() =>
  navLinks.value.slice(navLinks.value.findIndex(l => l.key === 'nav.solutions') + 1)
)

const otherLocale = computed(() =>
  locales.value.find((l) => l.code !== locale.value)
)

const toggleColorMode = () => {
  const nextMode = colorMode.value === 'dark' ? 'light' : 'dark'
  colorMode.preference = nextMode
}

const mobileOpen = ref(false)
const isMounted = ref(false)
const servicesDropdownOpen = ref(false)

const services = computed(() => [
  {
    key: 'ux',
    icon: LightBulbIcon,
    title: t('home.services.ux_title'),
    description: t('home.services.ux_desc')
  },
  {
    key: 'dev',
    icon: CodeBracketIcon,
    title: t('home.services.dev_title'),
    description: t('home.services.dev_desc')
  },
  {
    key: 'seo',
    icon: ChartBarIcon,
    title: t('home.services.seo_title'),
    description: t('home.services.seo_desc')
  },
  {
    key: 'booking',
    icon: CalendarDaysIcon,
    title: t('home.services.booking_title'),
    description: t('home.services.booking_desc')
  }
])

onMounted(() => {
  isMounted.value = true
})
</script>

<template>
  <header
    class="fixed top-0 left-0 right-0 z-50 h-nav backdrop-blur-md border-b border-border bg-surface/80 transition-colors duration-300"
  >
    <nav class="max-w-7xl mx-auto px-6 h-full flex items-center justify-between gap-8">

      <!-- Logo -->
      <NuxtLink :to="localePath('/')" class="flex items-center gap-2.5 shrink-0">
        <NuxtImg
          src="/logo-transparent.png"
          alt="Mindcoded Logo"
          class="w-8 h-8 rounded-md"
          width="32"
          height="32"
        />
        <span class="font-display font-semibold text-fg text-sm tracking-tight hidden sm:block">
          Mindcoded
        </span>
      </NuxtLink>

      <!-- Desktop Links -->
      <ul class="hidden md:flex items-center gap-1">
        <!-- Links before Solutions -->
        <li v-for="link in linksBeforeSolutions" :key="link.key">
          <NuxtLink
            :to="link.to"
            class="px-3 py-1.5 h-8 rounded-md text-sm font-body text-fg-muted hover:text-fg hover:bg-muted transition-all inline-flex items-center justify-center"
            active-class="text-accent bg-accent/10 font-semibold"
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
            class="px-3 py-1.5 h-8 rounded-md text-sm font-body text-fg-muted hover:text-fg hover:bg-muted transition-all flex items-center justify-center gap-1"
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
              class="absolute top-full left-0 mt-2 w-80 bg-surface border border-border rounded-lg shadow-lg overflow-hidden"
            >
              <div class="p-2">
                <div
                  v-for="service in services"
                  :key="service.key"
                  class="group p-3 rounded-md hover:bg-muted transition-colors cursor-pointer"
                  @click="$router.push(localePath('/solutions'))"
                >
                  <div class="flex items-start gap-3">
                    <!-- Service Icon -->
                    <div class="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center flex-shrink-0 group-hover:bg-accent/20 transition-colors">
                      <component 
                        :is="service.icon" 
                        class="w-5 h-5 text-accent"
                      />
                    </div>
                    
                    <!-- Service Content -->
                    <div class="flex-1 min-w-0">
                      <h4 class="font-display font-semibold text-sm text-fg mb-1">
                        {{ service.title }}
                      </h4>
                      <p class="font-body text-xs text-fg-muted leading-relaxed line-clamp-2">
                        {{ service.description }}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              
              <!-- All Solutions Button -->
              <div class="border-t border-border p-2">
                <NuxtLink
                  :to="localePath('/solutions')"
                  class="w-full px-3 py-2 rounded-md bg-accent text-white font-display font-semibold text-sm flex items-center justify-center gap-2 hover:bg-accent/90 transition-colors"
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
            class="px-3 py-1.5 h-8 rounded-md text-sm font-body text-fg-muted hover:text-fg hover:bg-muted transition-all inline-flex items-center justify-center"
            active-class="text-accent bg-accent/10 font-semibold"
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
            class="w-9 h-9 rounded-full flex items-center justify-center border border-border hover:border-accent hover:text-accent text-fg-muted transition-all"
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

        <!-- Language Toggle -->
        <ClientOnly>
          <button
            v-if="otherLocale"
            @click="setLocale(otherLocale.code)"
            class="px-3 py-1.5 rounded-md border border-border text-xs font-display font-semibold text-fg-muted hover:text-fg hover:border-accent transition-all tracking-widest"
          >
            {{ otherLocale.code.toUpperCase() }}
          </button>
        </ClientOnly>

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
          class="md:hidden border-t border-border bg-surface px-6 py-4 flex flex-col gap-1"
        >
          <!-- Links before Services -->
          <NuxtLink
            v-for="link in linksBeforeSolutions"
            :key="link.key"
            :to="link.to"
            class="py-2.5 text-sm font-body text-fg-muted hover:text-fg transition-colors"
            active-class="text-accent font-semibold"
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
              <div v-if="servicesDropdownOpen" class="mt-2 space-y-2 pl-4">
                <div
                  v-for="service in services"
                  :key="service.key"
                  class="p-3 rounded-md bg-muted/50"
                >
                  <div class="flex items-start gap-3">
                    <div class="w-8 h-8 rounded-lg bg-accent/10 flex items-center justify-center flex-shrink-0">
                      <component 
                        :is="service.icon" 
                        class="w-4 h-4 text-accent"
                      />
                    </div>
                    <div class="flex-1">
                      <h4 class="font-display font-semibold text-sm text-fg mb-1">
                        {{ service.title }}
                      </h4>
                      <p class="font-body text-xs text-fg-muted leading-relaxed">
                        {{ service.description }}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </Transition>
          </div>
          
          <!-- Links after Services -->
          <NuxtLink
            v-for="link in linksAfterSolutions"
            :key="link.key"
            :to="link.to"
            class="py-2.5 text-sm font-body text-fg-muted hover:text-fg transition-colors"
            active-class="text-accent font-semibold"
            @click="mobileOpen = false"
          >
            {{ t(link.key) }}
          </NuxtLink>
        </div>
      </Transition>
    </ClientOnly>
  </header>
</template>

<style scoped>
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
