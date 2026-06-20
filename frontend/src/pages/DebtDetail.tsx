import { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { api } from '../lib/api'
import { formatINR, formatDate } from '../lib/format'
import { Modal } from '../components/Modal'
import type { Debt, Transaction } from '../lib/types'

export function DebtDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()

  const [debt, setDebt] = useState<Debt | null>(null)
  const [payments, setPayments] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)

  const [editModal, setEditModal] = useState(false)
  const [editForm, setEditForm] = useState({ name: '', total_amount: '' })
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState('')

  const load = useCallback(async () => {
    if (!id) return
    setLoading(true)
    try {
      const [d, txns] = await Promise.all([
        api.debts.get(id),
        api.transactions.list({ debt_id: id }),
      ])
      setDebt(d)
      setPayments(txns)
      setNotFound(false)
    } catch {
      setNotFound(true)
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => { void load() }, [load])

  function openEdit() {
    if (!debt) return
    setEditForm({
      name: debt.name,
      total_amount: parseFloat(debt.total_amount).toString(),
    })
    setFormError('')
    setEditModal(true)
  }

  async function handleSave() {
    const amt = parseFloat(editForm.total_amount)
    if (!editForm.name.trim() || isNaN(amt) || amt <= 0) {
      setFormError('Name and a valid amount are required.')
      return
    }
    setSaving(true)
    setFormError('')
    try {
      await api.debts.update(id!, { name: editForm.name.trim(), total_amount: amt })
      await load()
      setEditModal(false)
    } catch (e: unknown) {
      setFormError(e instanceof Error ? e.message : 'Failed to save.')
    } finally {
      setSaving(false)
    }
  }

  async function handleToggleActive() {
    if (!debt) return
    await api.debts.update(id!, { is_active: !debt.is_active })
    await load()
  }

  async function handleDeletePayment(txnId: string) {
    await api.transactions.delete(txnId)
    await load()
  }

  if (loading) {
    return <div className="p-8 text-sm text-slate-400">Loading…</div>
  }

  if (notFound || !debt) {
    return (
      <div className="p-8">
        <button onClick={() => navigate('/debts')} className="text-sm text-slate-500 hover:text-slate-900 mb-4 block">
          ← Debts
        </button>
        <p className="text-sm text-red-600">Debt not found.</p>
      </div>
    )
  }

  const total = parseFloat(debt.total_amount)
  const paid = parseFloat(debt.paid_amount)
  const remaining = parseFloat(debt.remaining_amount)
  const pct = Math.min(100, debt.percent_paid)
  const overpaid = paid > total
  const overpaidAmt = paid - total

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-4 sm:px-8 pt-5 sm:pt-7 pb-4 border-b border-slate-100">
        <button
          onClick={() => navigate('/debts')}
          className="text-sm text-slate-400 hover:text-slate-700 transition-colors mb-2 block"
        >
          ← Debts
        </button>
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-semibold text-slate-900">{debt.name}</h1>
              {!debt.is_active && (
                <span className="text-xs bg-slate-100 text-slate-500 rounded-full px-2 py-0.5">Archived</span>
              )}
            </div>
            <p className="text-sm text-slate-500 mt-0.5">Opened {formatDate(debt.opened_date)}</p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={openEdit}
              className="px-3 py-1.5 border border-slate-200 rounded-lg text-sm text-slate-600 hover:bg-slate-50 transition-colors"
            >
              Edit
            </button>
            <button
              onClick={() => void handleToggleActive()}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                debt.is_active
                  ? 'border border-red-200 text-red-600 hover:bg-red-50'
                  : 'border border-emerald-200 text-emerald-600 hover:bg-emerald-50'
              }`}
            >
              {debt.is_active ? 'Archive' : 'Reopen'}
            </button>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-auto px-4 sm:px-8 py-4 sm:py-6 space-y-4 sm:space-y-5">
        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4">
          <StatCard label="Total" value={formatINR(total)} />
          <StatCard label="Paid" value={formatINR(paid)} color="text-emerald-600" />
          <StatCard
            label="Remaining"
            value={formatINR(remaining)}
            color={remaining <= 0 ? 'text-emerald-600' : 'text-slate-900'}
          />
        </div>

        {/* Overpayment warning */}
        {overpaid && (
          <div className="flex items-start gap-2.5 px-4 py-3 bg-amber-50 border border-amber-200 rounded-xl text-sm text-amber-800">
            <span className="mt-0.5">⚠</span>
            <span>
              Overpaid by <strong>{formatINR(overpaidAmt)}</strong> — total paid exceeds the loan amount.
            </span>
          </div>
        )}

        {/* Progress */}
        <div className="bg-white rounded-xl border border-slate-100 p-5">
          <div className="flex justify-between text-sm mb-2">
            <span className="text-slate-700 font-medium">{Math.round(pct)}% repaid</span>
            <span className="text-slate-400">{formatINR(remaining)} left</span>
          </div>
          <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${overpaid ? 'bg-amber-400' : 'bg-emerald-500'}`}
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>

        {/* Payment history */}
        <div className="bg-white rounded-xl border border-slate-100 overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-slate-700">Payment History</h2>
            <span className="text-xs text-slate-400">
              {payments.length} payment{payments.length !== 1 ? 's' : ''}
            </span>
          </div>

          {payments.length === 0 ? (
            <div className="px-5 py-10 text-center text-sm text-slate-400">
              No payments yet. Add transactions linked to this debt to track repayments.
            </div>
          ) : (
            <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 text-xs text-slate-400 uppercase tracking-wide">
                  <th className="px-5 py-2.5 text-left font-medium">Date</th>
                  <th className="px-5 py-2.5 text-left font-medium">Note / Category</th>
                  <th className="px-5 py-2.5 text-right font-medium">Amount</th>
                  <th className="px-5 py-2.5 w-10" />
                </tr>
              </thead>
              <tbody>
                {payments.map(p => (
                  <PaymentRow
                    key={p.id}
                    payment={p}
                    onDelete={() => handleDeletePayment(p.id)}
                  />
                ))}
              </tbody>
            </table>
            </div>
          )}
        </div>
      </div>

      {/* Edit modal */}
      {editModal && (
        <Modal title="Edit Debt" onClose={() => setEditModal(false)}>
          <div className="space-y-4">
            {formError && <p className="text-sm text-red-600">{formError}</p>}
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Name</label>
              <input
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-300"
                value={editForm.name}
                onChange={e => setEditForm(f => ({ ...f, name: e.target.value }))}
                onKeyDown={e => e.key === 'Enter' && void handleSave()}
                autoFocus
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Total Amount (₹)</label>
              <input
                type="number"
                min="1"
                step="1"
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-300"
                value={editForm.total_amount}
                onChange={e => setEditForm(f => ({ ...f, total_amount: e.target.value }))}
              />
            </div>
            <div className="flex justify-end gap-3 pt-1">
              <button
                onClick={() => setEditModal(false)}
                className="px-4 py-2 text-sm text-slate-600 hover:text-slate-900 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => void handleSave()}
                disabled={saving}
                className="px-4 py-2 bg-slate-900 text-white text-sm font-medium rounded-lg hover:bg-slate-700 disabled:opacity-50 transition-colors"
              >
                {saving ? 'Saving…' : 'Save'}
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  )
}

