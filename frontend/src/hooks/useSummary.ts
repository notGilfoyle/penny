import { useState, useEffect, useCallback } from 'react'
import { api } from '../lib/api'
import type { MonthlySummary } from '../lib/types'

export function useSummary(year: number, month: number) {
  const [summary, setSummary] = useState<MonthlySummary | null>(null)
  const [loading, setLoading] = useState(true)

  const refetch = useCallback(async () => {
    setLoading(true)
    try {
      const data = await api.summary.get(year, month)
      setSummary(data)
    } catch {
      setSummary(null)
    } finally {
      setLoading(false)
    }
  }, [year, month])

  useEffect(() => { void refetch() }, [refetch])

  return { summary, loading, refetch }
}
