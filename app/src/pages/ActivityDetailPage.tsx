import { Link, useNavigate, useParams } from 'react-router-dom'
import type { CatalogData } from '../data/catalog'
import type { AdditionContext } from '../app/additionContext'
import { calculateGroupCosts } from '../utils/business'
import { ACTIVITY_STATUS_LABELS, dataDateLabel, ENROLLMENT_LABELS, GROUP_FORMAT_LABELS, MISSING_INFORMATION, money, tariffLabel, WEEKDAYS } from '../components/activities/catalogPresentation'
import { InfoRow, InstructorsSection, OnlineDetailsSection, OrganizerContacts, VenueDetails } from '../components/activities/DetailSections'

export default function ActivityDetailPage({ data, activityIds, onAdd }: {
  data: CatalogData
  activityIds: readonly string[]
  onAdd: (id: string) => AdditionContext | null
}) {
  const { activityId } = useParams()
  const navigate = useNavigate()
  const source = data.groups.find(group => group.id === activityId)
  if (!source) return <section className="section"><h1>Занятие не найдено</h1><p>Проверьте ссылку или выберите занятие в каталоге.</p><Link className="hero-button-secondary" to="/activities">Вернуться в каталог</Link></section>
  const group = calculateGroupCosts([source], data.schedules)[0]
  const organizer = data.organizers.find(organizer => organizer.id === group.organizerId)
  const venue = group.venueId ? data.venues.find(venue => venue.id === group.venueId) : undefined
  const schedule = data.schedules.filter(session => session.groupId === group.id).sort((a, b) => a.weekday - b.weekday || a.startTime.localeCompare(b.startTime))
  const selected = activityIds.includes(group.id)
  return <article className="section activity-detail regular-detail">
    <Link to="/activities">← Вернуться в каталог</Link>
    <h1>{group.title}</h1>
    <p className="notice">Учебные данные: группа, преподаватели и площадка демонстрационные. Это не подтверждённое предложение и не запись на занятие. Указанные контакты относятся к учебному проекту.</p>
    <p className="category">{group.directionIds.map(id => data.directions.find(direction => direction.id === id)?.name ?? MISSING_INFORMATION).join(' · ')}</p>
    <p>{group.description}</p>
    <dl className="detail-facts">
      <InfoRow label="Формат" value={GROUP_FORMAT_LABELS[group.activityFormat]} />
      <InfoRow label="Статус программы" value={ACTIVITY_STATUS_LABELS[group.activityStatus]} />
      <InfoRow label="Модель программы" value={group.programModel === 'openEnded' ? 'Регулярная группа без фиксированного окончания' : 'Последовательные модули'} />
      <InfoRow label="Уровень" value={group.skillLevel} /><InfoRow label="Физическая нагрузка" value={group.physicalLoad} />
    </dl>
    <section className="detail-section"><h2>Еженедельное расписание</h2><p>Время местное, Екатеринбург (UTC+5).</p>
      <ul className="schedule-list">{schedule.map(session => <li key={session.id}>{WEEKDAYS.find(day => day.value === session.weekday)?.label}, {session.startTime}–{session.endTime}</li>)}</ul>
    </section>
    <section className="detail-section"><h2>Стоимость</h2><p>{tariffLabel(group)}</p><p><strong>Ориентировочно за месяц: {money(group.estimatedMonthlyCost)}</strong></p><p className="hero-note">Оценка рассчитана по обычной неделе: оплата за занятие × число сессий в неделю × 4; месячный тариф учитывается один раз. Бесплатные занятия — 0 ₽.</p></section>
    <section className="detail-section"><h2>Место занятий и доступность</h2>{group.activityFormat === 'online' ? <p>Онлайн — без привязки к району</p> : <VenueDetails venue={venue} />}</section>
    {group.activityFormat !== 'offline' && <OnlineDetailsSection details={group.onlineDetails} />}
    <InstructorsSection instructors={data.instructors.filter(instructor => group.instructorIds.includes(instructor.id))} />
    <section className="detail-section"><h2>Организатор</h2><dl className="detail-facts"><InfoRow label="Название" value={organizer?.name} /><InfoRow label="Тип" value={organizer?.type} /><InfoRow label="Описание" value={organizer?.description} /><InfoRow label="Сведения о проверке" value={organizer?.verificationStatus} /></dl></section>
    <section className="detail-section"><h2>Условия участия</h2><p>{group.participationConditions ?? MISSING_INFORMATION}</p></section>
    <section className="detail-section"><h2>Как присоединиться</h2><dl className="detail-facts">
      <InfoRow label="Статус набора" value={ENROLLMENT_LABELS[group.enrollmentStatus]} />
      <InfoRow label="Правило присоединения" value={group.entryPolicy === 'anySession' ? 'Можно присоединиться к любому занятию' : 'Присоединение со следующего модуля'} />
      {(group.nextEntryDate !== undefined || group.entryPolicy === 'nextModule' || group.enrollmentStatus === 'openFromDate') && <InfoRow label="Ближайшая дата входа" value={dataDateLabel(group.nextEntryDate)} />}
      <InfoRow label="Вместимость группы" value={group.capacity} /><InfoRow label="Свободные места" value={group.availablePlaces} />
    </dl><h3>Контакты</h3><OrganizerContacts organizer={organizer} /><p>Реальные условия перед посещением следует уточнить у организатора или по источнику. Для этого учебного примера реальная запись не производится.</p></section>
    <section className="detail-section"><h2>Источник и актуальность</h2><p>{group.source}</p><p>Последнее обновление: <time dateTime={group.lastUpdatedAt}>{dataDateLabel(group.lastUpdatedAt)}</time></p></section>
    <div className="hero-actions"><button type="button" disabled={selected} onClick={() => { const confirmation = onAdd(group.id); if (confirmation) navigate('/activity-added', { state: confirmation }) }}>{selected ? 'Уже в плане' : 'Добавить в мой план'}</button><Link className="hero-button-secondary" to="/activities">Продолжить поиск</Link></div>
    <p className="hero-note">План сохраняется в этом браузере. Добавление в план не является записью на занятие.</p>
  </article>
}
