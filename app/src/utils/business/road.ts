import type { Schedule } from '../../types/domain'
import type { ValidatedActivityGroup } from '../../data/catalog/contracts'
import { getWeeklySessions, intervalsOverlap, timeToMinutes, weeklyPairs } from './schedule'
import type { RoadWarning } from './types'

export function findRoadWarnings(groups: readonly ValidatedActivityGroup[], schedules: readonly Schedule[]): RoadWarning[] {
  return weeklyPairs(getWeeklySessions(groups, schedules)).flatMap(([first, second]): RoadWarning[] => {
    if (first.group.activityFormat !== 'offline' || second.group.activityFormat !== 'offline') return []
    if (first.group.venueId === second.group.venueId || intervalsOverlap(first.session, second.session)) return []
    const gapMinutes = timeToMinutes(second.session.startTime) - timeToMinutes(first.session.endTime)
    return gapMinutes >= 0 && gapMinutes < 30 ? [{ kind: 'road-warning', first, second, gapMinutes }] : []
  })
}
