import type { ActivityPlan } from '../types/domain'
import type { CatalogData } from '../data/catalog'
import type { CatalogFilters } from '../utils/business'
import { aggregatePlan, emptyCatalogFilters } from '../utils/business'
import { addActivityId } from '../utils/business/selection'
import { normalizePlanBudget } from '../storage/activityPlanStorage'

/** UI-only last-deletion metadata; never serialized with ActivityPlan. */
export interface LastRemoval { activityId: string; index: number }
export interface PlanSession {
  filters: Omit<CatalogFilters, 'monthlyBudget'>
  plan: ActivityPlan
  lastRemoval: LastRemoval | null
  readError: boolean
}
export type PlanAction =
  | { type: 'add'; id: string; now: string }
  | { type: 'remove'; id: string; now: string }
  | { type: 'undo'; now: string }
  | { type: 'filters'; filters: CatalogFilters; now: string }

export function initialPlanSession(plan: ActivityPlan, readError = false): PlanSession {
  const { monthlyBudget: _budget, ...filters } = emptyCatalogFilters()
  // The budget is restored from plan, all other filters start unrestricted.
  void _budget
  return { filters, plan, lastRemoval: null, readError }
}

function revisePlan(plan: ActivityPlan, activityIds: string[], monthlyBudget: ActivityPlan['monthlyBudget'], data: CatalogData, now: string): ActivityPlan {
  const result = aggregatePlan({ activityIds, monthlyBudget }, data)
  return { activityIds: result.activityIds, monthlyBudget, estimatedMonthlyTotal: result.estimatedMonthlyTotal, createdAt: plan.createdAt, updatedAt: now }
}

export function reducePlanSession(state: PlanSession, action: PlanAction, data: CatalogData): PlanSession {
  switch (action.type) {
    case 'add': {
      if (state.plan.activityIds.includes(action.id) || !data.groups.some(group => group.id === action.id)) return state
      const ids = addActivityId(state.plan.activityIds, action.id, data.groups)
      return { ...state, plan: revisePlan(state.plan, ids, state.plan.monthlyBudget, data, action.now), lastRemoval: state.lastRemoval?.activityId === action.id ? null : state.lastRemoval }
    }
    case 'remove': {
      const index = state.plan.activityIds.indexOf(action.id)
      if (index < 0) return state
      return { ...state, plan: revisePlan(state.plan, state.plan.activityIds.filter(id => id !== action.id), state.plan.monthlyBudget, data, action.now), lastRemoval: { activityId: action.id, index } }
    }
    case 'undo': {
      if (!state.lastRemoval) return state
      const { activityId, index } = state.lastRemoval
      const ids = [...state.plan.activityIds]
      if (!ids.includes(activityId) && data.groups.some(group => group.id === activityId)) ids.splice(Math.min(index, ids.length), 0, activityId)
      return { ...state, lastRemoval: null, plan: revisePlan(state.plan, ids, state.plan.monthlyBudget, data, action.now) }
    }
    case 'filters': {
      const { monthlyBudget, ...filters } = action.filters
      const budget = normalizePlanBudget(monthlyBudget)
      return { ...state, filters, plan: budget === state.plan.monthlyBudget ? state.plan : revisePlan(state.plan, state.plan.activityIds, budget, data, action.now) }
    }
  }
}
