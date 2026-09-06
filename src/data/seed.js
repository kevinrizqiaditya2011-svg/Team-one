import { TARIFF, EMISSION_FACTOR } from '../services/energyService'

const DAY_MS = 86400000

function toISO(d) {
  return d.toISOString().slice(0, 10)
}

function generateEnergyRecords(userId) {
  const records = []
  const today = new Date()
  const now = new Date()
  const hour = now.getHours()
  const todayKwh = Math.round(((hour / 24) * 13.2 + 1.4) * 10) / 10

  for (let i = 60; i >= 0; i -= 1) {
    const d = new Date(today.getTime() - i * DAY_MS)
    const dow = d.getDay()
    const isWeekend = dow === 0 || dow === 6

    let base = 11.2
    if (i < 7) base = 13.4
    else if (i < 14) base = 11.3
    else if (i < 28) base = 10.1
    else base = 13.1

    const wave = Math.sin(i / 4.2) * 0.7
    const noise = (Math.random() - 0.5) * 1.4
    let kwh = base + wave + noise
    if (isWeekend) kwh *= 0.88
    kwh = Math.max(6, Math.round(kwh * 10) / 10)

    if (i === 0) kwh = todayKwh
    const cost = Math.round(kwh * TARIFF)
    const estimatedCO2 = Math.round(kwh * EMISSION_FACTOR * 100) / 100
    records.push({
      id: 'rec_' + (1000 + i),
      userId,
      date: toISO(d),
      kwh,
      cost,
      locationType: 'Rumah',
      estimatedCO2,
    })
  }
  return records
}

export function seedIfNeeded() {
  if (localStorage.getItem('energikita:seeded_v4')) return

  const demoUser = {
    id: 'demo-user',
    name: 'Andi Pratama',
    email: 'demo@energikita.id',
    password: 'hbr2v10',
    role: 'user',
    userType: 'Rumah',
    points: 0,
    level: 1,
    energyTarget: 300,
    createdAt: new Date(Date.now() - 90 * DAY_MS).toISOString(),
  }

  const col = (name, docs) => localStorage.setItem(`energikita:col:${name}`, JSON.stringify(docs))

  col('users', [demoUser])
  col('energyRecords', generateEnergyRecords(demoUser.id))
  localStorage.setItem('energikita:seeded_v4', '1')

  // Reset session akun demo jika tersimpan dengan data lama (points/level basi)
  try {
    const raw = localStorage.getItem('energikita:session')
    if (!raw) return
    const session = JSON.parse(raw)
    if (session && (session.email === demoUser.email || session.id === demoUser.id)) {
      session.points = 0
      session.level = 1
      localStorage.setItem('energikita:session', JSON.stringify(session))
    }
  } catch {
  }
}
