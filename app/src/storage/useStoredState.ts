import { useEffect, useState } from 'react'
import type { Dispatch, SetStateAction } from 'react'

export default function useStoredState<T>(key: string, validate: (value: unknown) => T): [T, Dispatch<SetStateAction<T>>, boolean] {
  const [value, setValue] = useState<T>(() => {
    try {
      return validate(JSON.parse(localStorage.getItem(key) ?? 'null'))
    } catch {
      return validate(null)
    }
  })
  const [error, setError] = useState(false)
  useEffect(() => {
    let active = true
    // Report the result of the external write after this effect completes.
    queueMicrotask(() => {
      if (!active) return
      try {
        localStorage.setItem(key, JSON.stringify(value))
        setError(false)
      } catch {
        setError(true)
      }
    })
    return () => { active = false }
  }, [key, value])
  return [value, setValue, error]
}
