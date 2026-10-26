import { describe, expect, it } from 'vitest'
import { matchesAccessibility } from '../additionalFilters'
import { emptyCatalogFilters, filterCatalog } from '../filter'
import type { AccessibilityFilter, CatalogFilters } from '../types'
import { normalizeCatalog } from '../../../data/catalog/normalize'
import { catalog, demo, group, session } from './fixtures'

describe('FE-024 additional filters', () => {
  const values = [true, false, null, undefined]
  const selections: AccessibilityFilter[] = ['any', 'yes', 'no', 'unknown']
  it.each(values.flatMap(value => selections.map(selection => [value, selection] as const)))('accessibility value %s with %s', (value, selection) => {
    const expected = selection === 'any' || (selection === 'yes' && value === true) || (selection === 'no' && value === false) || (selection === 'unknown' && value == null)
    expect(matchesAccessibility(value, selection)).toBe(expected)
  })
  it('does not treat unknown/null or missing elevator as confirmed no', () => {
    const result = filterCatalog(demo, { ...emptyCatalogFilters(), elevator: 'no' })
    expect(result.map(g => g.id)).toEqual(['group-art', 'group-gap29', 'group-online', 'group-budget'])
    const unknown = filterCatalog(demo, { ...emptyCatalogFilters(), elevator: 'unknown' })
    expect(unknown.map(g => g.id)).toEqual(['group-walk', 'group-online', 'group-budget'])
  })
  it('filters both physical accessibility fields through AND, without excluding online', () => {
    expect(filterCatalog(demo, { ...emptyCatalogFilters(), elevator: 'yes', stepFreeEntrance: 'yes' }).map(g => g.id)).toEqual(['group-online', 'group-budget'])
    expect(filterCatalog(demo, { ...emptyCatalogFilters(), elevator: 'yes', stepFreeEntrance: 'unknown' }).map(g => g.id)).toEqual(['group-gap30', 'group-online', 'group-hybrid', 'group-budget'])
  })
  it.each(selections.flatMap(elevator => selections.map(stepFreeEntrance => [elevator, stepFreeEntrance] as const)))('pure online survives %s elevator and %s step-free selection', (elevator, stepFreeEntrance) => {
    const result = filterCatalog(demo, { ...emptyCatalogFilters(), elevator, stepFreeEntrance })
    expect(result.some(g => g.id === 'group-online')).toBe(true)
    expect(result.some(g => g.id === 'group-budget')).toBe(true)
  })
  it('ORs selected levels and loads internally, ANDs the two groups', () => {
    const groups = [group('a', { skillLevel: 'Уровень А', physicalLoad: 'Нагрузка А' }), group('b', { skillLevel: 'Уровень Б', physicalLoad: 'Нагрузка Б' }), group('c', { skillLevel: 'Уровень В', physicalLoad: 'Нагрузка А' })]
    const data = catalog(groups, groups.map(g => session(`s-${g.id}`, g.id)))
    expect(filterCatalog(data, { ...emptyCatalogFilters(), skillLevels: ['Уровень Б', 'Уровень А'], physicalLoads: ['Нагрузка А'] }).map(g => g.id)).toEqual(['a'])
    expect(filterCatalog(data, { ...emptyCatalogFilters(), skillLevels: ['Уровень Б'], physicalLoads: ['Нагрузка А', 'Нагрузка Б'] }).map(g => g.id)).toEqual(['b'])
  })
  it('combines search and every Must filter with the additional fields', () => {
    const groups = [group('target', { title: 'Искомый маркер', directionIds: ['art'], venueId: 'venue-b', priceType: 'monthly', priceAmount: 2000, skillLevel: 'Уровень А', physicalLoad: 'Нагрузка А' })]
    const data = catalog(groups, [session('s', 'target')])
    const filters: CatalogFilters = { ...emptyCatalogFilters(), query: 'маркер', directionIds: ['art'], areaIds: ['Кировский'], weekdays: [1], timeFrom: '09:00', timeTo: '11:00', preferredFormat: 'offline', monthlyBudget: 2000, skillLevels: ['Уровень А'], physicalLoads: ['Нагрузка А'], elevator: 'no', stepFreeEntrance: 'no' }
    expect(filterCatalog(data, filters).map(g => g.id)).toEqual(['target'])
    const mismatches: Partial<CatalogFilters>[] = [{ query: 'несуществующий' }, { directionIds: ['walking'] }, { areaIds: ['Академический'] }, { weekdays: [2] }, { timeFrom: '12:00' }, { preferredFormat: 'online' }, { monthlyBudget: 0 }, { skillLevels: ['Уровень Б'] }, { physicalLoads: ['Нагрузка Б'] }, { elevator: 'unknown' }, { stepFreeEntrance: 'yes' }]
    for (const mismatch of mismatches) expect(filterCatalog(data, { ...filters, ...mismatch })).toHaveLength(0)
  })
  it('missing required levels/loads are rejected by normalization, never guessed', () => {
    for (const field of ['skillLevel', 'physicalLoad']) {
      const input = { ...demo, groups: [{ ...demo.groups[0], [field]: undefined }] }
      expect(normalizeCatalog(input).data.groups).toHaveLength(0)
    }
  })
  it('does not add an enrollmentStatus filter or change the Must defaults', () => {
    const filters = emptyCatalogFilters()
    expect('enrollmentStatus' in filters).toBe(false)
    expect(filterCatalog(demo, filters)).toHaveLength(7)
    expect(filters.monthlyBudget).toBeNull()
  })
})
