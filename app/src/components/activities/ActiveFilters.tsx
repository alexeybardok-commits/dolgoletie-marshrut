import type { CatalogData } from '../../data/catalog'
import type { CatalogFilters } from '../../utils/business'
import { budgetLabel, FORMAT_LABELS, WEEKDAYS } from './catalogPresentation'
import { normalizeSearchQuery } from '../../utils/business'

export default function ActiveFilters({ data, filters, onChange }: { data: CatalogData; filters: CatalogFilters; onChange: (value: CatalogFilters) => void }) {
  const chips: { label: string; remove: () => void }[] = []
  if (normalizeSearchQuery(filters.query)) chips.push({ label: `Поиск: ${filters.query.trim()}`, remove: () => onChange({ ...filters, query: '' }) })
  for (const id of filters.directionIds) chips.push({ label: `Направление: ${data.directions.find(direction => direction.id === id)?.name ?? id}`, remove: () => onChange({ ...filters, directionIds: filters.directionIds.filter(value => value !== id) }) })
  for (const area of filters.areaIds) chips.push({ label: `Район: ${area}`, remove: () => onChange({ ...filters, areaIds: filters.areaIds.filter(value => value !== area) }) })
  for (const day of filters.weekdays) chips.push({ label: `День: ${WEEKDAYS.find(value => value.value === day)?.label}`, remove: () => onChange({ ...filters, weekdays: filters.weekdays.filter(value => value !== day) }) })
  if (filters.timeFrom !== null) chips.push({ label: `Начало с ${filters.timeFrom}`, remove: () => onChange({ ...filters, timeFrom: null }) })
  if (filters.timeTo !== null) chips.push({ label: `Начало до ${filters.timeTo}`, remove: () => onChange({ ...filters, timeTo: null }) })
  if (filters.preferredFormat !== 'any') chips.push({ label: `Формат: ${FORMAT_LABELS[filters.preferredFormat]}`, remove: () => onChange({ ...filters, preferredFormat: 'any' }) })
  if (filters.monthlyBudget !== null) chips.push({ label: `Бюджет: ${budgetLabel(filters.monthlyBudget)}`, remove: () => onChange({ ...filters, monthlyBudget: null }) })
  for (const value of filters.skillLevels) chips.push({ label: `Уровень: ${value}`, remove: () => onChange({ ...filters, skillLevels: filters.skillLevels.filter(item => item !== value) }) })
  for (const value of filters.physicalLoads) chips.push({ label: `Нагрузка: ${value}`, remove: () => onChange({ ...filters, physicalLoads: filters.physicalLoads.filter(item => item !== value) }) })
  const accessibilityLabels = { yes: 'Да', no: 'Нет', unknown: 'Информация отсутствует' }
  if (filters.elevator !== 'any') chips.push({ label: `Лифт: ${accessibilityLabels[filters.elevator]}`, remove: () => onChange({ ...filters, elevator: 'any' }) })
  if (filters.stepFreeEntrance !== 'any') chips.push({ label: `Вход без ступеней: ${accessibilityLabels[filters.stepFreeEntrance]}`, remove: () => onChange({ ...filters, stepFreeEntrance: 'any' }) })
  if (!chips.length) return <p>Фильтры не заданы.</p>
  return <ul className="filter-chips" aria-label="Активные фильтры">{chips.map(chip => <li key={chip.label}><button type="button" aria-label={`Убрать фильтр: ${chip.label}`} onClick={event => {
    const item = event.currentTarget.parentElement
    const next = item?.nextElementSibling?.querySelector<HTMLButtonElement>('button') ?? item?.previousElementSibling?.querySelector<HTMLButtonElement>('button')
    chip.remove()
    const target = next ?? document.getElementById('catalog-query')
    target?.focus()
  }}>{chip.label} <span aria-hidden="true">×</span></button></li>)}</ul>
}
