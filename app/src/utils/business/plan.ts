import type { ActivityPlan } from '../../types/domain'
import type { CatalogData } from '../../data/catalog/contracts'
import { calculateGroupCosts } from './cost'
import { getWeeklySessions } from './schedule'
import { findTimeConflicts } from './conflicts'
import { findRoadWarnings } from './road'
import type { PlanSummary } from './types'

/** No group-count limit or blocking warnings. Unknown IDs are ignored without
 * losing valid selections. Cached totals and all timestamps are never read.
 */
export function aggregatePlan(plan: Pick<ActivityPlan, 'activityIds' | 'monthlyBudget'>, data: CatalogData): PlanSummary {
  const byId = new Map(data.groups.map(group => [group.id, group]))
  const selected = [...new Set(plan.activityIds)].flatMap(id => {
    const group = byId.get(id)
    return group ? [group] : []
  })
  const groups = calculateGroupCosts(selected, data.schedules)
  const estimatedMonthlyTotal = groups.reduce((total, group) => total + group.estimatedMonthlyCost, 0)
  const budget = plan.monthlyBudget
  return {
    activityIds: groups.map(group => group.id), groups, sessions: getWeeklySessions(groups, data.schedules),
    monthlyBudget: budget, estimatedMonthlyTotal,
    timeConflicts: findTimeConflicts(groups, data.schedules),
    roadWarnings: findRoadWarnings(groups, data.schedules),
    budgetWarning: budget !== null && estimatedMonthlyTotal > budget
      ? { kind: 'budget-warning', monthlyBudget: budget, estimatedMonthlyTotal, excess: estimatedMonthlyTotal - budget }
      : null,
  }
}
