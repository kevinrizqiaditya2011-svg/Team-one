import { useEffect, useMemo, useRef, useState } from 'react'
import { TrendingUp, AlertTriangle, CheckCircle2, Fan, Plug, Sun, Smartphone, Lightbulb } from 'lucide-react'
import { buildRecommendations, devicesForRooms, ROOM_DEVICE_MAP } from '../services/recommendationService'
import { monthRange, periodFromRecords, sumStats, recentTrend, roomConsumption } from '../services/energyService'
import { askGeminiJSON, isGeminiConfigured } from '../services/geminiService'
import {
  readGeminiCache,
  writeGeminiCache,
  removeGeminiCache,
  geminiHash,
  getGeminiCooldownMs,
  setGeminiCooldown,
  clearGeminiCooldown,
} from '../services/geminiCache'
import { formatDecimal, formatNumber } from '../utils/format'

export const REC_ICONS = {
  'trending-up': TrendingUp,
  'trending-down': (props) => <TrendingUp {...props} className="rotate-180" />,
  alert: AlertTriangle,
  check: CheckCircle2,
  ac: Fan,
  plug: Plug,
  sun: Sun,
  device: Smartphone,
  lightbulb: Lightbulb,
}

const VALID_ICONS = Object.keys(REC_ICONS)
const VALID_PRIORITIES = ['Tinggi', 'Sedang', 'Rendah']

function unwrapList(list) {
  if (Array.isArray(list)) return list
  if (list && typeof list === 'object') {
    return list.recommendations || list.tips || list.data || list.items || []
  }
  return []
}

// Jaminan "tanpa emoji" untuk rekomendasi apa pun (termasuk hasil AI).
const stripEmoji = (s) => (s || '').replace(/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}\u{FE0F}]/gu, '').trim()

function normalizeRecs(list) {
  const arr = unwrapList(list)
  if (!Array.isArray(arr)) return []
  return arr
    .filter((r) => r && typeof r.title === 'string' && r.title.trim())
    .map((r, i) => ({
      id: 'ai-' + i,
      type: 'ai',
      icon: VALID_ICONS.includes(r.icon) ? r.icon : 'lightbulb',
      title: stripEmoji(r.title),
      description: stripEmoji(r.description),
      priority: VALID_PRIORITIES.includes(r.priority) ? r.priority : 'Sedang',
      savingsKwh: Math.max(0, Number(r.savingsKwh) || 0),
      savingsRp: Math.max(0, Number(r.savingsRp) || 0),
      co2Impact: Math.max(0, Number(r.co2Impact) || 0),
    }))
}

function roomDevicesLine(room) {
  const devs = ROOM_DEVICE_MAP[room] || []
  return devs.length ? devs.join(', ') : 'belum diketahui'
}

/**
 * Susun prompt AI dengan konteks ruangan gedung — kunci agar rekomendasi
 * "nyambung" dengan gedung tsb (mis. garasi tidak disarankan pakai AC).
 */
