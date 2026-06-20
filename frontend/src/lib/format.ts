export function formatINR(amount: number | string): string {
  const num = typeof amount === 'string' ? parseFloat(amount) : amount
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(num)
}

export function formatDate(dateStr: string): string {
  // Append time to avoid UTC-to-local date shift
  return new Date(dateStr + 'T00:00:00').toLocaleDateString('en-IN', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  })
}

export function formatMonthYear(year: number, month: number): string {
  return new Date(year, month - 1, 1).toLocaleDateString('en-IN', {
    month: 'long',
    year: 'numeric',
  })
}

export function formatMonthShort(year: number, month: number): string {
  return new Date(year, month - 1, 1).toLocaleDateString('en-IN', { month: 'short', year: '2-digit' })
}

export function formatINRShort(value: number): string {
  const abs = Math.abs(value)
  const prefix = value < 0 ? '-' : ''
  if (abs >= 100000) return `${prefix}₹${(abs / 100000).toFixed(1)}L`
  if (abs >= 1000) return `${prefix}₹${(abs / 1000).toFixed(0)}K`
  return `${prefix}₹${Math.round(abs)}`
}

export function todayLocal(): string {
  const d = new Date()
  return [
    d.getFullYear(),
    String(d.getMonth() + 1).padStart(2, '0'),
    String(d.getDate()).padStart(2, '0'),
  ].join('-')
}
