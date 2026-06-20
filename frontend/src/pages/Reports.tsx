import { useState } from 'react'
import {
  AreaChart, Area, BarChart, Bar, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts'
import { useTrend } from '../hooks/useTrend'
import { api } from '../lib/api'
import { formatINR, formatINRShort, formatMonthShort } from '../lib/format'
import type { Transaction } from '../lib/types'

export function Reports() {
  const [months, setMonths] = useState(6)
  const { trend, loading } = useTrend(months)
  const [exporting, setExporting] = useState(false)

  const chartData = trend.map(d => ({
    name: formatMonthShort(d.year, d.month),
    income: d.income_total,
    expenses: d.expense_total,
    savings: d.savings,
  }))

  const handleExport = async () => {
    setExporting(true)
    try {
      const transactions = await api.transactions.list()
      downloadCSV(generateCSV(transactions), 'penny-transactions.csv')
    } finally {
      setExporting(false)
    }
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-4 sm:px-8 pt-5 sm:pt-7 pb-4 flex items-center justify-between border-b border-slate-100">
        <div>
          <h1 className="text-lg font-semibold text-slate-900">Reports</h1>
          <p className="text-sm text-slate-500 mt-0.5">Month-over-month trends.</p>
        </div>
        <div className="flex items-center gap-3">
          {/* Period selector */}
          <div className="flex rounded-lg overflow-hidden border border-slate-200 text-xs font-medium">
            {[3, 6, 12].map(m => (
              <button
                key={m}
                onClick={() => setMonths(m)}
                className={`px-3 py-1.5 transition-colors ${
                  months === m ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-50'
                }`}
              >
                {m}M
              </button>
            ))}
          </div>
          <button
            onClick={handleExport}
            disabled={exporting}
            className="px-4 py-1.5 border border-slate-200 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50 transition-colors"
          >
            {exporting ? 'Exporting…' : 'Export CSV'}
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-auto px-4 sm:px-8 py-4 sm:py-6 space-y-4 sm:space-y-6">
        {loading && (
          <p className="text-sm text-slate-400 py-8 text-center">Loading…</p>
        )}

        {!loading && chartData.every(d => d.income === 0 && d.expenses === 0) && (
          <div className="text-center py-16 text-slate-400 text-sm">
            No data yet. Add transactions to see trends.
          </div>
        )}

        {!loading && chartData.some(d => d.income > 0 || d.expenses > 0) && (
          <>
            {/* Income vs Expenses */}
            <ChartCard title="Income vs Expenses">
              <ResponsiveContainer width="100%" height={240}>
                <AreaChart data={chartData} margin={{ top: 5, right: 10, bottom: 0, left: 10 }}>
                  <defs>
                    <linearGradient id="incomeGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#22c55e" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="expenseGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#ef4444" stopOpacity={0.15} />
                      <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                  <XAxis
                    dataKey="name"
                    tick={{ fontSize: 11, fill: '#94a3b8' }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fontSize: 11, fill: '#94a3b8' }}
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={formatINRShort}
                    width={52}
                  />
                  <Tooltip
                    formatter={(value, name) => [formatINR(Number(value ?? 0)), String(name)]}
                    contentStyle={{ fontSize: 12, borderColor: '#e2e8f0', borderRadius: 8 }}
                    labelStyle={{ color: '#475569', fontWeight: 600 }}
                  />
                  <Legend
                    iconType="circle"
                    iconSize={8}
                    wrapperStyle={{ fontSize: 12, paddingTop: 8 }}
                  />
                  <Area
                    type="monotone"
                    dataKey="income"
                    name="Income"
                    stroke="#22c55e"
                    strokeWidth={2}
                    fill="url(#incomeGrad)"
                    dot={false}
                    activeDot={{ r: 4 }}
                  />
                  <Area
                    type="monotone"
                    dataKey="expenses"
                    name="Expenses"
                    stroke="#ef4444"
                    strokeWidth={2}
                    fill="url(#expenseGrad)"
                    dot={false}
                    activeDot={{ r: 4 }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </ChartCard>

            {/* Savings */}
            <ChartCard title="Monthly Savings">
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={chartData} margin={{ top: 5, right: 10, bottom: 0, left: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                  <XAxis
                    dataKey="name"
                    tick={{ fontSize: 11, fill: '#94a3b8' }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fontSize: 11, fill: '#94a3b8' }}
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={formatINRShort}
                    width={52}
                  />
                  <Tooltip
                    formatter={(value) => [formatINR(Number(value ?? 0)), 'Savings']}
                    contentStyle={{ fontSize: 12, borderColor: '#e2e8f0', borderRadius: 8 }}
                    labelStyle={{ color: '#475569', fontWeight: 600 }}
                  />
                  <Bar dataKey="savings" name="Savings" radius={[4, 4, 0, 0]} maxBarSize={48}>
                    {chartData.map((entry, i) => (
                      <Cell key={i} fill={entry.savings >= 0 ? '#22c55e' : '#ef4444'} fillOpacity={0.85} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </ChartCard>

            {/* Summary table */}
            <SummaryTable data={chartData} />
          </>
        )}
      </div>
    </div>
  )
}

// ── Chart card wrapper ────────────────────────────────────────────────────────

function ChartCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-xl border border-slate-100 p-5">
      <h2 className="text-sm font-semibold text-slate-700 mb-4">{title}</h2>
      {children}
    </div>
  )
}

// ── Summary table ─────────────────────────────────────────────────────────────

interface Row { name: string; income: number; expenses: number; savings: number }

function SummaryTable({ data }: { data: Row[] }) {
  const sorted = [...data].reverse()
  return (
    <div className="bg-white rounded-xl border border-slate-100 overflow-hidden">
      <div className="px-5 py-4 border-b border-slate-100">
        <h2 className="text-sm font-semibold text-slate-700">Monthly Breakdown</h2>
      </div>
      <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-slate-100 text-xs text-slate-400 uppercase tracking-wide">
            <th className="px-5 py-2.5 text-left font-medium">Month</th>
            <th className="px-5 py-2.5 text-right font-medium">Income</th>
            <th className="px-5 py-2.5 text-right font-medium">Expenses</th>
            <th className="px-5 py-2.5 text-right font-medium">Saved</th>
          </tr>
        </thead>
        <tbody>
          {sorted.map(row => (
            <tr key={row.name} className="border-b border-slate-50 last:border-0 hover:bg-slate-50 transition-colors">
              <td className="px-5 py-3 font-medium text-slate-700">{row.name}</td>
              <td className="px-5 py-3 text-right text-green-600">{formatINR(row.income)}</td>
              <td className="px-5 py-3 text-right text-slate-700">{formatINR(row.expenses)}</td>
              <td className={`px-5 py-3 text-right font-semibold ${row.savings >= 0 ? 'text-slate-900' : 'text-red-600'}`}>
                {formatINR(row.savings)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      </div>
    </div>
  )
}

// ── CSV helpers ───────────────────────────────────────────────────────────────

function generateCSV(transactions: Transaction[]): string {
  const header = 'Date,Category,Direction,Amount,Payment Mode,Debt,Note'
  const rows = [...transactions]
    .sort((a, b) => a.txn_date.localeCompare(b.txn_date))
    .map(t =>
      [
        t.txn_date,
        `"${t.category_name.replace(/"/g, '""')}"`,
        t.direction,
        t.amount,
        t.payment_mode_name ?? '',
        t.debt_name ?? '',
        `"${(t.note ?? '').replace(/"/g, '""')}"`,
      ].join(',')
    )
  return [header, ...rows].join('\n')
}

function downloadCSV(content: string, filename: string) {
  const blob = new Blob(['﻿' + content], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}
