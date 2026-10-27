import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { money } from './catalogPresentation'

export default function CatalogPlanBar({ count, total }: { count: number; total: number }) {
  const bar = useRef<HTMLElement>(null)
  const [height, setHeight] = useState(180)
  useEffect(() => {
    if (!bar.current) return
    const element = bar.current
    const measure = () => setHeight(element.getBoundingClientRect().height)
    measure()
    const observer = new ResizeObserver(measure)
    observer.observe(element)
    return () => observer.disconnect()
  }, [])

  return <>
    <div aria-hidden="true" style={{ height: height + 24 }} />
    <aside ref={bar} className="catalog-plan-bar" aria-label="Краткая информация о плане">
      <div className="catalog-plan-bar-inner">
        <div aria-live="polite" aria-atomic="true"><strong>Выбрано групп: {count}</strong><div>Ориентировочно в месяц: <span className="money-value">{money(total)}</span></div></div>
        <Link className="hero-button" to="/my-plan">В мой план</Link>
      </div>
    </aside>
  </>
}
