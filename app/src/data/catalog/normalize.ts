import { ActivityFormat, ActivityStatus, EnrollmentStatus, EntryPolicy, PriceType, ProgramModel } from '../../types/domain'
import type { Direction, Instructor, OnlineDetails, Organizer, Schedule, Venue } from '../../types/domain'
import type { CatalogDiagnostic, CatalogNormalizationResult, CollectionName, RawCatalogData, ValidatedActivityGroup } from './contracts'

type Rule = (value: unknown) => boolean
type Schema<T> = { [K in keyof T]-?: Rule }
type Row<T> = { value: T; index: number }
const isRecord = (value: unknown): value is Record<string, unknown> => value !== null && typeof value === 'object' && !Array.isArray(value)
const text: Rule = value => typeof value === 'string' && value.trim().length > 0
const bool: Rule = value => typeof value === 'boolean'
const nonnegative: Rule = value => typeof value === 'number' && Number.isFinite(value) && value >= 0
const integer: Rule = value => nonnegative(value) && Number.isSafeInteger(value)
const optional = (rule: Rule): Rule => value => value === undefined || rule(value)
const nullable = (rule: Rule): Rule => value => value === null || rule(value)
const optionalText = optional(nullable(text))
const strings: Rule = value => Array.isArray(value) && value.every(item => text(item)) && new Set(value).size === value.length
const oneOf = (values: readonly unknown[]): Rule => value => values.includes(value)
const date: Rule = value => typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value) && Number.isFinite(Date.parse(value)) && new Date(value).toISOString().slice(0, 10) === value
const timestamp: Rule = value => date(value) || (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})$/.test(value) && date(value.slice(0, 10)) && Number.isFinite(Date.parse(value)))
const time: Rule = value => typeof value === 'string' && /^(?:[01]\d|2[0-3]):[0-5]\d$/.test(value)
const webUrl: Rule = value => {
  if (typeof value !== 'string') return false
  try { return ['https:', 'http:'].includes(new URL(value).protocol) } catch { return false }
}
const contactUrl: Rule = value => webUrl(value) || (typeof value === 'string' && /^mailto:[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value))

const directionSchema: Schema<Direction> = { id: text, name: text, parentId: optionalText, description: optionalText, active: bool, sortOrder: integer }
const organizerSchema: Schema<Organizer> = { id: text, name: text, type: text, description: optionalText, website: optional(nullable(webUrl)), phone: optionalText, contactLink: optional(nullable(contactUrl)), verificationStatus: text }
const venueSchema: Schema<Venue> = { id: text, name: text, area: text, address: text, landmark: optionalText, floor: optionalText, elevator: optional(nullable(bool)), stepFreeEntrance: optional(nullable(bool)), accessibilityNotes: optionalText }
const instructorSchema: Schema<Instructor> = { id: text, name: text, photo: optionalText, role: text, shortBio: optionalText, experience: optionalText, qualifications: optionalText }
const onlineSchema: Schema<OnlineDetails> = { platform: optional(text), deviceRequirements: optional(text), connectionInstructions: optional(text), supportContact: optional(text) }
const online: Rule = value => isRecord(value) && Object.entries(onlineSchema).every(([key, rule]) => rule(value[key]))
const groupSchema: Schema<ValidatedActivityGroup> = {
  id: text, title: text, shortDescription: text, description: text, directionIds: value => strings(value) && (value as string[]).length > 0,
  tags: strings, activityFormat: oneOf(Object.values(ActivityFormat)), programModel: oneOf(Object.values(ProgramModel)),
  skillLevel: text, physicalLoad: text, participationConditions: optional(text), organizerId: text, venueId: optionalText,
  instructorIds: strings, activityStatus: oneOf(Object.values(ActivityStatus)), enrollmentStatus: oneOf(Object.values(EnrollmentStatus)),
  entryPolicy: oneOf(Object.values(EntryPolicy)), nextEntryDate: optional(nullable(date)), capacity: optional(nullable(integer)),
  availablePlaces: optional(nullable(integer)), priceType: oneOf(Object.values(PriceType)), priceAmount: nonnegative,
  currency: oneOf(['RUB']), lessonsPerWeek: value => integer(value) && Number(value) > 0,
  source: text, lastUpdatedAt: timestamp, onlineDetails: optional(online),
}
const scheduleSchema: Schema<Schedule> = { id: text, groupId: text, weekday: oneOf([1, 2, 3, 4, 5, 6, 7]), startTime: time, endTime: time }