// ── Sub-components ────────────────────────────────────────────────────────────

function StatCard({ label, value, color = 'text-slate-900' }: { label: string; value: string; color?: string }) {
  return (
    <div className="bg-white rounded-xl border border-slate-100 px-5 py-4">
      <p className="text-xs text-slate-400 uppercase tracking-wide font-medium">{label}</p>
      <p className={`text-xl font-semibold mt-1 ${color}`}>{value}</p>
    </div>
  )
}

function PaymentRow({ payment, onDelete }: { payment: Transaction; onDelete: () => Promise<void> }) {
  const [deleting, setDeleting] = useState(false)

  async function handleDelete() {
    setDeleting(true)
    try { await onDelete() } finally { setDeleting(false) }
  }

  return (
    <tr className="border-b border-slate-50 last:border-0 hover:bg-slate-50 transition-colors group">
      <td className="px-5 py-3 text-slate-700 whitespace-nowrap">{formatDate(payment.txn_date)}</td>
      <td className="px-5 py-3 text-slate-600">
        {payment.note ? (
          <>
            <span>{payment.note}</span>
            <span className="text-slate-400"> · {payment.category_name}</span>
          </>
        ) : (
          payment.category_name
        )}
      </td>
      <td className="px-5 py-3 text-right font-medium text-slate-900">
        {formatINR(parseFloat(payment.amount))}
      </td>
      <td className="px-5 py-3 text-right">
        <button
          onClick={() => void handleDelete()}
          disabled={deleting}
          className="opacity-0 group-hover:opacity-100 text-slate-300 hover:text-red-500 transition-all disabled:opacity-30 text-base leading-none"
          title="Delete payment"
        >
          ✕
        </button>
      </td>
    </tr>
  )
}
