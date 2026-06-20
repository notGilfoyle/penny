import { useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useTransactions } from '../hooks/useTransactions'
import { useCategories } from '../hooks/useCategories'
import { usePaymentModes } from '../hooks/usePaymentModes'
import { useDebts } from '../hooks/useDebts'
import { api } from '../lib/api'
import { formatINR, formatDate } from '../lib/format'
import { Modal } from '../components/Modal'
import { MonthSwitcher } from '../components/MonthSwitcher'
import { TransactionForm } from '../components/TransactionForm'
import type { Transaction } from '../lib/types'

export function Transactions() {
  const now = new Date()
  const [params, setParams] = useSearchParams()
  const year = parseInt(params.get('year') ?? String(now.getFullYear()))
  const month = parseInt(params.get('month') ?? String(now.getMonth() + 1))

  const { transactions, loading, refetch } = useTransactions(year, month)
  const { categories } = useCategories(true)
  const { paymentModes } = usePaymentModes(true)
  const { debts } = useDebts(true)

  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<Transaction | undefined>()
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)

  const handleMonthChange = (y: number, m: number) => {
    setParams({ year: String(y), month: String(m) })
  }

  const handleDelete = async (id: string) => {
    setDeleting(true)
    try {
      await api.transactions.delete(id)
      setConfirmDelete(null)
      await refetch()
    } finally {
      setDeleting(false)
    }
  }

  // Compute totals from fetched data
  const incomeTotal = transactions
    .filter(t => t.direction === 'income')
    .reduce((s, t) => s + parseFloat(t.amount), 0)
  const expenseTotal = transactions
    .filter(t => t.direction === 'expense')
    .reduce((s, t) => s + parseFloat(t.amount), 0)
  const savings = incomeTotal - expenseTotal

  // Group by date
  const grouped = transactions.reduce<Record<string, Transaction[]>>((acc, t) => {
    acc[t.txn_date] = acc[t.txn_date] ?? []
    acc[t.txn_date].push(t)
    return acc
  }, {})
  const sortedDates = Object.keys(grouped).sort().reverse()

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-4 sm:px-8 pt-5 sm:pt-7 pb-4 flex items-center justify-between border-b border-slate-100">
        <div className="flex items-center gap-4">
          <h1 className="text-lg font-semibold text-slate-900">Transactions</h1>
          <MonthSwitcher year={year} month={month} onChange={handleMonthChange} />
        </div>
        <button
          onClick={() => { setEditing(undefined); setShowForm(true) }}
          className="px-4 py-2 bg-slate-900 text-white text-sm font-medium rounded-xl hover:bg-slate-800 transition-colors"
        >
          + Add
        </button>
      </div>

      {/* Summary strip */}
      <div className="px-4 sm:px-8 py-3 flex gap-3 sm:gap-6 border-b border-slate-100 bg-slate-50">
        <Stat label="Income" value={formatINR(incomeTotal)} color="text-green-600" />
        <div className="w-px bg-slate-200" />
        <Stat label="Expenses" value={formatINR(expenseTotal)} color="text-red-600" />
        <div className="w-px bg-slate-200" />
        <Stat
          label="Saved"
          value={formatINR(savings)}
          color={savings >= 0 ? 'text-slate-900' : 'text-red-600'}
        />
      </div>

      {/* Transaction list */}
      <div className="flex-1 overflow-auto px-4 sm:px-8 py-4">
        {loading && (
          <p className="text-sm text-slate-400 py-8 text-center">Loading…</p>
        )}

        {!loading && transactions.length === 0 && (
          <div className="text-center py-16">
            <p className="text-slate-400 text-sm">No transactions this month.</p>
            <button
              onClick={() => { setEditing(undefined); setShowForm(true) }}
              className="mt-3 text-sm text-slate-600 underline underline-offset-2"
            >
              Add the first one
            </button>
          </div>
        )}

        <div className="space-y-6">
          {sortedDates.map(date => (
            <div key={date}>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                {formatDate(date)}
              </p>
              <div className="bg-white rounded-xl border border-slate-100 divide-y divide-slate-50">
                {grouped[date].map(txn => (
                  <TxnRow
                    key={txn.id}
                    txn={txn}
                    isConfirmingDelete={confirmDelete === txn.id}
                    deleting={deleting}
                    onEdit={() => { setEditing(txn); setShowForm(true) }}
                    onDeleteRequest={() => setConfirmDelete(txn.id)}
                    onDeleteConfirm={() => handleDelete(txn.id)}
                    onDeleteCancel={() => setConfirmDelete(null)}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Add / Edit modal */}
      {showForm && (
        <Modal
          title={editing ? 'Edit Transaction' : 'Add Transaction'}
          onClose={() => setShowForm(false)}
        >
          <TransactionForm
            categories={categories}
            paymentModes={paymentModes}
            debts={debts}
            initial={editing}
            onClose={() => setShowForm(false)}
            onSaved={refetch}
          />
        </Modal>
      )}
    </div>
  )
}

function Stat({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div>
      <p className="text-xs text-slate-500">{label}</p>
      <p className={`text-sm font-semibold mt-0.5 ${color}`}>{value}</p>
    </div>
  )
}

interface TxnRowProps {
  txn: Transaction
  isConfirmingDelete: boolean
  deleting: boolean
  onEdit: () => void
  onDeleteRequest: () => void
  onDeleteConfirm: () => void
  onDeleteCancel: () => void
}

function TxnRow({ txn, isConfirmingDelete, deleting, onEdit, onDeleteRequest, onDeleteConfirm, onDeleteCancel }: TxnRowProps) {
  const isIncome = txn.direction === 'income'

  return (
    <div className="flex items-center gap-3 px-4 py-3">
      {/* Color dot */}
      <span
        className={`w-2 h-2 rounded-full shrink-0 ${isIncome ? 'bg-green-400' : txn.debt_id ? 'bg-orange-400' : 'bg-red-400'}`}
      />

      {/* Main info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-slate-900 truncate">{txn.category_name}</span>
          {txn.debt_name && (
            <span className="text-xs px-1.5 py-0.5 rounded bg-orange-50 text-orange-700 shrink-0">
              {txn.debt_name}
            </span>
          )}
        </div>
        {(txn.note || txn.payment_mode_name) && (
          <p className="text-xs text-slate-400 mt-0.5 truncate">
            {[txn.note, txn.payment_mode_name].filter(Boolean).join(' · ')}
          </p>
        )}
      </div>

      {/* Amount */}
      <span className={`text-sm font-semibold shrink-0 ${isIncome ? 'text-green-600' : 'text-slate-900'}`}>
        {isIncome ? '+' : '−'}{formatINR(txn.amount)}
      </span>

      {/* Actions */}
      {isConfirmingDelete ? (
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-xs text-slate-500">Delete?</span>
          <button
            onClick={onDeleteConfirm}
            disabled={deleting}
            className="text-xs font-medium text-red-600 hover:text-red-800 disabled:opacity-50"
          >
            Yes
          </button>
          <button onClick={onDeleteCancel} className="text-xs text-slate-400 hover:text-slate-600">
            No
          </button>
        </div>
      ) : (
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={onEdit}
            className="text-xs text-slate-400 hover:text-slate-700 transition-colors"
          >
            Edit
          </button>
          <button
            onClick={onDeleteRequest}
            className="text-xs text-slate-400 hover:text-red-600 transition-colors"
          >
            Delete
          </button>
        </div>
      )}
    </div>
  )
}
