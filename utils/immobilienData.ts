export type ListingType = 'buy' | 'rent' | 'commercial'

export interface PropertyListing {
  id: string
  title: string
  location: string
  priceLabel: string
  price: number
  listingType: ListingType
  typeLabel: string
  rooms: number
  roomsLabel: string
  area: string
  areaM2: number
  image: string
  gallery: string[]
  tag: string
  lat: number
  lng: number
  description: string
  agentId: string
}

export interface PropertyAgent {
  id: string
  name: string
  role: string
  focus?: string
  image: string
  availableToday: boolean
  phone: string
}

export interface ImmobilienCopy {
  location: string
  locationAll: string
  radius: string
  radiusAny: string
  type: string
  typeAll: string
  rooms: string
  roomsAny: string
  price: string
  search: string
  results: string
  noResults: string
  list: string
  map: string
  expose: string
  favorite: string
  unfavorite: string
  availableToday: string
  unavailable: string
  contactAgent: string
  from: string
  close: string
  details: string
}

interface PropertySeed {
  id: string
  location: string
  listingType: ListingType
  price: number
  rooms: number
  areaM2: number
  image: string
  gallery: string[]
  lat: number
  lng: number
  agentId: string
  tagDe: string
  tagEn: string
  titleDe: string
  titleEn: string
  descDe: string
  descEn: string
}

const IMAGES = {
  living: '/images/immobilien/1_The_Role_of_Living_Room_Furniture.png',
  terrace: '/images/immobilien/2_Modern_Penthouse_Terrace_Overlooking.png',
  luxury: '/images/immobilien/3_Before_After_Combined_Modern_Luxury.png',
  penthouse: '/images/immobilien/4_Luxury_Penthouse_Terrace_Overlooking.png',
  historic: '/images/immobilien/5_Berlin_Germany_october_2017_Historic.png',
  agent: '/images/immobilien/10_Professional_real_estate_agent_Images.png',
  panorama: '/images/immobilien/7_Luxury_Penthouse_Terrace_with_Panoramic.png',
  interior: '/images/immobilien/8_10_Trends_of_Luxury_Home_Interior.png',
  classic: '/images/immobilien/9_Old_classic_buildings_in_Berlin_Stock.png',
}

