import type { ActivityGroup, Direction, Instructor, Organizer, Schedule, Venue } from '../../types/domain'

/** Ingestion projection, not a second domain model. FE-008 must enrich these
 * validated inputs with estimatedMonthlyCost before they become ActivityGroup.
 * Distributing Omit preserves the venue/format discriminated union.
 */
type WithoutDerivedCost<T> = T extends ActivityGroup ? Omit<T, 'estimatedMonthlyCost'> : never
export type ValidatedActivityGroup = WithoutDerivedCost<ActivityGroup>

export interface RawCatalogData {
  directions: unknown
  organizers: unknown
  venues: unknown
  instructors: unknown
  groups: unknown
  schedules: unknown
}

export interface CatalogData {
  directions: readonly Direction[]
  organizers: readonly Organizer[]
  venues: readonly Venue[]
  instructors: readonly Instructor[]
  groups: readonly ValidatedActivityGroup[]
  schedules: readonly Schedule[]
}

export type CollectionName = keyof RawCatalogData
export interface CatalogDiagnostic {
  severity: 'error' | 'warning'
  collection: CollectionName
  index?: number
  id?: string
  field?: string
  code: 'collection' | 'shape' | 'duplicate-id' | 'reference' | 'schedule' | 'consistency' | 'derived-cost-ignored' | 'not-applicable'
  message: string
}

export interface CollectionStats {
  input: number
  valid: number
  excluded: number
}

export interface CatalogNormalizationResult {
  data: CatalogData
  diagnostics: readonly CatalogDiagnostic[]
  stats: Record<CollectionName, CollectionStats>
}
