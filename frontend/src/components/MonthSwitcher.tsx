import { formatMonthYear } from '../lib/format'

interface Props {
  year: number
  month: number
  onChange: (year: number, month: number) => void
}

export function MonthSwitcher({ year, month, onChange }: Props) {
  const now = new Date()
  const isCurrentMonth = year === now.getFullYear() && month === now.getMonth() + 1

  const prev = () => {
    if (month === 1) onChange(year - 1, 12)
    else onChange(year, month - 1)
  }

  const next = () => {
    if (month === 12) onChange(year + 1, 1)
    else onChange(year, month + 1)
  }

  return (
    <div className="flex items-center gap-1">
      <button
        onClick={prev}
        className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-900 transition-colors"
        aria-label="Previous month"
      >
        ←
      </button>
      <span className="px-2 text-sm font-medium text-slate-900 min-w-[130px] text-center">
        {formatMonthYear(year, month)}
      </span>
      {!isCurrentMonth && (
        <button
          onClick={next}
          className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-900 transition-colors"
          aria-label="Next month"
        >
          →
        </button>
      )}
    </div>
  )
}