export function buildPrompt(summary, user, { rooms = [], roomScope = null, placeName = 'Gedung', placeType = '' } = {}, avoidTitles = []) {
  const fmt = (n, d = 1) => formatDecimal(n, d)
  const curPct =
    summary.prevStats.totalKwh > 0
      ? ((summary.curStats.totalKwh - summary.prevStats.totalKwh) / summary.prevStats.totalKwh) * 100
      : null
  const trendPct = summary.trend ? summary.trend.pctChange : null
  const avoid = avoidTitles.length
    ? `\n\nRekomendasi berikut SUDAH PERNAH diberikan ke pengguna — JANGAN mengulanginya sama sekali:\n- ${avoidTitles.join('\n- ')}\n`
    : ''

  const roomList = roomScope ? [roomScope] : rooms
  const roomLines = roomList.length
    ? roomList.map((r) => `- ${r}: ${roomDevicesLine(r)}`).join('\n')
    : '- Ruangan gedung belum terdaftar — gunakan rekomendasi umum yang aman (lampu, perangkat standby, charger).'

  const perRoom = summary.roomStats.length
    ? summary.roomStats.map((s) => `- ${s.room}: ${fmt(s.kwh)} kWh (${fmt(s.share, 0)}% dari total pemakaian gedung)`).join('\n')
    : '- Belum ada data konsumsi per ruangan.'

  const scopeNote = roomScope
    ? `\nRuangan yang sedang dianalisis: "${roomScope}". Semua rekomendasi HANYA untuk ruangan ini — jangan menyarankan perangkat yang tidak ada di ruangan tersebut.`
    : '\nAnalisis berlaku untuk seluruh gedung — setiap rekomendasi harus relevan dengan ruangan yang benar-benar ada di gedung tersebut, dan sebutkan nama ruangannya.'

  return `Kamu adalah asisten AI ahli hemat energi untuk aplikasi "EnergiKita" di Indonesia. Analisis data konsumsi listrik pengguna berikut, lalu susun 4–6 rekomendasi penghematan yang SPESIFIK, PERSONAL, dan REALISTIS dalam bahasa Indonesia. Beri peringkat prioritas sesuai dampak & kemudahan menerapkannya.

DATA GEDUNG:
- Nama gedung: ${placeName}
- Jenis gedung: ${placeType || user?.userType || 'Rumah'}
- Daftar ruangan di gedung beserta perangkat khasnya:
${roomLines}
- Konsumsi per ruangan (seluruh periode):
${perRoom}${scopeNote}

DATA PENGGUNA:
- Jumlah catatan energi: ${summary.count}
- Total pemakaian tercatat: ${fmt(summary.totalKwh)} kWh
- Bulan ini: ${fmt(summary.curStats.totalKwh)} kWh (${summary.curStats.count} catatan)
- Bulan lalu: ${fmt(summary.prevStats.totalKwh)} kWh (${summary.prevStats.count} catatan)
- Perubahan bulanan: ${curPct === null ? 'belum bisa dibandingkan' : `${fmt(curPct, 1)}%`}
- Tren 7 hari terakhir: ${trendPct === null ? 'belum cukup data' : `${fmt(trendPct, 1)}%`}
- Tarif listrik: Rp1.450/kWh · Faktor emisi: 0,85 kg CO2/kWh
${avoid}
ATURAN PENTING (WAJIB DIPATUHI):
1. Hanya beri rekomendasi yang relevan dengan perangkat yang ADA di ruangan/gedung tersebut (lihat daftar ruangan di atas).
2. JANGAN PERNAH menyarankan AC (mis. "atur suhu 24–26°C", "bersihkan filter AC", "tutup jendela saat AC menyala") untuk ruangan yang TIDAK memiliki AC seperti Garasi, Gudang, Teras, Balkon, atau Kamar Mandi — untuk ruangan semacam itu ganti dengan tips lampu, charger, pompa air, atau perangkat yang memang ada di ruangan tersebut.
3. Jangan menyarankan perangkat yang tidak tercantum di daftar ruangan gedung.
4. Sebutkan nama ruangan dalam deskripsi agar rekomendasi terasa spesifik untuk gedung tersebut.

BALAS HANYA JSON ARRAY (tanpa teks lain, tanpa markdown):
[
  {
    "title": "judul singkat",
    "description": "penjelasan 1-2 kalimat spesifik sesuai data di atas",
    "icon": "salah satu dari: trending-up, trending-down, alert, check, ac, plug, sun, device, lightbulb",
    "priority": "Tinggi | Sedang | Rendah",
    "savingsKwh": 0,
    "savingsRp": 0,
    "co2Impact": 0
  }
]
Nilai savingsKwh/savingsRp/co2Impact adalah estimasi penghematan bulanan (boleh 0 jika tidak relevan). Pastikan JSON valid agar bisa di-parse langsung.`
}

/**
 * Hook bersama untuk rekomendasi hemat energi (AI + aturan).
 * - Data dihitung dari `records` (sudah difilter per gedung oleh pemanggil).
 * - `rooms` = daftar ruangan gedung; `roomScope` = ruangan yang sedang dianalisis (opsional).
 * - AI hanya dipanggil bila kunci Gemini terpasang; jika tidak/kuota habis,
 *   otomatis memakai rekomendasi berbasis aturan yang juga room-aware.
 */
