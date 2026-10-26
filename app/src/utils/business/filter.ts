import type { PreferredPeriod } from '../../types/domain'
import type { CatalogData } from '../../data/catalog/contracts'
import { calculateGroupCosts } from './cost'
import type { CatalogFilters } from './types'
import { createCatalogSearch } from './search'
import { matchesAdditionalFilters } from './additionalFilters'

export const TIME_PERIODS = {
  morning: { timeFrom: '08:00', timeTo: '11:59' },
  day: { timeFrom: '12:00', timeTo: '16:59' },
  evening: { timeFrom: '17:00', timeTo: '21:00' },
} as const satisfies Record<Exclude<PreferredPeriod, 'any'>, { timeFrom: string; timeTo: string }>

export function emptyCatalogFilters(): CatalogFilters {
  return { directionIds: [], areaIds: [], weekdays: [], timeFrom: null, timeTo: null, preferredFormat: 'any', monthlyBudget: null,
    query: '', skillLevels: [], physicalLoads: [], elevator: 'any', stepFreeEntrance: 'any' }
}

/** Only normalized records; no UI state, storage, ranking, or personal advice. */
export function filterCatalog(data: CatalogData, filters: CatalogFilters) {
  const venues = new Map(data.venues.map(venue => [venue.id, venue]))
  const matchesSearch = createCatalogSearch(data, filters.query)
  return calculateGroupCosts(data.groups, data.schedules).filter(group => {
    if (group.activityStatus !== 'active' || group.enrollmentStatus !== 'openNow') return false
    if (filters.directionIds.length && !group.directionIds.some(id => filters.directionIds.includes(id))) return false
    if (filters.areaIds.length && group.activityFormat !== 'online') {
      const venue = group.venueId ? venues.get(group.venueId) : undefined
      if (!venue || !filters.areaIds.includes(venue.area)) return false
    }
    if (filters.preferredFormat !== 'any' && group.activityFormat !== 'hybrid' && group.activityFormat !== filters.preferredFormat) return false
    if (filters.monthlyBudget !== null && group.estimatedMonthlyCost > filters.monthlyBudget) return false
    if (!matchesSearch(group) || !matchesAdditionalFilters(group, group.venueId ? venues.get(group.venueId) : undefined, filters)) return false
    const hasTimeFilter = filters.weekdays.length > 0 || filters.timeFrom !== null || filters.timeTo !== null
    return !hasTimeFilter || data.schedules.some(session =>
      session.groupId === group.id &&
      (!filters.weekdays.length || filters.weekdays.includes(session.weekday)) &&
      (filters.timeFrom === null || session.startTime >= filters.timeFrom) &&
      (filters.timeTo === null || session.startTime <= filters.timeTo),
    )
  })
}
