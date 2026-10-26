import { Link } from 'react-router-dom'
import { useRef } from 'react'
import type { CatalogData } from '../data/catalog'
import { emptyCatalogFilters, filterCatalog, orderCatalog } from '../utils/business'
import type { CatalogFilters } from '../utils/business'
import CatalogFields from '../components/common/CatalogFields'
import ActiveFilters from '../components/activities/ActiveFilters'
import ActivityCard from '../components/activities/ActivityCard'
import AdditionalFilters from '../components/activities/AdditionalFilters'

export default function CatalogPage({ data, filters, onChange }: { data: CatalogData; filters: CatalogFilters; onChange: (filters: CatalogFilters) => void }) {
  const search = useRef<HTMLInputElement>(null)
  const groups = orderCatalog(filterCatalog(data, filters), data.venues, filters.areaIds)
  const reset = () => onChange(emptyCatalogFilters())
  const resetFromEmpty = () => { reset(); search.current?.focus() }
  return <section className="section">
    <h1>Каталог занятий</h1>
    <p className="notice">Учебные данные: группы, организаторы и площадки демонстрационные. Это не подтверждённая афиша. Перед посещением уточняйте реальные условия у организатора или по указанному источнику.</p>
    <p><Link to="/help-select">Помочь подобрать</Link></p>
    <form id="catalog-filters" tabIndex={-1} onSubmit={event => event.preventDefault()}>
      <div className="catalog-search"><label htmlFor="catalog-query">Поиск по каталогу</label>
        <div className="catalog-search-controls"><input ref={search} id="catalog-query" type="search" value={filters.query} onChange={event => onChange({ ...filters, query: event.target.value })} aria-describedby="catalog-search-help" placeholder="Название, преподаватель или район" />
          {filters.query.length > 0 && <button type="button" className="hero-button-secondary" onClick={() => { onChange({ ...filters, query: '' }); search.current?.focus() }}>Очистить поиск</button>}</div>
        <p id="catalog-search-help" className="hero-note">Поиск по названию, описанию, направлению, преподавателю, организатору, площадке, району и ориентиру.</p>
      </div>
      <CatalogFields data={data} filters={filters} onChange={onChange} />
      <AdditionalFilters data={data} filters={filters} onChange={onChange} />
      <button type="button" className="hero-button-secondary" onClick={reset}>Сбросить всё</button>
    </form>
    <ActiveFilters data={data} filters={filters} onChange={onChange} />
    <p role="status">Найдено групп: {groups.length}</p>
    {groups.length === 0 ? <div className="notice empty-catalog"><h2>По этим условиям занятий нет</h2><p>Попробуйте изменить поисковый запрос или выбранные условия.</p><div className="hero-actions"><a className="hero-button-secondary" href="#catalog-filters">Изменить фильтры</a><button type="button" className="hero-button" onClick={resetFromEmpty}>Сбросить фильтры</button></div></div>
      : <div className="activity-grid">{groups.map(group => <ActivityCard key={group.id} group={group} data={data} />)}</div>}
  </section>
}
