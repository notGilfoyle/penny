import { useState } from 'react'
import { useCategories } from '../hooks/useCategories'
import { usePaymentModes } from '../hooks/usePaymentModes'
import { api } from '../lib/api'
import type { Category, PaymentMode } from '../lib/types'

export function Categories() {
  const { categories, refetch: refetchCats } = useCategories(false)
  const { paymentModes, refetch: refetchModes } = usePaymentModes(false)

  return (
    <div className="px-4 sm:px-8 py-6 sm:py-7 max-w-2xl space-y-10">
      <div>
        <h1 className="text-lg font-semibold text-slate-900">Categories & Payment Modes</h1>
        <p className="text-sm text-slate-500 mt-0.5">Manage your income/expense categories and payment methods.</p>
      </div>

      <CategorySection
        title="Expense Categories"
        kind="expense"
        items={categories.filter(c => c.kind === 'expense')}
        onRefetch={refetchCats}
      />

      <CategorySection
        title="Income Categories"
        kind="income"
        items={categories.filter(c => c.kind === 'income')}
        onRefetch={refetchCats}
      />

      <PaymentModeSection items={paymentModes} onRefetch={refetchModes} />
    </div>
  )
}

// ── Category section ──────────────────────────────────────────────────────────

interface CategorySectionProps {
  title: string
  kind: 'income' | 'expense'
  items: Category[]
  onRefetch: () => void
}

function CategorySection({ title, kind, items, onRefetch }: CategorySectionProps) {
  const [newName, setNewName] = useState('')
  const [adding, setAdding] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)
  const [editName, setEditName] = useState('')

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newName.trim()) return
    setAdding(true)
    try {
      await api.categories.create({ name: newName.trim(), kind })
      setNewName('')
      onRefetch()
    } finally {
      setAdding(false)
    }
  }

  const handleEdit = async (id: string) => {
    if (!editName.trim()) return
    await api.categories.update(id, { name: editName.trim() })
    setEditId(null)
    onRefetch()
  }

  const handleToggle = async (cat: Category) => {
    await api.categories.update(cat.id, { is_active: !cat.is_active })
    onRefetch()
  }

  const active = items.filter(c => c.is_active)
  const archived = items.filter(c => !c.is_active)

  return (
    <section>
      <h2 className="text-sm font-semibold text-slate-700 mb-3">{title}</h2>
      <div className="bg-white rounded-xl border border-slate-100 overflow-hidden">
        {active.length === 0 && archived.length === 0 && (
          <p className="px-4 py-3 text-sm text-slate-400">No categories yet.</p>
        )}

        {active.map(cat => (
          <div key={cat.id} className="flex items-center gap-3 px-4 py-3 border-b border-slate-50 last:border-0">
            {editId === cat.id ? (
              <>
                <input
                  autoFocus
                  value={editName}
                  onChange={e => setEditName(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter') void handleEdit(cat.id)
                    if (e.key === 'Escape') setEditId(null)
                  }}
                  className="flex-1 px-2 py-1 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-900"
                />
                <button onClick={() => handleEdit(cat.id)} className="text-xs font-medium text-slate-900">Save</button>
                <button onClick={() => setEditId(null)} className="text-xs text-slate-400">Cancel</button>
              </>
            ) : (
              <>
                <span className="flex-1 text-sm text-slate-900">{cat.name}</span>
                <button
                  onClick={() => { setEditId(cat.id); setEditName(cat.name) }}
                  className="text-xs text-slate-400 hover:text-slate-700"
                >
                  Edit
                </button>
                <button
                  onClick={() => handleToggle(cat)}
                  className="text-xs text-slate-400 hover:text-amber-600"
                >
                  Archive
                </button>
              </>
            )}
          </div>
        ))}

        {/* Add row */}
        <form onSubmit={handleAdd} className="flex items-center gap-2 px-4 py-3 bg-slate-50">
          <input
            value={newName}
            onChange={e => setNewName(e.target.value)}
            placeholder={`New ${kind} category…`}
            className="flex-1 px-3 py-1.5 border border-slate-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-slate-900"
          />
          <button
            type="submit"
            disabled={adding || !newName.trim()}
            className="px-3 py-1.5 bg-slate-900 text-white text-xs font-medium rounded-lg disabled:opacity-40"
          >
            Add
          </button>
        </form>

        {/* Archived */}
        {archived.length > 0 && (
          <details className="border-t border-slate-100">
            <summary className="px-4 py-2 text-xs text-slate-400 cursor-pointer select-none hover:text-slate-600">
              {archived.length} archived
            </summary>
            {archived.map(cat => (
              <div key={cat.id} className="flex items-center gap-3 px-4 py-2.5 border-b border-slate-50 last:border-0">
                <span className="flex-1 text-sm text-slate-400 line-through">{cat.name}</span>
                <button
                  onClick={() => handleToggle(cat)}
                  className="text-xs text-slate-400 hover:text-green-600"
                >
                  Restore
                </button>
              </div>
            ))}
          </details>
        )}
      </div>
    </section>
  )
}

