export interface BranchExample {
  id: string
  name: string
  /** When false, hidden from showcase and 404 on direct route. Keep data for later reactivation. */
  active: boolean
  categoryDe: string
  categoryEn: string
  descriptionDe: string
  descriptionEn: string
  featuresDe: string[]
  featuresEn: string[]
  tags: string[]
  image: string
  accentClass: string
  de: BranchPageContent
  en: BranchPageContent
  theme: BranchTheme
}

export interface BranchTheme {
  pageBg: string
  pageText: string
  surfaceBg: string
  accent: string
  accentText: string
  heroGradient: string
  heroText: string
  cardHover: string
  reviewsBg?: string
}

export interface BranchPageContent {
  nav: {
    brand: string
    links: { label: string; href: string }[]
    cta: string
    ctaHref?: string
  }
  hero: {
    badge: string
    headline: string[]
    sub: string
    ctas: { text: string; href?: string; primary?: boolean }[]
    image: string
    gallery?: string[]
    video?: string
  }
  stats?: { value: string; label: string }[]
  services: {
    eyebrow: string
    title: string
    subtitle: string
    items: { icon: string; title: string; description: string }[]
  }
  process?: {
    eyebrow: string
    title: string
    subtitle: string
    steps: { title: string; desc: string }[]
    image?: string
    floating?: { title: string; desc: string }
  }
  team?: {
    eyebrow: string
    title: string
    subtitle: string
    members: { name: string; role: string; focus?: string; image: string; availableToday?: boolean; phone?: string }[]
  }
  reviews?: {
    eyebrow: string
    title: string
    subtitle: string
    items: { name: string; info?: string; text: string }[]
    columns?: number
  }
  contact: {
    eyebrow: string
    title: string
    subtitle: string
    info: { icon: string; label: string; value: string }[]
    form: {
      fields: { name: string; label: string; type: string; placeholder?: string; options?: string[] }[]
      submit: string
    }
    emergency?: { title: string; desc: string; phone: string }
  }
  special?: {
    type: 'menu' | 'properties' | 'pricing'
    data: any
  }
}

const makeTheme = (opts: Partial<BranchTheme> & { accent: string; accentText?: string; heroGradient: string }): BranchTheme => ({
  pageBg: opts.pageBg ?? 'bg-slate-50',
  pageText: opts.pageText ?? 'text-slate-900',
  surfaceBg: opts.surfaceBg ?? 'bg-white',
  accent: opts.accent,
  accentText: opts.accentText ?? 'text-white',
  heroGradient: opts.heroGradient,
  heroText: opts.heroText ?? 'text-white',
  cardHover: opts.cardHover ?? 'hover:shadow-lg',
  reviewsBg: opts.reviewsBg,
})

