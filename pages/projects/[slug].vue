<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { 
  DevicePhoneMobileIcon,
  CursorArrowRaysIcon,
  CalendarIcon,
  Square3Stack3DIcon,
  Cog6ToothIcon,
  ArrowRightIcon,
  ServerIcon,
  CogIcon
} from '@heroicons/vue/24/outline'

const { t } = useI18n()
const localePath = useLocalePath()
const route = useRoute()
const { getBySlug, getNext } = useProjects()

const slug = computed(() => route.params.slug as string)
const project = computed(() => getBySlug(slug.value))
const nextProject = computed(() => project.value ? getNext(project.value.slug) : undefined)

// 404 if not found
if (!project.value) {
  throw createError({ statusCode: 404, statusMessage: 'Project not found' })
}

useSeo({
  title: `${project.value.title} – Studio Name`,
  description: project.value.tagline,
  image: project.value.heroImage,
  type: 'article',
})

// Parse section body to check for special markers
const parseSectionBody = (body: string) => {
  // [[IMAGE:path]] - single centered image
  const imageMatch = body.match(/\[\[IMAGE:([^\]]+)\]\]/)
  if (imageMatch) {
    return {
      type: 'image',
      text: body.replace(imageMatch[0], '').trim(),
      image: imageMatch[1].trim()
    }
  }

  // [[GALLERY:path1|path2|...]] - gallery of images
  const galleryMatch = body.match(/\[\[GALLERY:([^\]]+)\]\]/)
  if (galleryMatch) {
    const images = galleryMatch[1].split('|').map(i => i.trim())
    return {
      type: 'gallery',
      text: body.replace(galleryMatch[0], '').trim(),
      images
    }
  }

  // [[CARDS:card1;heroIcon:icon1|card2;heroIcon:icon2|...]] - cards layout with hero icons
  const cardsMatch = body.match(/\[\[CARDS:([^\]]+)\]\]/)
  if (cardsMatch) {
    const cardEntries = cardsMatch[1].split('|').map(c => {
      const [text, iconPart] = c.split(';heroIcon:')
      return {
        text: text.trim(),
        heroIcon: iconPart ? iconPart.trim() : null
      }
    })
    return {
      type: 'cards',
      text: '',
      cards: cardEntries
    }
  }

  // Legacy [[IMAGES:path1|path2]] marker
  const legacyMatch = body.match(/\[\[IMAGES:([^|]+)\|([^\]]+)\]\]/)
  if (legacyMatch) {
    return {
      type: 'legacy',
      text: body.replace(legacyMatch[0], '').trim(),
      images: [legacyMatch[1].trim(), legacyMatch[2].trim()]
    }
  }

  return { type: 'text', text: body }
}

// Lightbox state
const lightboxImages = ref<string[]>([])
const lightboxIndex = ref(0)
const lightboxOpen = ref(false)

const openLightbox = (images: string[], index: number) => {
  lightboxImages.value = images
  lightboxIndex.value = index
  lightboxOpen.value = true
}
const closeLightbox = () => { lightboxOpen.value = false }
const nextImage = () => {
  lightboxIndex.value = (lightboxIndex.value + 1) % lightboxImages.value.length
}
const prevImage = () => {
  lightboxIndex.value = (lightboxIndex.value - 1 + lightboxImages.value.length) % lightboxImages.value.length
}

const onKeydown = (e: KeyboardEvent) => {
  if (!lightboxOpen.value) return
  if (e.key === 'Escape') closeLightbox()
  else if (e.key === 'ArrowRight') nextImage()
  else if (e.key === 'ArrowLeft') prevImage()
}
onMounted(() => window.addEventListener('keydown', onKeydown))
onUnmounted(() => window.removeEventListener('keydown', onKeydown))

// Get the appropriate Heroicon component
const getHeroIcon = (iconName: string | null) => {
  const iconMap: {
    [key: string]: typeof DevicePhoneMobileIcon | typeof CursorArrowRaysIcon | typeof CalendarIcon | typeof Square3Stack3DIcon | typeof Cog6ToothIcon | typeof ArrowRightIcon | typeof ServerIcon | typeof CogIcon
  } = {
    'device-mobile': DevicePhoneMobileIcon,
    'cursor-arrow-rays': CursorArrowRaysIcon,
    'calendar': CalendarIcon,
    'layers': Square3Stack3DIcon,
    'cog': Cog6ToothIcon,
    'arrow-right': ArrowRightIcon,
    'server': ServerIcon,
    'cog-icon': CogIcon
  }
  return iconName ? iconMap[iconName] : null
}
</script>

