import type { ActivityGroup, Schedule } from '../../types/domain'
import type { CatalogBudget } from '../../utils/business'

export const WEEKDAYS: { value: Schedule['weekday']; label: string }[] = [
  { value: 1, label: 'Понедельник' }, { value: 2, label: 'Вторник' }, { value: 3, label: 'Среда' },
  { value: 4, label: 'Четверг' }, { value: 5, label: 'Пятница' }, { value: 6, label: 'Суббота' }, { value: 7, label: 'Воскресенье' },
]
export const BUDGET_OPTIONS: { value: CatalogBudget; label: string }[] = [
  { value: null, label: 'Стоимость не важна' }, { value: 0, label: 'Бесплатно' },
  { value: 2000, label: 'До 2 000 ₽' }, { value: 5000, label: 'До 5 000 ₽' }, { value: 10000, label: 'До 10 000 ₽' },
]
export const FORMAT_LABELS = { any: 'Любой формат', offline: 'Очно', online: 'Онлайн' } as const
export const GROUP_FORMAT_LABELS = { offline: 'Очно', online: 'Онлайн', hybrid: 'Очно и онлайн' } as const
export const ENROLLMENT_LABELS = { openNow: 'Можно присоединиться сейчас', openFromDate: 'Набор откроется позже', waitlist: 'Лист ожидания', closed: 'Набор закрыт' } as const
export const ACTIVITY_STATUS_LABELS = { planned: 'Запланирована', active: 'Действует', paused: 'Приостановлена', completed: 'Завершена' } as const
export const MISSING_INFORMATION = 'Информация отсутствует.'
export const accessibilityLabel = (value: boolean | null | undefined) => value == null ? MISSING_INFORMATION : value ? 'Да' : 'Нет'
export function dataDateLabel(value: string | null | undefined): string {
  if (!value) return MISSING_INFORMATION
  const date = new Date(value)
  return Number.isFinite(date.getTime()) ? new Intl.DateTimeFormat('ru-RU', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'Asia/Yekaterinburg' }).format(date) : MISSING_INFORMATION
}
export const money = (value: number) => `${value.toLocaleString('ru-RU')} ₽`
export const budgetLabel = (value: number | null) => BUDGET_OPTIONS.find(option => option.value === value)?.label ?? money(value ?? 0)

export function tariffLabel(group: ActivityGroup): string {
  switch (group.priceType) {
    case 'free': return 'Бесплатно'
    case 'perLesson': return `${money(group.priceAmount)} за занятие`
    case 'monthly': return `${money(group.priceAmount)} в месяц`
  }
}
