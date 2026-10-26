import { describe, expect, it } from 'vitest'
import { aggregatePlan } from '../plan'
import { calculateCatalogCosts } from '../cost'
import { filterCatalog, emptyCatalogFilters } from '../filter'
import { catalog, deepFreeze, demo, group, session } from './fixtures'

describe('FE-013 ActivityPlan aggregation', () => {
  it('accepts an empty plan with zero total and no weekly sessions or warnings', () => {
    expect(aggregatePlan({ activityIds: [], monthlyBudget: null }, demo)).toEqual({
      activityIds: [], groups: [], sessions: [], monthlyBudget: null, estimatedMonthlyTotal: 0,
      timeConflicts: [], roadWarnings: [], budgetWarning: null,
    })
  })
  it('deduplicates IDs and discards unknown IDs without losing valid groups', () => {
    const summary = aggregatePlan({ activityIds: ['group-art', 'missing', 'group-walk', 'group-art', 'group-walk'], monthlyBudget: null }, demo)
    expect(summary.activityIds).toEqual(['group-art', 'group-walk'])
    expect(summary.groups).toHaveLength(2)
    expect(summary.sessions).toHaveLength(3)
    expect(summary.estimatedMonthlyTotal).toBe(4000)
  })
  it('keeps five or more groups even when all warning types are present', () => {
    const activityIds = ['group-walk', 'group-art', 'group-gap29', 'group-gap30', 'group-online', 'group-hybrid', 'group-budget']
    const summary = aggregatePlan({ activityIds, monthlyBudget: 2000 }, demo)
    expect(summary.activityIds).toEqual(activityIds)
    expect(summary.groups).toHaveLength(7)
    expect(summary.sessions).toHaveLength(9)
    expect(summary.estimatedMonthlyTotal).toBe(26500)
    expect(summary.timeConflicts.length).toBeGreaterThan(0)
    expect(summary.roadWarnings.length).toBeGreaterThan(0)
    expect(summary.budgetWarning).toMatchObject({ monthlyBudget: 2000, estimatedMonthlyTotal: 26500, excess: 24500 })
  })
  it('includes every weekly session in chronological weekday/time order', () => {
    const summary = aggregatePlan({ activityIds: ['group-budget', 'group-walk'], monthlyBudget: null }, demo)
    expect(summary.sessions.map(s => [s.session.weekday, s.session.startTime])).toEqual([[1, '10:00'], [2, '18:00'], [4, '11:30'], [6, '09:00']])
    expect(summary.groups.every(g => Number.isFinite(g.estimatedMonthlyCost))).toBe(true)
  })
  it.each([
    [null, false], [0, true], [2000, true], [4000, false], [5000, false],
  ] as const)('budget %s warns only for strict numeric overrun', (monthlyBudget, warned) => {
    const result = aggregatePlan({ activityIds: ['group-walk'], monthlyBudget }, demo)
    expect(result.estimatedMonthlyTotal).toBe(4000)
    expect(result.budgetWarning !== null).toBe(warned)
  })
  it('recalculates after removal and preserves no stale conflicts/warnings/totals', () => {
    const full = aggregatePlan({ activityIds: ['group-walk', 'group-art', 'group-gap29'], monthlyBudget: 5000 }, demo)
    expect(full.timeConflicts.length).toBeGreaterThan(0)
    expect(full.roadWarnings.length).toBeGreaterThan(0)
    expect(full.budgetWarning).not.toBeNull()
    const remaining = aggregatePlan({ activityIds: ['group-walk'], monthlyBudget: 5000 }, demo)
    expect(remaining.timeConflicts).toEqual([])
    expect(remaining.roadWarnings).toEqual([])
    expect(remaining.budgetWarning).toBeNull()
    expect(remaining.estimatedMonthlyTotal).toBe(4000)
  })
  it('conflicts of any format win over road warnings for the same session pair', () => {
    const result = aggregatePlan({ activityIds: ['group-walk', 'group-art'], monthlyBudget: null }, demo)
    expect(result.timeConflicts).toHaveLength(1)
    expect(result.roadWarnings).toEqual([])
  })
  it('ignores cached group costs and the saved ActivityPlan total', () => {
    const calculated = calculateCatalogCosts(demo)
    const altered = { ...calculated, groups: calculated.groups.map(g => ({ ...g, estimatedMonthlyCost: 1 })) }
    const persisted = { activityIds: ['group-walk'], monthlyBudget: 2000, estimatedMonthlyTotal: 1, createdAt: '', updatedAt: '' }
    expect(aggregatePlan(persisted, altered).estimatedMonthlyTotal).toBe(4000)
    expect(aggregatePlan(persisted, altered).budgetWarning?.excess).toBe(2000)
    expect(filterCatalog(altered, { ...emptyCatalogFilters(), monthlyBudget: 2000 }).some(g => g.id === 'group-walk')).toBe(false)
  })
  it('does not mutate the caller plan or normalized data', () => {
    const plan = deepFreeze({ activityIds: ['group-walk', 'group-art', 'group-walk'], monthlyBudget: 0 })
    const frozen = deepFreeze(demo)
    const before = structuredClone({ plan, frozen })
    const first = aggregatePlan(plan, frozen)
    expect(aggregatePlan(plan, frozen)).toEqual(first)
    expect({ plan, frozen }).toEqual(before)
  })
  it('sums all three tariffs exactly once for unique groups', () => {
    const groups = [group('free', { priceType: 'free', priceAmount: 0 }), group('per', { priceType: 'perLesson', priceAmount: 500 }), group('month', { priceType: 'monthly', priceAmount: 2000 })]
    const schedules = [session('free', 'free'), session('per1', 'per'), session('per2', 'per', 2), session('month', 'month')]
    expect(aggregatePlan({ activityIds: ['free', 'per', 'month', 'per'], monthlyBudget: null }, catalog(groups, schedules)).estimatedMonthlyTotal).toBe(6000)
  })
})
