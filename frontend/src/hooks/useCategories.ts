import { useState, useEffect, useCallback } from 'react'
import { api } from '../lib/api'
import type { Category } from '../lib/types'

export function useCategories(activeOnly = false) {
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const data = await api.categories.list({ active_only: activeOnly })
      setCategories(data)
    } catch (e) {
      console.error('useCategories:', e)
    } finally {
      setLoading(false)
    }
  }, [activeOnly])

  useEffect(() => { void load() }, [load])

  return { categories, loading, refetch: load }
}