export function useAiRecommendations({ records, rooms = [], roomScope = null, placeName = 'Gedung', placeType = '', user, loading = false }) {
  const [aiRecs, setAiRecs] = useState(null)
  const [aiStatus, setAiStatus] = useState('idle') // idle | loading | done | fallback | quota | off
  const [aiError, setAiError] = useState(null)
  const [regenerate, setRegenerate] = useState(null)
  const [quotaWait, setQuotaWait] = useState(0)
  const inFlightRef = useRef({})
  const currentSigRef = useRef(null)

  const summary = useMemo(() => {
    const cur = monthRange(0)
    const prev = monthRange(-1)
    const curStats = sumStats(periodFromRecords(records, cur.start, cur.end))
    const prevStats = sumStats(periodFromRecords(records, prev.start, prev.end))
    return {
      count: records.length,
      totalKwh: sumStats(records).totalKwh,
      curStats,
      prevStats,
      trend: recentTrend(records, 7),
      roomStats: roomConsumption(records),
    }
  }, [records])

  // Rekomendasi berbasis aturan — selalu tersedia sebagai fallback.
  // Saat ruangan dipilih, hanya perangkat ruangan itu yang dipertimbangkan.
  const ruleRecs = useMemo(
    () => buildRecommendations(records, rooms, { roomScope }),
    [records, rooms, roomScope],
  )

  const aiSignature = useMemo(() => {
    if (!user) return null
    const roomStatStr = summary.roomStats.map((s) => `${s.room}:${Math.round(s.kwh * 100) / 100}`).join('|')
    return geminiHash({
      uid: user.id,
      userType: user.userType,
      count: summary.count,
      totalKwh: Math.round(summary.totalKwh * 100) / 100,
      curKwh: Math.round(summary.curStats.totalKwh * 100) / 100,
      prevKwh: Math.round(summary.prevStats.totalKwh * 100) / 100,
      trend: summary.trend ? Math.round(summary.trend.pctChange * 10) / 10 : null,
      rooms: rooms.join(','),
      roomScope: roomScope || '',
      roomStats: roomStatStr,
    })
  }, [user, summary, rooms, roomScope])

  const handleRegenerate = () => {
    if (!aiSignature) return
    removeGeminiCache('recs:' + aiSignature)
    setRegenerate({ sig: aiSignature, tick: Date.now(), avoid: (aiRecs || []).map((r) => r.title) })
  }

  const handleRetry = () => {
    if (!aiSignature) return
    setRegenerate({ sig: aiSignature, tick: Date.now() })
  }

  useEffect(() => {
    if (quotaWait <= 0) return
    const t = setInterval(() => setQuotaWait((w) => Math.max(0, w - 1)), 1000)
    return () => clearInterval(t)
  }, [quotaWait > 0])

  useEffect(() => {
    setAiError(null)
    if (loading || records.length === 0 || !aiSignature) return
    if (!isGeminiConfigured()) {
      setAiStatus('off')
      return
    }

    const cacheKey = 'recs:' + aiSignature

    const cached = readGeminiCache(cacheKey)
    if (cached && Array.isArray(cached) && cached.length) {
      setAiRecs(cached)
      setAiStatus('done')
      return
    }

    const cooldownMs = getGeminiCooldownMs()
    if (cooldownMs > 0) {
      setQuotaWait(Math.ceil(cooldownMs / 1000))
      setAiStatus('quota')
      return
    }

    if (inFlightRef.current[aiSignature]) return

    currentSigRef.current = aiSignature
    setAiStatus('loading')
    const avoid = regenerate && regenerate.sig === aiSignature ? regenerate.avoid || [] : []
    const p = askGeminiJSON(
      buildPrompt(summary, user, { rooms, roomScope, placeName, placeType }, avoid),
      undefined,
      { temperature: 0.5, maxOutputTokens: 8000 },
    )
      .then((list) => {
        if (currentSigRef.current !== aiSignature) return
        const recs = normalizeRecs(list)
        if (recs.length) {
          writeGeminiCache(cacheKey, recs)
          clearGeminiCooldown()
        }
        setAiRecs(recs.length ? recs : null)
        setAiStatus(recs.length ? 'done' : 'fallback')
      })
      .catch((err) => {
        if (currentSigRef.current !== aiSignature) return
        console.error('[AI] Rekomendasi gagal:', err)
        setAiError(err?.message || 'Terjadi kesalahan tak dikenal.')
        if (err?.quota) {
          setGeminiCooldown()
          setQuotaWait(Math.ceil(getGeminiCooldownMs() / 1000))
        }
        setAiStatus(err?.quota ? 'quota' : 'fallback')
      })
      .finally(() => {
        delete inFlightRef.current[aiSignature]
      })
    inFlightRef.current[aiSignature] = p
  }, [loading, records, aiSignature, regenerate, rooms, roomScope, placeName, placeType, summary, user])

  const recs = aiRecs || ruleRecs

  const totals = useMemo(() => {
    const actionable = recs.filter((r) => r.savingsKwh > 0)
    return {
      kwh: actionable.reduce((s, r) => s + r.savingsKwh, 0),
      rp: actionable.reduce((s, r) => s + r.savingsRp, 0),
      co2: actionable.reduce((s, r) => s + r.co2Impact, 0),
    }
  }, [recs])

  return {
    recs,
    ruleRecs,
    aiStatus,
    aiError,
    totals,
    quotaWait,
    summary,
    handleRegenerate,
    handleRetry,
  }
}