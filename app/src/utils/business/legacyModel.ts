import rawActivities from '../../data/activities.json'
import type { LegacyActivity, LegacyPreferences } from '../../types/legacy'

const activities: LegacyActivity[] = rawActivities

export { activities }
export const categories = [...new Set(activities.map(item => item.category))]
export const districts = [...new Set(activities.map(item => item.district))]
export const emptyPreferences: LegacyPreferences = { interests: [], district: '', dateFrom: '', dateTo: '', maxPrice: '', distance: '' }

function validDate(value: unknown): value is string {
  return typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(Date.parse(value)) && new Date(value).toISOString().slice(0, 10) === value
}

export function validatePreferences(value: unknown): LegacyPreferences {
  const result = { ...emptyPreferences }
  if (!value || typeof value !== 'object' || Array.isArray(value)) return result
  const saved = value as Record<string, unknown>
  result.interests = Array.isArray(saved.interests) ? categories.filter(category => (saved.interests as unknown[]).includes(category)) : []
  result.district = typeof saved.district === 'string' && districts.includes(saved.district) ? saved.district : ''
  for (const key of ['dateFrom', 'dateTo'] as const) result[key] = validDate(saved[key]) ? saved[key] : ''
  if (result.dateFrom > result.dateTo && result.dateTo) result.dateTo = ''
  result.maxPrice = typeof saved.maxPrice === 'string' && /^\d+$/.test(saved.maxPrice) && Number.isSafeInteger(Number(saved.maxPrice)) ? saved.maxPrice : ''
  result.distance = typeof saved.distance === 'string' && ['До 1 км', 'До 3 км', 'До 5 км', 'Не принципиально'].includes(saved.distance) ? saved.distance : ''
  return result
}

export function validatePlan(value: unknown): number[] {
  if (!Array.isArray(value)) return []
  const items = [...new Set(value)].map(id => activities.find(item => item.id === id)).filter((item): item is LegacyActivity => item !== undefined)
  return items.filter(item => item.date.slice(0, 7) === items[0].date.slice(0, 7)).slice(0, 4).map(item => item.id)
}

export function matchesFilters(item: LegacyActivity, filters: LegacyPreferences) {
  return (!filters.interests.length || filters.interests.includes(item.category)) &&
    (!filters.district || item.district === filters.district) &&
    (!filters.dateFrom || item.date >= filters.dateFrom) &&
    (!filters.dateTo || item.date <= filters.dateTo) &&
    (filters.maxPrice === '' || item.price <= Number(filters.maxPrice))
}

/** Existing behavior, retained until the baseline business-rule stage. */
export function toggleLegacyActivity(previous: number[], id: number): number[] {
  if (previous.includes(id)) return previous.filter(item => item !== id)
  const activity = activities.find(item => item.id === id)
  if (!activity || previous.length >= 4) return previous
  const first = activities.find(item => item.id === previous[0])
  if (first && first.date.slice(0, 7) !== activity.date.slice(0, 7)) return previous
  return [...previous, id]
}

export const legacyTotal = (items: LegacyActivity[]) => items.reduce((sum, item) => sum + item.price, 0)

export const money = (value: number) => value === 0 ? 'Бесплатно' : `${value.toLocaleString('ru-RU')} ₽`
export const dateLabel = (date: string) => new Intl.DateTimeFormat('ru-RU', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'Asia/Yekaterinburg' }).format(new Date(`${date}T12:00:00+05:00`))
export const startTime = (item: LegacyActivity) => Date.parse(`${item.date}T${item.time}:00+05:00`)
export const sortedPlan = (ids: number[]) => activities.filter(item => ids.includes(item.id)).sort((a, b) => startTime(a) - startTime(b))
export function conflicts(items: LegacyActivity[]) {
  return items.flatMap((a, index) => items.slice(index + 1).filter(b => startTime(a) < startTime(b) + b.duration * 60000 && startTime(b) < startTime(a) + a.duration * 60000).map(b => `${a.title} и ${b.title}: ${dateLabel(a.date)}, ${a.time} / ${b.time}`))
}
