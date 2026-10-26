import type { ActivityGroup, Schedule } from '../../types/domain'
import type { CatalogData, ValidatedActivityGroup } from '../../data/catalog/contracts'
import type { CalculatedCatalogData } from './types'

/** Input must come from FE-006 normalization. Schedule is the source of truth;
 * neither cached estimatedMonthlyCost nor a caller's lessonsPerWeek is read.
 */
export function calculateMonthlyCost(group: ValidatedActivityGroup, schedules: readonly Schedule[]): number {
  switch (group.priceType) {
    case 'free': return 0
    case 'monthly': return group.priceAmount
    case 'perLesson': return group.priceAmount * schedules.filter(session => session.groupId === group.id).length * 4
  }
}

export function calculateGroupCosts(groups: readonly ValidatedActivityGroup[], schedules: readonly Schedule[]): ActivityGroup[] {
  return groups.map(group => ({ ...group, estimatedMonthlyCost: calculateMonthlyCost(group, schedules) }))
}

/** Enriches the normalized snapshot without changing its source JSON order. */
export function calculateCatalogCosts(data: CatalogData): CalculatedCatalogData {
  return { ...data, groups: calculateGroupCosts(data.groups, data.schedules) }
}
