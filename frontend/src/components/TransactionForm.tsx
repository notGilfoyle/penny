import { useState, useEffect } from 'react'
import { api } from '../lib/api'
import { todayLocal } from '../lib/format'
import type { Category, PaymentMode, Debt, Transaction, Direction } from '../lib/types'

interface Props {
  onClose: () => void
  onSaved: () => void
  categories: Category[]
  paymentModes: PaymentMode[]
  debts: Debt[]
  initial?: Transaction
}

export function TransactionForm({ onClose, onSaved, categories, paymentModes, debts, initial }: Props) {
  const [direction, setDirection] = useState<Direction>(initial?.direction ?? 'expense')
  const [amount, setAmount] = useState(initial ? String(parseFloat(initial.amount)) : '')
  const [categoryId, setCategoryId] = useState(initial?.category_id ?? '')
  const [txnDate, setTxnDate] = useState(initial?.txn_date ?? todayLocal())
  const [paymentModeId, setPaymentModeId] = useState(initial?.payment_mode_id ?? '')
  const [debtId, setDebtId] = useState(initial?.debt_id ?? '')
  const [note, setNote] = useState(initial?.note ?? '')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const filteredCats = categories.filter(c => c.kind === direction && c.is_active)
  const activeDebts = debts.filter(d => d.is_active)

  // Reset category if it doesn't match the new direction
  useEffect(() => {
    if (categoryId) {
      const cat = categories.find(c => c.id === categoryId)
      if (cat && cat.kind !== direction) setCategoryId('')
    }
    if (direction === 'income') setDebtId('')
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [direction])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (!amount || parseFloat(amount) <= 0) {
      setError('Enter a valid amount')
      return
    }
    if (!categoryId) {
      setError('Select a category')
      return
    }
    setSaving(true)
    try {
      const payload = {
        txn_date: txnDate,
        amount: parseFloat(amount),
        direction,
        category_id: categoryId,
        payment_mode_id: paymentModeId || null,
        debt_id: direction === 'expense' && debtId ? debtId : null,
        note: note.trim() || null,
        source: 'manual' as const,
      }
      if (initial) {
        await api.transactions.update(initial.id, payload)
      } else {
        await api.transactions.create(payload)
      }
      onSaved()
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setSaving(false)
    }
  }

  const inputCls = 'w-full px-3 py-2 border border-slate-200 rounded-lg text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900 bg-white'

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Direction toggle */}
      <div className="flex rounded-xl overflow-hidden border border-slate-200 text-sm font-medium">
        {(['expense', 'income'] as Direction[]).map(d => (
          <button
            key={d}
            type="button"
            onClick={() => setDirection(d)}
            className={`flex-1 py-2.5 capitalize transition-colors ${
              direction === d
                ? d === 'expense'
                  ? 'bg-red-50 text-red-700 border-r border-red-100'
                  : 'bg-green-50 text-green-700'
                : 'text-slate-500 hover:bg-slate-50'
            }`}
          >
            {d}
          </button>
        ))}
      </div>

      {/* Amount */}
      <div>
        <label className="block text-xs font-medium text-slate-500 mb-1.5">Amount (₹) *</label>
        <input
          type="number"
          min="0.01"
          step="0.01"
          value={amount}
          onChange={e => setAmount(e.target.value)}
          className={`${inputCls} text-lg font-semibold`}
          placeholder="0"
          autoFocus
        />
      </div>

      {/* Category */}
      <div>
        <label className="block text-xs font-medium text-slate-500 mb-1.5">Category *</label>
        <select value={categoryId} onChange={e => setCategoryId(e.target.value)} className={inputCls}>
          <option value="">Select…</option>
          {filteredCats.map(c => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
        {filteredCats.length === 0 && (
          <p className="text-xs text-amber-600 mt-1">
            No {direction} categories yet — add some in Categories.
          </p>
        )}
      </div>

      {/* Date */}
      <div>
        <label className="block text-xs font-medium text-slate-500 mb-1.5">Date</label>
        <input
          type="date"
          value={txnDate}
          onChange={e => setTxnDate(e.target.value)}
          className={inputCls}
        />
      </div>

      {/* Payment mode */}
      <div>
        <label className="block text-xs font-medium text-slate-500 mb-1.5">Payment Mode</label>
        <select value={paymentModeId} onChange={e => setPaymentModeId(e.target.value)} className={inputCls}>
          <option value="">None</option>
          {paymentModes.map(m => (
            <option key={m.id} value={m.id}>{m.name}</option>
          ))}
        </select>
      </div>

      {/* Debt repayment (expense only) */}
      {direction === 'expense' && activeDebts.length > 0 && (
        <div>
          <label className="block text-xs font-medium text-slate-500 mb-1.5">Debt Repayment</label>
          <select value={debtId} onChange={e => setDebtId(e.target.value)} className={inputCls}>
            <option value="">Not a repayment</option>
            {activeDebts.map(d => (
              <option key={d.id} value={d.id}>
                {d.name} — ₹{parseFloat(d.remaining_amount).toLocaleString('en-IN')} left
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Note */}
      <div>
        <label className="block text-xs font-medium text-slate-500 mb-1.5">Note</label>
        <input
          type="text"
          value={note}
          onChange={e => setNote(e.target.value)}
          className={inputCls}
          placeholder="What was this for?"
        />
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="flex gap-2 pt-1">
        <button
          type="button"
          onClick={onClose}
          className="flex-1 px-4 py-2.5 border border-slate-200 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={saving}
          className={`flex-1 px-4 py-2.5 rounded-xl text-sm font-medium text-white transition-colors disabled:opacity-50 ${
            direction === 'income' ? 'bg-green-600 hover:bg-green-700' : 'bg-slate-900 hover:bg-slate-800'
          }`}
        >
          {saving ? 'Saving…' : initial ? 'Update' : `Add ${direction}`}
        </button>
      </div>
    </form>
  )
}
