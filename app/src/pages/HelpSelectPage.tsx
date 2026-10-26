import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import type { CatalogData } from '../data/catalog'
import type { SelectionPreferences } from '../types/domain'
import type { CatalogFilters } from '../utils/business'
import { preferencesToFilters } from '../utils/business/helpSelect'
import { ChoiceGroup, BudgetSelect, FormatSelect } from '../components/common/CatalogFields'

export default function HelpSelectPage({ data, onApply }: { data: CatalogData; onApply: (filters: CatalogFilters) => void }) {
  const [answers, setAnswers] = useState<SelectionPreferences & { monthlyBudget: CatalogFilters['monthlyBudget'] }>({ directionIds: [], areaIds: [], preferredPeriod: 'any', preferredFormat: 'any', monthlyBudget: null })
  const navigate = useNavigate()
  return <section className="section help-select">
    <h1>Помочь подобрать</h1>
    <p>Выберите удобные условия — мы настроим обычные фильтры каталога. Можно оставить любые параметры без ограничений.</p>
    <form onSubmit={event => { event.preventDefault(); onApply(preferencesToFilters(answers)); navigate('/activities') }}>
      <ChoiceGroup legend="Направление" options={data.directions.filter(direction => direction.active).map(direction => ({ value: direction.id, label: direction.name }))} selected={answers.directionIds} onChange={directionIds => setAnswers({ ...answers, directionIds })} />
      <ChoiceGroup legend="Район" options={[...new Set(data.venues.map(venue => venue.area))].map(area => ({ value: area, label: area }))} selected={answers.areaIds} onChange={areaIds => setAnswers({ ...answers, areaIds })} />
      <div className="filters">
        <div className="form-field"><label htmlFor="preferred-period">Удобное время</label><select id="preferred-period" value={answers.preferredPeriod} onChange={event => setAnswers({ ...answers, preferredPeriod: event.target.value as SelectionPreferences['preferredPeriod'] })}>
          <option value="any">Любое время</option><option value="morning">Утро · 08:00–11:59</option><option value="day">День · 12:00–16:59</option><option value="evening">Вечер · 17:00–21:00</option>
        </select></div>
        <FormatSelect value={answers.preferredFormat} onChange={preferredFormat => setAnswers({ ...answers, preferredFormat })} />
        <BudgetSelect value={answers.monthlyBudget} onChange={monthlyBudget => setAnswers({ ...answers, monthlyBudget })} />
      </div>
      <div className="hero-actions"><button className="hero-button" type="submit">Показать занятия</button><Link className="hero-button-secondary" to="/activities">Перейти в каталог без анкеты</Link></div>
    </form>
  </section>
}
