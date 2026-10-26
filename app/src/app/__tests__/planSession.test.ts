import { describe, expect, it } from 'vitest'
import { initialPlanSession, reducePlanSession } from '../planSession'
import { normalizeActivityPlan } from '../../storage/activityPlanStorage'
import { aggregatePlan, emptyCatalogFilters } from '../../utils/business'
import { deepFreeze, demo } from '../../utils/business/__tests__/fixtures'

const start = '2026-10-26T10:00:00.000Z'
const now = '2026-10-26T11:00:00.000Z'
const session = (ids: string[] = []) => initialPlanSession(normalizeActivityPlan({ activityIds: ids, monthlyBudget: 5000 }, demo, start))

describe('FE-031 remove and last-deletion Undo', () => {
  it('removes a group and recalculates every dependent value', () => {
    const state = reducePlanSession(session(['group-walk', 'group-art', 'group-gap29']), { type: 'remove', id: 'group-walk', now }, demo)
    expect(state.plan.activityIds).toEqual(['group-art', 'group-gap29'])
    expect(state.plan.estimatedMonthlyTotal).toBe(2500)
    expect(state.plan.createdAt).toBe(start)
    expect(state.plan.updatedAt).toBe(now)
    const summary = aggregatePlan(state.plan, demo)
    expect(summary.sessions).toHaveLength(2)
    expect(summary.timeConflicts).toHaveLength(1)
    expect(summary.timeConflicts.every(warning => warning.first.group.id !== 'group-walk' && warning.second.group.id !== 'group-walk')).toBe(true)
    expect(summary.roadWarnings).toEqual([])
    expect(summary.budgetWarning).toBeNull()
  })
  it('removing the last group yields an empty plan, and Undo restores it', () => {
    const empty = reducePlanSession(session(['group-walk']), { type: 'remove', id: 'group-walk', now }, demo)
    expect(empty.plan.activityIds).toEqual([])
    expect(empty.plan.estimatedMonthlyTotal).toBe(0)
    expect(empty.lastRemoval?.activityId).toBe('group-walk')
    const restored = reducePlanSession(empty, { type: 'undo', now }, demo)
    expect(restored.plan.activityIds).toEqual(['group-walk'])
    expect(restored.plan.estimatedMonthlyTotal).toBe(4000)
    expect(restored.lastRemoval).toBeNull()
  })
  it('restores only the last deletion and preserves its original position', () => {
    let state = session(['group-walk', 'group-art', 'group-online'])
    state = reducePlanSession(state, { type: 'remove', id: 'group-art', now }, demo)
    state = reducePlanSession(state, { type: 'remove', id: 'group-walk', now }, demo)
    state = reducePlanSession(state, { type: 'undo', now }, demo)
    expect(state.plan.activityIds).toEqual(['group-walk', 'group-online'])
    expect(reducePlanSession(state, { type: 'undo', now }, demo)).toBe(state)
  })
  it('does not create duplicates when the removed group is added again', () => {
    let state = reducePlanSession(session(['group-walk']), { type: 'remove', id: 'group-walk', now }, demo)
    state = reducePlanSession(state, { type: 'add', id: 'group-walk', now }, demo)
    expect(state.lastRemoval).toBeNull()
    state = reducePlanSession(state, { type: 'undo', now }, demo)
    state = reducePlanSession(state, { type: 'add', id: 'group-walk', now }, demo)
    expect(state.plan.activityIds).toEqual(['group-walk'])
  })
  it('keeps last-deletion Undo across an unrelated addition or filter change', () => {
    let state = reducePlanSession(session(['group-walk', 'group-art']), { type: 'remove', id: 'group-walk', now }, demo)
    state = reducePlanSession(state, { type: 'add', id: 'group-online', now }, demo)
    state = reducePlanSession(state, { type: 'filters', filters: { ...emptyCatalogFilters(), directionIds: ['art'], monthlyBudget: 0 }, now }, demo)
    state = reducePlanSession(state, { type: 'undo', now }, demo)
    expect(state.plan.activityIds).toEqual(['group-walk', 'group-art', 'group-online'])
    expect(state.plan.monthlyBudget).toBe(0)
    expect(state.filters.directionIds).toEqual(['art'])
  })
  it('reload reconstruction clears Undo and non-budget filters', () => {
    const previous = reducePlanSession(session(['group-walk']), { type: 'remove', id: 'group-walk', now }, demo)
    const restored = initialPlanSession(normalizeActivityPlan(previous.plan, demo, now))
    expect(restored.lastRemoval).toBeNull()
    expect(restored.filters.directionIds).toEqual([])
    expect(restored.plan.monthlyBudget).toBe(5000)
  })
  it('filter reset clears only budget/filters and leaves selected groups', () => {
    const state = reducePlanSession(session(['group-walk']), { type: 'filters', filters: emptyCatalogFilters(), now }, demo)
    expect(state.plan.activityIds).toEqual(['group-walk'])
    expect(state.plan.monthlyBudget).toBeNull()
  })
  it('is deterministic on frozen input and ignores invalid actions on IDs', () => {
    const state = deepFreeze(session(['group-walk']))
    expect(reducePlanSession(state, { type: 'remove', id: 'missing', now }, demo)).toBe(state)
    expect(reducePlanSession(state, { type: 'add', id: '1', now }, demo)).toBe(state)
    expect(reducePlanSession(state, { type: 'add', id: 'group-walk', now }, demo)).toBe(state)
    expect(reducePlanSession(state, { type: 'remove', id: 'group-walk', now }, demo).plan.activityIds).toEqual([])
    expect(state.plan.activityIds).toEqual(['group-walk'])
  })
})