/** Never mutates input; malformed records and their dependent records are isolated.
 * Duplicate IDs are all rejected, rather than arbitrarily trusting the first one.
 * Unknown fields are not copied. The source order of retained records is stable.
 */
export function normalizeCatalog(input: unknown): CatalogNormalizationResult {
  const source = isRecord(input) ? input : {}
  const raw: RawCatalogData = { directions: source.directions, organizers: source.organizers, venues: source.venues, instructors: source.instructors, groups: source.groups, schedules: source.schedules }
  const diagnostics: CatalogDiagnostic[] = []
  function error(collection: CollectionName, row: Row<{ id: string }>, code: CatalogDiagnostic['code'], message: string, field?: string) {
    diagnostics.push({ severity: 'error', collection, index: row.index, id: row.value.id, code, message, field })
  }

  function parse<T extends { id: string }>(collection: CollectionName, schema: Schema<T>): Row<T>[] {
    const input = raw[collection]
    if (!Array.isArray(input)) {
      diagnostics.push({ severity: 'error', collection, code: 'collection', message: 'Expected a JSON array.' })
      return []
    }
    const counts = new Map<string, number>()
    for (const value of input) if (isRecord(value) && typeof value.id === 'string') counts.set(value.id, (counts.get(value.id) ?? 0) + 1)
    return input.flatMap((value: unknown, index): Row<T>[] => {
      if (!isRecord(value)) {
        diagnostics.push({ severity: 'error', collection, index, code: 'shape', message: 'Expected an object.' })
        return []
      }
      const badFields = Object.entries<Rule>(schema).filter(([key, rule]) => !rule(value[key])).map(([key]) => key)
      if (badFields.length) {
        for (const field of badFields) diagnostics.push({ severity: 'error', collection, index, id: typeof value.id === 'string' ? value.id : undefined, field, code: 'shape', message: `Invalid or missing field: ${field}.` })
        return []
      }
      if ((counts.get(value.id as string) ?? 0) > 1) {
        diagnostics.push({ severity: 'error', collection, index, id: value.id as string, field: 'id', code: 'duplicate-id', message: 'All records with this duplicate ID are excluded.' })
        return []
      }
      // Every copied field has passed its schema; cross-record rules follow below.
      const parsed = Object.fromEntries(Object.keys(schema).filter(key => value[key] !== undefined).map(key => [key, structuredClone(value[key])])) as T
      return [{ value: parsed, index }]
    })
  }

  let directions = parse<Direction>('directions', directionSchema)
  const organizers = parse<Organizer>('organizers', organizerSchema)
  const venues = parse<Venue>('venues', venueSchema)
  const instructors = parse<Instructor>('instructors', instructorSchema)
  let groups = parse<ValidatedActivityGroup>('groups', groupSchema)
  let schedules = parse<Schedule>('schedules', scheduleSchema)

  // Reject parent cycles as well as dangling parents, then cascade orphan removal.
  const initialDirections = new Map(directions.map(row => [row.value.id, row.value]))
  directions = directions.filter(row => {
    const visited = new Set<string>()
    let current: Direction | undefined = row.value
    while (current) {
      if (visited.has(current.id)) {
        error('directions', row, 'reference', 'Direction parent chain contains a cycle.', 'parentId')
        return false
      }
      visited.add(current.id)
      if (!current.parentId) return true
      current = initialDirections.get(current.parentId)
      if (!current) {
        error('directions', row, 'reference', 'Direction parent does not exist.', 'parentId')
        return false
      }
    }
    return true
  })
  const ids = <T extends { id: string }>(rows: Row<T>[]) => new Set(rows.map(row => row.value.id))
  const directionIds = ids(directions), organizerIds = ids(organizers), venueIds = ids(venues), instructorIds = ids(instructors)
  groups = groups.filter(row => {
    const g = row.value
    const issues: [string, string][] = []
    if (!g.directionIds.every(id => directionIds.has(id))) issues.push(['directionIds', 'Unknown direction reference.'])
    if (!organizerIds.has(g.organizerId)) issues.push(['organizerId', 'Unknown organizer reference.'])
    if (!g.instructorIds.every(id => instructorIds.has(id))) issues.push(['instructorIds', 'Unknown instructor reference.'])
    if ((g.activityFormat !== 'online' && !g.venueId) || (g.venueId && !venueIds.has(g.venueId))) issues.push(['venueId', 'Offline/hybrid requires an existing venue; any supplied venue reference must exist.'])
    if (g.capacity != null && g.availablePlaces != null && g.availablePlaces > g.capacity) issues.push(['availablePlaces', 'Available places exceed capacity.'])
    if (g.priceType === 'free' && g.priceAmount !== 0) issues.push(['priceAmount', 'Free groups must have zero priceAmount.'])
    for (const [field, message] of issues) error('groups', row, field.endsWith('Id') || field.endsWith('Ids') ? 'reference' : 'consistency', message, field)
    if (issues.length) return false
    if (g.onlineDetails) {
      if (g.activityFormat === 'offline') {
        delete g.onlineDetails
        diagnostics.push({ severity: 'warning', collection: 'groups', index: row.index, id: g.id, field: 'onlineDetails', code: 'not-applicable', message: 'Offline onlineDetails omitted as not applicable.' })
      } else {
        // Copy applicable known optional fields only; missing details stay unknown.
        g.onlineDetails = Object.fromEntries(Object.keys(onlineSchema).filter(key => g.onlineDetails?.[key as keyof OnlineDetails] !== undefined).map(key => [key, g.onlineDetails?.[key as keyof OnlineDetails]]))
      }
    }
    const original = (raw.groups as unknown[])[row.index]
    if (isRecord(original) && 'estimatedMonthlyCost' in original) diagnostics.push({ severity: 'warning', collection: 'groups', index: row.index, id: g.id, field: 'estimatedMonthlyCost', code: 'derived-cost-ignored', message: 'Source monthly cost ignored. FE-008 must derive it from priceType, priceAmount and valid sessions.' })
    return true
  })
  const groupIds = ids(groups)
  schedules = schedules.filter(row => {
    if (!groupIds.has(row.value.groupId)) {
      error('schedules', row, 'reference', 'Schedule group is missing or invalid.', 'groupId')
      return false
    }
    if (row.value.startTime >= row.value.endTime) {
      error('schedules', row, 'schedule', 'startTime must be strictly before endTime.', 'startTime')
      return false
    }
    return true
  })
  const sessionCounts = new Map<string, number>()
  for (const row of schedules) sessionCounts.set(row.value.groupId, (sessionCounts.get(row.value.groupId) ?? 0) + 1)
  groups = groups.filter(row => {
    const count = sessionCounts.get(row.value.id) ?? 0
    if (row.value.lessonsPerWeek === count) return true
    error('groups', row, 'consistency', `lessonsPerWeek=${row.value.lessonsPerWeek}, valid Schedule sessions=${count}.`, 'lessonsPerWeek')
    return false
  })
  const finalIds = ids(groups)
  schedules = schedules.filter(row => {
    if (finalIds.has(row.value.groupId)) return true
    error('schedules', row, 'reference', 'Group excluded after Schedule consistency check.', 'groupId')
    return false
  })

  const values = <T>(rows: Row<T>[]) => rows.map(row => row.value)
  const data = { directions: values(directions), organizers: values(organizers), venues: values(venues), instructors: values(instructors), groups: values(groups), schedules: values(schedules) }
  const stats = Object.fromEntries((Object.keys(data) as CollectionName[]).map(key => {
    const input = Array.isArray(raw[key]) ? raw[key].length : 0
    return [key, { input, valid: data[key].length, excluded: input - data[key].length }]
  })) as CatalogNormalizationResult['stats']
  return { data, diagnostics, stats }
}
