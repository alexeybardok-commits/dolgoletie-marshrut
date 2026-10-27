import { Link } from 'react-router-dom'
import type { CatalogData } from '../../data/catalog'
import type { PlanSummary } from '../../utils/business'
import { GROUP_FORMAT_LABELS, MISSING_INFORMATION, WEEKDAYS } from './catalogPresentation'

export default function WeeklySchedule({ summary, data }: { summary: PlanSummary; data: CatalogData }) {
  return <section className="weekly-schedule" aria-labelledby="weekly-title"><h2 id="weekly-title">Расписание на неделю</h2>
    <p>Повторяется каждую неделю. Время местное, Екатеринбург (UTC+5).</p>
    {WEEKDAYS.map(day => {
      const sessions = summary.sessions.filter(item => item.session.weekday === day.value)
      return <section className="weekly-day" key={day.value} data-weekday={day.value}><h3>{day.label}</h3>
        {sessions.length === 0 ? <p>Занятий нет.</p> : <ul className="weekly-sessions">{sessions.map(({ group, session }) => {
          const venue = group.venueId ? data.venues.find(venue => venue.id === group.venueId) : undefined
          const conflict = summary.timeConflicts.some(warning => warning.first.session.id === session.id || warning.second.session.id === session.id)
          const road = summary.roadWarnings.some(warning => warning.first.session.id === session.id || warning.second.session.id === session.id)
          return <li key={session.id} className="weekly-session" data-session-id={session.id}>
            <p className="session-time">{session.startTime}–{session.endTime}</p><h4><Link to={`/activities/${group.id}`} state={{ from: '/my-plan' }}>{group.title}</Link></h4>
            <p>{GROUP_FORMAT_LABELS[group.activityFormat]}</p>
            {group.activityFormat === 'online' ? <p>Онлайн — без привязки к району</p> : <p>{venue ? `${venue.name} · ${venue.area} · ${venue.address}` : MISSING_INFORMATION}</p>}
            {(conflict || road) && <p className="session-warning"><a href="#plan-warnings">{conflict ? 'Пересечение по времени. ' : ''}{road ? 'Проверьте время на дорогу. ' : ''}Посмотреть предупреждения</a></p>}
          </li>
        })}</ul>}
      </section>
    })}
  </section>
}
