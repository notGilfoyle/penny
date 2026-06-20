import { useState, useEffect, useCallback } from 'react'
import { api } from '../lib/api'
import type { PaymentMode } from '../lib/types'

export function usePaymentModes(activeOnly = true) {
  const [paymentModes, setPaymentModes] = useState<PaymentMode[]>([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const data = await api.paymentModes.list({ active_only: activeOnly })
      setPaymentModes(data)
    } catch (e) {
      console.error('usePaymentModes:', e)
    } finally {
      setLoading(false)
    }
  }, [activeOnly])

  useEffect(() => { void load() }, [load])

  return { paymentModes, loading, refetch: load }
}