// ── Payment mode section ──────────────────────────────────────────────────────

interface PaymentModeSectionProps {
  items: PaymentMode[]
  onRefetch: () => void
}

function PaymentModeSection({ items, onRefetch }: PaymentModeSectionProps) {
  const [newName, setNewName] = useState('')
  const [adding, setAdding] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)
  const [editName, setEditName] = useState('')

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newName.trim()) return
    setAdding(true)
    try {
      await api.paymentModes.create({ name: newName.trim() })
      setNewName('')
      onRefetch()
    } finally {
      setAdding(false)
    }
  }

  const handleEdit = async (id: string) => {
    if (!editName.trim()) return
    await api.paymentModes.update(id, { name: editName.trim() })
    setEditId(null)
    onRefetch()
  }

  const handleToggle = async (mode: PaymentMode) => {
    await api.paymentModes.update(mode.id, { is_active: !mode.is_active })
    onRefetch()
  }

  const active = items.filter(m => m.is_active)
  const archived = items.filter(m => !m.is_active)

  return (
    <section>
      <h2 className="text-sm font-semibold text-slate-700 mb-3">Payment Modes</h2>
      <div className="bg-white rounded-xl border border-slate-100 overflow-hidden">
        {active.length === 0 && archived.length === 0 && (
          <p className="px-4 py-3 text-sm text-slate-400">No payment modes yet.</p>
        )}

        {active.map(mode => (
          <div key={mode.id} className="flex items-center gap-3 px-4 py-3 border-b border-slate-50 last:border-0">
            {editId === mode.id ? (
              <>
                <input
                  autoFocus
                  value={editName}
                  onChange={e => setEditName(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter') void handleEdit(mode.id)
                    if (e.key === 'Escape') setEditId(null)
                  }}
                  className="flex-1 px-2 py-1 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-900"
                />
                <button onClick={() => handleEdit(mode.id)} className="text-xs font-medium text-slate-900">Save</button>
                <button onClick={() => setEditId(null)} className="text-xs text-slate-400">Cancel</button>
              </>
            ) : (
              <>
                <span className="flex-1 text-sm text-slate-900">{mode.name}</span>
                <button
                  onClick={() => { setEditId(mode.id); setEditName(mode.name) }}
                  className="text-xs text-slate-400 hover:text-slate-700"
                >
                  Edit
                </button>
                <button
                  onClick={() => handleToggle(mode)}
                  className="text-xs text-slate-400 hover:text-amber-600"
                >
                  Archive
                </button>
              </>
            )}
          </div>
        ))}

        <form onSubmit={handleAdd} className="flex items-center gap-2 px-4 py-3 bg-slate-50">
          <input
            value={newName}
            onChange={e => setNewName(e.target.value)}
            placeholder="New payment mode… (e.g. PhonePe, HDFC Card)"
            className="flex-1 px-3 py-1.5 border border-slate-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-slate-900"
          />
          <button
            type="submit"
            disabled={adding || !newName.trim()}
            className="px-3 py-1.5 bg-slate-900 text-white text-xs font-medium rounded-lg disabled:opacity-40"
          >
            Add
          </button>
        </form>

        {archived.length > 0 && (
          <details className="border-t border-slate-100">
            <summary className="px-4 py-2 text-xs text-slate-400 cursor-pointer select-none hover:text-slate-600">
              {archived.length} archived
            </summary>
            {archived.map(mode => (
              <div key={mode.id} className="flex items-center gap-3 px-4 py-2.5 border-b border-slate-50 last:border-0">
                <span className="flex-1 text-sm text-slate-400 line-through">{mode.name}</span>
                <button
                  onClick={() => handleToggle(mode)}
                  className="text-xs text-slate-400 hover:text-green-600"
                >
                  Restore
                </button>
              </div>
            ))}
          </details>
        )}
      </div>
    </section>
  )
}
