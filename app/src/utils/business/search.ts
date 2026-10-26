import type { CatalogData, ValidatedActivityGroup } from '../../data/catalog/contracts'

/** Plain-text matching only, never regex, markup, or a network request. */
export function normalizeSearchQuery(value: unknown): string {
  return typeof value === 'string'
    ? value.normalize('NFKC').replace(/[\p{Cc}\p{Cf}]/gu, ' ').replace(/\s+/gu, ' ').trim().toLocaleLowerCase('ru-RU').replaceAll('ё', 'е')
    : ''
}

/** Build lookups once per catalog query. Missing optional text contributes
 * nothing, and pure online never borrows physical venue/area/landmark fields.
 */
export function createCatalogSearch(data: CatalogData, query: unknown): (group: ValidatedActivityGroup) => boolean {
  const normalized = normalizeSearchQuery(query)
  if (!normalized) return () => true
  const tokens = normalized.split(' ')
  const directions = new Map(data.directions.map(item => [item.id, item.name]))
  const instructors = new Map(data.instructors.map(item => [item.id, item.name]))
  const organizers = new Map(data.organizers.map(item => [item.id, item.name]))
  const venues = new Map(data.venues.map(item => [item.id, item]))
  return group => {
    const venue = group.activityFormat !== 'online' && group.venueId ? venues.get(group.venueId) : undefined
    const fields = [group.title, group.description, ...group.directionIds.map(id => directions.get(id)),
      ...group.instructorIds.map(id => instructors.get(id)), organizers.get(group.organizerId),
      venue?.name, venue?.address, venue?.area, venue?.landmark]
    const text = normalizeSearchQuery(fields.filter((value): value is string => typeof value === 'string').join(' '))
    return tokens.every(token => text.includes(token))
  }
}
