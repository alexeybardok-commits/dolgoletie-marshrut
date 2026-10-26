/** Transient UI event context, never part of ActivityPlan or localStorage. */
export interface AdditionContext {
  activityId: string
  sequence: number
}

export function confirmedActivityId(state: unknown, recent: AdditionContext | null, activityIds: readonly string[]): string | null {
  if (!state || typeof state !== 'object' || !recent) return null
  const value = state as Record<string, unknown>
  return value.activityId === recent.activityId && value.sequence === recent.sequence && activityIds.includes(recent.activityId)
    ? recent.activityId : null
}
