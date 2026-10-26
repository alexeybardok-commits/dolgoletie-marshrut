import type { Venue } from '../../types/domain'
import type { AccessibilityFilter, CatalogFilters } from './types'
import type { ValidatedActivityGroup } from '../../data/catalog/contracts'

export function matchesAccessibility(value: boolean | null | undefined, filter: AccessibilityFilter): boolean {
  switch (filter) {
    case 'any': return true
    case 'yes': return value === true
    case 'no': return value === false
    case 'unknown': return value == null
  }
}

export function matchesAdditionalFilters(group: ValidatedActivityGroup, venue: Venue | undefined, filters: CatalogFilters): boolean {
  if (filters.skillLevels.length && !filters.skillLevels.includes(group.skillLevel)) return false
  if (filters.physicalLoads.length && !filters.physicalLoads.includes(group.physicalLoad)) return false
  if (group.activityFormat === 'online') return true
  return matchesAccessibility(venue?.elevator, filters.elevator) && matchesAccessibility(venue?.stepFreeEntrance, filters.stepFreeEntrance)
}
