import type { ActivityPlan } from '../types/domain'
import type { CatalogData } from '../data/catalog'
import type { CatalogBudget } from '../utils/business'
import { aggregatePlan } from '../utils/business'

export const ACTIVITY_PLAN_KEY = 'dolgoletie.activityPlan.v1'

export function normalizePlanBudget(value: unknown): CatalogBudget {
  return value === 0 || value === 2000 || value === 5000 || value === 10000 ? value : null
}

function isTimestamp(value: unknown): value is string {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})$/.test(value)) return false
  const date = value.slice(0, 10)
  return Number.isFinite(Date.parse(value)) && Number.isFinite(Date.parse(date)) && new Date(date).toISOString().slice(0, 10) === date
}

/** Field-by-field recovery. Only the five baseline fields are returned.
 * `now` is injected so validation and recovery are deterministic in tests.
 */
export function normalizeActivityPlan(value: unknown, data: CatalogData, now: string): ActivityPlan {
  const source = value && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : {}
  const validStructure = Array.isArray(source.activityIds)
  const activityIds = validStructure ? (source.activityIds as unknown[]).filter((id): id is string => typeof id === 'string') : []
  const monthlyBudget = validStructure ? normalizePlanBudget(source.monthlyBudget) : null
  const summary = aggregatePlan({ activityIds, monthlyBudget }, data)
  const createdAt = validStructure && isTimestamp(source.createdAt) ? source.createdAt : now
  const updatedAt = validStructure && isTimestamp(source.updatedAt) && Date.parse(source.updatedAt) >= Date.parse(createdAt) ? source.updatedAt : createdAt
  return { activityIds: summary.activityIds, monthlyBudget, estimatedMonthlyTotal: summary.estimatedMonthlyTotal, createdAt, updatedAt }
}

export function decodeActivityPlan(serialized: string | null, data: CatalogData, now: string): ActivityPlan {
  try { return normalizeActivityPlan(JSON.parse(serialized ?? 'null'), data, now) }
  catch { return normalizeActivityPlan(null, data, now) }
}

export function loadActivityPlan(data: CatalogData, now: string, storage?: Pick<Storage, 'getItem'>): { plan: ActivityPlan; readError: boolean } {
  try { return { plan: decodeActivityPlan((storage ?? localStorage).getItem(ACTIVITY_PLAN_KEY), data, now), readError: false } }
  catch { return { plan: normalizeActivityPlan(null, data, now), readError: true } }
}

export function saveActivityPlan(plan: ActivityPlan, data: CatalogData, storage?: Pick<Storage, 'setItem'>): boolean {
  try {
    const snapshot = normalizeActivityPlan(plan, data, plan.updatedAt)
    const target = storage ?? localStorage
    target.setItem(ACTIVITY_PLAN_KEY, JSON.stringify(snapshot))
    return true
  } catch { return false }
}
