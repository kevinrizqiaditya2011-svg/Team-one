export const EMISSION_FACTOR = 0.85
export const TARIFF = 1450
export const LPG_FACTOR = 1.65
export const VEHICLE_FACTORS = { motor: 0.06, mobil: 0.12, transportUmum: 0.03 }

export function sortByDate(records) {
  return [...records].sort((a, b) => a.date.localeCompare(b.date))
}

export function monthRange(offset = 0) {
  const DAY_MS = 86400000
  const end = new Date()
  end.setDate(end.getDate() + offset * 30)
  const start = new Date(end.getTime() - 29 * DAY_MS)
  return {
    start: start.toISOString().slice(0, 10),
    end: end.toISOString().slice(0, 10),
  }
}

export function periodFromRecords(records, startISO, endISO) {
  return records.filter((r) => r.date >= startISO && r.date <= endISO)
}

export function sumStats(records) {
  const totalKwh = records.reduce((s, r) => s + (Number(r.kwh) || 0), 0)
  const totalCost = records.reduce((s, r) => s + (Number(r.cost) || 0), 0)
  const totalCo2 = records.reduce((s, r) => s + (Number(r.estimatedCO2) || 0), 0)
  return { totalKwh, totalCost, totalCo2, count: records.length }
}

export function dailyAverage(records) {
  if (!records.length) return 0
  return sumStats(records).totalKwh / records.length
}

export function savingsVsPrevious(current, previous) {
  const curDaily = dailyAverage(current)
  const prevDaily = dailyAverage(previous)
  if (!prevDaily) {
    return { savedKwh: 0, savedRp: 0, savedCo2: 0, pctChange: 0, baselineKwh: 0 }
  }
  const baselineKwh = prevDaily * current.length
  const savedKwh = Math.max(0, baselineKwh - sumStats(current).totalKwh)
  return {
    savedKwh,
    savedRp: Math.round(savedKwh * TARIFF),
    savedCo2: Math.round(savedKwh * EMISSION_FACTOR * 100) / 100,
    pctChange: ((curDaily - prevDaily) / prevDaily) * 100,
    baselineKwh,
  }
}

export function recentTrend(records, days = 7) {
  const sorted = sortByDate(records)
  if (sorted.length < days * 2) return null
  const recent = sorted.slice(-days)
  const before = sorted.slice(-days * 2, -days)
  const recentAvg = dailyAverage(recent)
  const beforeAvg = dailyAverage(before)
  if (!beforeAvg) return null
  return {
    recentAvg,
    beforeAvg,
    pctChange: ((recentAvg - beforeAvg) / beforeAvg) * 100,
  }
}

export function carbonFootprint({ kwh = 0, vehicleType = 'motor', vehicleKm = 0, lpgKg = 0 }) {
  const electricity = (Number(kwh) || 0) * EMISSION_FACTOR
  const transport = (Number(vehicleKm) || 0) * (VEHICLE_FACTORS[vehicleType] || 0.06)
  const lpg = (Number(lpgKg) || 0) * LPG_FACTOR
  const total = electricity + transport + lpg
  return {
    electricity: Math.round(electricity * 100) / 100,
    transport: Math.round(transport * 100) / 100,
    lpg: Math.round(lpg * 100) / 100,
    total: Math.round(total * 100) / 100,
  }
}

export const CARBON_TIPS = [
  {
    icon: 'fan',
    title: 'Gunakan AC hemat energi',
    text: 'Setel suhu 24–26°C dan bersihkan filter rutin — hemat hingga 6% per derajat.',
    saves: '± 25 kg CO₂/tahun',
  },
  {
    icon: 'leaf',
    title: 'Pilih kendaraan ramah lingkungan',
    text: 'Gunakan transportasi umum atau kendaraan listrik untuk jarak dekat.',
    saves: '± 0,12 kg CO₂/km',
  },
  {
    icon: 'lamp',
    title: 'Ganti lampu ke LED',
    text: 'LED mengonsumsi 80% lebih sedikit energi dibanding lampu pijar.',
    saves: '± 15 kg CO₂/tahun',
  },
  {
    icon: 'plug',
    title: 'Cabut charger yang tidak dipakai',
    text: 'Perangkat standby menyedot energi walau mati — cabut saat selesai.',
    saves: '± 8% tagihan listrik',
  },
  {
    icon: 'sun',
    title: 'Manfaatkan cahaya alami',
    text: 'Buka jendela di siang hari dan matikan lampu — gratis dan lebih sehat.',
    saves: '± 10% tagihan listrik',
  },
]

function pad(n) {
  return String(n).padStart(2, '0')
}

function localISO(d) {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

/**
 * Tren konsumsi bulanan — agregasi per bulan untuk N bulan terakhir.
 * Dipakai di Dashboard untuk menampilkan perkembangan konsumsi.
 */
export function monthlyTrend(records, count = 6) {
  const buckets = []
  const now = new Date()
  for (let i = count - 1; i >= 0; i -= 1) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const mStart = localISO(d)
    const lastDay = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate()
    const mEnd = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(lastDay)}`
    const s = sumStats(periodFromRecords(records, mStart, mEnd))
    buckets.push({
      key: `${d.getFullYear()}-${pad(d.getMonth() + 1)}`,
      label: d.toLocaleDateString('id-ID', { month: 'short' }),
      kwh: Math.round(s.totalKwh * 10) / 10,
      cost: Math.round(s.totalCost),
    })
  }
  return buckets
}

/**
 * Statistik konsumsi per ruangan, diurutkan dari yang paling boros.
 * Mengembalikan array [{ room, kwh, cost, co2, count, share }] — share = % dari total.
 */
export function roomConsumption(records) {
  const stats = {}
  records.forEach((r) => {
    const room = (r.room || '').trim()
    if (!room) return
    if (!stats[room]) stats[room] = { room, kwh: 0, cost: 0, co2: 0, count: 0 }
    stats[room].kwh += Number(r.kwh) || 0
    stats[room].cost += Number(r.cost) || 0
    stats[room].co2 += Number(r.estimatedCO2) || 0
    stats[room].count += 1
  })
  const totalKwh = Object.values(stats).reduce((s, v) => s + v.kwh, 0)
  return Object.values(stats)
    .map((s) => ({ ...s, share: totalKwh > 0 ? (s.kwh / totalKwh) * 100 : 0 }))
    .sort((a, b) => b.kwh - a.kwh)
}

export function hourlyDistribution(totalKwh) {
  const weights = [
    0.5, 0.4, 0.4, 0.5, 0.7, 1.2, 1.9, 2.1, 1.7, 1.1, 0.9, 0.8,
    0.8, 0.9, 1.0, 1.1, 1.4, 1.9, 2.5, 2.7, 2.3, 1.9, 1.4, 0.9,
  ]
  const sum = weights.reduce((a, b) => a + b, 0)
  return weights.map((w, i) => ({
    label: `${String(i).padStart(2, '0')}.00`,
    value: Math.round(((w / sum) * totalKwh) * 100) / 100,
  }))
}
