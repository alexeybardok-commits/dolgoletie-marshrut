import { Link, useLocation } from 'react-router-dom'
import type { CatalogData } from '../data/catalog'
import { confirmedActivityId } from '../app/additionContext'
import type { AdditionContext } from '../app/additionContext'

export default function ActivityAddedPage({ data, recentAddition, activityIds }: { data: CatalogData; recentAddition: AdditionContext | null; activityIds: readonly string[] }) {
  const location = useLocation()
  const id = confirmedActivityId(location.state, recentAddition, activityIds)
  const group = data.groups.find(group => group.id === id)
  return <section className="section activity-added">
    <h1>{group ? 'Занятие добавлено в план' : 'Нет недавнего добавления'}</h1>
    {group ? <><p className="added-title">{group.title}</p><p>Группа выбрана для вашего плана. Это не запись на занятие. План сохраняется в этом браузере.</p></> : <p>Здесь появится подтверждение после добавления занятия с подробной страницы. Сейчас подтверждать добавление нельзя.</p>}
    <div className="hero-actions"><Link className="hero-button" to="/my-plan">Перейти в мой план</Link><Link className="hero-button-secondary" to="/activities">Продолжить поиск</Link></div>
  </section>
}
