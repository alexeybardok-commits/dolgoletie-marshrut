import { Link, useParams } from 'react-router-dom'
import { activities, emptyPreferences, matchesFilters } from '../utils/business/legacyModel'
import { PreferenceFields } from '../components/common/PreferenceFields'
import { EventInfo, SelectionButton } from '../components/activities/ActivityParts'
import type { LegacyPreferences, LegacySelectionProps } from '../types/legacy'

interface ActivitiesProps extends LegacySelectionProps {
  filters: LegacyPreferences
  setFilters: (value: LegacyPreferences) => void
}

export default function Activities({ filters, setFilters, selectedIds, onToggle }: ActivitiesProps) {
  const filtered = activities.filter(item => matchesFilters(item, filters))
  return <section className="section">
    <h1>Каталог занятий</h1>
    <p className="notice">Все 24 события — тестовые примеры на ноябрь 2026 года. Адреса условные, это не афиша подтверждённых мероприятий.</p>
    <form onSubmit={event => event.preventDefault()}>
      <PreferenceFields value={filters} onChange={setFilters} />
      <button type="button" className="hero-button-secondary" onClick={() => setFilters({ ...emptyPreferences, distance: filters.distance })}>Сбросить фильтры</button>
    </form>
    {filters.distance && <p>Пожелание по расстоянию: {filters.distance}. Не используется для фильтрации; километры не рассчитаны.</p>}
    <p role="status">Найдено занятий: {filtered.length} · В плане: {selectedIds.length}/4</p>
    <Link to="/my-plan">Перейти в мой план →</Link>
    {!filtered.length && <p>По этим условиям событий нет. Измените даты, интересы или бюджет либо сбросьте фильтры.</p>}
    <div className="activity-grid">
      {filtered.map(activity => <article className="activity-card" key={activity.id}>
        <span className="category">Тестовое событие · {activity.category}</span>
        <h2>{activity.title}</h2>
        <EventInfo activity={activity} />
        <Link to={`/activities/${activity.id}`}>Подробнее о событии →</Link>
        <SelectionButton activity={activity} selectedIds={selectedIds} onToggle={onToggle} />
      </article>)}
    </div>
  </section>
}

export function ActivityDetails({ selectedIds, onToggle }: LegacySelectionProps) {
  const { id } = useParams()
  const activity = activities.find(item => String(item.id) === id)
  if (!activity) return <section><h1>Событие не найдено</h1><Link to="/activities">Вернуться в каталог</Link></section>
  return <section className="section activity-detail">
    <Link to="/activities">← Вернуться к подбору</Link>
    <p className="category">Тестовое событие · {activity.category}</p>
    <h1>{activity.title}</h1>
    <p>{activity.description}</p>
    <EventInfo activity={activity} />
    <h2>Условия участия</h2><p>{activity.conditions}</p>
    <p className="notice">Это вымышленный учебный пример. Дата, цена и адрес не подтверждают реальное мероприятие. Бронирование недоступно.</p>
    <SelectionButton activity={activity} selectedIds={selectedIds} onToggle={onToggle} />
    <p><Link to="/my-plan">Мой план: {selectedIds.length}/4 →</Link></p>
  </section>
}
