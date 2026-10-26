import { useMemo, useReducer, useRef, useState } from 'react'
import { Link, Route, Routes } from 'react-router-dom'
import { Header } from '../components/layout/Layout'
import RouteFocus from '../components/layout/RouteFocus'
import HomePage from '../pages/HomePage'
import HelpSelectPage from '../pages/HelpSelectPage'
import CatalogPage from '../pages/CatalogPage'
import MyPlanPage from '../pages/MyPlanPage'
import ActivityDetailPage from '../pages/ActivityDetailPage'
import ActivityAddedPage from '../pages/ActivityAddedPage'
import type { AdditionContext } from './additionContext'
import { getCatalogData } from '../data/catalog'
import { aggregatePlan } from '../utils/business'
import type { CatalogFilters } from '../utils/business'
import { initialPlanSession, reducePlanSession } from './planSession'
import type { PlanAction, PlanSession } from './planSession'
import { loadActivityPlan, normalizePlanBudget } from '../storage/activityPlanStorage'
import usePlanPersistence from '../storage/usePlanPersistence'
import '../styles/App.css'

export default function App() {
  const [catalog] = useState(() => getCatalogData().data)
  const [session, dispatch] = useReducer((state: PlanSession, action: PlanAction) => reducePlanSession(state, action, catalog), catalog, data => {
    const loaded = loadActivityPlan(data, new Date().toISOString())
    return initialPlanSession(loaded.plan, loaded.readError)
  })
  const filters: CatalogFilters = { ...session.filters, monthlyBudget: normalizePlanBudget(session.plan.monthlyBudget) }
  const summary = useMemo(() => aggregatePlan(session.plan, catalog), [session.plan, catalog])
  const storageStatus = usePlanPersistence(session.plan, catalog, session.readError)
  const [recentAddition, setRecentAddition] = useState<AdditionContext | null>(null)
  const additionSequence = useRef(0)

  function addGroup(id: string): AdditionContext | null {
    if (session.plan.activityIds.includes(id) || !catalog.groups.some(group => group.id === id)) return null
    const context = { activityId: id, sequence: ++additionSequence.current }
    dispatch({ type: 'add', id, now: new Date().toISOString() })
    setRecentAddition(context)
    return context
  }

  function updateFilters(value: CatalogFilters) {
    dispatch({ type: 'filters', filters: value, now: new Date().toISOString() })
  }

  function removeGroup(id: string) {
    dispatch({ type: 'remove', id, now: new Date().toISOString() })
    if (recentAddition?.activityId === id) setRecentAddition(null)
  }

  return <>
    <a className="skip-link" href="#main-content">Перейти к содержимому</a>
    <Header />
    <RouteFocus />
    <main id="main-content" tabIndex={-1}>
      {storageStatus === 'error' && <p className="warning" role="alert">Не удалось сохранить план в браузере. Текущие изменения работают, но могут потеряться после перезагрузки. Проверьте доступ к локальному хранилищу.</p>}
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/help-select" element={<HelpSelectPage data={catalog} onApply={updateFilters} />} />
        <Route path="/activities" element={<CatalogPage data={catalog} filters={filters} onChange={updateFilters} />} />
        <Route path="/activities/:activityId" element={<ActivityDetailPage data={catalog} activityIds={summary.activityIds} onAdd={addGroup} />} />
        <Route path="/activity-added" element={<ActivityAddedPage data={catalog} recentAddition={recentAddition} activityIds={summary.activityIds} />} />
        <Route path="/my-plan" element={<MyPlanPage data={catalog} summary={summary} lastRemoval={session.lastRemoval} onRemove={removeGroup} onUndo={() => dispatch({ type: 'undo', now: new Date().toISOString() })} storageStatus={storageStatus} />} />
        <Route path="*" element={<section className="section"><h1>Страница не найдена</h1><Link className="hero-button" to="/">На главную</Link></section>} />
      </Routes>
    </main>
  </>
}
