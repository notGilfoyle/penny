import { useState, useEffect } from 'react'
import { api } from '../lib/api'
import { todayLocal } from '../lib/format'
import type { Category, PaymentMode, RecurringRule, Direction } from '../lib/types'

interface Props {
  categories: Category[]
  paymentModes: PaymentMode[]
  initial?: RecurringRule
  onClose: () => void
  onSaved: () => void
}

export function RecurringRuleForm({ categories, paymentModes, initial, onClose, onSaved }: Props) {
  const [name, setName] = useState(initial?.name ?? '')
  const [direction, setDirection] = useState<Direction>(initial?.direction ?? 'expense')
  const [amount, setAmount] = useState(initial ? String(parseFloat(initial.amount)) : '')
  const [categoryId, setCategoryId] = useState(initial?.category_id ?? '')
  const [paymentModeId, setPaymentModeId] = useState(initial?.payment_mode_id ?? '')
  const [dayOfMonth, setDayOfMonth] = useState(String(initial?.day_of_month ?? 1))
  const [startDate, setStartDate] = useState(initial?.start_date ?? todayLocal())
  const [endDate, setEndDate] = useState(initial?.end_date ?? '')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const filteredCats = categories.filter(c => c.kind === direction && c.is_active)

  useEffect(() => {
    if (categoryId) {
      const cat = categories.find(c => c.id === categoryId)
      if (cat && cat.kind !== direction) setCategoryId('')
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [direction])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    const day = parseInt(dayOfMonth)
    if (!name.trim()) { setError('Enter a name'); return }
    if (!amount || parseFloat(amount) <= 0) { setError('Enter a valid amount'); return }
    if (!categoryId) { setError('Select a category'); return }
    if (!day || day < 1 || day > 31) { setError('Day must be between 1 and 31'); return }

    setSaving(true)
    try {
      const payload = {
        name: name.trim(),
        direction,
        amount: parseFloat(amount),
        category_id: categoryId,
        payment_mode_id: paymentModeId || null,
        day_of_month: day,
        start_date: startDate,
        end_date: endDate || null,
      }
      if (initial) {
        await api.recurringRules.update(initial.id, payload)
      } else {
        await api.recurringRules.create(payload)
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
      {/* Direction */}
      <div className="flex rounded-xl overflow-hidden border border-slate-200 text-sm font-medium">
        {(['expense', 'income'] as Direction[]).map(d => (
          <button
            key={d}
            type="button"
            onClick={() => setDirection(d)}
            className={`flex-1 py-2.5 capitalize transition-colors ${
              direction === d
                ? d === 'expense' ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'
                : 'text-slate-500 hover:bg-slate-50'
            }`}
          >
            {d}
          </button>
        ))}
      </div>

      {/* Name */}
      <div>
        <label className="block text-xs font-medium text-slate-500 mb-1.5">Rule Name *</label>
        <input
          autoFocus
          value={name}
          onChange={e => setName(e.target.value)}
          className={inputCls}
          placeholder="e.g. Rent, Salary, Netflix"
        />
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
        />
      </div>

      {/* Category */}
      <div>
        <label className="block text-xs font-medium text-slate-500 mb-1.5">Category *</label>
        <select value={categoryId} onChange={e => setCategoryId(e.target.value)} className={inputCls}>
          <option value="">Select…</option>
          {filteredCats.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        {filteredCats.length === 0 && (
          <p className="text-xs text-amber-600 mt-1">No {direction} categories — add some in Categories.</p>
        )}
      </div>

      {/* Day of month + Payment mode */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium text-slate-500 mb-1.5">Day of Month *</label>
          <input
            type="number"
            min="1"
            max="31"
            value={dayOfMonth}
            onChange={e => setDayOfMonth(e.target.value)}
            className={inputCls}
            placeholder="1"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-500 mb-1.5">Payment Mode</label>
          <select value={paymentModeId} onChange={e => setPaymentModeId(e.target.value)} className={inputCls}>
            <option value="">None</option>
            {paymentModes.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
          </select>
        </div>
      </div>

      {/* Start date + End date */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium text-slate-500 mb-1.5">Start Date</label>
          <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className={inputCls} />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-500 mb-1.5">End Date (optional)</label>
          <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className={inputCls} />
        </div>
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
          className="flex-1 px-4 py-2.5 bg-slate-900 rounded-xl text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-50 transition-colors"
        >
          {saving ? 'Saving…' : initial ? 'Update Rule' : 'Add Rule'}
        </button>
      </div>
    </form>
  )
}
