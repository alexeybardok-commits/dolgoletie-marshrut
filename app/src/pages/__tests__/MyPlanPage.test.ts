import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it } from 'vitest'
import MyPlanPage from '../MyPlanPage'
import { aggregatePlan } from '../../utils/business'
import { demo } from '../../utils/business/__tests__/fixtures'
import type { LastRemoval } from '../../app/planSession'

function renderPlan(activityIds: string[], monthlyBudget: number | null = null, lastRemoval: LastRemoval | null = null) {
  return renderToStaticMarkup(createElement(MemoryRouter, null, createElement(MyPlanPage, {
    data: demo, summary: aggregatePlan({ activityIds, monthlyBudget }, demo), lastRemoval,
    onRemove: () => {}, onUndo: () => {}, storageStatus: 'saved',
  }))).replaceAll('\u00a0', ' ')
}

describe('FE-028–031 My Plan view', () => {
  it('renders zero groups, zero total, unlimited budget and the catalog action', () => {
    const html = renderPlan([])
    for (const text of ['Выбрано групп: 0', 'Ориентировочно за месяц: 0 ₽', 'Стоимость не важна', 'В плане пока нет занятий', 'Найти занятия']) expect(html).toContain(text)
    expect(html).not.toContain('data-session-id')
    expect(html.match(/>Найти занятия<\/a>/g)).toHaveLength(1)
    expect(html).not.toContain('Добавить ещё')
  })
  it('renders seven unique groups and all nine obligatory sessions', () => {
    const html = renderPlan(demo.groups.slice(0, 7).map(group => group.id))
    expect(html).toContain('Выбрано групп: 7')
    expect(html).toContain('Ориентировочно за месяц: 26 500 ₽')
    expect(html.match(/data-group-id=/g)).toHaveLength(7)
    expect(html.match(/data-session-id=/g)).toHaveLength(9)
    expect(html.match(/data-weekday=/g)).toHaveLength(7)
    expect(html).toContain('href="/activities/group-walk"')
    expect(html).toContain('Добавить ещё')
    expect(html).not.toContain('Найти занятия')
  })
  it('shows both weekly sessions of one group with weekday, interval and place', () => {
    const html = renderPlan(['group-walk'])
    for (const text of ['Понедельник', 'Четверг', '10:00–11:00', '11:30–12:30', 'data-session-id="session-01"', 'data-session-id="session-02"', 'Учебная площадка А']) expect(html).toContain(text)
  })
  it('does not invent a physical address or show technical connection details for an online session', () => {
    const html = renderPlan(['group-online'])
    expect(html).toContain('Онлайн — без привязки к району')
    expect(html).not.toContain('условный адрес')
    expect(html).not.toContain('Требования к устройству')
  })
  it('renders time conflict text and links beside the affected sessions', () => {
    const html = renderPlan(['group-walk', 'group-art'])
    expect(html).toContain('Пересечение по времени.')
    expect(html).toContain('class="time-warning"')
    expect(html).not.toContain('class="road-warning"')
    expect(html).toContain('href="#plan-warnings"')
  })
  it('renders a 29-minute road warning and no 30-minute warning', () => {
    expect(renderPlan(['group-walk', 'group-gap29'])).toContain('29 мин.')
    expect(renderPlan(['group-walk', 'group-gap30'])).not.toContain('class="road-warning"')
    expect(renderPlan(['group-walk', 'group-hybrid', 'group-online'])).not.toContain('class="road-warning"')
  })
  it('renders numeric budget overrun but not unlimited-budget warnings', () => {
    const html = renderPlan(['group-walk'], 2000)
    expect(html).toContain('Бюджет в месяц: До 2 000 ₽')
    expect(html).toContain('Превышение бюджета.')
    expect(html).toContain('на 2 000 ₽')
    expect(renderPlan(['group-walk'], null)).not.toContain('class="budget-warning"')
  })
  it('keeps Undo visible after deleting the last group', () => {
    const html = renderPlan([], null, { activityId: 'group-walk', index: 0 })
    expect(html).toContain('В плане пока нет занятий')
    expect(html).toContain('Отменить удаление')
    expect(html).toContain('Удалено: Учебная группа: регулярная ходьба')
    expect(html).toContain('Найти занятия')
    expect(html).not.toContain('Добавить ещё')
  })
})
