import { useState, useEffect, useCallback } from 'react'
import { api } from '../lib/api'
import type { MonthTrend } from '../lib/types'

export function useTrend(months: number) {
  const [trend, setTrend] = useState<MonthTrend[]>([])
  const [loading, setLoading] = useState(true)

  const refetch = useCallback(async () => {
    setLoading(true)
    try {
      const data = await api.summary.trend(months)
      setTrend(data)
    } finally {
      setLoading(false)
    }
  }, [months])

  useEffect(() => { void refetch() }, [refetch])

  return { trend, loading, refetch }
}
