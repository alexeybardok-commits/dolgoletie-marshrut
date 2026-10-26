import { Link } from 'react-router-dom'
import { budgetLabel } from '../components/activities/catalogPresentation'

export function MyPlanPending({ monthlyBudget }: { monthlyBudget: number | null }) {
  return <section className="section"><h1>Мой план</h1><p className="notice">Недельный план регулярных занятий появится на следующем этапе. Сейчас можно подобрать группы в каталоге.</p><p className="current-budget">Бюджет в месяц: {budgetLabel(monthlyBudget)}</p><Link className="hero-button-secondary" to="/activities">Вернуться к подбору</Link></section>
}
