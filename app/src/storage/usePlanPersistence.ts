import { useEffect, useState } from 'react'
import type { ActivityPlan } from '../types/domain'
import type { CatalogData } from '../data/catalog'
import { saveActivityPlan } from './activityPlanStorage'

export type PlanStorageStatus = 'pending' | 'saved' | 'error'

export default function usePlanPersistence(plan: ActivityPlan, data: CatalogData, readError: boolean): PlanStorageStatus {
  const [status, setStatus] = useState<PlanStorageStatus>(readError ? 'error' : 'pending')
  useEffect(() => {
    let active = true
    queueMicrotask(() => {
      if (active) setStatus(saveActivityPlan(plan, data) ? 'saved' : 'error')
    })
    return () => { active = false }
  }, [plan, data])
  return status
}