const seeds: PropertySeed[] = [
  {
    id: 'kreuzberg-altbau',
    location: 'Kreuzberg',
    listingType: 'buy',
    price: 1180000,
    rooms: 4,
    areaM2: 138,
    image: IMAGES.luxury,
    gallery: [IMAGES.luxury, IMAGES.historic, IMAGES.interior, IMAGES.living],
    lat: 52.4987,
    lng: 13.418,
    agentId: 'clara',
    tagDe: 'Denkmalschutz',
    tagEn: 'Heritage',
    titleDe: 'Kreuzberger Altbauwohnung',
    titleEn: 'Kreuzberg Old Building Apartment',
    descDe: 'Hochherrschaftlicher Altbau mit Stuck, Dielen und stiller Hofseite. Denkmalgerecht saniert, zwei Balkone, Blick auf die Oranienstrasse.',
    descEn: 'Grand period apartment with stucco, floorboards and a quiet courtyard. Heritage renovation, two balconies, view towards Oranienstrasse.',
  },
  {
    id: 'neukoelln-loft',
    location: 'Neukoelln',
    listingType: 'rent',
    price: 2850,
    rooms: 3,
    areaM2: 105,
    image: IMAGES.interior,
    gallery: [IMAGES.interior, IMAGES.living, IMAGES.luxury],
    lat: 52.4813,
    lng: 13.4352,
    agentId: 'jonas',
    tagDe: 'Neu',
    tagEn: 'New',
    titleDe: 'Loft im Gewerbehof',
    titleEn: 'Loft in Commercial Courtyard',
    descDe: 'Offenes Loft in einem sanierten Gewerbehof. Vier Meter Raumhoehe, Industriefenster, Gemeinschaftsterrasse im dritten Hof.',
    descEn: 'Open loft in a refurbished courtyard complex. Four-metre ceilings, industrial windows, shared terrace in the third courtyard.',
  },
  {
    id: 'charlottenburg-villa',
    location: 'Charlottenburg',
    listingType: 'buy',
    price: 2650000,
    rooms: 7,
    areaM2: 295,
    image: IMAGES.living,
    gallery: [IMAGES.living, IMAGES.panorama, IMAGES.classic, IMAGES.luxury],
    lat: 52.5166,
    lng: 13.3041,
    agentId: 'clara',
    tagDe: 'Exklusiv',
    tagEn: 'Exclusive',
    titleDe: 'Stadtvilla Charlottenburg',
    titleEn: 'Charlottenburg Townhouse',
    descDe: 'Freistehende Stadtvilla mit Garten, Kaminzimmer und originaler Holzvertäfelung. Ruhige Seitenstrasse, Fussweg zum Schlosspark.',
    descEn: 'Detached townhouse with garden, fireplace lounge and original wood panelling. Quiet side street, walking distance to the palace park.',
  },
  {
    id: 'friedrichshain-penthouse',
    location: 'Friedrichshain',
    listingType: 'rent',
    price: 3900,
    rooms: 4,
    areaM2: 165,
    image: IMAGES.penthouse,
    gallery: [IMAGES.penthouse, IMAGES.panorama, IMAGES.terrace, IMAGES.interior],
    lat: 52.5158,
    lng: 13.454,
    agentId: 'clara',
    tagDe: 'Dachterrasse',
    tagEn: 'Rooftop',
    titleDe: 'Penthouse Friedrichshain',
    titleEn: 'Friedrichshain Penthouse',
    descDe: 'Staffelgeschoss mit 40 m2 Dachterrasse, Skylineblick und Abendsonne. Fussbodenheizung, offene Kueche, Aufzug.',
    descEn: 'Pitched-roof penthouse with 40 m2 terrace, skyline views and evening sun. Underfloor heating, open kitchen, elevator.',
  },
  {
    id: 'schoeneberg-gewerbe',
    location: 'Schoeneberg',
    listingType: 'commercial',
    price: 7500,
    rooms: 0,
    areaM2: 220,
    image: IMAGES.living,
    gallery: [IMAGES.living, IMAGES.classic, IMAGES.historic],
    lat: 52.4833,
    lng: 13.3556,
    agentId: 'jonas',
    tagDe: 'Gewerbe',
    tagEn: 'Commercial',
    titleDe: 'Gewerbeeinheit Schoeneberg',
    titleEn: 'Schoeneberg Commercial Unit',
    descDe: 'Repraesentativer Open Space mit Schaufensterfront. Ideal fuer Showroom, Atelier oder Boutique-Office. Nebenraeume und Lager.',
    descEn: 'Representative open space with shop-front glazing. Ideal for showroom, atelier or boutique office. Ancillary rooms and storage.',
  },
  {
    id: 'prenzlauer-garten',
    location: 'Prenzlauer Berg',
    listingType: 'buy',
    price: 985000,
    rooms: 5,
    areaM2: 158,
    image: IMAGES.terrace,
    gallery: [IMAGES.terrace, IMAGES.luxury, IMAGES.historic, IMAGES.interior],
    lat: 52.5388,
    lng: 13.4244,
    agentId: 'clara',
    tagDe: 'Garten',
    tagEn: 'Garden',
    titleDe: 'Gartengeschoss Prenzlauer Berg',
    titleEn: 'Prenzlauer Berg Garden Floor',
    descDe: 'Souterrain plus Hochparterre mit eigenem Garten. Kinderzimmer zur ruhigen Seite, neue Kueche, Kellerabteil.',
    descEn: 'Garden-level plus raised ground floor with a private garden. Children\'s rooms on the quiet side, new kitchen, cellar storage.',
  },
  {
    id: 'kreuzberg-kanal',
    location: 'Kreuzberg',
    listingType: 'rent',
    price: 1650,
    rooms: 2,
    areaM2: 68,
    image: IMAGES.classic,
    gallery: [IMAGES.classic, IMAGES.historic, IMAGES.interior],
    lat: 52.4965,
    lng: 13.411,
    agentId: 'jonas',
    tagDe: 'Kanalblick',
    tagEn: 'Canal view',
    titleDe: 'Altbau am Landwehrkanal',
    titleEn: 'Period flat by the Landwehrkanal',
    descDe: 'Zweite Etage, Westbalkon, Blick aufs Wasser. Frisch renoviert, Einbaukueche, stilvolle Nachbarschaft.',
    descEn: 'Second floor, west-facing balcony, water views. Freshly renovated, fitted kitchen, characterful neighbourhood.',
  },
  {
    id: 'lietzensee-townhouse',
    location: 'Charlottenburg',
    listingType: 'buy',
    price: 1890000,
    rooms: 6,
    areaM2: 210,
    image: IMAGES.panorama,
    gallery: [IMAGES.panorama, IMAGES.living, IMAGES.terrace, IMAGES.luxury],
    lat: 52.51,
    lng: 13.29,
    agentId: 'clara',
    tagDe: 'See-Lage',
    tagEn: 'Lakeside',
    titleDe: 'Townhouse am Lietzensee',
    titleEn: 'Townhouse at Lietzensee',
    descDe: 'Reihenhaus der 1920er mit Blick zum See. Drei Etagen, Dachterrasse, Garage. Familienfreundlich und ruhig.',
    descEn: '1920s townhouse facing the lake. Three floors, roof terrace, garage. Family-friendly and quiet.',
  },
]

const formatDe = (n: number) => n.toLocaleString('de-DE')
const formatEn = (n: number) => n.toLocaleString('en-GB')

