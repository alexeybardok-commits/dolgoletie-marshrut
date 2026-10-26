import { describe, expect, it } from 'vitest'
import type { ActivityFormat } from '../../../types/domain'
import { findTimeConflicts } from '../conflicts'
import { findRoadWarnings } from '../road'
import { demo, group, session } from './fixtures'

describe('FE-011 time conflicts', () => {
  const groups = [group('a'), group('b', { venueId: 'venue-b' })]
  it('reports strict overlap with both group and session contexts', () => {
    const result = findTimeConflicts(groups, [session('a1', 'a', 1, '18:00', '19:30'), session('b1', 'b', 1, '19:00', '20:00')])
    expect(result).toHaveLength(1)
    expect(result[0]).toMatchObject({ kind: 'time-conflict', first: { group: { id: 'a' }, session: { id: 'a1', startTime: '18:00', endTime: '19:30' } }, second: { group: { id: 'b' }, session: { id: 'b1', startTime: '19:00', endTime: '20:00' } } })
  })
  it('does not treat touching intervals as overlap', () => {
    expect(findTimeConflicts(groups, [session('a1', 'a', 1, '18:00', '19:00'), session('b1', 'b', 1, '19:00', '20:00')])).toEqual([])
  })
  it('does not compare sessions on different weekdays', () => {
    expect(findTimeConflicts(groups, [session('a1', 'a', 1), session('b1', 'b', 2)])).toEqual([])
  })
  it('checks the second weekly session and non-neighboring nested intervals', () => {
    const groups3 = [...groups, group('c')]
    const schedules = [session('a1', 'a', 1), session('a2', 'a', 3, '10:00', '14:00'), session('b1', 'b', 3, '11:00', '12:00'), session('c1', 'c', 3, '13:00', '14:00')]
    expect(findTimeConflicts(groups3, schedules).map(c => [c.first.session.id, c.second.session.id])).toEqual([['a2', 'b1'], ['a2', 'c1']])
  })
  it('also checks two obligatory sessions of the same selected group', () => {
    expect(findTimeConflicts([groups[0]], [session('a1', 'a'), session('a2', 'a', 1, '10:30', '11:30')])).toHaveLength(1)
  })
  it.each(['offline', 'online', 'hybrid'] as const)('includes %s sessions in conflicts', activityFormat => {
    expect(findTimeConflicts([group('a'), group('b', { activityFormat })], [session('a1', 'a'), session('b1', 'b')])).toHaveLength(1)
  })
  it('ignores sessions of unselected groups', () => {
    expect(findTimeConflicts([groups[0]], [session('a1', 'a'), session('b1', 'b')])).toEqual([])
  })
})

describe('FE-012 road warnings', () => {
  const groups = [group('a', { venueId: 'venue-a' }), group('b', { venueId: 'venue-b' })]
  it.each([
    ['11:00', 0, 1], ['11:29', 29, 1], ['11:30', 30, 0], ['11:31', 31, 0],
  ] as const)('gap to %s: %i minutes', (startTime, gapMinutes, count) => {
    const result = findRoadWarnings(groups, [session('b1', 'b', 1, startTime, '12:00'), session('a1', 'a')])
    expect(result).toHaveLength(count)
    if (count) expect(result[0]).toMatchObject({ kind: 'road-warning', gapMinutes, first: { group: { id: 'a' } }, second: { group: { id: 'b' } } })
  })
  it('does not warn for the same physical venue', () => {
    expect(findRoadWarnings([group('a'), group('b')], [session('a1', 'a'), session('b1', 'b', 1, '11:29', '12:00')])).toEqual([])
  })
  it('does not warn across different weekdays', () => {
    expect(findRoadWarnings(groups, [session('a1', 'a'), session('b1', 'b', 2, '11:29', '12:00')])).toEqual([])
  })
  const formats: ActivityFormat[] = ['offline', 'online', 'hybrid']
  it.each(formats.flatMap(a => formats.map(b => [a, b] as const)))('only offline/offline: %s/%s', (a, b) => {
    const result = findRoadWarnings([group('a', { activityFormat: a, venueId: 'venue-a' }), group('b', { activityFormat: b, venueId: 'venue-b' })], [session('a1', 'a'), session('b1', 'b', 1, '11:29', '12:00')])
    expect(result).toHaveLength(a === 'offline' && b === 'offline' ? 1 : 0)
  })
  it('gives time conflict priority: an overlapping pair has no road warning', () => {
    const sessions = [session('a1', 'a'), session('b1', 'b', 1, '10:59', '12:00')]
    expect(findTimeConflicts(groups, sessions)).toHaveLength(1)
    expect(findRoadWarnings(groups, sessions)).toEqual([])
  })
  it('finds the demo 29-minute pair but not the 30-minute pair', () => {
    const warnings = findRoadWarnings(demo.groups, demo.schedules)
    expect(warnings.some(w => w.first.group.id === 'group-walk' && w.second.group.id === 'group-gap29' && w.gapMinutes === 29)).toBe(true)
    expect(warnings.some(w => w.first.group.id === 'group-walk' && w.second.group.id === 'group-gap30')).toBe(false)
  })
})
