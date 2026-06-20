import { useState, useEffect, useCallback } from 'react'
import { api } from '../lib/api'
import type { Transaction } from '../lib/types'

export function useTransactions(year: number, month: number) {
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const data = await api.transactions.list({ year, month })
      setTransactions(data)
    } catch (e) {
      console.error('useTransactions:', e)
    } finally {
      setLoading(false)
    }
  }, [year, month])

  useEffect(() => { void load() }, [load])

  return { transactions, loading, refetch: load }
}
