import type { PlanSummary } from '../../utils/business'
import { money, WEEKDAYS } from './catalogPresentation'

const weekday = (value: number) => WEEKDAYS.find(day => day.value === value)?.label

export default function PlanWarnings({ summary }: { summary: PlanSummary }) {
  if (!summary.timeConflicts.length && !summary.roadWarnings.length && !summary.budgetWarning) return null
  return <section className="warning plan-warnings" id="plan-warnings" aria-labelledby="warnings-title">
    <h2 id="warnings-title">На что обратить внимание</h2>
    <p>Предупреждения не запрещают добавлять занятия. Проверьте удобство расписания и бюджета.</p>
    <ul>
      {summary.timeConflicts.map(warning => <li className="time-warning" key={`time-${warning.first.session.id}-${warning.second.session.id}`}>
        <strong>Пересечение по времени.</strong> {weekday(warning.first.session.weekday)}: «{warning.first.group.title}» ({warning.first.session.startTime}–{warning.first.session.endTime}) и «{warning.second.group.title}» ({warning.second.session.startTime}–{warning.second.session.endTime}).
      </li>)}
      {summary.roadWarnings.map(warning => <li className="road-warning" key={`road-${warning.first.session.id}-${warning.second.session.id}`}>
        <strong>Мало времени на дорогу.</strong> {weekday(warning.first.session.weekday)}: между «{warning.first.group.title}» и «{warning.second.group.title}» — {warning.gapMinutes} мин., площадки разные. Это предупреждение по фиксированному порогу 30 минут, а не расчёт реального пути.
      </li>)}
      {summary.budgetWarning && <li className="budget-warning"><strong>Превышение бюджета.</strong> Ориентировочная сумма {money(summary.budgetWarning.estimatedMonthlyTotal)} превышает бюджет {money(summary.budgetWarning.monthlyBudget)} на {money(summary.budgetWarning.excess)}.</li>}
    </ul>
  </section>
}