const branchExamples: BranchExample[] = [
  {
    id: 'fitnessstudio',
    active: true,
    name: 'Ironpulse Fitness',
    categoryDe: 'Sport & Fitness',
    categoryEn: 'Sports & Fitness',
    descriptionDe: 'Pulsierendes Dark-Mode-Studio mit Neon-Akzenten, Kursfinder und spielerischem Mitgliedschafts-Konfigurator.',
    descriptionEn: 'Pulsing dark-mode studio with neon accents, a class finder and a playful membership configurator.',
    featuresDe: ['Interaktiver Kursfinder', 'Mitgliedschafts-Konfigurator', 'Digital Hub Teaser'],
    featuresEn: ['Interactive class finder', 'Membership configurator', 'Digital Hub teaser'],
    tags: ['Vue.js', 'Nuxt 3', 'TailwindCSS'],
    image: '/branchen/fitnessstudio-hero.png',
    accentClass: 'text-lime-400 bg-lime-400/10 border-lime-400/20',
    theme: makeTheme({
      pageBg: 'bg-neutral-950',
      pageText: 'text-white',
      surfaceBg: 'bg-neutral-900',
      accent: 'lime-400',
      accentText: 'text-slate-900',
      heroGradient: 'bg-gradient-to-br from-neutral-900 via-neutral-900 to-neutral-800',
      heroText: 'text-white',
      cardHover: 'hover:shadow-[0_0_30px_rgba(163,230,53,0.15)]',
    }),
    de: {
      nav: { brand: 'IRONPULSE', links: [{ label: 'Kurse', href: '#classes' }, { label: 'Mitgliedschaft', href: '#membership' }, { label: 'Hub', href: '#hub' }, { label: 'Team', href: '#team' }], cta: 'Probetraining', ctaHref: '#trial' },
      hero: { badge: '24/7 · Dresden Neustadt', headline: ['BEWEGUNG.', 'KRAFT.', 'DU.'], sub: 'Modernstes Equipment. 50+ Kurse. 24/7 Zugang. Werde Mitglied und starte durch.', ctas: [{ text: 'Starte dein Probetraining in 60 Sekunden', href: '#trial', primary: true }, { text: 'Preise ansehen', href: '#membership' }], image: '/images/fitness/3_Futuristic_Gym_Interior_Neon_Lighting.png', gallery: ['/images/fitness/3_Futuristic_Gym_Interior_Neon_Lighting.png', '/images/fitness/7_455_Gym_Neon_Interior_Royalty_Free.png', '/images/fitness/1_Modern_Gym_Interior_with_Purple_Neon.png'] },
      services: { eyebrow: 'Vorteile', title: 'Deine Vorteile', subtitle: 'Alles, was du fuer dein Training brauchst.', items: [{ icon: 'Clock', title: '24/7 Zugang', description: 'Trainiere wann immer du willst, rund um die Uhr.' }, { icon: 'Dumbbell', title: 'Modernste Geraete', description: 'Neueste Kraft- und Cardio-Geraete fuer effektives Training.' }, { icon: 'Users', title: '50+ Kurse/Woche', description: 'Von Yoga bis HIIT - fuer jeden Level das Richtige.' }, { icon: 'Heart', title: 'Wellness-Bereich', description: 'Sauna, Duschen und Ruhezonen fuer deine Regeneration.' }, { icon: 'Smartphone', title: 'App-Steuerung', description: 'Kurse buchen, Fortschritte tracken, Community treffen.' }, { icon: 'Zap', title: 'Personal Training', description: 'Individuelle Betreuung durch zertifizierte Trainer.' }] },
      special: { type: 'pricing', data: { eyebrow: 'Mitgliedschaften', title: 'Waehle deinen Plan', subtitle: 'Flexible Tarife ohne versteckte Kosten.', plans: [{ name: 'Basic', price: '29,90', period: '/Monat', features: ['24/7 Zugang', 'Kraft- & Cardiobereich', 'Umkleide & Duschen'], highlighted: false }, { name: 'Premium', price: '49,90', period: '/Monat', features: ['Alles aus Basic', 'Alle Kurse inklusive', 'Wellness-Bereich', 'App-Mitgliedschaft'], highlighted: true }, { name: 'Student', price: '24,90', period: '/Monat', features: ['24/7 Zugang', 'Kraft- & Cardiobereich', 'Gueltig mit Studentenausweis'], highlighted: false }] } },
      team: { eyebrow: 'Team', title: 'Deine Trainer', subtitle: 'Erfahren, motiviert und immer an deiner Seite.', members: [{ name: 'Tom Brenner', role: 'Head Coach', focus: 'Functional Training', image: '/images/people/6_49_900_Fitness_Instructor_Portrait.png', availableToday: true, phone: '0351 847630' }, { name: 'Nico Brandt', role: 'Krafttrainer', focus: 'Bodybuilding', image: '/images/people/3_238_400_Personal_Trainer_Stock_Photos.png', availableToday: true, phone: '0351 847631' }] },
      reviews: { eyebrow: 'Feedback', title: 'Community Stimmen', subtitle: 'Das sagen unsere Mitglieder.', items: [{ name: 'Jan K.', info: 'Mitglied seit 2023', text: 'Bestes Studio in Dresden. Die Ausstattung ist top und die Trainer wissen, wovon sie reden.' }, { name: 'Melanie S.', info: 'Mitglied seit 2022', text: 'Endlich ein Studio, das wirklich 24/7 geoeffnet ist. Perfekt fuer Schichtarbeiter.' }, { name: 'Felix R.', info: 'Probetraining', text: 'Das Probetraining hat mich ueberzeugt. Professionell und unkompliziert.' }] },
      contact: { eyebrow: 'Probetraining', title: 'STARTE JETZT', subtitle: '60 Sekunden. Keine Kreditkarte. Keine Verpflichtung.', info: [{ icon: 'MapPin', label: 'Adresse', value: 'Goerlitzer Strasse 23, 01099 Dresden' }, { icon: 'Phone', label: 'Telefon', value: '0351 847630' }, { icon: 'Mail', label: 'E-Mail', value: 'team@kraftwerk-dresden.de' }], form: { fields: [{ name: 'firstName', label: 'Vorname', type: 'text', placeholder: 'Max' }, { name: 'lastName', label: 'Nachname', type: 'text', placeholder: 'Mustermann' }, { name: 'email', label: 'E-Mail', type: 'email', placeholder: 'max@beispiel.de' }, { name: 'phone', label: 'Telefon', type: 'tel', placeholder: '0176 12345678' }], submit: 'Probetraining in 60 Sekunden' } },
    },
    en: {
      nav: { brand: 'IRONPULSE', links: [{ label: 'Classes', href: '#classes' }, { label: 'Membership', href: '#membership' }, { label: 'Hub', href: '#hub' }, { label: 'Team', href: '#team' }], cta: 'Free Trial', ctaHref: '#trial' },
      hero: { badge: '24/7 · Dresden Neustadt', headline: ['MOVEMENT.', 'STRENGTH.', 'YOU.'], sub: 'Modern equipment. 50+ classes. 24/7 access. Become a member and get started.', ctas: [{ text: 'Start your trial in 60 seconds', href: '#trial', primary: true }, { text: 'See pricing', href: '#membership' }], image: '/images/fitness/3_Futuristic_Gym_Interior_Neon_Lighting.png', gallery: ['/images/fitness/3_Futuristic_Gym_Interior_Neon_Lighting.png', '/images/fitness/7_455_Gym_Neon_Interior_Royalty_Free.png', '/images/fitness/1_Modern_Gym_Interior_with_Purple_Neon.png'] },
      services: { eyebrow: 'Benefits', title: 'Your Benefits', subtitle: 'Everything you need for your training.', items: [{ icon: 'Clock', title: '24/7 Access', description: 'Train whenever you want, around the clock.' }, { icon: 'Dumbbell', title: 'Modern Equipment', description: 'Latest strength and cardio equipment.' }, { icon: 'Users', title: '50+ Classes/Week', description: 'From yoga to HIIT - something for every level.' }, { icon: 'Heart', title: 'Wellness Area', description: 'Sauna, showers and relaxation zones.' }, { icon: 'Smartphone', title: 'App Control', description: 'Book classes, track progress, meet the community.' }, { icon: 'Zap', title: 'Personal Training', description: 'Individual coaching by certified trainers.' }] },
      special: { type: 'pricing', data: { eyebrow: 'Memberships', title: 'Choose Your Plan', subtitle: 'Flexible rates with no hidden costs.', plans: [{ name: 'Basic', price: '29.90', period: '/month', features: ['24/7 access', 'Strength & cardio area', 'Locker rooms & showers'], highlighted: false }, { name: 'Premium', price: '49.90', period: '/month', features: ['Everything in Basic', 'All classes included', 'Wellness area', 'App membership'], highlighted: true }, { name: 'Student', price: '24.90', period: '/month', features: ['24/7 access', 'Strength & cardio area', 'Valid with student ID'], highlighted: false }] } },
      team: { eyebrow: 'Team', title: 'Your Trainers', subtitle: 'Experienced, motivated, and always by your side.', members: [{ name: 'Tom Brenner', role: 'Head Coach', focus: 'Functional Training', image: '/images/people/6_49_900_Fitness_Instructor_Portrait.png', availableToday: true, phone: '0351 847630' }, { name: 'Nico Brandt', role: 'Strength Coach', focus: 'Bodybuilding', image: '/images/people/3_238_400_Personal_Trainer_Stock_Photos.png', availableToday: true, phone: '0351 847631' }] },
      reviews: { eyebrow: 'Feedback', title: 'Community Voices', subtitle: 'What our members say.', items: [{ name: 'Jan K.', info: 'Member since 2023', text: 'Best studio in Dresden. The equipment is top-notch and the trainers know their stuff.' }, { name: 'Melanie S.', info: 'Member since 2022', text: 'Finally a studio that is truly open 24/7. Perfect for shift workers.' }, { name: 'Felix R.', info: 'Trial training', text: 'The trial training convinced me. Professional and uncomplicated.' }] },
      contact: { eyebrow: 'Free trial', title: 'START NOW', subtitle: '60 seconds. No credit card. No obligation.', info: [{ icon: 'MapPin', label: 'Address', value: 'Goerlitzer Strasse 23, 01099 Dresden' }, { icon: 'Phone', label: 'Phone', value: '0351 847630' }, { icon: 'Mail', label: 'Email', value: 'team@kraftwerk-dresden.de' }], form: { fields: [{ name: 'firstName', label: 'First name', type: 'text', placeholder: 'Max' }, { name: 'lastName', label: 'Last name', type: 'text', placeholder: 'Mustermann' }, { name: 'email', label: 'Email', type: 'email', placeholder: 'max@example.com' }, { name: 'phone', label: 'Phone', type: 'tel', placeholder: '+49 176 12345678' }], submit: 'Start trial in 60 seconds' } },
    },
  },
  {
    id: 'immobilien',
    active: true,
    name: 'Boeckler Immobilien',
    categoryDe: 'Immobilien',
    categoryEn: 'Real Estate',
    descriptionDe: 'High-End-Immobilienplattform mit Smart Search, Live-Karte und Exposé-Vorschau — warm, schnell, vertrauensvoll.',
    descriptionEn: 'High-end real-estate platform with smart search, live map and expose preview — warm, fast, trustworthy.',
    featuresDe: ['Smart Search & Echtzeit-Filter', 'Split-View mit interaktiver Karte', 'Exposé Quick-View'],
    featuresEn: ['Smart search & live filters', 'Split view with interactive map', 'Expose quick view'],
    tags: ['Vue.js', 'Animations', 'Performance'],
    image: '/branchen/immobilien-hero.png',
    accentClass: 'text-amber-400 bg-amber-400/10 border-amber-400/20',
    theme: makeTheme({
      pageBg: 'bg-stone-50',
      pageText: 'text-stone-900',
      surfaceBg: 'bg-white',
      accent: 'amber-600',
      heroGradient: 'bg-gradient-to-r from-stone-900/80 via-stone-900/50 to-stone-900/30',
      heroText: 'text-white',
      cardHover: 'hover:shadow-amber-500/10',
      reviewsBg: 'bg-stone-900',
    }),
    de: {
      nav: { brand: 'BOECKLER', links: [{ label: 'Angebote', href: '#properties' }, { label: 'Makler', href: '#team' }, { label: 'Kontakt', href: '#contact' }], cta: 'Beratung', ctaHref: '#contact' },
      hero: { badge: 'Seit 2010 in Berlin-Kreuzberg', headline: ['Raeume mit', 'Geschichte.'], sub: 'Wir vermitteln aussergewoehnliche Immobilien - von denkmalgeschuetztem Altbau bis zum modernen Loft.', ctas: [{ text: 'Angebote entdecken', href: '#properties', primary: true }, { text: 'Kontakt', href: '#contact' }], image: '/images/immobilien/1_The_Role_of_Living_Room_Furniture.png', gallery: ['/images/immobilien/3_Before_After_Combined_Modern_Luxury.png', '/images/immobilien/8_10_Trends_of_Luxury_Home_Interior.png', '/images/immobilien/4_Luxury_Penthouse_Terrace_Overlooking.png', '/images/immobilien/1_The_Role_of_Living_Room_Furniture.png'], video: '/videos/boeckler-hero.mp4' },
      stats: [{ value: '480+', label: 'Immobilien vermittelt' }, { value: '16', label: 'Jahre Erfahrung' }, { value: '98%', label: 'Kundenzufriedenheit' }, { value: '48h', label: 'Erstkontakt-Garantie' }],
      services: { eyebrow: 'Aktuelle Angebote', title: 'Exklusive Immobilien', subtitle: 'Entdecken Sie unsere aktuellen Highlights.', items: [] },
      special: { type: 'properties', data: {} },
      team: { eyebrow: 'Das Team', title: 'Ihre Ansprechpartner', subtitle: 'Persoenliche Beratung auf Augenhoehe.', members: [{ name: 'Clara Boeckler', role: 'Geschaeftsfuehrerin · Inhaberin', focus: 'Denkmalimmobilien & Altbau', image: '/images/people/5_72_700_Accountant_Portrait_Stock.png', availableToday: true, phone: '030 61408921' }, { name: 'Jonas Richter', role: 'Senior Immobilienmakler', focus: 'Gewerbeimmobilien', image: '/images/immobilien/10_Professional_real_estate_agent_Images.png', availableToday: false, phone: '030 61408922' }] },
      reviews: { eyebrow: 'Mandantenstimmen', title: 'Vertrauen durch Kompetenz', subtitle: 'Was unsere Kunden ueber uns sagen.', items: [{ name: 'Familie Bauer', info: 'Altbaukauf', text: 'Frau Boeckler hat uns durch den kompletten Kaufprozess begleitet. Souveraen und empathisch.' }, { name: 'Lena M.', info: 'Gewerbemiete', text: 'Schnell, unkompliziert und mit echtem Markt-Know-how.' }, { name: 'Thomas K.', info: 'Verkaeufer', text: 'Transparente Kommunikation und ein hervorragendes Ergebnis.' }, { name: 'Mira S.', info: 'Erstkauf', text: 'Die Suche fuehlte sich an wie ein privater Concierge. In drei Tagen standen wir im Altbau.' }] },
      contact: { eyebrow: 'Kontakt', title: 'Kontaktieren Sie uns', subtitle: 'Ob Kauf, Verkauf oder Miete - wir beraten Sie gerne persoenlich.', info: [{ icon: 'MapPin', label: 'Adresse', value: 'Oranienstrasse 45, 10969 Berlin' }, { icon: 'Phone', label: 'Telefon', value: '030 61408920' }, { icon: 'Mail', label: 'E-Mail', value: 'info@boeckler-immobilien.de' }], form: { fields: [{ name: 'name', label: 'Name', type: 'text', placeholder: 'Name' }, { name: 'email', label: 'E-Mail', type: 'email', placeholder: 'email@beispiel.de' }, { name: 'interest', label: 'Interesse', type: 'select', options: ['Kauf', 'Verkauf', 'Miete', 'Gewerbe', 'Sonstiges'] }, { name: 'message', label: 'Nachricht', type: 'textarea', placeholder: 'Ihre Nachricht' }], submit: 'Anfrage senden' } },
    },
    en: {
      nav: { brand: 'BOECKLER', links: [{ label: 'Listings', href: '#properties' }, { label: 'Agents', href: '#team' }, { label: 'Contact', href: '#contact' }], cta: 'Consult', ctaHref: '#contact' },
      hero: { badge: 'Since 2010 in Berlin-Kreuzberg', headline: ['Spaces with', 'History.'], sub: 'We broker exceptional properties - from listed old buildings to modern lofts.', ctas: [{ text: 'Discover listings', href: '#properties', primary: true }, { text: 'Contact', href: '#contact' }], image: '/images/immobilien/1_The_Role_of_Living_Room_Furniture.png', gallery: ['/images/immobilien/3_Before_After_Combined_Modern_Luxury.png', '/images/immobilien/8_10_Trends_of_Luxury_Home_Interior.png', '/images/immobilien/4_Luxury_Penthouse_Terrace_Overlooking.png', '/images/immobilien/1_The_Role_of_Living_Room_Furniture.png'], video: '/videos/boeckler-hero.mp4' },
      stats: [{ value: '480+', label: 'Properties sold' }, { value: '16', label: 'Years experience' }, { value: '98%', label: 'Customer satisfaction' }, { value: '48h', label: 'First contact guarantee' }],
      services: { eyebrow: 'Current Listings', title: 'Exclusive Properties', subtitle: 'Discover our current highlights.', items: [] },
      special: { type: 'properties', data: {} },
      team: { eyebrow: 'Team', title: 'Your Contacts', subtitle: 'Personal advice at eye level.', members: [{ name: 'Clara Boeckler', role: 'Managing Director · Owner', focus: 'Heritage properties & old buildings', image: '/images/people/5_72_700_Accountant_Portrait_Stock.png', availableToday: true, phone: '030 61408921' }, { name: 'Jonas Richter', role: 'Senior Real Estate Agent', focus: 'Commercial properties', image: '/images/immobilien/10_Professional_real_estate_agent_Images.png', availableToday: false, phone: '030 61408922' }] },
      reviews: { eyebrow: 'Client Voices', title: 'Trust Through Competence', subtitle: 'What our clients say about us.', items: [{ name: 'Bauer Family', info: 'Old building purchase', text: 'Ms. Boeckler guided us through the entire purchase process. Sovereign and empathetic.' }, { name: 'Lena M.', info: 'Commercial lease', text: 'Fast, uncomplicated and with real market know-how.' }, { name: 'Thomas K.', info: 'Seller', text: 'Transparent communication and an outstanding result.' }, { name: 'Mira S.', info: 'First purchase', text: 'The search felt like a private concierge. Three days later we were standing in the apartment.' }] },
      contact: { eyebrow: 'Contact', title: 'Contact Us', subtitle: 'Whether buying, selling or renting - we are happy to advise you personally.', info: [{ icon: 'MapPin', label: 'Address', value: 'Oranienstrasse 45, 10969 Berlin' }, { icon: 'Phone', label: 'Phone', value: '030 61408920' }, { icon: 'Mail', label: 'Email', value: 'info@boeckler-immobilien.de' }], form: { fields: [{ name: 'name', label: 'Name', type: 'text', placeholder: 'Name' }, { name: 'email', label: 'Email', type: 'email', placeholder: 'email@example.com' }, { name: 'interest', label: 'Interest', type: 'select', options: ['Buy', 'Sell', 'Rent', 'Commercial', 'Other'] }, { name: 'message', label: 'Message', type: 'textarea', placeholder: 'Your message' }], submit: 'Send request' } },
    },
  },
  {
    id: 'zahnarzt',
    active: false,
    name: 'Dr. Hartmann',
    categoryDe: 'Zahnarztpraxis',
    categoryEn: 'Dental Practice',
    descriptionDe: 'Beruhigendes Design mit Vertrauensfaktor. Ersttermin-Assistent, Leistungsuebersicht und Team-Vorstellung.',
    descriptionEn: 'Calming design built on trust. First-appointment assistant, services overview and team introduction.',
    featuresDe: ['Ersttermin-Assistent', 'Leistungsuebersicht', 'Team-Vorstellung'],
    featuresEn: ['First-appointment assistant', 'Services overview', 'Team introduction'],
    tags: ['UX Design', 'Accessibility', 'Booking'],
    image: '/branchen/zahnarzt-hero.png',
    accentClass: 'text-sky-400 bg-sky-400/10 border-sky-400/20',
    theme: makeTheme({
      pageBg: 'bg-slate-50',
      pageText: 'text-slate-900',
      surfaceBg: 'bg-white',
      accent: 'sky-500',
      heroGradient: 'bg-gradient-to-br from-sky-800 via-sky-700 to-cyan-600',
      heroText: 'text-white',
      cardHover: 'hover:shadow-sky-500/15',
    }),
    de: {
      nav: { brand: 'DR.HARTMANN', links: [{ label: 'Leistungen', href: '#services' }, { label: 'Erstbesuch', href: '#process' }, { label: 'Team', href: '#team' }, { label: 'Kontakt', href: '#contact' }], cta: 'Termin' },
      hero: { badge: 'Seit 2008 in Moenchengladbach — Kostenlose Parkplaetze', headline: ['Zaehne.', 'Menschen.', 'Vertrauen.'], sub: 'Moderne Zahnheilkunde mit Menschlichkeit. Wir nehmen uns Zeit, hoeren zu und finden die beste Loesung fuer Ihr Laecheln.', ctas: [{ text: 'Termin vereinbaren', primary: true }, { text: 'Ihr erster Besuch' }], image: '/images/zahnarzt/4_Modern_Dental_Waiting_Room_with_Stylish.png' },
      stats: [{ value: '15+', label: 'Jahre Erfahrung' }, { value: '3.200+', label: 'Zufriedene Patienten' }, { value: '4,9', label: 'Google-Bewertung' }, { value: '100%', label: 'Transparente Kosten' }],
      services: { eyebrow: 'Unsere Leistungen', title: 'Alles fuer Ihr Laecheln', subtitle: 'Von der Vorsorge bis zur Aesthetik - kompetent und sanft.', items: [{ icon: 'Sparkles', title: 'Aesthetische Zahnheilkunde', description: 'Bleaching, Veneers und natuerlich schoene Zaehne.' }, { icon: 'Scan', title: 'Implantologie', description: 'Festsitzender Ersatz fuer einzelne oder mehrere Zaehne.' }, { icon: 'Shield', title: 'Angstfreie Behandlung', description: 'Geduldig, einfuehlsam und mit modernen Betaeubungstechniken.' }, { icon: 'Heart', title: 'Kinderzahnheilkunde', description: 'Liebevolle Betreuung der kleinsten Patienten.' }, { icon: 'CheckCircle', title: 'Prophylaxe', description: 'Professionelle Zahnreinigung und individuelle Beratung.' }, { icon: 'Monitor', title: 'Digitale Diagnostik', description: '3D-Roentgen und intraorale Scans fuer praecise Befunde.' }] },
      process: { eyebrow: 'Ihr erster Besuch', title: 'So einfach geht\'s', subtitle: 'Ihr erstes Mal bei uns? Wir begleiten Sie Schritt fuer Schritt - transparent, geduldig und ohne Zeitdruck.', steps: [{ title: 'Termin vereinbaren', desc: 'Online oder telefonisch - wir finden schnell einen passenden Termin.' }, { title: 'Anamnese & Beratung', desc: 'Wir hoeren Ihnen zu und besprechen Ihre Wuensche und Befuerchtungen.' }, { title: 'Diagnostik', desc: 'Mit moderner Technik schaffen wir Transparenz.' }, { title: 'Behandlungsplan', desc: 'Sie erhalten einen klaren, nachvollziehbaren Plan mit Festpreis.' }], image: '/images/zahnarzt/4_Modern_Dental_Waiting_Room_with_Stylish.png', floating: { title: 'Neupatienten willkommen', desc: '30 Minuten extra Zeit fuer Ihre Anamnese.' } },
      team: { eyebrow: 'Das Team', title: 'Ihre Ansprechpartner', subtitle: 'Ein Team, das Sie mit Kompetenz und Herz behandelt.', members: [{ name: 'Dr. Lena Hartmann', role: 'Zahnaerztin · Inhaberin', focus: 'Implantologie & Aesthetik', image: '/images/people/8_23_900_Female_Dentist_Portrait_Stock.png' }, { name: 'Dr. Markus Bergmann', role: 'Zahnarzt · Oralchirurgie', focus: 'Weisheitszaehne & Knochenaufbau', image: '/images/people/7_Young_Accountant_Woman_Working_In.png' }, { name: 'Sarah Koehler', role: 'Zahnmedizinische Fachangestellte', focus: 'Prophylaxe & Patientenbetreuung', image: '/images/people/2_16_803_Modern_Accountant_Woman_Stock.png' }] },
      reviews: { eyebrow: 'Patientenstimmen', title: 'Was unsere Patienten sagen', subtitle: 'Echte Bewertungen aus der Praxis.', items: [{ name: 'Katharina M.', info: '34 Jahre', text: 'Endlich eine Zahnarztpraxis, in der ich mich wirklich wohlfuehle. Sehr geduldig und sanft.' }, { name: 'Thomas B.', info: '52 Jahre', text: 'Die Implantation wurde perfekt geplant. Das Ergebnis ist natuerlich und haltbar.' }, { name: 'Petra S.', info: '67 Jahre', text: 'Ich war immer aengstlich - hier wurde mir das endlich genommen.' }] },
      contact: { eyebrow: 'Kontakt', title: 'Vereinbaren Sie Ihren Termin', subtitle: 'Wir melden uns innerhalb von 24 Stunden bei Ihnen.', info: [{ icon: 'Phone', label: 'Telefon', value: '02161 508470' }, { icon: 'MapPin', label: 'Adresse', value: 'Waldhausenstrasse 14, 41061 Moenchengladbach' }, { icon: 'Mail', label: 'E-Mail', value: 'praxis@drhartmann-zahn.de' }, { icon: 'Clock', label: 'Oeffnungszeiten', value: 'Mo-Do 8-18h · Fr 8-14h' }], form: { fields: [{ name: 'firstName', label: 'Vorname', type: 'text', placeholder: 'Vorname' }, { name: 'lastName', label: 'Nachname', type: 'text', placeholder: 'Nachname' }, { name: 'email', label: 'E-Mail', type: 'email', placeholder: 'email@beispiel.de' }, { name: 'phone', label: 'Telefon', type: 'tel', placeholder: '02161 ...' }, { name: 'concern', label: 'Anliegen', type: 'select', options: ['Allgemeine Beratung', 'Terminvereinbarung', 'Implantologie', 'Prophylaxe', 'Sonstiges'] }, { name: 'message', label: 'Nachricht (optional)', type: 'textarea', placeholder: 'Ihre Nachricht an uns' }], submit: 'Terminanfrage senden' } },
    },
    en: {
      nav: { brand: 'DR.HARTMANN', links: [{ label: 'Services', href: '#services' }, { label: 'First Visit', href: '#process' }, { label: 'Team', href: '#team' }, { label: 'Contact', href: '#contact' }], cta: 'Appointment' },
      hero: { badge: 'Since 2008 in Moenchengladbach — Free parking', headline: ['Teeth.', 'People.', 'Trust.'], sub: 'Modern dentistry with humanity. We take time to listen and find the best solution for your smile.', ctas: [{ text: 'Book appointment', primary: true }, { text: 'Your first visit' }], image: '/images/zahnarzt/4_Modern_Dental_Waiting_Room_with_Stylish.png' },
      stats: [{ value: '15+', label: 'Years experience' }, { value: '3,200+', label: 'Happy patients' }, { value: '4.9', label: 'Google rating' }, { value: '100%', label: 'Transparent costs' }],
      services: { eyebrow: 'Our Services', title: 'Everything for your smile', subtitle: 'From prevention to aesthetics - competent and gentle.', items: [{ icon: 'Sparkles', title: 'Aesthetic Dentistry', description: 'Whitening, veneers and naturally beautiful teeth.' }, { icon: 'Scan', title: 'Implantology', description: 'Fixed replacement for single or multiple teeth.' }, { icon: 'Shield', title: 'Anxiety-free Treatment', description: 'Patient, empathetic and with modern anesthesia techniques.' }, { icon: 'Heart', title: 'Pediatric Dentistry', description: 'Loving care for the youngest patients.' }, { icon: 'CheckCircle', title: 'Prophylaxis', description: 'Professional cleaning and individual advice.' }, { icon: 'Monitor', title: 'Digital Diagnostics', description: '3D X-ray and intraoral scans for precise findings.' }] },
      process: { eyebrow: 'Your First Visit', title: 'How it works', subtitle: 'Your first time with us? We guide you step by step - transparent, patient and without time pressure.', steps: [{ title: 'Book appointment', desc: 'Online or by phone - we quickly find a suitable time.' }, { title: 'Anamnesis & Consultation', desc: 'We listen to you and discuss your wishes and concerns.' }, { title: 'Diagnostics', desc: 'Modern technology creates transparency.' }, { title: 'Treatment Plan', desc: 'You receive a clear, understandable plan with fixed prices.' }], image: '/images/zahnarzt/4_Modern_Dental_Waiting_Room_with_Stylish.png', floating: { title: 'New patients welcome', desc: '30 minutes extra time for your anamnesis.' } },
      team: { eyebrow: 'Team', title: 'Your Contacts', subtitle: 'A team that treats you with competence and heart.', members: [{ name: 'Dr. Lena Hartmann', role: 'Dentist · Owner', focus: 'Implantology & Aesthetics', image: '/images/people/8_23_900_Female_Dentist_Portrait_Stock.png' }, { name: 'Dr. Markus Bergmann', role: 'Dentist · Oral Surgery', focus: 'Wisdom teeth & bone augmentation', image: '/images/people/7_Young_Accountant_Woman_Working_In.png' }, { name: 'Sarah Koehler', role: 'Dental Assistant', focus: 'Prophylaxis & patient care', image: '/images/people/2_16_803_Modern_Accountant_Woman_Stock.png' }] },
      reviews: { eyebrow: 'Patient Voices', title: 'What our patients say', subtitle: 'Real reviews from the practice.', items: [{ name: 'Katharina M.', info: 'Age 34', text: 'Finally a dental practice where I really feel comfortable. Very patient and gentle.' }, { name: 'Thomas B.', info: 'Age 52', text: 'The implantation was perfectly planned. The result is natural and durable.' }, { name: 'Petra S.', info: 'Age 67', text: 'I was always anxious - they finally took that away from me.' }] },
      contact: { eyebrow: 'Contact', title: 'Book Your Appointment', subtitle: 'We will get back to you within 24 hours.', info: [{ icon: 'Phone', label: 'Phone', value: '02161 508470' }, { icon: 'MapPin', label: 'Address', value: 'Waldhausenstrasse 14, 41061 Moenchengladbach' }, { icon: 'Mail', label: 'Email', value: 'praxis@drhartmann-zahn.de' }, { icon: 'Clock', label: 'Opening hours', value: 'Mon-Thu 8am-6pm · Fri 8am-2pm' }], form: { fields: [{ name: 'firstName', label: 'First name', type: 'text', placeholder: 'First name' }, { name: 'lastName', label: 'Last name', type: 'text', placeholder: 'Last name' }, { name: 'email', label: 'Email', type: 'email', placeholder: 'email@example.com' }, { name: 'phone', label: 'Phone', type: 'tel', placeholder: '02161 ...' }, { name: 'concern', label: 'Concern', type: 'select', options: ['General consultation', 'Appointment request', 'Implantology', 'Prophylaxis', 'Other'] }, { name: 'message', label: 'Message (optional)', type: 'textarea', placeholder: 'Your message to us' }], submit: 'Send appointment request' } },
    },
  },
  {
    id: 'restaurant',
    active: false,
    name: 'Tre Pini',
    categoryDe: 'Restaurant',
    categoryEn: 'Restaurant',
    descriptionDe: 'Mediterrane Waerme mit digitalem Charakter. Menue-Praesentation, Reservierungssystem und Ambiente-Fotos.',
    descriptionEn: 'Mediterranean warmth with digital character. Menu presentation, reservation system and ambience photos.',
    featuresDe: ['Menue-Praesentation', 'Reservierungssystem', 'Ambiente-Fotos'],
    featuresEn: ['Menu presentation', 'Reservation system', 'Ambience photos'],
    tags: ['Nuxt 3', 'Content Management', 'SEO'],
    image: '/branchen/restaurant-hero.png',
    accentClass: 'text-amber-600 bg-amber-600/10 border-amber-600/20',
    theme: makeTheme({
      pageBg: 'bg-amber-50',
      pageText: 'text-amber-950',
      surfaceBg: 'bg-white',
      accent: 'amber-600',
      heroGradient: 'bg-gradient-to-br from-amber-900 via-amber-800 to-orange-900',
      heroText: 'text-white',
      cardHover: 'hover:shadow-amber-500/15',
      reviewsBg: 'bg-amber-950',
    }),
    de: {
      nav: { brand: 'TRE PINI', links: [{ label: 'Speisekarte', href: '#menu' }, { label: 'Reservierung', href: '#contact' }, { label: 'Kontakt', href: '#contact' }], cta: 'Reservieren' },
      hero: { badge: 'Frankfurt-Sachsenhausen', headline: ['Tre Pini'], sub: 'Authentisch italienisch. Handgemachte Pasta. Holzofen-Pizza. Seit 2017.', ctas: [{ text: 'Tisch reservieren', primary: true }], image: '' },
      services: { eyebrow: 'Unsere Philosophie', title: 'Liebe zu den Zutaten', subtitle: 'Respekt vor der Tradition. Jeden Tag frisch, jeden Tag mit Leidenschaft.', items: [{ icon: 'UtensilsCrossed', title: 'Handgemachte Pasta', description: 'Frisch taeglich nach italienischer Tradition.' }, { icon: 'Flame', title: 'Holzofen-Pizza', description: 'Knusprig, duftend, im originalen Holzofen gebacken.' }, { icon: 'Wine', title: 'Regionale Weine', description: 'Sorgfaeltig ausgewaehlte Weine aus Kampanien.' }] },
      special: { type: 'menu', data: { eyebrow: 'Speisekarte', title: 'Unsere Gerichte', subtitle: 'Von Vorspeise bis Dolci.', categories: ['Vorspeisen', 'Pasta', 'Pizza', 'Dolci'], items: { Vorspeisen: [{ name: 'Bruschetta al Pomodoro', desc: 'Mit frischen Tomaten und Basilikum', price: '8,50' }, { name: 'Carpaccio di Manzo', desc: 'Duennes Rinderfilet mit Parmesan', price: '14,90' }, { name: 'Burrata con Prosciutto', desc: 'Cremige Burrata mit Parmaschinken', price: '13,50' }], Pasta: [{ name: 'Spaghetti alla Carbonara', desc: 'Nach originalroemischem Rezept', price: '15,90' }, { name: 'Tagliatelle al Tartufo', desc: 'Mit schwarzem Trueffel', price: '24,50' }, { name: 'Pasta all\'Amatriciana', desc: 'Tomate, Guanciale und Pecorino', price: '14,90' }], Pizza: [{ name: 'Margherita DOP', desc: 'San Marzano Tomaten und Buufala', price: '11,50' }, { name: 'Diavola', desc: 'Scharfe Salami und Chili', price: '14,50' }, { name: 'Quattro Stagioni', desc: 'Die vier Jahreszeiten', price: '15,90' }], Dolci: [{ name: 'Tiramisu della Casa', desc: 'Hausgemacht, klassisch', price: '8,50' }, { name: 'Panna Cotta', desc: 'Mit Waldbeeren', price: '7,90' }, { name: 'Cannoli Siciliani', desc: 'Gefuellte Teigroehrchen', price: '9,50' }] } } },
      team: { eyebrow: 'Team', title: 'Chef Matteo Rossi', subtitle: 'Aus Neapel. Seit 20 Jahren lebt er seine Leidenschaft fuer authentische italienische Kueche.', members: [{ name: 'Matteo Rossi', role: 'Chef de Cuisine · Inhaber', focus: 'Authentische italienische Kueche', image: '/images/people/4_193_600_Male_Chef_Stock_Photos_Pictures.png' }] },
      reviews: { eyebrow: 'Gaestestimmen', title: 'Was unsere Gaeste sagen', subtitle: 'Ein kleiner Einblick in unser Gastro-Erlebnis.', items: [{ name: 'Lisa & Markus', info: 'Hochzeitstag', text: 'Romantisch, lecker und herzlich. Wir kommen garantiert wieder.' }, { name: 'Thomas H.', info: 'Geschaeftsessen', text: 'Perfekt fuer Abendessen mit Kunden. Service und Qualitaet stimmen.' }, { name: 'Sabine K.', info: 'Familienessen', text: 'Die Kinder lieben die Pizza - und wir den Wein. Ein Gewinn fuer die Gegend.' }] },
      contact: { eyebrow: 'Reservierung', title: 'Reservieren Sie Ihren Tisch', subtitle: 'Fuer Gruppen ab 8 Personen erstellen wir ein individuelles Menue.', info: [{ icon: 'MapPin', label: 'Adresse', value: 'Textorstrasse 28, 60594 Frankfurt' }, { icon: 'Phone', label: 'Telefon', value: '069 219740' }, { icon: 'Clock', label: 'Oeffnungszeiten', value: 'Di-Sa 18-23h · So 12-21h · Mo Ruhetag' }], form: { fields: [{ name: 'name', label: 'Name', type: 'text', placeholder: 'Name' }, { name: 'email', label: 'E-Mail', type: 'email', placeholder: 'email@beispiel.de' }, { name: 'date', label: 'Datum', type: 'date' }, { name: 'time', label: 'Uhrzeit', type: 'select', options: ['18:00', '18:30', '19:00', '19:30', '20:00', '20:30', '21:00'] }, { name: 'guests', label: 'Personen', type: 'select', options: ['2 Pers.', '3 Pers.', '4 Pers.', '5 Pers.', '6+ Pers.'] }, { name: 'wishes', label: 'Wuensche / Allergien', type: 'textarea', placeholder: 'Ihre Wuensche' }], submit: 'Reservierung anfragen' } },
    },
    en: {
      nav: { brand: 'TRE PINI', links: [{ label: 'Menu', href: '#menu' }, { label: 'Reservation', href: '#contact' }, { label: 'Contact', href: '#contact' }], cta: 'Reserve' },
      hero: { badge: 'Frankfurt-Sachsenhausen', headline: ['Tre Pini'], sub: 'Authentic Italian. Handmade pasta. Wood-fired pizza. Since 2017.', ctas: [{ text: 'Reserve a table', primary: true }], image: '' },
      services: { eyebrow: 'Our Philosophy', title: 'Love for Ingredients', subtitle: 'Respect for tradition. Fresh every day, every day with passion.', items: [{ icon: 'UtensilsCrossed', title: 'Handmade Pasta', description: 'Fresh daily according to Italian tradition.' }, { icon: 'Flame', title: 'Wood-fired Pizza', description: 'Crispy, fragrant, baked in the original wood oven.' }, { icon: 'Wine', title: 'Regional Wines', description: 'Carefully selected wines from Campania.' }] },
      special: { type: 'menu', data: { eyebrow: 'Menu', title: 'Our Dishes', subtitle: 'From appetizer to dolci.', categories: ['Starters', 'Pasta', 'Pizza', 'Dolci'], items: { Starters: [{ name: 'Bruschetta al Pomodoro', desc: 'With fresh tomatoes and basil', price: '8.50' }, { name: 'Carpaccio di Manzo', desc: 'Thin beef fillet with Parmesan', price: '14.90' }, { name: 'Burrata con Prosciutto', desc: 'Creamy burrata with Parma ham', price: '13.50' }], Pasta: [{ name: 'Spaghetti alla Carbonara', desc: 'Original Roman recipe', price: '15.90' }, { name: 'Tagliatelle al Tartufo', desc: 'With black truffle', price: '24.50' }, { name: 'Pasta all\'Amatriciana', desc: 'Tomato, guanciale and pecorino', price: '14.90' }], Pizza: [{ name: 'Margherita DOP', desc: 'San Marzano tomatoes and buffalo mozzarella', price: '11.50' }, { name: 'Diavola', desc: 'Spicy salami and chili', price: '14.50' }, { name: 'Quattro Stagioni', desc: 'The four seasons', price: '15.90' }], Dolci: [{ name: 'Tiramisu della Casa', desc: 'Homemade, classic', price: '8.50' }, { name: 'Panna Cotta', desc: 'With forest berries', price: '7.90' }, { name: 'Cannoli Siciliani', desc: 'Filled pastry rolls', price: '9.50' }] } } },
      team: { eyebrow: 'Team', title: 'Chef Matteo Rossi', subtitle: 'From Naples. For 20 years he has lived his passion for authentic Italian cuisine.', members: [{ name: 'Matteo Rossi', role: 'Chef de Cuisine · Owner', focus: 'Authentic Italian cuisine', image: '/images/people/4_193_600_Male_Chef_Stock_Photos_Pictures.png' }] },
      reviews: { eyebrow: 'Guest Voices', title: 'What our guests say', subtitle: 'A glimpse into our dining experience.', items: [{ name: 'Lisa & Markus', info: 'Anniversary', text: 'Romantic, delicious and warm. We will definitely come back.' }, { name: 'Thomas H.', info: 'Business dinner', text: 'Perfect for evening meals with clients. Service and quality are excellent.' }, { name: 'Sabine K.', info: 'Family dinner', text: 'The kids love the pizza - and we love the wine. A gem for the area.' }] },
      contact: { eyebrow: 'Reservation', title: 'Reserve Your Table', subtitle: 'For groups of 8 or more we create a custom menu.', info: [{ icon: 'MapPin', label: 'Address', value: 'Textorstrasse 28, 60594 Frankfurt' }, { icon: 'Phone', label: 'Phone', value: '069 219740' }, { icon: 'Clock', label: 'Opening hours', value: 'Tue-Sat 6-11pm · Sun 12-9pm · Mon closed' }], form: { fields: [{ name: 'name', label: 'Name', type: 'text', placeholder: 'Name' }, { name: 'email', label: 'Email', type: 'email', placeholder: 'email@example.com' }, { name: 'date', label: 'Date', type: 'date' }, { name: 'time', label: 'Time', type: 'select', options: ['6:00 PM', '6:30 PM', '7:00 PM', '7:30 PM', '8:00 PM', '8:30 PM', '9:00 PM'] }, { name: 'guests', label: 'Guests', type: 'select', options: ['2 guests', '3 guests', '4 guests', '5 guests', '6+ guests'] }, { name: 'wishes', label: 'Wishes / Allergies', type: 'textarea', placeholder: 'Your wishes' }], submit: 'Request reservation' } },
    },
  },
]

export const useBranchExamples = () => {
  const { locale } = useI18n()

  const branches = computed(() =>
    branchExamples
      .filter((b) => b.active)
      .map((b) => ({
        id: b.id,
        name: b.name,
        category: locale.value === 'de' ? b.categoryDe : b.categoryEn,
        description: locale.value === 'de' ? b.descriptionDe : b.descriptionEn,
        features: locale.value === 'de' ? b.featuresDe : b.featuresEn,
        tags: b.tags,
        image: b.image,
        accentClass: b.accentClass,
        theme: b.theme,
      })),
  )

  const getById = (id: string) => {
    const branch = branchExamples.find((b) => b.id === id && b.active)
    if (!branch) return undefined
    const content = locale.value === 'de' ? branch.de : branch.en
    return {
      ...branch,
      category: locale.value === 'de' ? branch.categoryDe : branch.categoryEn,
      content,
    }
  }

  return { branches, getById }
}
