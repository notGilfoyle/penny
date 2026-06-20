import { useState, useEffect, useCallback } from 'react'
import { api } from '../lib/api'
import type { Debt } from '../lib/types'

export function useDebts(activeOnly = true) {
  const [debts, setDebts] = useState<Debt[]>([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const data = await api.debts.list({ active_only: activeOnly })
      setDebts(data)
    } catch (e) {
      console.error('useDebts:', e)
    } finally {
      setLoading(false)
    }
  }, [activeOnly])

  useEffect(() => { void load() }, [load])

  return { debts, loading, refetch: load }
}