<template>
  <div v-if="project">

    <!-- ─── HERO BANNER ─────────────────────────────────────────── -->
    <section class="relative h-[75vh] min-h-[480px] flex items-end overflow-hidden">
      <!-- Background Image -->
      <NuxtImg
        :src="project.heroImage"
        :alt="project.title"
        class="absolute inset-0 w-full h-full object-cover"
        format="webp"
        width="1600"
        height="900"
        loading="eager"
        fetchpriority="high"
      />

      <!-- Dark Gradient Overlay -->
      <div class="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-black/10" />

      <!-- Hero Text (bottom-left, like studiomerkas) -->
      <div class="relative z-10 w-full max-w-7xl mx-auto px-6 pb-16">
        <!-- Category -->
        <p class="animate-fade-up text-accent text-xs font-display font-semibold tracking-[0.3em] uppercase mb-4">
          {{ project.category }}
        </p>

        <!-- Title -->
        <h1 class="animate-fade-up [animation-delay:80ms] opacity-0 font-display font-extrabold text-4xl sm:text-5xl lg:text-6xl text-white mb-4 max-w-3xl leading-tight">
          {{ project.title }}
        </h1>

        <!-- Tagline / Subtitle -->
        <p class="animate-fade-up [animation-delay:160ms] opacity-0 font-body text-lg text-white/70 max-w-xl">
          {{ project.tagline }}
        </p>

        <!-- Tech Tags -->
        <div class="animate-fade-up [animation-delay:240ms] opacity-0 flex flex-wrap gap-2 mt-6">
          <span
            v-for="tag in project.tags"
            :key="tag"
            class="px-3 py-1 rounded-full text-xs font-body bg-white/10 text-white/80 border border-white/20 backdrop-blur-sm"
          >
            {{ tag }}
          </span>
        </div>
      </div>
    </section>

    <!-- ─── META BAR ─────────────────────────────────────────────── -->
    <div class="border-b border-border">
      <div class="max-w-7xl mx-auto px-6 py-6 flex flex-wrap gap-8 text-sm font-body">
        <div>
          <p class="text-fg-muted text-xs uppercase tracking-widest mb-1">{{ t('project.client') }}</p>
          <p class="text-fg font-medium">{{ project.client }}</p>
        </div>
        <div>
          <p class="text-fg-muted text-xs uppercase tracking-widest mb-1">{{ t('project.category') }}</p>
          <p class="text-fg font-medium">{{ project.category }}</p>
        </div>
        <div>
          <p class="text-fg-muted text-xs uppercase tracking-widest mb-1">Jahr / Year</p>
          <p class="text-fg font-medium">{{ project.year }}</p>
        </div>
      </div>
    </div>

    <!-- ─── CONTENT SECTIONS ─────────────────────────────────────── -->
    <article class="max-w-5xl mx-auto px-6 py-20 space-y-20">
      <section
        v-for="(section, i) in project.sections"
        :key="i"
        class="max-w-3xl mx-auto"
      >
        <h2 class="font-display font-bold text-2xl sm:text-3xl text-fg mb-5">
          {{ section.heading }}
        </h2>

        <div class="border-l-2 border-accent pl-8">
          <!-- Text Section -->
          <template v-if="parseSectionBody(section.body).type === 'text'">
            <div class="font-body text-fg-muted leading-relaxed text-base sm:text-lg">
              <template v-for="(line, li) in parseSectionBody(section.body).text.split('\n')" :key="li">
                <div
                  v-if="line.match(/\(#([0-9a-fA-F]{3,8})\)/)"
                  class="flex items-center gap-3 py-0.5"
                >
                  <span
                    class="inline-block w-4 h-4 rounded-md shrink-0 border border-border"
                    :style="{ backgroundColor: '#' + (line.match(/\(#([0-9a-fA-F]{3,8})\)/) || [])[1] }"
                  />
                  <span>{{ line }}</span>
                </div>
                <p
                  v-else-if="line.includes('Metanoia')"
                  :style="{ fontFamily: '\'Metanoia\', \'Cormorant Garamond\', serif' }"
                  class="text-lg sm:text-xl"
                >
                  {{ line }}
                </p>
                <p
                  v-else-if="line.includes('Poppins')"
                  :style="{ fontFamily: '\'Poppins\', sans-serif' }"
                >
                  {{ line }}
                </p>
                <p v-else-if="line.trim()">{{ line }}</p>
                <div v-else class="h-4" />
              </template>
            </div>
          </template>

          <!-- Single Centered Image Section -->
          <template v-if="parseSectionBody(section.body).type === 'image'">
            <p class="font-body text-fg-muted leading-relaxed text-base sm:text-lg whitespace-pre-line mb-8">
              {{ parseSectionBody(section.body).text }}
            </p>
            <div class="flex justify-center">
              <button
                type="button"
                class="group block w-full max-w-4xl cursor-zoom-in overflow-hidden rounded-md"
                @click="openLightbox([parseSectionBody(section.body).image], 0)"
              >
                <NuxtImg
                  :src="parseSectionBody(section.body).image"
                  alt="Screenshot"
                  class="w-full h-auto object-contain transition-transform duration-300 group-hover:scale-[1.02]"
                  format="webp"
                  width="900"
                  height="600"
                  loading="lazy"
                />
              </button>
            </div>
          </template>

          <!-- Gallery Section -->
          <template v-if="parseSectionBody(section.body).type === 'gallery'">
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
              <button
                v-for="(img, idx) in parseSectionBody(section.body).images"
                :key="idx"
                type="button"
                class="group block w-full cursor-zoom-in overflow-hidden rounded-md"
                @click="openLightbox(parseSectionBody(section.body).images, idx)"
              >
                <NuxtImg
                  :src="img"
                  :alt="`Screenshot ${idx + 1}`"
                  class="w-full h-auto object-contain transition-transform duration-300 group-hover:scale-[1.02]"
                  format="webp"
                  width="600"
                  height="450"
                  loading="lazy"
                />
              </button>
            </div>
          </template>

          <!-- Cards Section -->
          <template v-if="parseSectionBody(section.body).type === 'cards'">
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div
                v-for="(card, idx) in parseSectionBody(section.body).cards"
                :key="idx"
                class="group bg-surface rounded-xl p-6 border border-border hover:border-accent/50 hover:shadow-md transition-all cursor-default"
              >
                <div class="flex items-start justify-between">
                  <p class="font-body text-fg font-medium pr-4">{{ card.text }}</p>
                  
                  <!-- Hero Icon or Arrow -->
                  <template v-if="card.heroIcon">
                    <component
                      :is="getHeroIcon(card.heroIcon)"
                      class="w-5 h-5 text-accent transition-colors flex-shrink-0 mt-0.5"
                    />
                  </template>
                  
                  <template v-else>
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      stroke-width="2"
                      class="w-5 h-5 text-fg-muted group-hover:text-accent transition-colors flex-shrink-0 mt-0.5"
                    >
                      <line x1="5" y1="12" x2="19" y2="12"/>
                      <polyline points="12 5 19 12 12 19"/>
                    </svg>
                  </template>
                </div>
              </div>
            </div>
          </template>
        </div>
      </section>
    </article>

    <!-- ─── NEXT PROJECT ─────────────────────────────────────────── -->
    <div v-if="nextProject" class="border-t border-border">
      <NuxtLink
        :to="localePath(`/projects/${nextProject.slug}`)"
        class="group block max-w-7xl mx-auto px-6 py-16"
      >
        <p class="text-fg-muted text-xs font-display font-semibold tracking-widest uppercase mb-4">
          {{ t('project.next_project') }}
        </p>
        <div class="flex items-center justify-between gap-6">
          <div>
            <p class="text-accent text-sm font-display mb-1">{{ nextProject.category }}</p>
            <h3 class="font-display font-bold text-3xl sm:text-4xl text-fg group-hover:text-accent transition-colors">
              {{ nextProject.title }}
            </h3>
          </div>
          <!-- Arrow -->
          <div class="shrink-0 w-12 h-12 rounded-full border border-border flex items-center justify-center group-hover:border-accent group-hover:text-accent text-fg-muted transition-all group-hover:translate-x-2">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="w-5 h-5">
              <line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>
            </svg>
          </div>
        </div>
      </NuxtLink>
    </div>

    <!-- ─── BACK LINK ─────────────────────────────────────────────── -->
    <div class="max-w-7xl mx-auto px-6 pb-16">
      <NuxtLink
        :to="localePath('/')"
        class="inline-flex items-center gap-2 text-sm font-body text-fg-muted hover:text-accent transition-colors group"
      >
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="w-4 h-4 group-hover:-translate-x-1 transition-transform">
          <line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/>
        </svg>
        {{ t('project.back') }}
      </NuxtLink>
    </div>

    <!-- ─── LIGHTBOX ─────────────────────────────────────────────── -->
    <Teleport to="body">
      <Transition name="fade">
        <div
          v-if="lightboxOpen"
          class="fixed inset-0 z-[100] bg-black/90 backdrop-blur-sm flex items-center justify-center p-4 sm:p-8"
          @click.self="closeLightbox"
        >
          <!-- Close -->
          <button
            type="button"
            class="absolute top-4 right-4 w-11 h-11 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors"
            aria-label="Close"
            @click="closeLightbox"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="w-5 h-5">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>

          <!-- Prev -->
          <button
            v-if="lightboxImages.length > 1"
            type="button"
            class="absolute left-2 sm:left-6 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors"
            aria-label="Previous image"
            @click.stop="prevImage"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="w-6 h-6">
              <polyline points="15 18 9 12 15 6"/>
            </svg>
          </button>

          <!-- Image -->
          <img
            :key="lightboxIndex"
            :src="lightboxImages[lightboxIndex].startsWith('/') ? lightboxImages[lightboxIndex] : '/' + lightboxImages[lightboxIndex]"
            alt="Screenshot"
            class="max-h-[90vh] max-w-[92vw] w-auto h-auto object-contain"
          />

          <!-- Next -->
          <button
            v-if="lightboxImages.length > 1"
            type="button"
            class="absolute right-2 sm:right-6 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors"
            aria-label="Next image"
            @click.stop="nextImage"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="w-6 h-6">
              <polyline points="9 18 15 12 9 6"/>
            </svg>
          </button>

          <!-- Counter -->
          <div
            v-if="lightboxImages.length > 1"
            class="absolute bottom-4 left-1/2 -translate-x-1/2 text-white/70 text-xs font-body tracking-widest"
          >
            {{ lightboxIndex + 1 }} / {{ lightboxImages.length }}
          </div>
        </div>
      </Transition>
    </Teleport>

  </div>
</template>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
