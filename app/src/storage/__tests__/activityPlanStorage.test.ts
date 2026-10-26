import { describe, expect, it } from 'vitest'
import { ACTIVITY_PLAN_KEY, decodeActivityPlan, loadActivityPlan, normalizeActivityPlan, saveActivityPlan } from '../activityPlanStorage'
import { demo } from '../../utils/business/__tests__/fixtures'

const now = '2026-10-26T10:00:00.000Z'
const createdAt = '2026-10-20T09:00:00.000Z'
const updatedAt = '2026-10-25T09:00:00.000Z'
const valid = { activityIds: ['group-walk', 'group-art'], monthlyBudget: 5000, estimatedMonthlyTotal: 1, createdAt, updatedAt }

describe('FE-032 ActivityPlan persistence', () => {
  it('restores canonical fields and recalculates a stale monthly total', () => {
    expect(decodeActivityPlan(JSON.stringify(valid), demo, now)).toEqual({ ...valid, estimatedMonthlyTotal: 4000 })
  })
  it.each([null, '{broken', '[]', 'null', '7', '"bad"', '{}', '{"activityIds":"bad","monthlyBudget":5000}'])('recovers corrupted structure %s to an empty valid plan', serialized => {
    expect(decodeActivityPlan(serialized, demo, now)).toEqual({ activityIds: [], monthlyBudget: null, estimatedMonthlyTotal: 0, createdAt: now, updatedAt: now })
  })
  it('recovers valid fields without losing known groups when IDs are mixed or duplicated', () => {
    const restored = normalizeActivityPlan({ ...valid, activityIds: ['group-walk', 1, null, 'missing', 'group-art', 'group-walk'] }, demo, now)
    expect(restored.activityIds).toEqual(['group-walk', 'group-art'])
    expect(restored.monthlyBudget).toBe(5000)
    expect(restored.estimatedMonthlyTotal).toBe(4000)
  })
  it.each([0, 2000, 5000, 10000, null])('preserves allowed monthly budget %s', monthlyBudget => {
    expect(normalizeActivityPlan({ ...valid, monthlyBudget }, demo, now).monthlyBudget).toBe(monthlyBudget)
  })
  it.each([-1, 100, '5000', false, {}, [], undefined, NaN, Infinity])('normalizes invalid monthly budget %j to null independently of IDs', monthlyBudget => {
    const result = normalizeActivityPlan({ ...valid, monthlyBudget }, demo, now)
    expect(result.monthlyBudget).toBeNull()
    expect(result.activityIds).toEqual(valid.activityIds)
  })
  it('normalizes timestamps, including invalid dates and reversed chronology', () => {
    const invalid = normalizeActivityPlan({ ...valid, createdAt: '2026-02-31T00:00:00Z', updatedAt: 'bad' }, demo, now)
    expect(invalid.createdAt).toBe(now)
    expect(invalid.updatedAt).toBe(now)
    const reversed = normalizeActivityPlan({ ...valid, updatedAt: '2020-01-01T00:00:00Z' }, demo, now)
    expect(Date.parse(reversed.updatedAt)).toBeGreaterThanOrEqual(Date.parse(reversed.createdAt))
  })
  it('recalculates the total from the current catalog when a stored group disappears', () => {
    const result = normalizeActivityPlan(valid, { ...demo, groups: demo.groups.filter(group => group.id !== 'group-walk') }, now)
    expect(result.activityIds).toEqual(['group-art'])
    expect(result.estimatedMonthlyTotal).toBe(0)
  })
  it('serializes only five baseline fields, excluding Undo, preferences, filters and confirmation', () => {
    const writes = new Map<string, string>()
    const input = { ...valid, filters: { directionIds: ['art'] }, SelectionPreferences: { preferredPeriod: 'morning' }, lastRemoval: { activityId: 'group-online', index: 0 }, recentAddition: { activityId: 'group-art', sequence: 1 } }
    expect(saveActivityPlan(input, demo, { setItem: (key, value) => { writes.set(key, value) } })).toBe(true)
    const stored = JSON.parse(writes.get(ACTIVITY_PLAN_KEY) ?? 'null')
    expect(Object.keys(stored).sort()).toEqual(['activityIds', 'monthlyBudget', 'estimatedMonthlyTotal', 'createdAt', 'updatedAt'].sort())
    expect(stored.estimatedMonthlyTotal).toBe(4000)
  })
  it('never reads or migrates the legacy keys', () => {
    const requests: string[] = []
    const legacy = new Map([['myPlan', '[1,2,3]'], ['parentPreferences', '{"maxPrice":"5000"}']])
    const result = loadActivityPlan(demo, now, { getItem: key => { requests.push(key); return legacy.get(key) ?? null } })
    expect(requests).toEqual([ACTIVITY_PLAN_KEY])
    expect(result.plan.activityIds).toEqual([])
    expect(result.plan.monthlyBudget).toBeNull()
    expect(legacy.get('myPlan')).toBe('[1,2,3]')
  })
  it('round-trips seven groups without a limit and without trusting the total', () => {
    const input = normalizeActivityPlan({ ...valid, activityIds: demo.groups.slice(0, 7).map(group => group.id) }, demo, now)
    const memory = new Map<string, string>()
    saveActivityPlan(input, demo, { setItem: (key, value) => { memory.set(key, value) } })
    const restored = loadActivityPlan(demo, now, { getItem: key => memory.get(key) ?? null })
    expect(restored.plan.activityIds).toHaveLength(7)
    expect(restored.plan.estimatedMonthlyTotal).toBe(26500)
    expect(restored.plan).toEqual(input)
  })
  it('handles denied reads and writes without throwing', () => {
    expect(loadActivityPlan(demo, now, { getItem: () => { throw new Error('blocked') } })).toMatchObject({ readError: true, plan: { activityIds: [] } })
    expect(saveActivityPlan(valid, demo, { setItem: () => { throw new Error('blocked') } })).toBe(false)
  })
})
