import { NavLink } from 'react-router-dom'

export function Header() {
  return (
    <header className="site-header">
      <NavLink className="brand" to="/">Долголетие Маршрут</NavLink>
      <nav aria-label="Основная навигация">
        <NavLink to="/activities">Занятия</NavLink>
        <NavLink to="/my-plan">Мой план</NavLink>
      </nav>
    </header>
  )
}
