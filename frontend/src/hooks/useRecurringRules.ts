import { useState, useEffect, useCallback } from 'react'
import { api } from '../lib/api'
import type { RecurringRule } from '../lib/types'

export function useRecurringRules(activeOnly = false) {
  const [rules, setRules] = useState<RecurringRule[]>([])
  const [loading, setLoading] = useState(true)

  const refetch = useCallback(async () => {
    setLoading(true)
    try {
      const data = await api.recurringRules.list({ active_only: activeOnly })
      setRules(data)
    } finally {
      setLoading(false)
    }
  }, [activeOnly])

  useEffect(() => { void refetch() }, [refetch])

  return { rules, loading, refetch }
}

export function usePendingRules(year: number, month: number) {
  const [pending, setPending] = useState<RecurringRule[]>([])
  const [loading, setLoading] = useState(true)

  const refetch = useCallback(async () => {
    setLoading(true)
    try {
      const data = await api.recurringRules.pending(year, month)
      setPending(data)
    } finally {
      setLoading(false)
    }
  }, [year, month])

  useEffect(() => { void refetch() }, [refetch])

  return { pending, loading, refetch }
}
