import { describe, expect, it } from 'vitest'
import { normalizeCatalog } from '../../../data/catalog/normalize'
import { createCatalogSearch, normalizeSearchQuery } from '../search'
import { emptyCatalogFilters, filterCatalog } from '../filter'
import { orderCatalog } from '../order'
import { demo, group, session, deepFreeze } from './fixtures'

const raw = {
  ...demo,
  directions: demo.directions.map(direction => direction.id === 'art' ? { ...direction, name: 'Азуритнаправление' } : direction),
  instructors: demo.instructors.map(instructor => instructor.id === 'instructor-a' ? { ...instructor, name: 'Бирюзапреподаватель' } : instructor),
  organizers: demo.organizers.map(organizer => organizer.id === 'demo-project' ? { ...organizer, name: 'Изумрудорганизатор' } : organizer),
  venues: demo.venues.map(venue => venue.id === 'venue-a' ? { ...venue, name: 'Рубинплощадка', address: 'Учебный Ониксадрес', area: 'Сапфиррайон', landmark: 'Топазориентир' } : venue),
  groups: [group('target', { title: 'Кедровыймаркер', description: 'Нефритописание', directionIds: ['art'], lessonsPerWeek: 1 })],
  schedules: [session('s', 'target')],
}
const data = normalizeCatalog(raw).data

describe('FE-023 local text search', () => {
  it.each(['Кедровыймаркер', 'Нефритописание', 'Азуритнаправление', 'Бирюзапреподаватель', 'Изумрудорганизатор', 'Рубинплощадка', 'Ониксадрес', 'Сапфиррайон', 'Топазориентир'])('finds the group by text field %s', query => {
    expect(filterCatalog(data, { ...emptyCatalogFilters(), query }).map(g => g.id)).toEqual(['target'])
  })
  it('normalizes case, whitespace and control characters and ANDs words across fields', () => {
    expect(filterCatalog(data, { ...emptyCatalogFilters(), query: '  КЕДРОВЫЙМАРКЕР\n\t САПФИРРАЙОН\u200b' })).toHaveLength(1)
    expect(filterCatalog(data, { ...emptyCatalogFilters(), query: 'Кедровыймаркер отсутствующийтокен' })).toHaveLength(0)
    expect(normalizeSearchQuery('  ЁЛКА\t ＣＬＵＢ  ')).toBe('елка club')
  })
  it.each(['', '  \n\t ', '\u0000\u200b'])('treats empty query %j as unrestricted', query => {
    expect(filterCatalog(demo, { ...emptyCatalogFilters(), query })).toEqual(filterCatalog(demo, emptyCatalogFilters()))
  })
  it.each([null, undefined, 123, false, {}, [], ['ходьба']])('safely ignores non-string query %j', query => {
    expect(normalizeSearchQuery(query)).toBe('')
    expect(createCatalogSearch(demo, query)(demo.groups[0])).toBe(true)
  })
  it.each(['.*[a-z]', '<script>alert(1)</script>', 'несуществующийпоисковыйтекст', '\ud800'])('matches malformed/literal query %j without regex execution or exceptions', query => {
    expect(filterCatalog(demo, { ...emptyCatalogFilters(), query })).toHaveLength(0)
  })
  it('finds online groups by available text and ignores even an explicitly supplied venue', () => {
    const online = normalizeCatalog({ ...raw, groups: [group('online', { title: 'Онлайнмаркер', activityFormat: 'online', venueId: 'venue-a', directionIds: ['art'], lessonsPerWeek: 1 })], schedules: [session('online-session', 'online')] }).data
    for (const query of ['Онлайнмаркер', 'Азуритнаправление', 'Бирюзапреподаватель', 'Изумрудорганизатор']) expect(filterCatalog(online, { ...emptyCatalogFilters(), query })).toHaveLength(1)
    for (const query of ['Рубинплощадка', 'Ониксадрес', 'Сапфиррайон', 'Топазориентир']) expect(filterCatalog(online, { ...emptyCatalogFilters(), query })).toHaveLength(0)
    expect(filterCatalog(demo, { ...emptyCatalogFilters(), query: 'цифровые' }).map(g => g.id)).toEqual(['group-online'])
  })
  it('skips missing venue/landmark fields instead of indexing placeholder text', () => {
    expect(filterCatalog(demo, { ...emptyCatalogFilters(), query: 'Информация отсутствует' })).toHaveLength(0)
    expect(() => filterCatalog(demo, { ...emptyCatalogFilters(), query: 'безрезультата' })).not.toThrow()
  })
  it('keeps active/openNow, monthly cost and stable area order unchanged', () => {
    const filters = { ...emptyCatalogFilters(), query: 'учебная', areaIds: ['Академический'] }
    const result = orderCatalog(filterCatalog(demo, filters), demo.venues, filters.areaIds)
    expect(result.map(g => g.id)).toEqual(['group-gap30', 'group-hybrid', 'group-online', 'group-budget'])
    expect(result.every(g => g.activityStatus === 'active' && g.enrollmentStatus === 'openNow')).toBe(true)
    expect(result.find(g => g.id === 'group-budget')?.estimatedMonthlyCost).toBe(12000)
    expect(filterCatalog(demo, { ...filters, monthlyBudget: 5000 }).some(g => g.id === 'group-budget')).toBe(false)
  })
  it('does not mutate frozen normalized records', () => {
    const before = structuredClone(demo)
    filterCatalog(deepFreeze(demo), { ...emptyCatalogFilters(), query: 'ходьба' })
    expect(demo).toEqual(before)
  })
})
