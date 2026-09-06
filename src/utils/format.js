export function formatRupiah(value) {
  const n = Number(value) || 0
  return 'Rp' + Math.round(n).toLocaleString('id-ID')
}

export function formatNumber(value, digits = 0) {
  const n = Number(value) || 0
  return n.toLocaleString('id-ID', { maximumFractionDigits: digits })
}

export function formatDecimal(value, digits = 1) {
  const n = Number(value) || 0
  return n.toLocaleString('id-ID', {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  })
}

export function formatDate(iso) {
  if (!iso) return '-'
  return new Date(iso).toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

export function formatDateShort(iso) {
  if (!iso) return '-'
  return new Date(iso).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })
}

export function formatDateLong(iso) {
  if (!iso) return '-'
  return new Date(iso + 'T00:00:00').toLocaleDateString('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

export function todayISO() {
  return new Date().toISOString().slice(0, 10)
}

export function addDays(iso, days) {
  const d = new Date(iso)
  d.setDate(d.getDate() + days)
  return d.toISOString().slice(0, 10)
}

export function daysUntil(iso) {
  if (!iso) return 0
  const a = new Date(todayISO())
  const b = new Date(iso)
  return Math.round((b - a) / 86400000)
}

export function monthLabel(offset = 0) {
  const d = new Date()
  return new Date(d.getFullYear(), d.getMonth() + offset, 1).toLocaleDateString('id-ID', {
    month: 'long',
    year: 'numeric',
  })
}

export function initials(name = '') {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join('')
}

export function uid() {
  return 'id_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 9)
}
