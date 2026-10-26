import type { Schedule } from '../../types/domain'
import type { ValidatedActivityGroup } from '../../data/catalog/contracts'
import { calculateGroupCosts } from './cost'
import type { ScheduledActivity } from './types'

/** All inputs are normalized. Work exclusively in local weekly HH:mm values. */
export const timeToMinutes = (time: string): number => Number(time.slice(0, 2)) * 60 + Number(time.slice(3, 5))

export function getWeeklySessions(groups: readonly ValidatedActivityGroup[], schedules: readonly Schedule[]): ScheduledActivity[] {
  const byId = new Map(calculateGroupCosts(groups, schedules).map(group => [group.id, group]))
  return schedules.flatMap(session => {
    const group = byId.get(session.groupId)
    return group ? [{ group, session }] : []
  }).sort((a, b) => a.session.weekday - b.session.weekday || a.session.startTime.localeCompare(b.session.startTime))
}

export function intervalsOverlap(a: Schedule, b: Schedule): boolean {
  return a.weekday === b.weekday && a.startTime < b.endTime && b.startTime < a.endTime
}

/** Enumerate session pairs once; every session participates, not just
 * neighboring rows or the first weekly session of each group.
 */
export function weeklyPairs(sessions: readonly ScheduledActivity[]): [ScheduledActivity, ScheduledActivity][] {
  return sessions.flatMap((first, index) => sessions.slice(index + 1)
    .filter(second => first.session.weekday === second.session.weekday)
    .map(second => [first, second] as [ScheduledActivity, ScheduledActivity]))
}
