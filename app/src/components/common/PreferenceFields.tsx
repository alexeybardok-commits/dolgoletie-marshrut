import { categories, districts } from '../../utils/business/legacyModel'
import type { LegacyPreferences } from '../../types/legacy'

interface PreferenceFieldsProps {
  value: LegacyPreferences
  onChange: (value: LegacyPreferences) => void
  distance?: boolean
}

export function PreferenceFields({ value, onChange, distance = false }: PreferenceFieldsProps) {
  const update = <K extends keyof LegacyPreferences,>(key: K, next: LegacyPreferences[K]) => onChange({ ...value, [key]: next })
  return <>
    <fieldset className="interests">
      <legend>Интересы родителя / категории</legend>
      <p>Если ничего не выбрано, покажем все категории.</p>
      {categories.map(category => <label key={category}>
        <input type="checkbox" checked={value.interests.includes(category)} onChange={event => update('interests', event.target.checked ? [...value.interests, category] : value.interests.filter(item => item !== category))} /> {category}
      </label>)}
    </fieldset>
    <div className="filters">
      <label>Район<select value={value.district} onChange={event => update('district', event.target.value)}><option value="">Все районы</option>{districts.map(item => <option key={item}>{item}</option>)}</select></label>
      <label>С даты<input type="date" value={value.dateFrom} max={value.dateTo || undefined} onChange={event => update('dateFrom', event.target.value)} /></label>
      <label>По дату<input type="date" value={value.dateTo} min={value.dateFrom || undefined} onChange={event => update('dateTo', event.target.value)} /></label>
      <label>Максимум за событие, ₽<input type="number" min="0" max="1000000" step="1" placeholder="Без ограничения" value={value.maxPrice} onChange={event => update('maxPrice', event.target.value)} /></label>
      {distance && <label>Комфортное расстояние<select value={value.distance} onChange={event => update('distance', event.target.value)}><option value="">Не указано</option>{['До 1 км', 'До 3 км', 'До 5 км', 'Не принципиально'].map(item => <option key={item}>{item}</option>)}</select></label>}
    </div>
  </>
}
