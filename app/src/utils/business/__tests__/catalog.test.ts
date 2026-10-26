import { describe, expect, it } from 'vitest'
import { emptyCatalogFilters, filterCatalog, TIME_PERIODS } from '../filter'
import { orderCatalog } from '../order'
import type { CatalogBudget } from '../types'
import { catalog, deepFreeze, demo, group, session } from './fixtures'

const ids = (groups: readonly { id: string }[]) => groups.map(g => g.id)

describe('FE-009 filters', () => {
  it('includes only active/openNow groups', () => {
    const result = filterCatalog(demo, emptyCatalogFilters())
    expect(result).toHaveLength(7)
    expect(result.every(g => g.activityStatus === 'active' && g.enrollmentStatus === 'openNow')).toBe(true)
  })

  it('AND across direction/area/schedule/format/budget, OR within directions, areas and weekdays', () => {
    const result = filterCatalog(demo, { ...emptyCatalogFilters(), directionIds: ['art', 'walking'], areaIds: ['Кировский', 'Верх-Исетский'], weekdays: [1, 4], ...TIME_PERIODS.morning, preferredFormat: 'offline', monthlyBudget: 5000 })
    expect(ids(result)).toEqual(['group-walk', 'group-art', 'group-gap29'])
    expect(filterCatalog(demo, { ...emptyCatalogFilters(), directionIds: ['art'], areaIds: ['Верх-Исетский'] })).toHaveLength(0)
  })

  it('preserves pure online with no venue for any selected area, but requires matching hybrid/offline venue', () => {
    const result = filterCatalog(demo, { ...emptyCatalogFilters(), areaIds: ['Верх-Исетский'] })
    expect(ids(result)).toEqual(['group-walk', 'group-online', 'group-budget'])
    expect(ids(filterCatalog(demo, { ...emptyCatalogFilters(), areaIds: ['Академический'] }))).toContain('group-hybrid')
  })

  it.each([
    ['offline', ['group-walk', 'group-art', 'group-gap29', 'group-gap30', 'group-hybrid']],
    ['online', ['group-online', 'group-hybrid', 'group-budget']],
  ] as const)('%s preference also matches hybrid', (preferredFormat, expected) => {
    expect(ids(filterCatalog(demo, { ...emptyCatalogFilters(), preferredFormat }))).toEqual(expected)
  })

  const budgets: [CatalogBudget, string[]][] = [
    [0, ['free']], [2000, ['free', 'cheap']], [5000, ['free', 'cheap', 'medium']],
    [10000, ['free', 'cheap', 'medium', 'high']], [null, ['free', 'cheap', 'medium', 'high', 'expensive']],
  ]
  it.each(budgets)('budget %s uses inclusive monthly costs, not cached values', (monthlyBudget, expected) => {
    const groups = [group('free', { priceType: 'free', priceAmount: 0 }), ...[2000, 5000, 10000, 12000].map((priceAmount, i) => group(['cheap', 'medium', 'high', 'expensive'][i], { priceType: 'monthly', priceAmount, estimatedMonthlyCost: 0 }))]
    expect(ids(filterCatalog(catalog(groups, groups.map(g => session(`s-${g.id}`, g.id))), { ...emptyCatalogFilters(), monthlyBudget }))).toEqual(expected)
  })

  it('prices perLesson by every weekly session even if only one session matches time filters', () => {
    expect(ids(filterCatalog(demo, { ...emptyCatalogFilters(), weekdays: [1], monthlyBudget: 2000 }))).not.toContain('group-walk')
  })

  const data = catalog([group('g')], [session('s1', 'g', 1, '11:30', '12:30'), session('s2', 'g', 2, '18:00', '19:00')])
  it('requires day and time to match the same session', () => {
    expect(filterCatalog(data, { ...emptyCatalogFilters(), weekdays: [1], ...TIME_PERIODS.evening })).toHaveLength(0)
    expect(filterCatalog(data, { ...emptyCatalogFilters(), weekdays: [2], ...TIME_PERIODS.evening })).toHaveLength(1)
  })
  it('supports days only, time only and OR days', () => {
    expect(filterCatalog(data, { ...emptyCatalogFilters(), weekdays: [1] })).toHaveLength(1)
    expect(filterCatalog(data, { ...emptyCatalogFilters(), ...TIME_PERIODS.evening })).toHaveLength(1)
    expect(filterCatalog(data, { ...emptyCatalogFilters(), weekdays: [6, 2] })).toHaveLength(1)
    expect(filterCatalog(data, { ...emptyCatalogFilters(), weekdays: [6, 7] })).toHaveLength(0)
  })
  it('assigns 11:30–12:30 to morning only using startTime', () => {
    expect(filterCatalog(data, { ...emptyCatalogFilters(), weekdays: [1], ...TIME_PERIODS.morning })).toHaveLength(1)
    expect(filterCatalog(data, { ...emptyCatalogFilters(), weekdays: [1], ...TIME_PERIODS.day })).toHaveLength(0)
  })
  it.each([
    ['08:00', 'morning'], ['11:59', 'morning'], ['12:00', 'day'], ['16:59', 'day'], ['17:00', 'evening'], ['21:00', 'evening'],
  ] as const)('includes the period boundary %s in %s', (start, period) => {
    const single = catalog([group('g')], [session('s', 'g', 1, start, '22:00')])
    for (const [name, range] of Object.entries(TIME_PERIODS)) expect(filterCatalog(single, { ...emptyCatalogFilters(), ...range })).toHaveLength(name === period ? 1 : 0)
  })
  it.each(['07:59', '21:01'])('does not match out-of-period start %s', start => {
    const single = catalog([group('g')], [session('s', 'g', 1, start, '22:00')])
    for (const range of Object.values(TIME_PERIODS)) expect(filterCatalog(single, { ...emptyCatalogFilters(), ...range })).toHaveLength(0)
  })
  it('supports one-sided and exact inclusive time bounds', () => {
    expect(filterCatalog(data, { ...emptyCatalogFilters(), timeFrom: '18:00' })).toHaveLength(1)
    expect(filterCatalog(data, { ...emptyCatalogFilters(), timeTo: '11:30' })).toHaveLength(1)
    expect(filterCatalog(data, { ...emptyCatalogFilters(), timeFrom: '11:30', timeTo: '11:30' })).toHaveLength(1)
    expect(filterCatalog(data, { ...emptyCatalogFilters(), timeFrom: '19:00' })).toHaveLength(0)
  })
})

