import type { ActivityGroup, Venue } from '../../types/domain'

/** Stable partition of an already filtered catalog. Does not remove records or
 * rank districts against each other. Input array order is the JSON order.
 */
export function orderCatalog(groups: readonly ActivityGroup[], venues: readonly Venue[], areaIds: readonly string[]): ActivityGroup[] {
  if (!areaIds.length) return [...groups]
  const matchingVenues = new Set(venues.filter(venue => areaIds.includes(venue.area)).map(venue => venue.id))
  const local: ActivityGroup[] = []
  const remaining: ActivityGroup[] = []
  for (const group of groups) {
    if (group.activityFormat !== 'online' && matchingVenues.has(group.venueId)) local.push(group)
    else remaining.push(group)
  }
  return [...local, ...remaining]
}
