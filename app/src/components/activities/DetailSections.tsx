import type { ReactNode } from 'react'
import type { Instructor, Organizer, Venue, OnlineDetails } from '../../types/domain'
import { accessibilityLabel, MISSING_INFORMATION } from './catalogPresentation'

export function InfoRow({ label, value }: { label: string; value: ReactNode }) {
  return <div className="detail-row"><dt>{label}</dt><dd>{value ?? MISSING_INFORMATION}</dd></div>
}

export function OrganizerContacts({ organizer }: { organizer: Organizer | undefined }) {
  if (!organizer || (!organizer.website && !organizer.phone && !organizer.contactLink)) return <p>{MISSING_INFORMATION}</p>
  return <ul className="contact-list">
    {organizer.website && <li><a href={organizer.website}>Сайт организатора: {organizer.website}</a></li>}
    {organizer.phone && <li><a href={`tel:${organizer.phone}`}>Телефон: {organizer.phone}</a></li>}
    {organizer.contactLink && <li><a href={organizer.contactLink}>Контакт учебного проекта: {organizer.contactLink.replace(/^mailto:/, '')}</a></li>}
  </ul>
}

export function VenueDetails({ venue }: { venue: Venue | undefined }) {
  if (!venue) return <p>{MISSING_INFORMATION}</p>
  return <dl className="detail-facts">
    <InfoRow label="Площадка" value={venue.name} /><InfoRow label="Район" value={venue.area} /><InfoRow label="Адрес" value={venue.address} />
    <InfoRow label="Ориентир" value={venue.landmark} /><InfoRow label="Этаж" value={venue.floor} />
    <InfoRow label="Лифт" value={accessibilityLabel(venue.elevator)} /><InfoRow label="Вход без ступеней" value={accessibilityLabel(venue.stepFreeEntrance)} />
    <InfoRow label="Дополнительная информация о доступности" value={venue.accessibilityNotes} />
  </dl>
}

export function OnlineDetailsSection({ details }: { details: OnlineDetails | undefined }) {
  return <section className="detail-section"><h2>Участие онлайн</h2><dl className="detail-facts">
    <InfoRow label="Платформа" value={details?.platform} /><InfoRow label="Требования к устройству" value={details?.deviceRequirements} />
    <InfoRow label="Инструкции подключения" value={details?.connectionInstructions} /><InfoRow label="Контакт поддержки учебного проекта" value={details?.supportContact} />
  </dl></section>
}

export function InstructorsSection({ instructors }: { instructors: readonly Instructor[] }) {
  return <section className="detail-section"><h2>Преподаватель</h2>{instructors.length === 0 ? <p>{MISSING_INFORMATION}</p> : instructors.map(instructor => <div key={instructor.id}>
    {instructor.photo && <img className="instructor-photo" src={instructor.photo} alt={instructor.name} />}
    <h3>{instructor.name}</h3><dl className="detail-facts">
      <InfoRow label="Роль" value={instructor.role} /><InfoRow label="О преподавателе" value={instructor.shortBio} />
      <InfoRow label="Опыт" value={instructor.experience} /><InfoRow label="Квалификация" value={instructor.qualifications} />
    </dl>
  </div>)}</section>
}