const typeLabel = (type: ListingType, locale: 'de' | 'en') => {
  if (locale === 'de') {
    if (type === 'buy') return 'Kauf'
    if (type === 'rent') return 'Miete'
    return 'Gewerbe'
  }
  if (type === 'buy') return 'Buy'
  if (type === 'rent') return 'Rent'
  return 'Commercial'
}

const toListing = (seed: PropertySeed, locale: 'de' | 'en'): PropertyListing => {
  const isDe = locale === 'de'
  const priceLabel = seed.listingType === 'buy'
    ? (isDe ? `${formatDe(seed.price)} EUR` : `EUR ${formatEn(seed.price)}`)
    : (isDe ? `${formatDe(seed.price)} EUR/Monat` : `EUR ${formatEn(seed.price)}/month`)

  return {
    id: seed.id,
    title: isDe ? seed.titleDe : seed.titleEn,
    location: seed.location,
    priceLabel,
    price: seed.price,
    listingType: seed.listingType,
    typeLabel: typeLabel(seed.listingType, locale),
    rooms: seed.rooms,
    roomsLabel: seed.rooms === 0
      ? 'Open Space'
      : `${seed.rooms} ${isDe ? 'Zimmer' : (seed.rooms === 1 ? 'room' : 'rooms')}`,
    area: `${seed.areaM2} m²`,
    areaM2: seed.areaM2,
    image: seed.image,
    gallery: seed.gallery,
    tag: isDe ? seed.tagDe : seed.tagEn,
    lat: seed.lat,
    lng: seed.lng,
    description: isDe ? seed.descDe : seed.descEn,
    agentId: seed.agentId,
  }
}

export const immobilienHeroGallery = [
  IMAGES.luxury,
  IMAGES.interior,
  IMAGES.penthouse,
  IMAGES.living,
]

export const immobilienOrigin = { lat: 52.4987, lng: 13.418, label: 'Kreuzberg' }

export const getImmobilienListings = (locale: 'de' | 'en') => seeds.map((s) => toListing(s, locale))

export const getImmobilienLocations = () =>
  [...new Set(seeds.map((s) => s.location))].sort((a, b) => a.localeCompare(b))

export const getImmobilienCopy = (locale: 'de' | 'en'): ImmobilienCopy => {
  if (locale === 'de') {
    return {
      location: 'Ort',
      locationAll: 'Ganz Berlin',
      radius: 'Radius',
      radiusAny: 'egal',
      type: 'Objektart',
      typeAll: 'Alle',
      rooms: 'Zimmer',
      roomsAny: 'egal',
      price: 'Preis bis',
      search: 'Objekte finden',
      results: 'Treffer',
      noResults: 'Keine Treffer — Filter lockern.',
      list: 'Liste',
      map: 'Karte',
      expose: 'Exposé',
      favorite: 'Merken',
      unfavorite: 'Gespeichert',
      availableToday: 'heute erreichbar',
      unavailable: 'zurzeit unterwegs',
      contactAgent: 'Makler kontaktieren',
      from: 'ab',
      close: 'Schliessen',
      details: 'Eckdaten',
    }
  }
  return {
    location: 'Area',
    locationAll: 'All Berlin',
    radius: 'Radius',
    radiusAny: 'any',
    type: 'Type',
    typeAll: 'All',
    rooms: 'Rooms',
    roomsAny: 'any',
    price: 'Price up to',
    search: 'Find homes',
    results: 'results',
    noResults: 'No matches — loosen the filters.',
    list: 'List',
    map: 'Map',
    expose: 'Preview',
    favorite: 'Save',
    unfavorite: 'Saved',
    availableToday: 'available today',
    unavailable: 'currently out',
    contactAgent: 'Contact agent',
    from: 'from',
    close: 'Close',
    details: 'Key facts',
  }
}

export const getImmobilienAgents = (locale: 'de' | 'en'): PropertyAgent[] => {
  const isDe = locale === 'de'
  return [
    {
      id: 'clara',
      name: 'Clara Boeckler',
      role: isDe ? 'Geschaeftsfuehrerin · Inhaberin' : 'Managing Director · Owner',
      focus: isDe ? 'Denkmalimmobilien & Altbau' : 'Heritage properties & old buildings',
      image: '/images/people/5_72_700_Accountant_Portrait_Stock.png',
      availableToday: true,
      phone: '030 61408921',
    },
    {
      id: 'jonas',
      name: 'Jonas Richter',
      role: isDe ? 'Senior Immobilienmakler' : 'Senior Real Estate Agent',
      focus: isDe ? 'Gewerbeimmobilien' : 'Commercial properties',
      image: '/images/immobilien/10_Professional_real_estate_agent_Images.png',
      availableToday: false,
      phone: '030 61408922',
    },
  ]
}
