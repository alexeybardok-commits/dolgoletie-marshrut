/** Domain contracts from Development Baseline v1.15, section 9.
 * Referential integrity, unique IDs, valid times and monetary values require
 * runtime normalization in FE-006; these declarations do not validate JSON.
 */
export const ActivityFormat = { Offline: 'offline', Online: 'online', Hybrid: 'hybrid' } as const
export type ActivityFormat = typeof ActivityFormat[keyof typeof ActivityFormat]

export const ProgramModel = { OpenEnded: 'openEnded', RollingModules: 'rollingModules' } as const
export type ProgramModel = typeof ProgramModel[keyof typeof ProgramModel]

export const EntryPolicy = { AnySession: 'anySession', NextModule: 'nextModule' } as const
export type EntryPolicy = typeof EntryPolicy[keyof typeof EntryPolicy]

export const ActivityStatus = { Planned: 'planned', Active: 'active', Paused: 'paused', Completed: 'completed' } as const
export type ActivityStatus = typeof ActivityStatus[keyof typeof ActivityStatus]

export const EnrollmentStatus = { OpenNow: 'openNow', OpenFromDate: 'openFromDate', Waitlist: 'waitlist', Closed: 'closed' } as const
export type EnrollmentStatus = typeof EnrollmentStatus[keyof typeof EnrollmentStatus]

export const PriceType = { Free: 'free', PerLesson: 'perLesson', Monthly: 'monthly' } as const
export type PriceType = typeof PriceType[keyof typeof PriceType]

/** ISO weekday representation: Monday = 1, Sunday = 7. */
export type Weekday = 1 | 2 | 3 | 4 | 5 | 6 | 7
export type PreferredPeriod = 'morning' | 'day' | 'evening' | 'any'
/** offline preference matches offline/hybrid; online matches online/hybrid. */
export type PreferredFormat = 'offline' | 'online' | 'any'

export interface OnlineDetails {
  platform?: string
  deviceRequirements?: string
  connectionInstructions?: string
  supportContact?: string
}

interface ActivityGroupFields {
  id: string
  title: string
  shortDescription: string
  description: string
  directionIds: string[]
  tags: string[]
  programModel: ProgramModel
  // Baseline does not prescribe enum values for these descriptive fields.
  skillLevel: string
  physicalLoad: string
  participationConditions?: string
  organizerId: string
  instructorIds: string[]
  activityStatus: ActivityStatus
  enrollmentStatus: EnrollmentStatus
  entryPolicy: EntryPolicy
  nextEntryDate?: string | null
  capacity?: number | null
  availablePlaces?: number | null
  priceType: PriceType
  priceAmount: number
  currency: 'RUB'
  lessonsPerWeek: number
  /** Derived from priceType, priceAmount and lessonsPerWeek; never trusted input. */
  estimatedMonthlyCost: number
  source: string
  lastUpdatedAt: string
  onlineDetails?: OnlineDetails
}

/** Physical venue is required for offline/hybrid, optional for pure online. */
export type ActivityGroup = ActivityGroupFields & (
  | { activityFormat: 'offline' | 'hybrid'; venueId: string }
  | { activityFormat: 'online'; venueId?: string | null }
)

export interface Direction {
  id: string
  name: string
  parentId?: string | null
  description?: string | null
  active: boolean
  sortOrder: number
}

export interface Organizer {
  id: string
  name: string
  type: string
  description?: string | null
  website?: string | null
  phone?: string | null
  contactLink?: string | null
  verificationStatus: string
}

export interface Venue {
  id: string
  name: string
  area: string
  address: string
  landmark?: string | null
  floor?: string | null
  elevator?: boolean | null
  stepFreeEntrance?: boolean | null
  accessibilityNotes?: string | null
}

export interface Instructor {
  id: string
  name: string
  photo?: string | null
  role: string
  shortBio?: string | null
  experience?: string | null
  qualifications?: string | null
}

export interface Schedule {
  id: string
  groupId: string
  weekday: Weekday
  /** HH:mm; startTime < endTime is checked during normalization. */
  startTime: string
  endTime: string
}

/** Temporary form state. Must not be persisted independently of ActivityPlan. */
export interface SelectionPreferences {
  directionIds: string[]
  areaIds: string[]
  preferredPeriod: PreferredPeriod
  preferredFormat: PreferredFormat
  monthlyBudget: number | null
}

export interface ActivityPlan {
  /** Unique IDs, 0..N. No upper limit; uniqueness is a runtime invariant. */
  activityIds: string[]
  monthlyBudget: number | null
  /** Recomputed from the current normalized catalog on restoration. */
  estimatedMonthlyTotal: number
  createdAt: string
  updatedAt: string
}
