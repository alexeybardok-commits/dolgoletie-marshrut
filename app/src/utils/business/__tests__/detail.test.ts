import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { describe, expect, it } from 'vitest'
import ActivityDetailPage from '../../../pages/ActivityDetailPage'
import { OrganizerContacts, OnlineDetailsSection } from '../../../components/activities/DetailSections'
import { accessibilityLabel, MISSING_INFORMATION } from '../../../components/activities/catalogPresentation'
import { demo } from './fixtures'

function renderDetail(id: string, activityIds: string[] = []) {
  return renderToStaticMarkup(createElement(MemoryRouter, { initialEntries: [`/activities/${id}`] }, createElement(Routes, null,
    createElement(Route, { path: '/activities/:activityId', element: createElement(ActivityDetailPage, { data: demo, activityIds, onAdd: () => null }) }),
  )))
}

describe('FE-025 applicable details', () => {
  it.each([[true, 'Да'], [false, 'Нет'], [null, MISSING_INFORMATION], [undefined, MISSING_INFORMATION]] as const)('accessibility %s is explicit', (value, label) => {
    expect(accessibilityLabel(value)).toBe(label)
  })
  it('renders the exact missing-information phrase for every unknown online detail', () => {
    const markup = renderToStaticMarkup(createElement(OnlineDetailsSection, { details: undefined }))
    expect(markup.split(MISSING_INFORMATION)).toHaveLength(5)
  })
  it('does not invent organizer contacts', () => {
    const organizer = { ...demo.organizers[0], website: null, phone: null, contactLink: null }
    const markup = renderToStaticMarkup(createElement(OrganizerContacts, { organizer }))
    expect(markup).toContain(MISSING_INFORMATION)
    expect(markup).not.toContain('href=')
  })
  it('renders every weekly session, calculated cost, actual source and nullable venue data', () => {
    const markup = renderDetail('group-walk').replaceAll('\u00a0', ' ')
    for (const text of ['10:00–11:00', '11:30–12:30', '4 000', 'Как присоединиться', 'Лифт', MISSING_INFORMATION, 'Источник и актуальность', 'ekanitki@gmail.com']) expect(markup).toContain(text)
    expect(markup).toContain('mailto:ekanitki@gmail.com')
  })
  it('pure online has no physical address or venue accessibility block', () => {
    const markup = renderDetail('group-online')
    expect(markup).toContain('Онлайн — без привязки к району')
    expect(markup).toContain('Участие онлайн')
    expect(markup).not.toContain('<dt>Адрес</dt>')
    expect(markup).not.toContain('<dt>Лифт</dt>')
  })
  it('hybrid renders both venue and online joining instructions', () => {
    const markup = renderDetail('group-hybrid')
    for (const text of ['<dt>Адрес</dt>', 'Платформа', 'Требования к устройству', 'Инструкции подключения', 'Контакт поддержки учебного проекта', 'Ближайшая дата входа']) expect(markup).toContain(text)
  })
  it('unknown applicable participation and online fields stay explicitly unknown', () => {
    const markup = renderDetail('group-budget')
    expect(markup).toContain(`<h2>Условия участия</h2><p>${MISSING_INFORMATION}</p>`)
    expect(markup).toContain(`<dt>Платформа</dt><dd>${MISSING_INFORMATION}</dd>`)
  })
  it('zero available places is not treated as missing information', () => {
    expect(renderDetail('group-waitlist')).toContain('<dt>Свободные места</dt><dd>0</dd>')
  })
  it('selected groups show an inert Already in Plan button', () => {
    const markup = renderDetail('group-walk', ['group-walk'])
    expect(markup).toContain('Уже в плане</button>')
    expect(markup).toContain('disabled=')
    expect(markup).not.toContain('Добавить в мой план')
  })
  it('unknown ID is safe and has a catalog return action', () => {
    const markup = renderDetail('missing')
    expect(markup).toContain('Занятие не найдено')
    expect(markup).toContain('href="/activities"')
    expect(markup).not.toContain('Добавить в мой план')
  })
})
