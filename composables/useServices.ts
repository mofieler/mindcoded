export type ServiceItem = {
  id: string
  title: string
  teaser: string
  body: string
  includes: string[]
  tags: string[]
}

export function useServices() {
  const items = useI18nEntries<ServiceItem>('services.items')
  return { items }
}
