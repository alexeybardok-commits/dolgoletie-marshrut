import type { Schedule } from '../../types/domain'
import type { ValidatedActivityGroup } from '../../data/catalog/contracts'
import { getWeeklySessions, intervalsOverlap, weeklyPairs } from './schedule'
import type { TimeConflict } from './types'

export function findTimeConflicts(groups: readonly ValidatedActivityGroup[], schedules: readonly Schedule[]): TimeConflict[] {
  return weeklyPairs(getWeeklySessions(groups, schedules))
    .filter(([first, second]) => intervalsOverlap(first.session, second.session))
    .map(([first, second]) => ({ kind: 'time-conflict', first, second }))
}
