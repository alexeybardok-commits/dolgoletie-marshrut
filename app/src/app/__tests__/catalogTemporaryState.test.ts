import { describe, expect, it } from 'vitest'
import { initialPlanSession, reducePlanSession } from '../planSession'
import { normalizeActivityPlan, saveActivityPlan } from '../../storage/activityPlanStorage'
import { emptyCatalogFilters, filterCatalog } from '../../utils/business'
import { deepFreeze, demo } from '../../utils/business/__tests__/fixtures'

const now = '2026-10-26T10:00:00.000Z'

describe('FE-023/024 temporary state and plan isolation', () => {
  it('search/additional changes never change the plan reference or its timestamps/IDs/total', () => {
    const plan = deepFreeze(normalizeActivityPlan({ activityIds: ['group-walk', 'group-art'], monthlyBudget: 5000 }, demo, now))
    let state = initialPlanSession(plan)
    const filters = { ...emptyCatalogFilters(), monthlyBudget: 5000 as const, query: 'нетсовпадений', skillLevels: ['Для начинающих — учебное значение'], physicalLoads: ['Низкая — учебное значение'], elevator: 'unknown' as const, stepFreeEntrance: 'yes' as const }
    state = reducePlanSession(state, { type: 'filters', filters, now: '2026-10-26T12:00:00.000Z' }, demo)
    expect(filterCatalog(demo, filters)).toHaveLength(0)
    expect(state.plan).toBe(plan)
    expect(state.plan.activityIds).toEqual(['group-walk', 'group-art'])
    expect(state.plan.estimatedMonthlyTotal).toBe(4000)
    state = reducePlanSession(state, { type: 'filters', filters: { ...filters, query: '', elevator: 'any' }, now }, demo)
    expect(state.plan).toBe(plan)
  })
  it('serializes no search/additional fields and restores them empty', () => {
    const plan = normalizeActivityPlan({ activityIds: ['group-walk'], monthlyBudget: 5000 }, demo, now)
    const state = reducePlanSession(initialPlanSession(plan), { type: 'filters', filters: { ...emptyCatalogFilters(), monthlyBudget: 5000, query: 'ходьба', skillLevels: ['Для начинающих — учебное значение'], physicalLoads: ['Низкая — учебное значение'], elevator: 'unknown', stepFreeEntrance: 'yes' }, now }, demo)
    let serialized = ''
    expect(saveActivityPlan(state.plan, demo, { setItem: (_key, value) => { serialized = value } })).toBe(true)
    expect(Object.keys(JSON.parse(serialized)).sort()).toEqual(['activityIds', 'monthlyBudget', 'estimatedMonthlyTotal', 'createdAt', 'updatedAt'].sort())
    const restored = initialPlanSession(normalizeActivityPlan(JSON.parse(serialized), demo, now))
    expect(restored.filters.query).toBe('')
    expect(restored.filters.skillLevels).toEqual([])
    expect(restored.filters.physicalLoads).toEqual([])
    expect(restored.filters.elevator).toBe('any')
    expect(restored.filters.stepFreeEntrance).toBe('any')
    expect(restored.plan).toEqual(plan)
  })
  it('clears every condition with the existing full reset, preserving selected groups', () => {
    let state = initialPlanSession(normalizeActivityPlan({ activityIds: ['group-walk'], monthlyBudget: null }, demo, now))
    state = reducePlanSession(state, { type: 'filters', filters: { ...emptyCatalogFilters(), query: 'ходьба', skillLevels: ['test'], physicalLoads: ['test'], elevator: 'yes', stepFreeEntrance: 'no' }, now }, demo)
    const before = state.plan
    state = reducePlanSession(state, { type: 'filters', filters: emptyCatalogFilters(), now }, demo)
    expect(state.plan).toBe(before)
    expect({ ...state.filters, monthlyBudget: state.plan.monthlyBudget }).toEqual(emptyCatalogFilters())
    expect(filterCatalog(demo, { ...state.filters, monthlyBudget: null })).toHaveLength(7)
  })
})
