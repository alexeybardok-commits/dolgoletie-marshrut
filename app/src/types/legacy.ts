/** Temporary contracts for the existing one-time-event UI.
 * These are NOT ActivityGroup/SelectionPreferences from the baseline.
 * Kept separate until data and business-rule migration is authorized.
 */
export interface LegacyActivity {
  id: number
  title: string
  category: string
  district: string
  date: string
  time: string
  duration: number
  price: number
  address: string
  description: string
  conditions: string
}

export interface LegacyPreferences {
  interests: string[]
  district: string
  dateFrom: string
  dateTo: string
  maxPrice: string
  distance: string
}

export interface LegacySelectionProps {
  selectedIds: number[]
  onToggle: (id: number) => void
}
