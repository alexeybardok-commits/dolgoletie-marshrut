import type { ActivityPlan } from '../../types/domain'
import type { ValidatedActivityGroup } from '../../data/catalog/contracts'

/** FE-026: add only an existing regular-group ID; never toggle or cap the plan. */
export function addActivityId(activityIds: readonly string[], id: string, groups: readonly ValidatedActivityGroup[]): ActivityPlan['activityIds'] {
  if (!groups.some(group => group.id === id)) return [...activityIds]
  return [...new Set([...activityIds, id])]
}
