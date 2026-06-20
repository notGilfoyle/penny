import type {
  Category,
  PaymentMode,
  Debt,
  Transaction,
  RecurringRule,
  MonthlySummary,
  MonthTrend,
  Direction,
} from './types'

const BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:8000'

async function req<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...init,
  })
  if (res.status === 204) return undefined as T
  const json = await res.json()
  if (!res.ok) throw new Error(json.detail ?? `HTTP ${res.status}`)
  return json as T
}

function qs(params: Record<string, string | number | boolean | undefined | null>): string {
  const p = new URLSearchParams()
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== null) p.set(k, String(v))
  }
  const s = p.toString()
  return s ? `?${s}` : ''
}

export const api = {
  categories: {
    list: (p?: { kind?: string; active_only?: boolean }) =>
      req<Category[]>(`/categories${qs({ ...p })}`),
    create: (body: { name: string; kind: string }) =>
      req<Category>('/categories', { method: 'POST', body: JSON.stringify(body) }),
    update: (id: string, body: { name?: string; is_active?: boolean }) =>
      req<Category>(`/categories/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
    archive: (id: string) =>
      req<void>(`/categories/${id}`, { method: 'DELETE' }),
  },

  paymentModes: {
    list: (p?: { active_only?: boolean }) =>
      req<PaymentMode[]>(`/payment-modes${qs({ ...p })}`),
    create: (body: { name: string }) =>
      req<PaymentMode>('/payment-modes', { method: 'POST', body: JSON.stringify(body) }),
    update: (id: string, body: { name?: string; is_active?: boolean }) =>
      req<PaymentMode>(`/payment-modes/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
    archive: (id: string) =>
      req<void>(`/payment-modes/${id}`, { method: 'DELETE' }),
  },

  debts: {
    list: (p?: { active_only?: boolean }) =>
      req<Debt[]>(`/debts${qs({ ...p })}`),
    get: (id: string) => req<Debt>(`/debts/${id}`),
    create: (body: { name: string; total_amount: number; opened_date: string }) =>
      req<Debt>('/debts', { method: 'POST', body: JSON.stringify(body) }),
    update: (id: string, body: { name?: string; total_amount?: number; is_active?: boolean }) =>
      req<Debt>(`/debts/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
    archive: (id: string) =>
      req<void>(`/debts/${id}`, { method: 'DELETE' }),
  },

  transactions: {
    list: (p?: { year?: number; month?: number; direction?: Direction; category_id?: string; debt_id?: string }) =>
      req<Transaction[]>(`/transactions${qs({ ...p })}`),
    get: (id: string) => req<Transaction>(`/transactions/${id}`),
    create: (body: {
      txn_date: string
      amount: number
      direction: Direction
      category_id: string
      payment_mode_id?: string | null
      debt_id?: string | null
      recurring_rule_id?: string | null
      note?: string | null
      source?: string
    }) => req<Transaction>('/transactions', { method: 'POST', body: JSON.stringify(body) }),
    update: (id: string, body: {
      txn_date?: string
      amount?: number
      category_id?: string
      payment_mode_id?: string | null
      debt_id?: string | null
      note?: string | null
    }) => req<Transaction>(`/transactions/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
    delete: (id: string) => req<void>(`/transactions/${id}`, { method: 'DELETE' }),
  },

  recurringRules: {
    list: (p?: { active_only?: boolean }) =>
      req<RecurringRule[]>(`/recurring-rules${qs({ ...p })}`),
    pending: (year: number, month: number) =>
      req<RecurringRule[]>(`/recurring-rules/pending${qs({ year, month })}`),
    create: (body: object) =>
      req<RecurringRule>('/recurring-rules', { method: 'POST', body: JSON.stringify(body) }),
    update: (id: string, body: object) =>
      req<RecurringRule>(`/recurring-rules/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
    delete: (id: string) =>
      req<void>(`/recurring-rules/${id}`, { method: 'DELETE' }),
  },

  summary: {
    get: (year: number, month: number) =>
      req<MonthlySummary>(`/summary/${year}/${month}`),
    trend: (months?: number) =>
      req<MonthTrend[]>(`/summary/trend${qs({ months })}`),
  },
}
