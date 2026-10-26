import type { SelectionPreferences } from '../../types/domain'
import { emptyCatalogFilters, TIME_PERIODS } from './filter'
import type { CatalogFilters } from './types'

/** FE-020: temporary answers become the ordinary editable catalog filters. */
export function preferencesToFilters(preferences: SelectionPreferences): CatalogFilters {
  const budget = preferences.monthlyBudget
  return {
    ...emptyCatalogFilters(),
    directionIds: [...preferences.directionIds], areaIds: [...preferences.areaIds],
    ...(preferences.preferredPeriod === 'any' ? {} : TIME_PERIODS[preferences.preferredPeriod]),
    preferredFormat: preferences.preferredFormat,
    monthlyBudget: budget === 0 || budget === 2000 || budget === 5000 || budget === 10000 ? budget : null,
  }
}