describe('FE-010 stable catalog order', () => {
  const groups = [group('online1', { activityFormat: 'online', venueId: null }), group('b', { venueId: 'venue-b' }), group('online2', { activityFormat: 'online', venueId: undefined }), group('a', { venueId: 'venue-a' }), group('hybrid', { activityFormat: 'hybrid', venueId: 'venue-b' })]
  it('preserves original JSON order without a selected area', () => {
    expect(ids(orderCatalog(groups, demo.venues, []))).toEqual(ids(groups))
  })
  it('places matching offline/hybrid before pure online in stable source order', () => {
    const data = catalog(groups, groups.map(g => session(`s-${g.id}`, g.id)))
    const filters = { ...emptyCatalogFilters(), areaIds: ['Кировский'] }
    expect(ids(orderCatalog(filterCatalog(data, filters), demo.venues, filters.areaIds))).toEqual(['b', 'hybrid', 'online1', 'online2'])
  })
  it('treats selected areas equally regardless of their selection order', () => {
    for (const areas of [['Верх-Исетский', 'Кировский'], ['Кировский', 'Верх-Исетский']]) {
      expect(ids(orderCatalog(groups, demo.venues, areas))).toEqual(['b', 'a', 'hybrid', 'online1', 'online2'])
    }
  })
  it('does not mutate deeply frozen groups, filters or catalog data', () => {
    const data = deepFreeze(demo)
    const filters = deepFreeze({ ...emptyCatalogFilters(), areaIds: ['Кировский'] })
    const result = filterCatalog(data, filters)
    const before = [...result]
    orderCatalog(deepFreeze(result), data.venues, filters.areaIds)
    expect(result).toEqual(before)
    expect(filterCatalog(data, filters)).toEqual(result)
  })
})
