import { Link } from 'react-router-dom'
import { useEffect, useRef } from 'react'
import type { CatalogData } from '../data/catalog'
import type { PlanSummary } from '../utils/business'
import type { LastRemoval } from '../app/planSession'
import type { PlanStorageStatus } from '../storage/usePlanPersistence'
import { budgetLabel, money } from '../components/activities/catalogPresentation'
import PlanWarnings from '../components/activities/PlanWarnings'
import WeeklySchedule from '../components/activities/WeeklySchedule'

export default function MyPlanPage({ data, summary, lastRemoval, onRemove, onUndo, storageStatus }: {
  data: CatalogData; summary: PlanSummary; lastRemoval: LastRemoval | null
  onRemove: (id: string) => void; onUndo: () => void; storageStatus: PlanStorageStatus
}) {
  const heading = useRef<HTMLHeadingElement>(null)
  const undoButton = useRef<HTMLButtonElement>(null)
  const groupLinks = useRef(new Map<string, HTMLAnchorElement>())
  const nextFocus = useRef<{ kind: 'undo' } | { kind: 'group'; id: string } | null>(null)
  useEffect(() => {
    const target = nextFocus.current
    if (!target) return
    nextFocus.current = null
    const element = target.kind === 'undo' ? undoButton.current : groupLinks.current.get(target.id)
    const focusTarget = element ?? heading.current
    focusTarget?.focus()
  }, [summary, lastRemoval])
  function remove(id: string) {
    nextFocus.current = { kind: 'undo' }
    onRemove(id)
  }
  function undo() {
    if (lastRemoval) nextFocus.current = { kind: 'group', id: lastRemoval.activityId }
    onUndo()
  }
  const removedTitle = lastRemoval ? data.groups.find(group => group.id === lastRemoval.activityId)?.title : null
  return <section className="section my-plan">
    <h1 ref={heading} tabIndex={-1}>Мой план</h1>
    <div className="plan-overview"><p className="plan-count">Выбрано групп: {summary.groups.length}</p><p className="plan-total">Ориентировочно за месяц: {money(summary.estimatedMonthlyTotal)}</p><p className="current-budget">Бюджет в месяц: {budgetLabel(summary.monthlyBudget)}</p></div>
    <p className="plan-storage-status" role="status">{storageStatus === 'saved' ? 'План сохранён в этом браузере.' : storageStatus === 'error' ? 'Не удалось сохранить план. Изменения пока доступны в текущем сеансе.' : 'Сохранение плана…'}</p>
    <p className="notice">Учебные данные: занятия и площадки демонстрационные. План не подтверждает запись. Реальные условия уточняйте у организатора или по источнику.</p>
    {lastRemoval && <div className="undo-notice"><p role="status">Удалено: {removedTitle}.</p><button ref={undoButton} type="button" className="hero-button-secondary" onClick={undo}>Отменить удаление</button></div>}
    <PlanWarnings summary={summary} />
    {summary.groups.length === 0 ? <div className="empty-plan"><h2>В плане пока нет занятий</h2><p>Найдите регулярные группы и добавьте их с подробной страницы.</p><Link className="hero-button" to="/activities">Найти занятия</Link></div> : <>
      <section aria-labelledby="selected-title"><h2 id="selected-title">Выбранные занятия</h2><ul className="selected-groups">{summary.groups.map(group => <li className="activity-card selected-group" key={group.id} data-group-id={group.id}>
        <h3>{group.title}</h3><p>Ориентировочно за месяц: {money(group.estimatedMonthlyCost)}</p><Link ref={element => { if (element) groupLinks.current.set(group.id, element); else groupLinks.current.delete(group.id) }} to={`/activities/${group.id}`}>Подробнее<span className="sr-only">: {group.title}</span></Link>
        <button type="button" onClick={() => remove(group.id)} aria-label={`Удалить из плана: ${group.title}`}>Удалить из плана</button>
      </li>)}</ul></section>
      <WeeklySchedule summary={summary} data={data} />
    </>}
    <div className="hero-actions"><Link className="hero-button-secondary" to="/activities">Добавить ещё</Link></div>
  </section>
}
