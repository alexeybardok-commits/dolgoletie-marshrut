import directions from './demo/directions.json'
import organizers from './demo/organizers.json'
import venues from './demo/venues.json'
import instructors from './demo/instructors.json'
import groups from './demo/groups.json'
import schedules from './demo/schedules.json'
import { normalizeCatalog } from './normalize'
import type { CatalogNormalizationResult } from './contracts'

export type { CatalogData, CatalogDiagnostic, CatalogNormalizationResult, ValidatedActivityGroup } from './contracts'
export { normalizeCatalog } from './normalize'

/** Local ingestion only. UI is intentionally not migrated in FE-006/007.
 * A fresh snapshot prevents consumers from corrupting another caller's data.
 * No fetch, API, storage writes, filtering, ranking or cost calculation.
 */
export function getCatalogData(): CatalogNormalizationResult {
  const result = normalizeCatalog({ directions, organizers, venues, instructors, groups, schedules })
  if (import.meta.env?.DEV) {
    for (const diagnostic of result.diagnostics) console.warn('[catalog]', diagnostic)
  }
  return result
}
