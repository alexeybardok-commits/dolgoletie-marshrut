import type { CatalogData } from '../../data/catalog'
import type { CatalogFilters } from '../../utils/business'
import { BUDGET_OPTIONS, FORMAT_LABELS, WEEKDAYS } from '../activities/catalogPresentation'

export function ChoiceGroup({ legend, options, selected, onChange }: {
  legend: string
  options: readonly { value: string; label: string }[]
  selected: readonly string[]
  onChange: (selected: string[]) => void
}) {
  return <fieldset className="choice-group"><legend>{legend}</legend>
    {options.map(option => <label key={option.value}>
      <input type="checkbox" checked={selected.includes(option.value)} onChange={event => onChange(event.target.checked ? [...selected, option.value] : selected.filter(value => value !== option.value))} />
      {option.label}
    </label>)}
  </fieldset>
}

export function FormatSelect({ value, onChange }: { value: CatalogFilters['preferredFormat']; onChange: (value: CatalogFilters['preferredFormat']) => void }) {
  return <div className="form-field"><label htmlFor="activity-format">Формат</label><select id="activity-format" value={value} onChange={event => onChange(event.target.value as CatalogFilters['preferredFormat'])}>
    {Object.entries(FORMAT_LABELS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
  </select></div>
}

export function BudgetSelect({ value, onChange }: { value: CatalogFilters['monthlyBudget']; onChange: (value: CatalogFilters['monthlyBudget']) => void }) {
  return <div className="form-field"><label htmlFor="monthly-budget">Бюджет в месяц</label><select id="monthly-budget" value={value ?? ''} onChange={event => onChange(BUDGET_OPTIONS.find(option => String(option.value ?? '') === event.target.value)?.value ?? null)}>
    {BUDGET_OPTIONS.map(option => <option key={String(option.value)} value={option.value ?? ''}>{option.label}</option>)}
  </select></div>
}

export default function CatalogFields({ data, filters, onChange }: { data: CatalogData; filters: CatalogFilters; onChange: (value: CatalogFilters) => void }) {
  return <div className="catalog-fields">
    <ChoiceGroup legend="Направление" options={data.directions.filter(direction => direction.active).map(direction => ({ value: direction.id, label: direction.name }))} selected={filters.directionIds} onChange={directionIds => onChange({ ...filters, directionIds })} />
    <ChoiceGroup legend="Район" options={[...new Set(data.venues.map(venue => venue.area))].map(area => ({ value: area, label: area }))} selected={filters.areaIds} onChange={areaIds => onChange({ ...filters, areaIds })} />
    <fieldset className="choice-group"><legend>Дни и время</legend>
      {WEEKDAYS.map(day => <label key={day.value}><input type="checkbox" checked={filters.weekdays.includes(day.value)} onChange={event => onChange({ ...filters, weekdays: event.target.checked ? [...filters.weekdays, day.value] : filters.weekdays.filter(value => value !== day.value) })} />{day.label}</label>)}
      <div className="filters"><label>Начало занятия с<input type="time" value={filters.timeFrom ?? ''} onChange={event => onChange({ ...filters, timeFrom: event.target.value || null })} /></label>
        <label>Начало занятия до<input type="time" value={filters.timeTo ?? ''} onChange={event => onChange({ ...filters, timeTo: event.target.value || null })} /></label></div>
      <p className="hero-note">Учитывается время начала. Дни и время можно задать отдельно.</p>
    </fieldset>
    <div className="filters">
      <FormatSelect value={filters.preferredFormat} onChange={preferredFormat => onChange({ ...filters, preferredFormat })} />
      <BudgetSelect value={filters.monthlyBudget} onChange={monthlyBudget => onChange({ ...filters, monthlyBudget })} />
    </div>
  </div>
}
