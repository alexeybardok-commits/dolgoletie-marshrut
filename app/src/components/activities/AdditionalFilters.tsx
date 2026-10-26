import type { CatalogData } from '../../data/catalog'
import type { AccessibilityFilter, CatalogFilters } from '../../utils/business'
import { ChoiceGroup } from '../common/CatalogFields'

function AccessibilitySelect({ id, label, value, onChange }: { id: string; label: string; value: AccessibilityFilter; onChange: (value: AccessibilityFilter) => void }) {
  return <div className="form-field"><label htmlFor={id}>{label}</label><select id={id} value={value} onChange={event => onChange(event.target.value as AccessibilityFilter)}>
    <option value="any">Любое значение</option><option value="yes">Да</option><option value="no">Нет</option><option value="unknown">Информация отсутствует</option>
  </select></div>
}

export default function AdditionalFilters({ data, filters, onChange }: { data: CatalogData; filters: CatalogFilters; onChange: (value: CatalogFilters) => void }) {
  const options = (values: string[]) => [...new Set(values)].filter(value => typeof value === 'string' && value.trim()).map(value => ({ value, label: value }))
  return <section className="additional-filters" aria-labelledby="additional-filters-title"><h2 id="additional-filters-title">Дополнительные условия</h2>
    <ChoiceGroup legend="Уровень подготовки" options={options(data.groups.map(group => group.skillLevel))} selected={filters.skillLevels} onChange={skillLevels => onChange({ ...filters, skillLevels })} />
    <ChoiceGroup legend="Физическая нагрузка" options={options(data.groups.map(group => group.physicalLoad))} selected={filters.physicalLoads} onChange={physicalLoads => onChange({ ...filters, physicalLoads })} />
    <fieldset className="choice-group"><legend>Доступность площадки</legend><div className="filters">
      <AccessibilitySelect id="venue-elevator" label="Лифт" value={filters.elevator} onChange={elevator => onChange({ ...filters, elevator })} />
      <AccessibilitySelect id="venue-step-free" label="Вход без ступеней" value={filters.stepFreeEntrance} onChange={stepFreeEntrance => onChange({ ...filters, stepFreeEntrance })} />
    </div><p className="hero-note">Неизвестные сведения не считаются ответом «нет». Онлайн-группы не ограничиваются доступностью физической площадки.</p></fieldset>
  </section>
}
