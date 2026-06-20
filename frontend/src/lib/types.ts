export type Direction = 'income' | 'expense'
export type TransactionSource = 'manual' | 'imported' | 'parsed'
export type CategoryKind = 'income' | 'expense'

export interface Category {
  id: string
  name: string
  kind: CategoryKind
  is_active: boolean
  created_at: string
}

export interface PaymentMode {
  id: string
  name: string
  is_active: boolean
  created_at: string
}

// Decimal fields come back as strings from Pydantic
export interface Debt {
  id: string
  name: string
  total_amount: string
  opened_date: string
  is_active: boolean
  created_at: string
  remaining_amount: string
  paid_amount: string
  percent_paid: number
}

export interface Transaction {
  id: string
  txn_date: string
  amount: string
  direction: Direction
  category_id: string
  category_name: string
  payment_mode_id: string | null
  payment_mode_name: string | null
  debt_id: string | null
  debt_name: string | null
  recurring_rule_id: string | null
  note: string | null
  source: TransactionSource
  created_at: string
}

export interface RecurringRule {
  id: string
  name: string
  amount: string
  direction: Direction
  category_id: string
  category_name: string
  payment_mode_id: string | null
  payment_mode_name: string | null
  day_of_month: number
  start_date: string
  end_date: string | null
  is_active: boolean
  created_at: string
}

export interface MonthTrend {
  year: number
  month: number
  income_total: number
  expense_total: number
  savings: number
  savings_rate: number
}

export interface MonthlySummary {
  year: number
  month: number
  income_total: number
  expense_total: number
  savings: number
  savings_rate: number
  expense_by_category: {
    category_id: string
    category_name: string
    amount: number
    percent: number
  }[]
  debt_summary: {
    debt_id: string
    name: string
    total_amount: number
    remaining_amount: number
    paid_amount: number
    percent_paid: number
  }[]
}
