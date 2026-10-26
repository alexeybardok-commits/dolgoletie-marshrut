import { useEffect, useRef } from 'react'
import { useLocation } from 'react-router-dom'

/** Announce a new SPA page through its heading and start Tab in its content.
 * Initial load keeps the normal document order, including the skip link.
 * Hash links within the current page retain native focus/scroll behavior.
 */
export default function RouteFocus() {
  const { pathname } = useLocation()
  const previousPath = useRef(pathname)
  useEffect(() => {
    if (previousPath.current === pathname) return
    previousPath.current = pathname
    const heading = document.querySelector<HTMLElement>('main h1')
    if (heading) {
      heading.tabIndex = -1
      heading.focus({ preventScroll: true })
    }
    window.scrollTo(0, 0)
  }, [pathname])
  return null
}
