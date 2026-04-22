import { useI18n } from 'vue-i18n'

export interface ProjectSection {
  heading: string
  body: string
}

export interface Project {
  slug: string
  category: string
  title: string
  tagline: string
  client: string
  year: number
  tags: string[]
  heroImage: string
  coverImage: string
  sections: ProjectSection[]
  nextSlug?: string
}

// Non-translatable project metadata (images, client, year, slug, nextSlug)
const projectMeta: Pick<Project, 'slug' | 'client' | 'year' | 'heroImage' | 'coverImage' | 'nextSlug'>[] = [
  {
    slug: 'paquita-pilates',
    client: 'Paquita Pilates Stuttgart',
    year: 2025,
    heroImage: '/paquitabanner.png',
    coverImage: '/paquitabanner.png',
    nextSlug: undefined,
  },
]

export const useProjects = () => {
  const { tm, rt } = useI18n()

  const buildProject = (slug: string): Project | undefined => {
    const meta = projectMeta.find((m) => m.slug === slug)
    if (!meta) return undefined

    const key = `projects.${slug}`
    const data = tm(key) as any
    if (!data) return undefined

    const sections: ProjectSection[] = (data.sections ?? []).map((s: any) => ({
      heading: rt(s.heading),
      body: rt(s.body),
    }))

    return {
      ...meta,
      category: rt(data.category ?? ''),
      title: rt(data.title ?? ''),
      tagline: rt(data.tagline ?? ''),
      tags: (data.tags ?? []).map((t: any) => rt(t)),
      sections,
    }
  }

  const getAll = (): Project[] =>
    projectMeta.map((m) => buildProject(m.slug)).filter(Boolean) as Project[]

  const getBySlug = (slug: string): Project | undefined => buildProject(slug)

  const getNext = (currentSlug: string): Project | undefined => {
    const meta = projectMeta.find((m) => m.slug === currentSlug)
    if (!meta?.nextSlug) return undefined
    return buildProject(meta.nextSlug)
  }

  return { getAll, getBySlug, getNext }
}
