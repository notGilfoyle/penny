import { useSearchParams } from 'react-router-dom'
import { useSummary } from '../hooks/useSummary'
import { formatINR, formatMonthYear } from '../lib/format'
import { MonthSwitcher } from '../components/MonthSwitcher'
import type { MonthlySummary } from '../lib/types'

export function Dashboard() {
  const now = new Date()
  const [params, setParams] = useSearchParams()
  const year = parseInt(params.get('year') ?? String(now.getFullYear()))
  const month = parseInt(params.get('month') ?? String(now.getMonth() + 1))

  const prevMonth = month === 1 ? 12 : month - 1
  const prevYear = month === 1 ? year - 1 : year

  const { summary, loading } = useSummary(year, month)
  const { summary: prevSummary } = useSummary(prevYear, prevMonth)

  const handleMonthChange = (y: number, m: number) => {
    setParams({ year: String(y), month: String(m) })
  }

  const savingsDelta =
    summary !== null && prevSummary !== null
      ? summary.savings - prevSummary.savings
      : null

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-4 sm:px-8 pt-5 sm:pt-7 pb-4 flex items-center justify-between border-b border-slate-100">
        <h1 className="text-lg font-semibold text-slate-900">Overview</h1>
        <MonthSwitcher year={year} month={month} onChange={handleMonthChange} />
      </div>

      <div className="flex-1 overflow-auto px-4 sm:px-8 py-4 sm:py-6 space-y-4 sm:space-y-6">
        {loading && (
          <p className="text-sm text-slate-400 py-8 text-center">Loading…</p>
        )}

        {!loading && (
          <>
            {/* Hero stat cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
              <HeroCard
                label="Income"
                value={formatINR(summary?.income_total ?? 0)}
                valueColor="text-green-600"
              />
              <HeroCard
                label="Expenses"
                value={formatINR(summary?.expense_total ?? 0)}
                valueColor="text-red-600"
              />
              <SavingsCard
                summary={summary}
                delta={savingsDelta}
                prevLabel={formatMonthYear(prevYear, prevMonth)}
              />
            </div>

            {/* Expense breakdown + Debts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 items-start">
              <ExpenseBreakdown
                categories={summary?.expense_by_category ?? []}
                total={summary?.expense_total ?? 0}
              />
              <DebtsPanel debts={summary?.debt_summary ?? []} />
            </div>
          </>
        )}
      </div>
    </div>
  )
}

// ── Hero cards ────────────────────────────────────────────────────────────────

function HeroCard({ label, value, valueColor }: { label: string; value: string; valueColor: string }) {
  return (
    <div className="bg-white rounded-xl border border-slate-100 p-5">
      <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">{label}</p>
      <p className={`text-2xl font-semibold mt-1.5 ${valueColor}`}>{value}</p>
    </div>
  )
}

function SavingsCard({
  summary,
  delta,
  prevLabel,
}: {
  summary: MonthlySummary | null
  delta: number | null
  prevLabel: string
}) {
  const savings = summary?.savings ?? 0
  const rate = summary?.savings_rate ?? 0
  const isPositive = savings >= 0

  return (
    <div className={`rounded-xl border p-5 ${isPositive ? 'bg-slate-900 border-slate-900' : 'bg-red-50 border-red-100'}`}>
      <p className={`text-xs font-medium uppercase tracking-wide ${isPositive ? 'text-slate-400' : 'text-red-400'}`}>
        Saved
      </p>
      <p className={`text-2xl font-semibold mt-1.5 ${isPositive ? 'text-white' : 'text-red-700'}`}>
        {formatINR(savings)}
      </p>
      <div className="mt-2 flex items-center gap-3">
        <span className={`text-xs ${isPositive ? 'text-slate-400' : 'text-red-400'}`}>
          {rate.toFixed(1)}% savings rate
        </span>
        {delta !== null && (
          <span
            className={`text-xs font-medium ${
              delta >= 0
                ? isPositive ? 'text-green-400' : 'text-green-600'
                : isPositive ? 'text-red-400' : 'text-red-600'
            }`}
          >
            {delta >= 0 ? '↑' : '↓'} {formatINR(Math.abs(delta))} vs {prevLabel}
          </span>
        )}
      </div>
    </div>
  )
}

// ── Expense breakdown ─────────────────────────────────────────────────────────

interface ExpenseCat {
  category_id: string
  category_name: string
  amount: number
  percent: number
}

function ExpenseBreakdown({ categories, total }: { categories: ExpenseCat[]; total: number }) {
  const sorted = [...categories].sort((a, b) => b.amount - a.amount)

  return (
    <div className="bg-white rounded-xl border border-slate-100 p-5">
      <h2 className="text-sm font-semibold text-slate-700 mb-4">Expense Breakdown</h2>

      {sorted.length === 0 ? (
        <p className="text-sm text-slate-400 py-4 text-center">No expenses this month.</p>
      ) : (
        <div className="space-y-3">
          {sorted.map(cat => (
            <div key={cat.category_id}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm text-slate-700 truncate max-w-[55%]">{cat.category_name}</span>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-xs text-slate-400">{cat.percent.toFixed(1)}%</span>
                  <span className="text-sm font-medium text-slate-900">{formatINR(cat.amount)}</span>
                </div>
              </div>
              <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-red-400 rounded-full"
                  style={{ width: `${cat.percent}%` }}
                />
              </div>
            </div>
          ))}

          <div className="pt-2 mt-1 border-t border-slate-100 flex justify-between">
            <span className="text-xs font-medium text-slate-500">Total</span>
            <span className="text-sm font-semibold text-slate-900">{formatINR(total)}</span>
          </div>
        </div>
      )}
    </div>
  )
}

// ── Debts panel ───────────────────────────────────────────────────────────────

interface DebtItem {
  debt_id: string
  name: string
  total_amount: number
  remaining_amount: number
  paid_amount: number
  percent_paid: number
}

function DebtsPanel({ debts }: { debts: DebtItem[] }) {
  const active = debts.filter(d => d.remaining_amount > 0)

  return (
    <div className="bg-white rounded-xl border border-slate-100 p-5">
      <h2 className="text-sm font-semibold text-slate-700 mb-4">Active Debts</h2>

      {active.length === 0 ? (
        <p className="text-sm text-slate-400 py-4 text-center">
          {debts.length === 0 ? 'No debts tracked.' : 'All debts paid off!'}
        </p>
      ) : (
        <div className="space-y-4">
          {active.map(debt => (
            <div key={debt.debt_id}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm text-slate-700 truncate max-w-[55%]">{debt.name}</span>
                <span className="text-xs text-slate-400 shrink-0">
                  {formatINR(debt.remaining_amount)} left
                </span>
              </div>
              <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-orange-400 rounded-full transition-all"
                  style={{ width: `${debt.percent_paid}%` }}
                />
              </div>
              <div className="flex justify-between mt-1">
                <span className="text-xs text-slate-400">
                  {formatINR(debt.paid_amount)} paid
                </span>
                <span className="text-xs text-slate-400">
                  {debt.percent_paid.toFixed(0)}% of {formatINR(debt.total_amount)}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
