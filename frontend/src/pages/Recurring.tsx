import { useState } from 'react'
import { useRecurringRules, usePendingRules } from '../hooks/useRecurringRules'
import { useCategories } from '../hooks/useCategories'
import { usePaymentModes } from '../hooks/usePaymentModes'
import { api } from '../lib/api'
import { formatINR, formatDate, formatMonthYear } from '../lib/format'
import { Modal } from '../components/Modal'
import { RecurringRuleForm } from '../components/RecurringRuleForm'
import type { RecurringRule } from '../lib/types'

function clampedDate(year: number, month: number, day: number): string {
  const lastDay = new Date(year, month, 0).getDate()
  const d = Math.min(day, lastDay)
  return `${year}-${String(month).padStart(2, '0')}-${String(d).padStart(2, '0')}`
}

export function Recurring() {
  const now = new Date()
  const year = now.getFullYear()
  const month = now.getMonth() + 1

  const { rules, refetch: refetchRules } = useRecurringRules(false)
  const { pending, refetch: refetchPending } = usePendingRules(year, month)
  const { categories } = useCategories(true)
  const { paymentModes } = usePaymentModes(true)

  // Rule form modal
  const [showRuleForm, setShowRuleForm] = useState(false)
  const [editingRule, setEditingRule] = useState<RecurringRule | undefined>()

  // Confirm-edit modal
  const [confirmingRule, setConfirmingRule] = useState<RecurringRule | null>(null)
  const [confirmAmount, setConfirmAmount] = useState('')
  const [confirmDate, setConfirmDate] = useState('')
  const [confirmNote, setConfirmNote] = useState('')
  const [confirming, setConfirming] = useState(false)
  const [confirmError, setConfirmError] = useState('')

  const openConfirmEdit = (rule: RecurringRule) => {
    setConfirmingRule(rule)
    setConfirmAmount(String(parseFloat(rule.amount)))
    setConfirmDate(clampedDate(year, month, rule.day_of_month))
    setConfirmNote('')
    setConfirmError('')
  }

  const handleConfirmEdit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!confirmingRule) return
    setConfirmError('')
    const amt = parseFloat(confirmAmount)
    if (!amt || amt <= 0) { setConfirmError('Enter a valid amount'); return }
    setConfirming(true)
    try {
      await api.transactions.create({
        txn_date: confirmDate,
        amount: amt,
        direction: confirmingRule.direction,
        category_id: confirmingRule.category_id,
        payment_mode_id: confirmingRule.payment_mode_id ?? null,
        recurring_rule_id: confirmingRule.id,
        note: confirmNote.trim() || null,
        source: 'manual',
      })
      setConfirmingRule(null)
      void refetchPending()
    } catch (err) {
      setConfirmError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setConfirming(false)
    }
  }

  const handleSaved = () => {
    void refetchRules()
    void refetchPending()
  }

  const activeRules = rules.filter(r => r.is_active)
  const archivedRules = rules.filter(r => !r.is_active)

  return (
    <div className="flex flex-col h-full">
      <div className="px-4 sm:px-8 pt-5 sm:pt-7 pb-4 border-b border-slate-100">
        <h1 className="text-lg font-semibold text-slate-900">Recurring</h1>
        <p className="text-sm text-slate-500 mt-0.5">Scheduled transactions and monthly confirm inbox.</p>
      </div>

      <div className="flex-1 overflow-auto px-4 sm:px-8 py-4 sm:py-6 space-y-6 sm:space-y-8">
        {/* Confirm inbox */}
        <section>
          <h2 className="text-sm font-semibold text-slate-700 mb-3">
            Inbox — {formatMonthYear(year, month)}
          </h2>

          {pending.length === 0 ? (
            <div className="bg-white rounded-xl border border-slate-100 px-5 py-6 text-center">
              <p className="text-sm text-slate-400">All caught up for {formatMonthYear(year, month)}.</p>
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-slate-100 divide-y divide-slate-50">
              {pending.map(rule => (
                <InboxItem
                  key={rule.id}
                  rule={rule}
                  year={year}
                  month={month}
                  onConfirm={async () => {
                    await api.transactions.create({
                      txn_date: clampedDate(year, month, rule.day_of_month),
                      amount: parseFloat(rule.amount),
                      direction: rule.direction,
                      category_id: rule.category_id,
                      payment_mode_id: rule.payment_mode_id ?? null,
                      recurring_rule_id: rule.id,
                      note: null,
                      source: 'manual',
                    })
                    void refetchPending()
                  }}
                  onEdit={() => openConfirmEdit(rule)}
                />
              ))}
            </div>
          )}
        </section>

        {/* Rules list */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-slate-700">Rules</h2>
            <button
              onClick={() => { setEditingRule(undefined); setShowRuleForm(true) }}
              className="px-3 py-1.5 bg-slate-900 text-white text-xs font-medium rounded-lg hover:bg-slate-800 transition-colors"
            >
              + Add Rule
            </button>
          </div>

          {activeRules.length === 0 ? (
            <div className="bg-white rounded-xl border border-slate-100 px-5 py-6 text-center">
              <p className="text-sm text-slate-400">No recurring rules yet.</p>
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-slate-100 divide-y divide-slate-50">
              {activeRules.map(rule => (
                <RuleRow
                  key={rule.id}
                  rule={rule}
                  onEdit={() => { setEditingRule(rule); setShowRuleForm(true) }}
                  onArchive={async () => {
                    await api.recurringRules.delete(rule.id)
                    handleSaved()
                  }}
                />
              ))}
            </div>
          )}

          {archivedRules.length > 0 && (
            <details className="mt-3">
              <summary className="text-xs text-slate-400 cursor-pointer select-none hover:text-slate-600 py-1">
                {archivedRules.length} archived rule{archivedRules.length !== 1 ? 's' : ''}
              </summary>
              <div className="mt-2 bg-white rounded-xl border border-slate-100 divide-y divide-slate-50">
                {archivedRules.map(rule => (
                  <RuleRow
                    key={rule.id}
                    rule={rule}
                    archived
                    onRestore={async () => {
                      await api.recurringRules.update(rule.id, { is_active: true })
                      handleSaved()
                    }}
                  />
                ))}
              </div>
            </details>
          )}
        </section>
      </div>

      {/* Rule form modal */}
      {showRuleForm && (
        <Modal
          title={editingRule ? 'Edit Rule' : 'New Recurring Rule'}
          onClose={() => setShowRuleForm(false)}
          size="lg"
        >
          <RecurringRuleForm
            categories={categories}
            paymentModes={paymentModes}
            initial={editingRule}
            onClose={() => setShowRuleForm(false)}
            onSaved={handleSaved}
          />
        </Modal>
      )}

      {/* Confirm-edit modal */}
      {confirmingRule && (
        <Modal
          title={`Confirm: ${confirmingRule.name}`}
          onClose={() => setConfirmingRule(null)}
        >
          <form onSubmit={handleConfirmEdit} className="space-y-4">
            <div className="bg-slate-50 rounded-lg px-4 py-3 text-sm text-slate-600">
              <span className={confirmingRule.direction === 'income' ? 'text-green-700' : 'text-red-700'}>
                {confirmingRule.direction === 'income' ? 'Income' : 'Expense'}
              </span>
              {' · '}{confirmingRule.category_name}
              {confirmingRule.payment_mode_name && ` · ${confirmingRule.payment_mode_name}`}
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1.5">Amount (₹)</label>
              <input
                type="number"
                min="0.01"
                step="0.01"
                autoFocus
                value={confirmAmount}
                onChange={e => setConfirmAmount(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-lg font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900 bg-white"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1.5">Date</label>
              <input
                type="date"
                value={confirmDate}
                onChange={e => setConfirmDate(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900 bg-white"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1.5">Note (optional)</label>
              <input
                type="text"
                value={confirmNote}
                onChange={e => setConfirmNote(e.target.value)}
                placeholder="e.g. June rent"
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900 bg-white"
              />
            </div>

            {confirmError && <p className="text-sm text-red-600">{confirmError}</p>}

            <div className="flex gap-2 pt-1">
              <button
                type="button"
                onClick={() => setConfirmingRule(null)}
                className="flex-1 px-4 py-2.5 border border-slate-200 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={confirming}
                className={`flex-1 px-4 py-2.5 rounded-xl text-sm font-medium text-white disabled:opacity-50 transition-colors ${
                  confirmingRule.direction === 'income' ? 'bg-green-600 hover:bg-green-700' : 'bg-slate-900 hover:bg-slate-800'
                }`}
              >
                {confirming ? 'Confirming…' : 'Confirm'}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  )
}

// ── Inbox item ────────────────────────────────────────────────────────────────

interface InboxItemProps {
  rule: RecurringRule
  year: number
  month: number
  onConfirm: () => Promise<void>
  onEdit: () => void
}

function InboxItem({ rule, year, month, onConfirm, onEdit }: InboxItemProps) {
  const [busy, setBusy] = useState(false)
  const isIncome = rule.direction === 'income'
  const dueDate = clampedDate(year, month, rule.day_of_month)

  const handleConfirm = async () => {
    setBusy(true)
    try {
      await onConfirm()
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="flex items-center gap-3 px-4 py-3">
      <span className={`w-2 h-2 rounded-full shrink-0 ${isIncome ? 'bg-green-400' : 'bg-red-400'}`} />

      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium text-slate-900">{rule.name}</div>
        <div className="text-xs text-slate-400 mt-0.5 truncate">
          {rule.category_name} · due {formatDate(dueDate)}
          {rule.payment_mode_name && ` · ${rule.payment_mode_name}`}
        </div>
      </div>

      <span className={`text-sm font-semibold shrink-0 ${isIncome ? 'text-green-600' : 'text-slate-900'}`}>
        {isIncome ? '+' : '−'}{formatINR(rule.amount)}
      </span>

      <div className="flex items-center gap-2 shrink-0">
        <button
          onClick={handleConfirm}
          disabled={busy}
          className="px-3 py-1 bg-slate-900 text-white text-xs font-medium rounded-lg hover:bg-slate-800 disabled:opacity-50 transition-colors"
        >
          {busy ? '…' : 'Confirm'}
        </button>
        <button
          onClick={onEdit}
          className="px-3 py-1 border border-slate-200 text-slate-600 text-xs font-medium rounded-lg hover:bg-slate-50 transition-colors"
        >
          Edit
        </button>
      </div>
    </div>
  )
}

// ── Rule row ──────────────────────────────────────────────────────────────────

interface RuleRowProps {
  rule: RecurringRule
  archived?: boolean
  onEdit?: () => void
  onArchive?: () => void
  onRestore?: () => void
}

function RuleRow({ rule, archived = false, onEdit, onArchive, onRestore }: RuleRowProps) {
  const isIncome = rule.direction === 'income'

  return (
    <div className="flex items-center gap-3 px-4 py-3">
      <span className={`w-2 h-2 rounded-full shrink-0 ${archived ? 'bg-slate-200' : isIncome ? 'bg-green-400' : 'bg-red-400'}`} />

      <div className="flex-1 min-w-0">
        <div className={`text-sm font-medium ${archived ? 'text-slate-400 line-through' : 'text-slate-900'}`}>
          {rule.name}
        </div>
        <div className="text-xs text-slate-400 mt-0.5 truncate">
          Day {rule.day_of_month} · {rule.category_name}
          {rule.payment_mode_name && ` · ${rule.payment_mode_name}`}
        </div>
      </div>

      <span className={`text-sm font-semibold shrink-0 ${archived ? 'text-slate-400' : isIncome ? 'text-green-600' : 'text-slate-900'}`}>
        {isIncome ? '+' : '−'}{formatINR(rule.amount)}
      </span>

      <div className="flex items-center gap-2 shrink-0">
        {!archived && onEdit && (
          <button onClick={onEdit} className="text-xs text-slate-400 hover:text-slate-700 transition-colors">
            Edit
          </button>
        )}
        {archived && onRestore ? (
          <button onClick={onRestore} className="text-xs text-slate-400 hover:text-green-600 transition-colors">
            Restore
          </button>
        ) : onArchive ? (
          <button onClick={onArchive} className="text-xs text-slate-400 hover:text-amber-600 transition-colors">
            Archive
          </button>
        ) : null}
      </div>
    </div>
  )
}
