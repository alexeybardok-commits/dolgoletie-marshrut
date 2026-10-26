import { Link } from 'react-router-dom'
import { conflicts, dateLabel, legacyTotal } from '../utils/business/legacyModel'
import { EventInfo } from '../components/activities/ActivityParts'
import type { LegacyActivity, LegacyPreferences } from '../types/legacy'

type PlanProps = {
  items: LegacyActivity[]
  preferences: LegacyPreferences
} & (
  | { print: true; onToggle?: never }
  | { print?: false; onToggle: (id: number) => void }
)

export default function Plan({ items, onToggle, preferences, print = false }: PlanProps) {
  const warnings = conflicts(items)
  const total = legacyTotal(items)
  return <section className="section route-sheet">
    <h1>{print ? 'Маршрут на месяц для родителя' : 'Мой план'}</h1>
    <p className="plan-progress">Выбрано событий: {items.length}/4</p>
    <progress className="no-print" value={items.length} max="4" aria-label="Заполнение плана" />
    <p>Екатеринбург · Время местное (UTC+5).</p>
    {items.length > 0 && <p>Период маршрута: {dateLabel(items[0].date)} — {dateLabel(items[items.length - 1].date)}.</p>}
    <p className="notice">Учебный маршрут: все события, цены и площадки условные. Это не подтверждение записи.</p>
    {preferences.distance && <p>Пожелание по расстоянию: {preferences.distance}. Расстояние и время в пути не рассчитаны.</p>}
    {warnings.length > 0 && <div className="warning" role="alert"><h2>События пересекаются по времени</h2><ul>{warnings.map(item => <li key={item}>{item}</li>)}</ul><p>Удалите одно из пересекающихся событий или выберите другое.</p></div>}
    {!items.length ? <p>План пока пуст. Выберите четыре события на один календарный месяц.</p> : <ol className="route-list">
      {items.map(item => <li className="activity-card" key={item.id}>
        <h2>{item.title}</h2>
        <EventInfo activity={item} />
        {print && <p>Условия участия: {item.conditions}</p>}
        {!print && onToggle && <div className="no-print"><Link to={`/activities/${item.id}`}>Подробнее →</Link><button type="button" onClick={() => onToggle(item.id)} aria-label={`Удалить из плана: ${item.title}`}>Удалить из плана</button></div>}
      </li>)}
    </ol>}
    <p className="total">Общая стоимость: {total.toLocaleString('ru-RU')} ₽</p>
    <p>Сумма включает только стоимость событий. Проезд и другие расходы не учтены.</p>
    {items.length < 4 && <p>До полного маршрута осталось выбрать {4 - items.length} события. Можно сохранить и распечатать текущий вариант.</p>}
    <p>Маршрут сохраняется автоматически в этом браузере.</p>
    <div className="hero-actions no-print">
      <Link className="hero-button-secondary" to="/activities">Вернуться к подбору</Link>
      {!print && items.length > 0 && <Link className="hero-button" to="/route">Открыть маршрут для печати</Link>}
      {print && <Link className="hero-button-secondary" to="/my-plan">Изменить план</Link>}
      {print && items.length > 0 && <button className="hero-button" type="button" onClick={() => window.print()}>Распечатать / сохранить PDF</button>}
    </div>
  </section>
}
