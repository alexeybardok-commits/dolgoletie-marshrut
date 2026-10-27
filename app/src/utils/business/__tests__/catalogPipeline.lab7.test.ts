import { describe, expect, it } from 'vitest'
import { normalizeCatalog } from '../../../data/catalog/normalize'
import type { CatalogFilters } from '../types'
import { emptyCatalogFilters, filterCatalog } from '../filter'
import { orderCatalog } from '../order'
import { deepFreeze, rawDemo } from './fixtures'

describe('L7-01 normalized catalog pipeline', () => {
  it('combines search, AND/OR filters and same-session time matching before stable ordering', () => {
    // Start with raw JSON, never with already calculated/normalized fixture groups.
    const row = (id: string, overrides: Record<string, unknown> = {}) => ({
      ...rawDemo.groups[0], id, title: 'Учебный каталогмаркер',
      description: 'Тестовая группа, не реальное предложение.',
      directionIds: ['walking'], activityFormat: 'offline', venueId: 'venue-a',
      skillLevel: 'Начальный', physicalLoad: 'Низкая',
      priceType: 'monthly', priceAmount: 2000, lessonsPerWeek: 1,
      ...overrides,
    })
    const groups = [
      row('online-first', { activityFormat: 'online', venueId: null, priceType: 'free', priceAmount: 0 }),
      row('wrong-query', { title: 'Учебная мастерская' }),
      row('hybrid-local', { activityFormat: 'hybrid', venueId: 'venue-b', directionIds: ['art'], priceAmount: 5000 }),
      row('split-session', { lessonsPerWeek: 2 }),
      row('wrong-area', { venueId: 'venue-other-area' }),
      row('offline-local-b', { venueId: 'venue-b', directionIds: ['art'] }),
      row('wrong-direction', { directionIds: ['learning'] }),
      row('offline-local-a', { lessonsPerWeek: 2, priceType: 'perLesson', priceAmount: 500, estimatedMonthlyCost: 1 }),
      row('online-last', { activityFormat: 'online', venueId: null, directionIds: ['art'], priceAmount: 1000 }),
      row('wrong-day'), row('wrong-time'),
      row('wrong-level', { skillLevel: 'Другой уровень' }),
      row('wrong-load', { physicalLoad: 'Другая нагрузка' }),
      row('wrong-elevator', { venueId: 'venue-elevator' }),
      row('unknown-elevator', { venueId: 'venue-unknown' }),
      row('wrong-entrance', { venueId: 'venue-entrance' }),
      row('over-budget', { priceAmount: 5001, estimatedMonthlyCost: 0 }),
      row('paused', { activityStatus: 'paused' }),
      row('closed', { enrollmentStatus: 'closed' }),
      row('invalid-reference', { venueId: 'missing-venue' }),
    ]
    const schedules = groups.flatMap(group => {
      const session = (suffix: string, weekday: number, startTime: string, endTime: string) => ({
        id: `${group.id}-${suffix}`, groupId: group.id, weekday, startTime, endTime,
      })
      if (group.id === 'split-session') return [session('mon', 1, '18:00', '19:00'), session('tue', 2, '10:00', '11:00')]
      if (group.id === 'offline-local-a') return [session('mon', 1, '10:00', '11:00'), session('thu', 4, '11:30', '12:30')]
      if (group.id === 'offline-local-b') return [session('thu', 4, '08:00', '09:00')]
      if (group.id === 'wrong-day') return [session('tue', 2, '10:00', '11:00')]
      if (group.id === 'wrong-time') return [session('mon', 1, '12:00', '13:00')]
      return [session('mon', 1, '10:00', '11:00')]
    })
    const venue = { ...rawDemo.venues[0], elevator: false, stepFreeEntrance: true }
    const raw = deepFreeze({
      ...rawDemo, groups, schedules,
      venues: [
        { ...venue, id: 'venue-a', area: 'Верх-Исетский' },
        { ...venue, id: 'venue-b', area: 'Кировский' },
        { ...venue, id: 'venue-other-area', area: 'Академический' },
        { ...venue, id: 'venue-elevator', elevator: true },
        { ...venue, id: 'venue-unknown', elevator: null },
        { ...venue, id: 'venue-entrance', stepFreeEntrance: false },
      ],
    })
    const normalized = normalizeCatalog(raw)
    expect(normalized.stats.groups).toEqual({ input: 20, valid: 19, excluded: 1 })
    expect(normalized.stats.schedules).toEqual({ input: 22, valid: 21, excluded: 1 })
    expect(normalized.diagnostics).toEqual(expect.arrayContaining([
      expect.objectContaining({ collection: 'groups', id: 'invalid-reference', code: 'reference', field: 'venueId' }),
    ]))
    // All other decoys must survive normalization, so filtering must exclude them.
    expect(normalized.data.groups.map(group => group.id)).toEqual(groups.slice(0, -1).map(group => group.id))
    const filters: CatalogFilters = deepFreeze({
      ...emptyCatalogFilters(), query: '  КАТАЛОГМАРКЕР  ',
      directionIds: ['art', 'walking'], areaIds: ['Кировский', 'Верх-Исетский'],
      weekdays: [1, 4], timeFrom: '08:00', timeTo: '11:59',
      monthlyBudget: 5000, skillLevels: ['Начальный'], physicalLoads: ['Низкая'],
      elevator: 'no', stepFreeEntrance: 'yes',
    })
    const matches = filterCatalog(normalized.data, filters)
    // Literal oracles are independent of the production filtering/ordering code.
    expect(matches.map(group => group.id)).toEqual([
      'online-first', 'hybrid-local', 'offline-local-b', 'offline-local-a', 'online-last',
    ])
    expect(orderCatalog(matches, normalized.data.venues, filters.areaIds).map(group => group.id)).toEqual([
      'hybrid-local', 'offline-local-b', 'offline-local-a', 'online-first', 'online-last',
    ])
    expect(matches.map(group => [group.id, group.estimatedMonthlyCost])).toEqual([
      ['online-first', 0], ['hybrid-local', 5000], ['offline-local-b', 2000],
      ['offline-local-a', 4000], ['online-last', 1000],
    ])
    const online = filterCatalog(normalized.data, { ...filters, preferredFormat: 'online' })
    expect(orderCatalog(online, normalized.data.venues, filters.areaIds).map(group => group.id)).toEqual([
      'hybrid-local', 'online-first', 'online-last',
    ])
    // Neither area selection order nor an absent area priority may reorder peers.
    expect(orderCatalog(matches, normalized.data.venues, [...filters.areaIds].reverse()).map(group => group.id)).toEqual([
      'hybrid-local', 'offline-local-b', 'offline-local-a', 'online-first', 'online-last',
    ])
    expect(orderCatalog(matches, normalized.data.venues, []).map(group => group.id)).toEqual([
      'online-first', 'hybrid-local', 'offline-local-b', 'offline-local-a', 'online-last',
    ])
  })
})
