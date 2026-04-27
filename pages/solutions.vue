<script setup lang="ts">
import { ref } from 'vue'
import { 
  LightBulbIcon, 
  CodeBracketIcon, 
  ChartBarIcon, 
  CalendarDaysIcon,
  CheckCircleIcon,
  XCircleIcon,
  CheckIcon,
  XMarkIcon
} from '@heroicons/vue/24/outline'

// Nuxt-specific composables (auto-imported, but variables defined here)
const { t, locale } = useI18n()
const localePath = useLocalePath()

// Expand/shrink state - using a Set for performance/multiple open items
const expandedServices = ref(new Set<string>())

// Safe check for SSR compatibility
const isExpanded = (serviceNumber: string) => {
  return expandedServices.value?.has(serviceNumber) ?? false
}

const toggleService = (serviceNumber: string) => {
  const newSet = new Set(expandedServices.value)
  if (newSet.has(serviceNumber)) {
    newSet.delete(serviceNumber)
  } else {
    newSet.add(serviceNumber)
  }
  expandedServices.value = newSet
}

// SEO Meta
useSeo({
  title: locale.value === 'de' ? 'Leistungen – Studio Name' : 'Solutions – Studio Name',
  description: locale.value === 'de'
    ? 'UX Design, Webentwicklung und SEO aus Stuttgart für kleine Unternehmen und Freelancer.'
    : 'UX Design, web development and SEO from Stuttgart for small businesses and freelancers.',
})

const services = [
  {
    number: '01',
    icon: 'lightbulb',
    titleDe: 'UX & Design',
    titleEn: 'UX & Design',
    descDe: 'Nutzerzentriertes Design mit Figma – von der ersten Wireframe-Skizze bis zum finalen Prototyp.',
    descEn: 'User-centered design with Figma – from the first wireframe sketch to the final prototype.',
    prosDe: ['Systematischer Ansatz', 'Konsistente User Experience', 'Skalierbare Design Systeme'],
    prosEn: ['Systematic approach', 'Consistent user experience', 'Scalable design systems'],
    consDe: ['Benötigt mehr Vorarbeit', 'Kann anfangs starr wirken', 'Erfordert Disziplin'],
    consEn: ['Requires more upfront work', 'Can feel rigid initially', 'Requires discipline'],
    tags: ['Figma', 'Prototyping', 'UX Research', 'Usability Testing', 'Design System'],
  },
  {
    number: '02',
    icon: 'code-bracket',
    titleDe: 'Webentwicklung',
    titleEn: 'Web Development',
    descDe: 'Moderne Frontend-Entwicklung mit Vue.js, Nuxt 3 und TypeScript. Performance-optimiert.',
    descEn: 'Modern frontend development with Vue.js, Nuxt 3 and TypeScript. Performance-optimized.',
    prosDe: ['Moderne Technologien', 'Schnelle Performance', 'Einfache Wartung'],
    prosEn: ['Modern technologies', 'Fast performance', 'Easy maintenance'],
    consDe: ['Lernkurve für neue Teammitglieder', 'Initial höhere Komplexität', 'Regelmäßige Updates nötig'],
    consEn: ['Learning curve for new team members', 'Initial higher complexity', 'Regular updates needed'],
    tags: ['Vue.js', 'Nuxt 3', 'TypeScript', 'TailwindCSS', 'Node.js'],
  },
  {
    number: '03',
    icon: 'chart-bar',
    titleDe: 'SEO & Performance',
    titleEn: 'SEO & Performance',
    descDe: 'Core Web Vitals optimiert, strukturierte Daten, technisches SEO.',
    descEn: 'Core Web Vitals optimized, structured data, technical SEO.',
    prosDe: ['Bessere Rankings', 'Mehr organischer Traffic', 'Optimierte User Experience'],
    prosEn: ['Better rankings', 'More organic traffic', 'Optimized user experience'],
    consDe: ['Zeitaufwändig', 'Ständige Anpassungen nötig', 'Ergebnisse nicht sofort sichtbar'],
    consEn: ['Time-consuming', 'Constant adjustments needed', 'Results not immediately visible'],
    tags: ['Core Web Vitals', 'Structured Data', 'Nuxt Image', 'Lighthouse'],
  },
  {
    number: '04',
    icon: 'calendar-days',
    titleDe: 'Buchungssysteme',
    titleEn: 'Booking Systems',
    descDe: 'Maßgeschneiderte Buchungsflows, Kalender-Integrationen und CMS-Anbindungen.',
    descEn: 'Custom booking flows, calendar integrations and CMS connections.',
    prosDe: ['Exakt auf Bedarf zugeschnitten', 'Keine laufenden Kosten', 'Vollständige Kontrolle'],
    prosEn: ['Tailored to needs', 'No ongoing costs', 'Full control'],
    consDe: ['Höhere Entwicklungskosten', 'Wartungsaufwand', 'Sicherheitsaspekte'],
    consEn: ['Higher development costs', 'Maintenance effort', 'Security aspects'],
    tags: ['Custom Booking', 'CMS', 'Calendar API', 'Stripe'],
  },
]
</script>

