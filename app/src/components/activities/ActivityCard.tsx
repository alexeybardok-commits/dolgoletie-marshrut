import { Link } from 'react-router-dom'
import type { ActivityGroup } from '../../types/domain'
import type { CatalogData } from '../../data/catalog'
import { GROUP_FORMAT_LABELS, money, tariffLabel, WEEKDAYS } from './catalogPresentation'

export default function ActivityCard({ group, data, selected, onAdd }: { group: ActivityGroup; data: CatalogData; selected: boolean; onAdd: (id: string) => unknown }) {
  const venue = group.venueId ? data.venues.find(venue => venue.id === group.venueId) : undefined
  const schedule = data.schedules.filter(session => session.groupId === group.id).sort((a, b) => a.weekday - b.weekday || a.startTime.localeCompare(b.startTime))
  const statusLabels = { openNow: 'Можно присоединиться сейчас', openFromDate: 'Набор откроется позже', waitlist: 'Лист ожидания', closed: 'Набор закрыт' }
  return <article className="activity-card recurring-card" data-activity-id={group.id}>
    <span className="category">{group.directionIds.map(id => data.directions.find(direction => direction.id === id)?.name).join(' · ')}</span>
    <h2>{group.title}</h2>
    <p>Формат: {GROUP_FORMAT_LABELS[group.activityFormat]}</p>
    <h3>Каждую неделю</h3>
    <ul className="schedule-list">{schedule.map(session => <li key={session.id}>{WEEKDAYS.find(day => day.value === session.weekday)?.label}, {session.startTime}–{session.endTime}</li>)}</ul>
    <p>{tariffLabel(group)}</p>
    <p><strong>Ориентировочно за месяц: <span className="money-value">{money(group.estimatedMonthlyCost)}</span></strong></p>
    <p>{statusLabels[group.enrollmentStatus]}</p>
    {group.activityFormat === 'online' ? <p>Онлайн — без привязки к району</p> : <div><p>Район: {venue?.area}</p><p>Площадка: {venue?.name}</p><p>Адрес: {venue?.address}</p></div>}
    <div className="catalog-card-actions"><Link to={`/activities/${group.id}`} state={{ from: '/activities' }}>Подробнее<span className="sr-only">: {group.title}</span> →</Link>
      <button type="button" className="hero-button" disabled={selected} aria-label={`${selected ? 'В плане ✓' : 'Добавить в план'}: ${group.title}`} onClick={() => onAdd(group.id)}>{selected ? 'В плане ✓' : 'Добавить в план'}</button>
      <span className="sr-only" aria-live="polite">{selected ? `${group.title}: в плане` : ''}</span>
    </div>
  </article>
}
