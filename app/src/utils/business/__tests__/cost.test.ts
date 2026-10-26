import { describe, expect, it } from 'vitest'
import { calculateCatalogCosts, calculateMonthlyCost } from '../cost'
import { normalizeCatalog } from '../../../data/catalog/normalize'
import { demo, group, rawDemo, session } from './fixtures'

describe('FE-008 monthly cost', () => {
  it.each([
    ['free', 0, 0], ['perLesson', 500, 4000], ['monthly', 2500, 2500],
  ] as const)('%s tariff', (priceType, priceAmount, expected) => {
    expect(calculateMonthlyCost(group('g', { priceType, priceAmount }), [session('s1', 'g'), session('s2', 'g', 3)])).toBe(expected)
  })

  it('uses the actual number of group sessions, not cached lessonsPerWeek or other groups', () => {
    expect(calculateMonthlyCost(group('g', { priceAmount: 500, lessonsPerWeek: 99 }), [session('s1', 'g'), session('s2', 'g', 4), session('other', 'other')])).toBe(4000)
  })

  it('calculates full ActivityGroup records without mutating the normalized snapshot', () => {
    const before = structuredClone(demo)
    const result = calculateCatalogCosts(demo)
    expect(result.groups.find(g => g.id === 'group-walk')?.estimatedMonthlyCost).toBe(4000)
    expect(result.groups.find(g => g.id === 'group-budget')?.estimatedMonthlyCost).toBe(12000)
    expect(result.groups.map(g => g.id)).toEqual(demo.groups.map(g => g.id))
    expect(demo).toEqual(before)
    expect('estimatedMonthlyCost' in demo.groups[0]).toBe(false)
  })

  it.each([0, -999, 999999])('ignores monthly cost %s from raw JSON end to end', cached => {
    const raw = structuredClone(rawDemo)
    const normalized = normalizeCatalog({ ...raw, groups: raw.groups.map(g => ({ ...g, estimatedMonthlyCost: cached })) })
    expect(normalized.diagnostics.some(d => d.code === 'derived-cost-ignored')).toBe(true)
    expect(calculateCatalogCosts(normalized.data)).toEqual(calculateCatalogCosts(demo))
  })

  it('rejects malformed numbers and invalid sessions in normalization before costing', () => {
    const raw = structuredClone(rawDemo)
    raw.groups[0].priceAmount = -1
    raw.schedules[5].startTime = '24:00'
    const normalized = normalizeCatalog(raw)
    const result = calculateCatalogCosts(normalized.data)
    expect(result.groups.some(g => g.id === 'group-walk')).toBe(false)
    expect(result.groups.some(g => g.id === 'group-online')).toBe(false)
    expect(result.groups.some(g => g.id === 'group-art')).toBe(true)
  })
})
