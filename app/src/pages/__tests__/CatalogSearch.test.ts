import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it } from 'vitest'
import CatalogPage from '../CatalogPage'
import { emptyCatalogFilters } from '../../utils/business'
import { demo } from '../../utils/business/__tests__/fixtures'
import type { CatalogFilters } from '../../utils/business'

const render = (filters: CatalogFilters) => renderToStaticMarkup(createElement(MemoryRouter, null, createElement(CatalogPage, { estimatedMonthlyTotal: 0, activityIds: [], onAdd: () => {}, data: demo, filters, onChange: () => {} })))

describe('FE-023/024 Catalog controls', () => {
  it('renders search, extra fields, removal actions and unchanged main fields', () => {
    const html = render({ ...emptyCatalogFilters(), query: 'ходьба', skillLevels: ['Для начинающих — учебное значение'], physicalLoads: ['Низкая — учебное значение'], elevator: 'unknown', stepFreeEntrance: 'yes' })
    for (const text of ['Поиск по каталогу', 'Очистить поиск', 'Уровень подготовки', 'Физическая нагрузка', 'Доступность площадки', 'Лифт', 'Вход без ступеней', 'Убрать фильтр: Поиск:', 'Убрать фильтр: Уровень:', 'Убрать фильтр: Нагрузка:', 'Убрать фильтр: Лифт:', 'Убрать фильтр: Вход без ступеней:', 'Сбросить всё', 'Бюджет в месяц', 'Дни и время']) expect(html).toContain(text)
    expect(html).not.toContain('aria-label="Статус набора"')
  })
  it('keeps literal markup queries escaped and displays Empty State', () => {
    const html = render({ ...emptyCatalogFilters(), query: '<img src=x onerror=alert(1)>' })
    expect(html).toContain('&lt;img')
    expect(html).not.toContain('<img')
    expect(html).toContain('По этим условиям занятий нет')
    expect(html).not.toContain('data-activity-id=')
    expect(html).toContain('Сбросить фильтры')
  })
  it('offers only level/load values from normalized data, with no added demo characteristics', () => {
    const html = render(emptyCatalogFilters())
    expect(html).toContain('Для начинающих — учебное значение')
    expect(html).toContain('Низкая — учебное значение')
    expect(html).not.toContain('Продвинутый')
    expect(html).not.toContain('Высокая нагрузка')
  })
})
