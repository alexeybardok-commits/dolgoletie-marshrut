import { describe, expect, it } from 'vitest'
import { preferencesToFilters } from '../helpSelect'
import { TIME_PERIODS } from '../filter'
import type { SelectionPreferences } from '../../../types/domain'

const answers: SelectionPreferences = { directionIds: ['art'], areaIds: ['Кировский'], preferredPeriod: 'any', preferredFormat: 'online', monthlyBudget: 5000 }

describe('FE-020 Help Select to ordinary filters', () => {
  it.each(['morning', 'day', 'evening'] as const)('maps %s to the exact inclusive start-time bounds', preferredPeriod => {
    expect(preferencesToFilters({ ...answers, preferredPeriod })).toMatchObject({ ...TIME_PERIODS[preferredPeriod], directionIds: ['art'], areaIds: ['Кировский'], weekdays: [], preferredFormat: 'online', monthlyBudget: 5000 })
  })
  it('does not restrict days or times for any period', () => {
    expect(preferencesToFilters(answers)).toMatchObject({ weekdays: [], timeFrom: null, timeTo: null })
  })
  it.each([0, 2000, 5000, 10000, null] as const)('preserves budget %s, including free and unlimited', monthlyBudget => {
    expect(preferencesToFilters({ ...answers, monthlyBudget }).monthlyBudget).toBe(monthlyBudget)
  })
  it('does not share mutable arrays with the temporary form', () => {
    const filters = preferencesToFilters(answers)
    filters.directionIds.push('walking')
    filters.areaIds.push('Академический')
    expect(answers.directionIds).toEqual(['art'])
    expect(answers.areaIds).toEqual(['Кировский'])
  })
})