<template>
  <div>
    <section class="relative hero-grid overflow-hidden py-32 px-6">
      <div class="absolute inset-0 bg-gradient-to-b from-base/0 to-base pointer-events-none" />
      <div class="relative z-10 max-w-4xl mx-auto text-center">
        <p class="text-accent text-xs font-display font-semibold tracking-[0.3em] uppercase mb-4 animate-fade-up">
          {{ locale === 'de' ? 'Was wir tun' : 'What we do' }}
        </p>
        <h1 class="font-display font-extrabold text-5xl sm:text-6xl text-fg mb-6 animate-fade-up">
          {{ t('nav.solutions') }}
        </h1>
        <p class="font-body text-lg text-fg-muted max-w-xl mx-auto animate-fade-up">
          {{ locale === 'de'
            ? 'Alles aus einer Hand – von der Idee bis zur fertigen Website.'
            : 'Everything from one source – from idea to finished website.' }}
        </p>
      </div>
    </section>

    <section class="max-w-7xl mx-auto px-6 py-20 space-y-6">
      <div
        v-for="service in services"
        :key="service.number"
        class="border border-border rounded-xl overflow-hidden transition-all duration-300"
        :class="isExpanded(service.number) ? 'bg-surface' : 'bg-base hover:bg-muted'"
      >
        <button
          @click="toggleService(service.number)"
          class="w-full p-8 md:p-10 text-left group transition-colors duration-200"
        >
          <div class="flex items-start gap-4 md:gap-6">
            <div class="w-12 h-12 rounded-lg bg-accent/10 flex items-center justify-center shrink-0 group-hover:bg-accent/20 transition-colors">
              <div class="w-6 h-6 text-accent">
                <LightBulbIcon v-if="service.icon === 'lightbulb'" />
                <CodeBracketIcon v-else-if="service.icon === 'code-bracket'" />
                <ChartBarIcon v-else-if="service.icon === 'chart-bar'" />
                <CalendarDaysIcon v-else />
              </div>
            </div>

            <div class="flex-1 min-w-0">
              <div class="flex items-baseline gap-3 mb-3">
                <span class="font-display font-bold text-lg text-accent opacity-60 group-hover:opacity-100 transition-opacity">
                  {{ service.number }}
                </span>
                <h2 class="font-display font-bold text-2xl text-fg">
                  {{ locale === 'de' ? service.titleDe : service.titleEn }}
                </h2>
              </div>
              <p class="font-body text-fg-muted leading-relaxed mb-4 max-w-2xl -mt-1">
                {{ locale === 'de' ? service.descDe : service.descEn }}
              </p>
              
              <div class="flex flex-wrap gap-2 mb-4">
                <span
                  v-for="tag in service.tags"
                  :key="tag"
                  class="px-2.5 py-1 rounded-full text-xs font-body bg-base border border-border text-fg-muted"
                >
                  {{ tag }}
                </span>
              </div>

              <div class="flex items-center gap-2 text-accent text-sm font-display font-semibold">
                <span>{{ isExpanded(service.number) ? (locale === 'de' ? 'Weniger anzeigen' : 'Show less') : (locale === 'de' ? 'Mehr erfahren' : 'Learn more') }}</span>
                <div class="w-5 h-5 transition-transform duration-200" :class="isExpanded(service.number) ? 'rotate-180' : ''">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="m6 9 6 6 6-6"/>
                  </svg>
                </div>
              </div>
            </div>
          </div>
        </button>

        <div
          v-if="isExpanded(service.number)"
          class="border-t border-border bg-surface p-8 md:p-10 animate-fade-in"
        >
          <div class="grid md:grid-cols-2 gap-8">
            <div>
              <h3 class="font-display font-semibold text-base text-fg mb-3 flex items-center gap-2">
                <CheckCircleIcon class="w-5 h-5 text-green-500 shrink-0" />
                {{ locale === 'de' ? 'Vorteile' : 'Advantages' }}
              </h3>
              <ul class="space-y-2">
                <li
                  v-for="(pro, index) in (locale === 'de' ? service.prosDe : service.prosEn)"
                  :key="index"
                  class="flex items-center gap-3 rounded-lg bg-green-500/5 border border-green-500/10 px-3 py-2.5"
                >
                  <CheckIcon class="w-4 h-4 text-green-500 shrink-0" />
                  <span class="font-body text-sm text-fg">{{ pro }}</span>
                </li>
              </ul>
            </div>

            <div>
              <h3 class="font-display font-semibold text-base text-fg mb-3 flex items-center gap-2">
                <XCircleIcon class="w-5 h-5 text-orange-500 shrink-0" />
                {{ locale === 'de' ? 'Zu beachten' : 'Considerations' }}
              </h3>
              <ul class="space-y-2">
                <li
                  v-for="(con, index) in (locale === 'de' ? service.consDe : service.consEn)"
                  :key="index"
                  class="flex items-center gap-3 rounded-lg bg-orange-500/5 border border-orange-500/10 px-3 py-2.5"
                >
                  <XMarkIcon class="w-4 h-4 text-orange-400 shrink-0" />
                  <span class="font-body text-sm text-fg">{{ con }}</span>
                </li>
              </ul>
            </div>
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

        <div class="relative z-10">
          <h2 class="font-display font-extrabold text-3xl sm:text-4xl dark:text-white text-fg mb-4">
            {{ t('contact.title') }}
          </h2>
          <p class="font-body dark:text-white/95 text-fg-muted mb-8">{{ t('contact.sub') }}</p>
          <NuxtLink
            :to="localePath('/optin')"
            class="inline-block px-8 py-3 rounded-lg dark:bg-white/10 dark:backdrop-blur-sm dark:border dark:border-white/20 bg-accent text-white font-display font-bold text-sm dark:hover:bg-white/20 hover:bg-accent/90 transition-all duration-300 hover:scale-105 dark:hover:shadow-lg dark:hover:shadow-white/10 hover:shadow-lg hover:shadow-accent/30"
          >
            {{ t('home.hero_cta_secondary') }}
          </NuxtLink>
        </div>
      </div>
    </section>
  </div>
</template>