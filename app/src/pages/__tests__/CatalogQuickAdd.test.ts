import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { MemoryRouter } from 'react-router-dom'
import { expect, it } from 'vitest'
import ActivityCard from '../../components/activities/ActivityCard'
import { demo } from '../../utils/business/__tests__/fixtures'

for (const selected of [false, true]) {
  it(`catalog card preserves details and renders shared selection state: ${selected}`, () => {
    const group = { ...demo.groups.find(group => group.id === 'group-walk')!, estimatedMonthlyCost: 4000 }
    const html = renderToStaticMarkup(createElement(MemoryRouter, null, createElement(ActivityCard, { group, data: demo, selected, onAdd: () => {} })))
    expect(html).toContain('href="/activities/group-walk"')
    expect(html).toContain('Подробнее')
    expect(html).toContain('aria-live="polite"')
    expect(html).toContain(`aria-label="${selected ? 'В плане ✓' : 'Добавить в план'}: ${group.title}"`)
    expect(html.includes('disabled=""')).toBe(selected)
    expect(html).not.toContain(selected ? '>Добавить в план</button>' : '>В плане ✓</button>')
  })
}
