import { describe, expect, it } from 'vitest'
import { addActivityId } from '../selection'
import { aggregatePlan } from '../plan'
import { confirmedActivityId } from '../../../app/additionContext'
import { deepFreeze, demo } from './fixtures'

describe('FE-026 selection', () => {
  it('adds normalized string IDs without mutating the caller', () => {
    const ids = deepFreeze(['group-walk'])
    expect(addActivityId(ids, 'group-art', demo.groups)).toEqual(['group-walk', 'group-art'])
    expect(ids).toEqual(['group-walk'])
  })
  it('does not toggle or duplicate an already selected group', () => {
    expect(addActivityId(['group-walk'], 'group-walk', demo.groups)).toEqual(['group-walk'])
  })
  it('does not insert an unknown or legacy event ID', () => {
    expect(addActivityId(['group-walk'], '1', demo.groups)).toEqual(['group-walk'])
    expect(addActivityId([], 'missing', demo.groups)).toEqual([])
  })
  it('accepts seven distinct groups despite conflicts and budget overrun', () => {
    let activityIds: string[] = []
    for (const id of ['group-walk', 'group-art', 'group-gap29', 'group-gap30', 'group-online', 'group-hybrid', 'group-budget']) activityIds = addActivityId(activityIds, id, demo.groups)
    const summary = aggregatePlan({ activityIds, monthlyBudget: 0 }, demo)
    expect(activityIds).toHaveLength(7)
    expect(summary.sessions).toHaveLength(9)
    expect(summary.estimatedMonthlyTotal).toBe(26500)
    expect(summary.timeConflicts.length).toBeGreaterThan(0)
    expect(summary.roadWarnings.length).toBeGreaterThan(0)
    expect(summary.budgetWarning).not.toBeNull()
  })
})

describe('FE-027 confirmation context', () => {
  const recent = { activityId: 'group-walk', sequence: 1 }
  it('confirms only an actual selected recent group with matching route context', () => {
    expect(confirmedActivityId({ ...recent }, recent, ['group-walk'])).toBe('group-walk')
  })
  it.each([null, undefined, {}, 'group-walk', { activityId: 'group-art', sequence: 1 }, { activityId: 'group-walk', sequence: 2 }, { activityId: 'group-walk', sequence: '1' }])('rejects missing or stale route context %j', state => {
    expect(confirmedActivityId(state, recent, ['group-walk'])).toBeNull()
  })
  it('does not confirm a browser-history state after reload or an unselected group', () => {
    expect(confirmedActivityId(recent, null, ['group-walk'])).toBeNull()
    expect(confirmedActivityId(recent, recent, [])).toBeNull()
  })
})
