import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { PreferenceFields } from '../components/common/PreferenceFields'
import type { LegacyPreferences } from '../types/legacy'

export default function Preferences({ preferences, onSave }: { preferences: LegacyPreferences; onSave: (value: LegacyPreferences) => void }) {
  const [draft, setDraft] = useState(preferences)
  const navigate = useNavigate()
  return <section className="section">
    <h1>Предпочтения родителя</h1>
    <p>Расскажите, что нравится маме или папе. Вы сможете изменить фильтры в каталоге.</p>
    <form onSubmit={event => { event.preventDefault(); onSave(draft); navigate('/activities') }}>
      <PreferenceFields value={draft} onChange={setDraft} distance />
      <p>Расстояние сохраняется как пожелание. Без координат дома и маршрутизации мы не проверяем километры и время в пути.</p>
      <button className="hero-button" type="submit">Сохранить и подобрать занятия</button>
    </form>
  </section>
}
