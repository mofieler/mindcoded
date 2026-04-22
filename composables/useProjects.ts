/**
 * useProjects – zentrale Datenquelle für alle Projekte.
 * Hier alles anpassen: neue Projekte hinzufügen, Felder erweitern.
 * Keine Daten sind irgendwo sonst hardgecoded.
 */

export interface ProjectSection {
  heading: string
  body: string
}

export interface Project {
  slug: string
  category: string        // z.B. "UX Design" – erscheint als Label
  title: string
  tagline: string         // Kurzbeschreibung für Karte & Hero-Subtitle
  client: string
  year: number
  tags: string[]          // Technologien / Methoden
  heroImage: string       // Pfad in /public/images/ oder Placeholder-URL
  coverImage: string      // Thumbnail für die Karte
  sections: ProjectSection[]  // Inhalt der Projektseite (beliebig viele)
  nextSlug?: string       // Optionaler Link zum nächsten Projekt
}

const projects: Project[] = [
  {
    slug: 'paquita-pilates',
    category: 'Webentwicklung',
    title: 'Paquita Pilates Stuttgart',
    tagline: 'Website & Buchungssystem für Pilates Studio in Stuttgart',
    client: 'Paquita Pilates Stuttgart',
    year: 2025,
    tags: ['Vue.js', 'Nuxt', 'UX Design', 'Buchungssystem', 'Node.js', 'MongoDB', 'Ionic', 'Figma'],
    heroImage: '/paquitabanner.png',
    coverImage: '/paquitabanner.png',
    sections: [
      {
        heading: 'Die Herausforderung',
        body: 'Paquita Pilates ist ein Boutique-Studio in Stuttgart-Ost für Reformer und Classical Pilates — mit privatem, Duo- und Kleingruppentraining. Trotz Premium-Erfahrung fehlte eine kohärente Markenidentität, eine professionelle Website und das Buchungsmanagement lief manuell. Reibung für Kunden und Trainer.\n\nDie Kernfrage: Wie übersetzt man den ruhigen, körperbewussten Geist eines Boutique-Pilates-Studios in eine komplette Marken- und Digital-Erfahrung — die die richtigen Kunden anzieht und das Studio-Management mühelos macht?',
      },
      {
        heading: 'Zielsetzung',
        body: 'Aufbau von Identität und digitaler Infrastruktur von Grund auf:\n\n• Markenentwicklung: Logo, Farbsystem, visuelle Sprache — konsistent über alle Touchpoints\n• Website: Digitale Präsenz, die Philosophie, Kursangebot und Team kommuniziert\n• Buchungssystem: Integrierte Plattform mit Self-Service für Kunden und Admin-Tools für Trainer\n• Live unter: paquitapilatesreformer.com',
      },
      {
        heading: 'Scope und Leistungen',
        body: 'Drei vernetzte Säulen:\n\n• Markenidentität & Design System: Komplettes Branding von Grund auf — Logo, Typografie, Farbpalette. Flexible Anwendung digital (Website, Instagram) und physisch (Print-Materialien).\n• Website Design & Entwicklung: Custom Website als primäre digitale Präsenz — ruhige Layouts, bewusster Whitespace, klare Calls-to-Action. Mobile-first responsive Design: Navigation kollabiert elegant, Inhalte adaptieren sich fließend vom Smartphone bis zum Desktop-Monitor.\n• Digitales Buchungssystem: Duale Architektur mit Kunden-Interface (Self-Service Buchung, Zeitplan) und Admin/Trainer-Interface (Kursmanagement, Kapazitäten).\n\n[[IMAGE:paquita/paquita-mac.png]]',
      },
      {
        heading: 'Design System',
        body: 'Das visuelle System fängt die duale Natur ein: bodenständig und physisch auf der einen, achtsam und spirituell auf der anderen Seite.\n\nLogo: Ein zentrales Auge — Symbol für Bewusstsein und innere Vision — mit Flügeln und ornamentalem Detail, eingefasst in weiche Formen. Das Wortmarken-Motto "RETURN TO LIFE" (Joseph Pilates\' ursprünglicher Methoden-Name) rundet das zeitlose, zeitgemäße Emblem ab.\n\nTypografie:\n— Metanoia (Display): Eine kontrastreiche Editorial-Serif. Der Name bedeutet "transformierende Herzensänderung" — direkter Spiegel der Studio-Philosophie. Eleganz für Headlines.\n— Poppins (UI): Geometrische Sans-Serif für Bodytext und Interface-Elemente — modern und lesbar\n\nFarbpalette (7 Farben):\n— Olive Gold (#86703f): Erdige Tiefe, Akzent für Struktur\n— Warm Taupe (#937955): Neutrales Mittelton\n— Terracotta Copper (#b27d55): Wärmster Ton, Logo und Key Brand Moments\n— Cream White (#f0f1ed): Primärer Hintergrund — weich, atmend\n— Soft Teal (#97cbcc): Einziger kühler Ton — Klarheit und Ruhe, Highlight\n— Muted Rose Taupe (#968173): Ruhender Ton für sekundären Text\n— Warm Grey (#bbbbaf): Vielseitiges Neutral für Unterflächen\n— Das Ergebnis: eine Farbwelt, die das sensorische Studio-Erlebnis kommuniziert — natürliche Materialien, weiches Licht, Stille.',
      },
      {
        heading: 'Technologie & Umsetzung',
        body: '• Frontend: Vue.js + Ionic für plattformübergreifende Erfahrung\n• Backend: Node.js + MongoDB API, selbst entwickelt\n• Echtzeit-Kursplan: Sofortige Verfügbarkeit und Bestätigung\n• Guthaben-System: Flexibles Prepaid-Modell für Kunden',
      },
      {
        heading: 'Ergebnis und Ausblick',
        body: 'Branding und Website sind live. Das Buchungssystem ist in aktiver Entwicklung und wird schrittweise ausgerollt.\n\nGeplante Erweiterungen:\n• Automated Waitlist Management\n• Guthaben-/Paket-Systeme\n• Push-Notifications für Kurs-Erinnerungen\n\nMein Beitrag: Komplettes Branding, UX-Architektur, UI-Design und Full-Stack-Implementierung. Eine Buchungsplattform, die sich nicht nach Standard-Software anfühlt — sondern wie ein Gespräch vor dem Studio.',
      },
      {
        heading: 'Screens',
        body: '[[GALLERY:paquita/paquita-mac.png|paquita/paquita-mobile.png]]',
      },
      {
        heading: 'Highlights',
        body: '[[CARDS:Mobile-first Design;heroIcon:device-mobile|Intuitive Navigation;heroIcon:cursor-arrow-rays|Nahtlose Buchung;heroIcon:calendar|Modernes Tech-Stack;heroIcon:layers]]',
      },
    ],
    nextSlug: undefined,
  },
]

export const useProjects = () => {
  const getAll = (): Project[] => projects

  const getBySlug = (slug: string): Project | undefined =>
    projects.find((p) => p.slug === slug)

  const getNext = (currentSlug: string): Project | undefined => {
    const current = getBySlug(currentSlug)
    if (!current?.nextSlug) return undefined
    return getBySlug(current.nextSlug)
  }

  return { getAll, getBySlug, getNext }
}
