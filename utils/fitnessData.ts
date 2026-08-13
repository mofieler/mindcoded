export type FitnessLevel = 'beginner' | 'intermediate' | 'advanced'
export type FitnessGoal = 'muscle' | 'fatburn' | 'yoga'
export type FitnessTimeOfDay = 'morning' | 'midday' | 'evening'

export interface FitnessClass {
  id: string
  name: string
  trainer: string
  level: FitnessLevel
  goal: FitnessGoal
  time: string
  hour: number
  duration: string
  spots: number
}

export interface FitnessModule {
  id: string
  name: string
  price: number
  priceLabel: string
  description: string
}

export interface FitnessCopy {
  classesEyebrow: string
  classesTitle: string
  classesSubtitle: string
  level: string
  goal: string
  time: string
  all: string
  book: string
  spots: string
  configuratorEyebrow: string
  configuratorTitle: string
  configuratorSubtitle: string
  basePlan: string
  addons: string
  monthly: string
  cta: string
  hubEyebrow: string
  hubTitle: string
  hubSubtitle: string
  hubBadge: string
  hubCta: string
  trialCta: string
  trialSecondary: string
}

export const getFitnessClasses = (): FitnessClass[] => [
  { id: 'sunrise-hiit', name: 'Sunrise HIIT', trainer: 'Tom Brenner', level: 'advanced', goal: 'fatburn', time: '06:15', hour: 6, duration: '45 min', spots: 4 },
  { id: 'hiit-ignite', name: 'HIIT Ignite', trainer: 'Tom Brenner', level: 'intermediate', goal: 'fatburn', time: '07:00', hour: 7, duration: '45 min', spots: 8 },
  { id: 'flow-yoga', name: 'Flow Yoga', trainer: 'Tom Brenner', level: 'beginner', goal: 'yoga', time: '09:30', hour: 9, duration: '60 min', spots: 12 },
  { id: 'core-burn', name: 'Core Burn', trainer: 'Nico Brandt', level: 'beginner', goal: 'fatburn', time: '12:15', hour: 12, duration: '30 min', spots: 10 },
  { id: 'hypertrophy', name: 'Hypertrophy', trainer: 'Nico Brandt', level: 'beginner', goal: 'muscle', time: '17:00', hour: 17, duration: '50 min', spots: 6 },
  { id: 'power-lift', name: 'Power Lift', trainer: 'Nico Brandt', level: 'advanced', goal: 'muscle', time: '18:00', hour: 18, duration: '55 min', spots: 5 },
  { id: 'strength-lab', name: 'Strength Lab', trainer: 'Nico Brandt', level: 'intermediate', goal: 'muscle', time: '19:30', hour: 19, duration: '50 min', spots: 7 },
  { id: 'night-yoga', name: 'Night Yoga', trainer: 'Tom Brenner', level: 'intermediate', goal: 'yoga', time: '21:00', hour: 21, duration: '60 min', spots: 14 },
]

export const getFitnessModules = (locale: 'de' | 'en'): FitnessModule[] => {
  const isDe = locale === 'de'
  return [
    {
      id: 'wellness',
      name: 'Wellness',
      price: 19.9,
      priceLabel: isDe ? '+19,90' : '+19.90',
      description: isDe ? 'Sauna, Ruhezone, Handtuecher.' : 'Sauna, quiet zone, towels.',
    },
    {
      id: 'drinks',
      name: 'Drinks',
      price: 8.9,
      priceLabel: isDe ? '+8,90' : '+8.90',
      description: isDe ? 'Protein-Bar Flatrate, 7 Tage.' : 'Protein bar flat rate, 7 days.',
    },
    {
      id: 'coaching',
      name: 'Coaching',
      price: 39,
      priceLabel: isDe ? '+39,00' : '+39.00',
      description: isDe ? '2x Personal Training / Monat.' : '2x personal training / month.',
    },
  ]
}

export const getFitnessCopy = (locale: 'de' | 'en'): FitnessCopy => {
  if (locale === 'de') {
    return {
      classesEyebrow: 'Live Schedule',
      classesTitle: 'Finde deinen Kurs',
      classesSubtitle: 'Filter nach Level, Ziel und Uhrzeit — und buche direkt ins Probetraining.',
      level: 'Level',
      goal: 'Ziel',
      time: 'Uhrzeit',
      all: 'Alle',
      book: 'Jetzt buchen',
      spots: 'frei',
      configuratorEyebrow: 'Mitgliedschaft',
      configuratorTitle: 'Bau dir deinen Pulse',
      configuratorSubtitle: 'Waehle den Basisplan, klicke Module dazu, sieh den Preis live.',
      basePlan: 'Basis',
      addons: 'Module',
      monthly: '/Monat',
      cta: 'Mitgliedschaft sichern',
      hubEyebrow: 'Coming soon',
      hubTitle: 'IronPulse Digital Hub',
      hubSubtitle: 'On-Demand-Workouts und eine Member-Community — bald direkt in der App.',
      hubBadge: 'In Entwicklung',
      hubCta: 'Warteliste',
      trialCta: 'Starte dein Probetraining in 60 Sekunden',
      trialSecondary: 'Preise ansehen',
    }
  }
  return {
    classesEyebrow: 'Live schedule',
    classesTitle: 'Find your class',
    classesSubtitle: 'Filter by level, goal and time — then book straight into a trial.',
    level: 'Level',
    goal: 'Goal',
    time: 'Time',
    all: 'All',
    book: 'Book now',
    spots: 'left',
    configuratorEyebrow: 'Membership',
    configuratorTitle: 'Build your pulse',
    configuratorSubtitle: 'Pick a base plan, tap add-ons, watch the price live.',
    basePlan: 'Base',
    addons: 'Modules',
    monthly: '/month',
    cta: 'Lock in membership',
    hubEyebrow: 'Coming soon',
    hubTitle: 'IronPulse Digital Hub',
    hubSubtitle: 'On-demand workouts and a member community — soon inside the app.',
    hubBadge: 'In development',
    hubCta: 'Join waitlist',
    trialCta: 'Start your trial in 60 seconds',
    trialSecondary: 'See pricing',
  }
}

export const fitnessLevelLabel = (level: FitnessLevel, locale: 'de' | 'en') => {
  const map = {
    de: { beginner: 'Einsteiger', intermediate: 'Fortgeschritten', advanced: 'Profi' },
    en: { beginner: 'Beginner', intermediate: 'Intermediate', advanced: 'Pro' },
  }
  return map[locale][level]
}

export const fitnessGoalLabel = (goal: FitnessGoal, locale: 'de' | 'en') => {
  const map = {
    de: { muscle: 'Muskelaufbau', fatburn: 'Fatburn', yoga: 'Yoga' },
    en: { muscle: 'Muscle', fatburn: 'Fatburn', yoga: 'Yoga' },
  }
  return map[locale][goal]
}

export const fitnessTimeLabel = (slot: FitnessTimeOfDay, locale: 'de' | 'en') => {
  const map = {
    de: { morning: 'Morgens', midday: 'Mittags', evening: 'Abends' },
    en: { morning: 'Morning', midday: 'Midday', evening: 'Evening' },
  }
  return map[locale][slot]
}

export const timeOfDayFromHour = (hour: number): FitnessTimeOfDay => {
  if (hour < 11) return 'morning'
  if (hour < 16) return 'midday'
  return 'evening'
}
