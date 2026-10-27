import { createElement } from 'react'
import type { ReactElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, describe, expect, it, vi } from 'vitest'
import htmlDocument from '../../../index.html?raw'
import App from '../../app/App'
import HelpSelectPage from '../HelpSelectPage'
import CatalogPage from '../CatalogPage'
import ActivityAddedPage from '../ActivityAddedPage'
import MyPlanPage from '../MyPlanPage'
import { aggregatePlan, emptyCatalogFilters } from '../../utils/business'
import { ACTIVITY_PLAN_KEY } from '../../storage/activityPlanStorage'
import { demo } from '../../utils/business/__tests__/fixtures'

afterEach(() => vi.unstubAllGlobals())
const render = (child: ReactElement) => renderToStaticMarkup(createElement(MemoryRouter, null, child))

describe('FE-033–037 semantic UI contracts', () => {
  it('sets Russian document language and project tab title', () => {
    const html = htmlDocument
    expect(html).toContain('<html lang="ru">')
    expect(html).toContain('<title>Долголетие Маршрут</title>')
  })
  it.each(['/', '/help-select', '/activities', '/activities/group-walk', '/activity-added', '/my-plan'])('route %s has one H1, one main and a working skip destination', route => {
    vi.stubGlobal('localStorage', { getItem: (key: string) => key === ACTIVITY_PLAN_KEY ? JSON.stringify({ activityIds: ['group-walk'], monthlyBudget: null }) : null })
    const html = renderToStaticMarkup(createElement(MemoryRouter, { initialEntries: [route] }, createElement(App)))
    expect(html.match(/<h1(?:\s|>)/g)).toHaveLength(1)
    expect(html.match(/<main(?:\s|>)/g)).toHaveLength(1)
    expect(html).toContain('href="#main-content"')
    expect(html).toContain('id="main-content" tabindex="-1"')
    expect(html.indexOf('Перейти к содержимому')).toBeLessThan(html.indexOf('site-header'))
    expect(html).toContain('aria-label="Основная навигация"')
    const headings = [...html.matchAll(/<h([1-6])(?:\s|>)/g)].map(match => Number(match[1]))
    expect(headings.every((level, index) => index === 0 || level <= headings[index - 1] + 1)).toBe(true)
  })
  it('uses native select labels and keeps exactly five Help Select parameters', () => {
    const html = render(createElement(HelpSelectPage, { data: demo, onApply: () => {} }))
    expect(html.match(/<fieldset/g)).toHaveLength(2)
    expect(html.match(/<select/g)).toHaveLength(3)
    for (const id of ['preferred-period', 'activity-format', 'monthly-budget']) {
      expect(html).toContain(`for="${id}"`)
      expect(html).toContain(`id="${id}"`)
    }
    expect(html).not.toContain('aria-label="Формат"')
    expect(html).not.toContain('tabindex="1"')
  })
  it('provides native names for all additional selects and preserves live result feedback', () => {
    const html = render(createElement(CatalogPage, { estimatedMonthlyTotal: 0, activityIds: [], onAdd: () => {}, data: demo, filters: emptyCatalogFilters(), onChange: () => {} }))
    for (const id of ['catalog-query', 'activity-format', 'monthly-budget', 'venue-elevator', 'venue-step-free']) {
      expect(html).toContain(`for="${id}"`)
      expect(html).toContain(`id="${id}"`)
    }
    expect(html).toContain('role="status">Найдено групп: 7')
    expect(html).toContain('aria-describedby="catalog-search-help"')
    expect(html).toContain('id="catalog-search-help"')
  })
  it('communicates successful and missing-context Added states with headings and native links', () => {
    const recent = { activityId: 'group-walk', sequence: 1 }
    const added = renderToStaticMarkup(createElement(MemoryRouter, { initialEntries: [{ pathname: '/activity-added', state: recent }] }, createElement(ActivityAddedPage, { data: demo, recentAddition: recent, activityIds: ['group-walk'] })))
    expect(added).toContain('<h1>Занятие добавлено в план</h1>')
    expect(added).toContain('href="/my-plan"')
    const neutral = render(createElement(ActivityAddedPage, { data: demo, recentAddition: null, activityIds: [] }))
    expect(neutral).toContain('<h1>Нет недавнего добавления</h1>')
  })
  it('keeps interactive Undo out of the live text region and preserves explicit warning text', () => {
    const html = render(createElement(MyPlanPage, { data: demo, summary: aggregatePlan({ activityIds: ['group-walk', 'group-art', 'group-gap29'], monthlyBudget: 0 }, demo), lastRemoval: { activityId: 'group-online', index: 0 }, onRemove: () => {}, onUndo: () => {}, storageStatus: 'error' }))
    expect(html).toContain('<p role="status">Удалено:')
    expect(html).not.toMatch(/<div[^>]*role="status"[^>]*><p>Удалено/)
    for (const text of ['Пересечение по времени.', 'Мало времени на дорогу.', 'Превышение бюджета.', 'Не удалось сохранить план.', 'Отменить удаление']) expect(html).toContain(text)
  })
})
