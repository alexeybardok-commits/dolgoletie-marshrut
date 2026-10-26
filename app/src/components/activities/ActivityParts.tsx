import { dateLabel, money } from '../../utils/business/legacyModel'
import type { LegacyActivity, LegacySelectionProps } from '../../types/legacy'

export function SelectionButton({ activity, selectedIds, onToggle }: LegacySelectionProps & { activity: LegacyActivity }) {
  const selected = selectedIds.includes(activity.id)
  const full = selectedIds.length >= 4 && !selected
  return <button type="button" disabled={full} onClick={() => onToggle(activity.id)} aria-label={`${selected ? 'Убрать из плана' : 'Добавить в план'}: ${activity.title}`}>
    {selected ? 'Убрать из плана' : full ? 'План заполнен: 4/4' : 'Добавить в план'}
  </button>
}

export function EventInfo({ activity }: { activity: LegacyActivity }) {
  return <>
    <p><time dateTime={`${activity.date}T${activity.time}:00+05:00`}>{dateLabel(activity.date)}, {activity.time}</time> · {activity.duration} мин.</p>
    <p>Район: {activity.district}</p>
    <p>Адрес: {activity.address}</p>
    <p>Стоимость: {money(activity.price)}</p>
  </>
}
