import type { ActivityGroup, ActivityPlan, Schedule, SelectionPreferences } from '../../types/domain'
import type { CatalogData } from '../../data/catalog/contracts'

export type CatalogBudget = 0 | 2000 | 5000 | 10000 | null
export type AccessibilityFilter = 'any' | 'yes' | 'no' | 'unknown'
export type CatalogFilters = Pick<SelectionPreferences, 'directionIds' | 'areaIds' | 'preferredFormat'> & {
  weekdays: Schedule['weekday'][]
  /** Inclusive bounds on Schedule.startTime; null means unbounded. */
  timeFrom: string | null
  timeTo: string | null
  monthlyBudget: CatalogBudget
  query: string
  skillLevels: string[]
  physicalLoads: string[]
  elevator: AccessibilityFilter
  stepFreeEntrance: AccessibilityFilter
}

export type CalculatedCatalogData = Omit<CatalogData, 'groups'> & { groups: readonly ActivityGroup[] }

export interface ScheduledActivity {
  group: ActivityGroup
  session: Schedule
}

export interface TimeConflict {
  kind: 'time-conflict'
  first: ScheduledActivity
  second: ScheduledActivity
}

export interface RoadWarning {
  kind: 'road-warning'
  /** Ordered chronologically, on the same weekday. */
  first: ScheduledActivity
  second: ScheduledActivity
  gapMinutes: number
}

export interface BudgetWarning {
  kind: 'budget-warning'
  monthlyBudget: number
  estimatedMonthlyTotal: number
  excess: number
}

/** Derived view only. No persistence, dates, or mutation of ActivityPlan. */
export interface PlanSummary {
  activityIds: ActivityPlan['activityIds']
  groups: readonly ActivityGroup[]
  sessions: readonly ScheduledActivity[]
  monthlyBudget: ActivityPlan['monthlyBudget']
  estimatedMonthlyTotal: number
  timeConflicts: readonly TimeConflict[]
  roadWarnings: readonly RoadWarning[]
  budgetWarning: BudgetWarning | null
}
