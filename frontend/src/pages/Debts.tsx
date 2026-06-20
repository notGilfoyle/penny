import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useDebts } from '../hooks/useDebts'
import { api } from '../lib/api'
import { formatINR, formatDate } from '../lib/format'
import { Modal } from '../components/Modal'
import type { Debt } from '../lib/types'

interface DebtFormState {
  name: string
  total_amount: string
  opened_date: string
}

const EMPTY_FORM: DebtFormState = { name: '', total_amount: '', opened_date: '' }

export function Debts() {
  const navigate = useNavigate()
  const { debts, loading, refetch } = useDebts(false)
  const activeDebts = debts.filter(d => d.is_active)
  const archivedDebts = debts.filter(d => !d.is_active)

  const [modal, setModal] = useState<{ mode: 'add' } | { mode: 'edit'; debt: Debt } | null>(null)
  const [form, setForm] = useState<DebtFormState>(EMPTY_FORM)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  function openAdd() {
    setForm(EMPTY_FORM)
    setError('')
    setModal({ mode: 'add' })
  }

  function openEdit(debt: Debt) {
    setForm({
      name: debt.name,
      total_amount: parseFloat(debt.total_amount).toString(),
      opened_date: debt.opened_date,
    })
    setError('')
    setModal({ mode: 'edit', debt })
  }

  async function handleSave() {
    if (!form.name.trim() || !form.total_amount || !form.opened_date) {
      setError('All fields are required.')
      return
    }
    const amt = parseFloat(form.total_amount)
    if (isNaN(amt) || amt <= 0) { setError('Amount must be positive.'); return }
    setSaving(true)
    setError('')
    try {
      if (modal?.mode === 'add') {
        await api.debts.create({ name: form.name.trim(), total_amount: amt, opened_date: form.opened_date })
      } else if (modal?.mode === 'edit') {
        await api.debts.update(modal.debt.id, { name: form.name.trim(), total_amount: amt })
      }
      await refetch()
      setModal(null)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to save.')
    } finally {
      setSaving(false)
    }
  }

  async function handleArchive(id: string) {
    await api.debts.archive(id)
    await refetch()
  }

  async function handleRestore(id: string) {
    await api.debts.update(id, { is_active: true })
    await refetch()
  }

  return (
    <div className="flex flex-col h-full">
      <div className="px-4 sm:px-8 pt-5 sm:pt-7 pb-4 flex items-center justify-between border-b border-slate-100">
        <div>
          <h1 className="text-lg font-semibold text-slate-900">Debts</h1>
          <p className="text-sm text-slate-500 mt-0.5">Track loans and repayments.</p>
        </div>
        <button
          onClick={openAdd}
          className="px-4 py-1.5 bg-slate-900 text-white text-sm font-medium rounded-lg hover:bg-slate-700 transition-colors"
        >
          + Add Debt
        </button>
      </div>

      <div className="flex-1 overflow-auto px-4 sm:px-8 py-4 sm:py-6 space-y-3">
        {loading && <p className="text-sm text-slate-400 py-8 text-center">Loading…</p>}

        {!loading && activeDebts.length === 0 && (
          <div className="text-center py-16 text-slate-400 text-sm">
            No active debts. Add one to start tracking repayments.
          </div>
        )}

        {activeDebts.map(debt => (
          <DebtCard
            key={debt.id}
            debt={debt}
            onNavigate={() => navigate(`/debts/${debt.id}`)}
            onEdit={() => openEdit(debt)}
            onArchive={() => handleArchive(debt.id)}
          />
        ))}

        {archivedDebts.length > 0 && (
          <details className="mt-4">
            <summary className="text-xs font-semibold text-slate-400 uppercase tracking-wider cursor-pointer select-none py-2">
              Archived ({archivedDebts.length})
            </summary>
            <div className="mt-2 space-y-2">
              {archivedDebts.map(debt => (
                <div
                  key={debt.id}
                  className="flex items-center justify-between px-5 py-3 bg-white rounded-xl border border-slate-100 opacity-60"
                >
                  <div>
                    <p className="text-sm font-medium text-slate-700">{debt.name}</p>
                    <p className="text-xs text-slate-400 mt-0.5">
                      {formatINR(parseFloat(debt.total_amount))} total · Opened {formatDate(debt.opened_date)}
                    </p>
                  </div>
                  <button
                    onClick={() => handleRestore(debt.id)}
                    className="text-xs text-slate-500 hover:text-slate-900 px-3 py-1 border border-slate-200 rounded-md transition-colors"
                  >
                    Restore
                  </button>
                </div>
              ))}
            </div>
          </details>
        )}
      </div>

      {modal && (
        <Modal
          title={modal.mode === 'add' ? 'Add Debt' : 'Edit Debt'}
          onClose={() => setModal(null)}
        >
          <div className="space-y-4">
            {error && <p className="text-sm text-red-600">{error}</p>}
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Name</label>
              <input
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-300"
                placeholder="e.g. Home Loan"
                value={form.name}
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
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
                placeholder="500000"
                value={form.total_amount}
                onChange={e => setForm(f => ({ ...f, total_amount: e.target.value }))}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Opened Date</label>
              <input
                type="date"
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-300"
                value={form.opened_date}
                onChange={e => setForm(f => ({ ...f, opened_date: e.target.value }))}
              />
            </div>
            <div className="flex justify-end gap-3 pt-1">
              <button
                onClick={() => setModal(null)}
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

// ── Debt card ─────────────────────────────────────────────────────────────────

interface DebtCardProps {
  debt: Debt
  onNavigate: () => void
  onEdit: () => void
  onArchive: () => void
}

function DebtCard({ debt, onNavigate, onEdit, onArchive }: DebtCardProps) {
  const total = parseFloat(debt.total_amount)
  const paid = parseFloat(debt.paid_amount)
  const remaining = parseFloat(debt.remaining_amount)
  const pct = Math.min(100, debt.percent_paid)
  const overpaid = paid > total

  return (
    <div className="bg-white rounded-xl border border-slate-100 p-5 hover:border-slate-200 transition-colors group">
      <div className="flex items-start justify-between gap-4">
        <button onClick={onNavigate} className="text-left flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className="font-semibold text-slate-900 truncate">{debt.name}</p>
            {overpaid && (
              <span className="text-xs bg-amber-50 text-amber-700 border border-amber-200 rounded-full px-2 py-0.5 shrink-0">
                Overpaid
              </span>
            )}
          </div>
          <p className="text-xs text-slate-400 mt-0.5">Opened {formatDate(debt.opened_date)}</p>
        </button>
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
          <button
            onClick={onEdit}
            className="text-xs text-slate-500 hover:text-slate-900 px-2 py-1 rounded transition-colors"
          >
            Edit
          </button>
          <button
            onClick={onArchive}
            className="text-xs text-slate-400 hover:text-red-600 px-2 py-1 rounded transition-colors"
          >
            Archive
          </button>
        </div>
      </div>

      <div className="mt-3">
        <div className="flex justify-between text-xs text-slate-500 mb-1.5">
          <span>{formatINR(paid)} paid</span>
          <span>{formatINR(remaining)} remaining</span>
        </div>
        <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all ${overpaid ? 'bg-amber-400' : 'bg-emerald-500'}`}
            style={{ width: `${pct}%` }}
          />
        </div>
        <div className="flex justify-between text-xs text-slate-400 mt-1">
          <span>{Math.round(pct)}% paid</span>
          <span>of {formatINR(total)}</span>
        </div>
      </div>
    </div>
  )
}
