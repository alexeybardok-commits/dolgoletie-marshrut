import type { ActivityGroup, Schedule, Venue } from '../../../types/domain'
import type { CatalogData } from '../../../data/catalog/contracts'
import { normalizeCatalog } from '../../../data/catalog/normalize'
import directions from '../../../data/catalog/demo/directions.json'
import organizers from '../../../data/catalog/demo/organizers.json'
import venues from '../../../data/catalog/demo/venues.json'
import instructors from '../../../data/catalog/demo/instructors.json'
import groups from '../../../data/catalog/demo/groups.json'
import schedules from '../../../data/catalog/demo/schedules.json'
import { calculateCatalogCosts } from '../cost'

export const rawDemo = { directions, organizers, venues, instructors, groups, schedules }
export const demo = normalizeCatalog(rawDemo).data
const base = calculateCatalogCosts(demo).groups[0]

export function group(id: string, overrides: Partial<ActivityGroup> = {}): ActivityGroup {
  // Partial discriminated unions cannot prove the final spread's discriminator.
  // Fixtures explicitly set format/venue when exercising online/hybrid variants.
  return { ...base, id, ...overrides } as ActivityGroup
}

export function session(id: string, groupId: string, weekday: Schedule['weekday'] = 1, startTime = '10:00', endTime = '11:00'): Schedule {
  return { id, groupId, weekday, startTime, endTime }
}

export function catalog(groups: ActivityGroup[], schedules: Schedule[], venues: readonly Venue[] = demo.venues): CatalogData {
  return { ...demo, groups, schedules, venues }
}

export function deepFreeze<T>(value: T): T {
  if (value !== null && typeof value === 'object') {
    Object.freeze(value)
    for (const child of Object.values(value)) deepFreeze(child)
  }
  return value
}
