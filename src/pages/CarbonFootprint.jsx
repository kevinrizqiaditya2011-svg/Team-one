import { useEffect, useMemo, useRef, useState } from 'react'
import { Car, Flame, Zap, TrendingDown, TrendingUp, Leaf, AlertCircle, RotateCcw } from 'lucide-react'
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend,
} from 'recharts'
import { useUserData } from '../hooks/useUserData'
import { usePlaces, usePlaceRecords } from '../context/PlaceContext'
import {
  carbonFootprint,
  CARBON_TIPS,
  monthRange,
  periodFromRecords,
  sumStats,
} from '../services/energyService'
import { askGeminiJSON, isGeminiConfigured } from '../services/geminiService'
import { readGeminiCache, writeGeminiCache, removeGeminiCache, geminiHash, getGeminiCooldownMs, setGeminiCooldown, clearGeminiCooldown } from '../services/geminiCache'
import { formatDecimal, formatNumber } from '../utils/format'
import { usePageTitle } from '../utils/hooks'
import PageHeader from '../components/ui/PageHeader'
import Badge from '../components/ui/Badge'
import PlaceSwitcher from '../components/PlaceSwitcher'
import { LoadingBlock } from '../components/ui/Loading'

const TIPS_CACHE_PREFIX = 'tips:v2:'
const TIPS_CACHE_TTL = 1000 * 60 * 60 * 24

const VEHICLES = [
  { id: 'motor', label: 'Motor' },
  { id: 'mobil', label: 'Mobil' },
  { id: 'transportUmum', label: 'Transportasi umum' },
]

const VEHICLE_LABELS = { motor: 'Motor', mobil: 'Mobil', transportUmum: 'Transportasi umum' }

const COLORS = { listrik: '#2456E6', transport: '#22D3EE', lpg: '#F5B50A' }

const TOOLTIP_STYLE = {
  borderRadius: 12,
  border: '1px solid #e2e8f0',
  fontSize: 12,
  background: '#fff',
  color: '#0f172a',
}

function unwrapList(list) {
  if (Array.isArray(list)) return list
  if (list && typeof list === 'object') {
    return list.tips || list.recommendations || list.data || list.items || []
  }
  return []
}

function normalizeTips(list) {
  const arr = unwrapList(list)
  if (!Array.isArray(arr)) return []
  return arr
    .filter((t) => t && typeof t.title === 'string' && t.title.trim())
    .map((t) => ({
      title: t.title,
      text: t.text || '',
      saves: t.saves || '± bervariasi',
    }))
}

function ensureFiveTips(list, target = 5) {
  const seen = new Set()
  const out = []
  for (const t of [...list, ...CARBON_TIPS]) {
    if (!t || typeof t.title !== 'string' || !t.title.trim()) continue
    if (seen.has(t.title)) continue
    seen.add(t.title)
    out.push(t)
    if (out.length >= target) break
  }
  return out
}

function buildTipsPrompt(result, inputKwh, trees, avoidTitles = []) {
  const avoid = avoidTitles.length
    ? `\n\nTips berikut SUDAH PERNAH diberikan ke pengguna — JANGAN mengulanginya sama sekali:\n- ${avoidTitles.join('\n- ')}\n`
    : ''
  return `Kamu adalah asisten AI ahli lingkungan & hemat energi untuk aplikasi "EnergiKita" di Indonesia. Pengguna baru saja menghitung estimasi jejak karbon bulanannya:

- Total: ${formatDecimal(result.total)} kg CO₂/bulan ≈ setara ${formatNumber(trees)} pohon/tahun
- Listrik: ${formatDecimal(result.electricity)} kg CO₂
- Transportasi: ${formatDecimal(result.transport)} kg CO₂
- LPG: ${formatDecimal(result.lpg)} kg CO₂
${avoid}
Buat TEPAT 5 tips (lima buah — jangan kurang dan jangan lebih) yang SPESIFIK, PERSONAL, dan BARU untuk pengguna ini. Rujuk angka konsumsinya di atas. Fokus pada sumber emisi TERBESAR pengguna. Gunakan bahasa Indonesia santai dan jelas. BALAS HANYA JSON ARRAY dengan tepat 5 elemen (tanpa teks lain, tanpa markdown):
[
  {
    "title": "judul singkat",
    "text": "penjelasan 1-2 kalimat yang bisa langsung dipraktikkan",
    "saves": "estimasi penghematan (mis. ± X kg CO₂/tahun)"
  }
]
Pastikan JSON valid agar bisa di-parse langsung.`
}

export default function CarbonFootprint() {
  usePageTitle('Carbon Footprint')
  const { records: allRecords, loading } = useUserData('energyRecords')
  const records = usePlaceRecords(allRecords)
  const [form, setForm] = useState({
    vehicleType: 'motor',
    vehicleKm: '',
    lpgKg: '',
  })
  const [tips, setTips] = useState(null)
  const [tipsStatus, setTipsStatus] = useState('idle')
  const [tipsError, setTipsError] = useState(null)
  const [fetchReq, setFetchReq] = useState(null)
  const [quotaWait, setQuotaWait] = useState(0)
  const inFlightRef = useRef({})
  const currentSigRef = useRef(null)

  const handleGenerateTips = () => {
    if (!tipsSignature) return
    setFetchReq({ sig: tipsSignature, tick: Date.now() })
  }

  const handleRegenerateTips = () => {
    if (!tipsSignature) return
    removeGeminiCache(TIPS_CACHE_PREFIX + tipsSignature)
    setFetchReq({ sig: tipsSignature, tick: Date.now(), avoid: (tips || []).map((t) => t.title) })
  }

  const monthKwh = useMemo(() => {
    const cur = monthRange(0)
    return sumStats(periodFromRecords(records, cur.start, cur.end)).totalKwh
  }, [records])

  const comparison = useMemo(() => {
    const cur = monthRange(0)
    const prev = monthRange(-1)
    const curCo2 = sumStats(periodFromRecords(records, cur.start, cur.end)).totalCo2
    const prevCo2 = sumStats(periodFromRecords(records, prev.start, prev.end)).totalCo2
    if (!prevCo2) return null
    return {
      curCo2,
      prevCo2,
      pct: ((curCo2 - prevCo2) / prevCo2) * 100,
    }
  }, [records])

  // Auto-use data from records (no manual kWh input)
  const inputKwh = monthKwh
  const result = carbonFootprint({
    kwh: inputKwh,
    vehicleType: form.vehicleType,
    vehicleKm: form.vehicleKm,
    lpgKg: form.lpgKg,
  })

  const hasInput = result.total > 0
  const trees = Math.round(result.total * 16.67)

  const tipsSignature = useMemo(() => {
    if (!hasInput) return null
    return geminiHash({
      vehicleType: form.vehicleType,
      vehicleKm: form.vehicleKm,
      lpgKg: form.lpgKg,
      monthKwh: Math.round(monthKwh * 100) / 100,
      total: Math.round(result.total * 100) / 100,
    })
  }, [hasInput, form.vehicleType, form.vehicleKm, form.lpgKg, monthKwh, result.total])

  useEffect(() => {
    if (quotaWait <= 0) return
    const t = setInterval(() => setQuotaWait((w) => Math.max(0, w - 1)), 1000)
    return () => clearInterval(t)
  }, [quotaWait > 0])

  useEffect(() => {
    setTipsError(null)
    if (!hasInput || !tipsSignature) {
      setTips(null)
      setTipsStatus('idle')
      return
    }
    if (!isGeminiConfigured()) {
      setTips(CARBON_TIPS)
      setTipsStatus('off')
      return
    }

    const cacheKey = TIPS_CACHE_PREFIX + tipsSignature
    const cached = readGeminiCache(cacheKey)
    if (cached && Array.isArray(cached) && cached.length) {
      setTips(cached)
      setTipsStatus('done')
      return
    }

    const cooldownMs = getGeminiCooldownMs()
    if (cooldownMs > 0) {
      setTips(CARBON_TIPS)
      setQuotaWait(Math.ceil(cooldownMs / 1000))
      setTipsStatus('quota')
      return
    }

    if (!fetchReq || fetchReq.sig !== tipsSignature) {
      currentSigRef.current = tipsSignature
      setTips(null)
      setTipsStatus('idle')
      return
    }

    if (inFlightRef.current[tipsSignature]) return

    currentSigRef.current = tipsSignature
    setTipsStatus('loading')
    inFlightRef.current[tipsSignature] = true
    const p = askGeminiJSON(buildTipsPrompt(result, inputKwh, trees, fetchReq.avoid || []), undefined, {
      temperature: 0.8,
      maxOutputTokens: 4000,
    })
      .then((list) => {
        if (currentSigRef.current !== tipsSignature) return
        const normalized = normalizeTips(list)
        const final = ensureFiveTips(normalized)
        if (normalized.length) {
          writeGeminiCache(cacheKey, final, TIPS_CACHE_TTL)
          clearGeminiCooldown()
        }
        setTips(final)
        setTipsStatus(normalized.length ? 'done' : 'fallback')
      })
      .catch((err) => {
        if (currentSigRef.current !== tipsSignature) return
        setTipsError(err?.message || 'Terjadi kesalahan tak dikenal.')
        setTips(CARBON_TIPS)
        if (err?.quota) {
          setGeminiCooldown()
          setQuotaWait(Math.ceil(getGeminiCooldownMs() / 1000))
        }
        setTipsStatus(err?.quota ? 'quota' : 'fallback')
      })
      .finally(() => {
        delete inFlightRef.current[tipsSignature]
      })
    inFlightRef.current[tipsSignature] = p
  }, [hasInput, tipsSignature, fetchReq])

  const pieData = [
    { name: 'Listrik', value: result.electricity, color: COLORS.listrik },
    { name: 'Transportasi', value: result.transport, color: COLORS.transport },
    { name: 'LPG', value: result.lpg, color: COLORS.lpg },
  ].filter((d) => d.value > 0)

  if (loading) return <LoadingBlock label="Menghitung jejak karbon…" />

  return (
    <div>
      <PageHeader
        title="Carbon Footprint"
        subtitle="Hitung estimasi jejak karbonmu dari listrik, kendaraan, dan LPG — lengkap dengan tips pengurangan emisi dari AI."
      />

      <div className="mb-5 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-3 dark:border-slate-800 dark:bg-slate-900">
        <PlaceSwitcher />
      </div>

      <div className="grid gap-5 lg:grid-cols-5">
        <div className="card h-fit p-6 lg:col-span-2">
          <h2 className="mb-4 text-base font-bold text-slate-900 dark:text-white">Kalkulator Emisi</h2>
          <div className="space-y-4">
            {/* kWh auto dari data records */}
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-3.5 dark:border-slate-700 dark:bg-slate-800/60">
              <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-slate-700 dark:text-slate-300">
                <Zap size={14} className="text-teal-500" /> Konsumsi listrik
              </span>
              <p className="mt-1.5 font-mono text-lg font-bold text-slate-900 dark:text-white">
                {formatDecimal(monthKwh)} <span className="text-sm font-semibold text-slate-400">kWh</span>
              </p>
              <p className="text-[11px] text-slate-400">Dari data catatan bulan ini</p>
            </div>

            <div>
              <span className="mb-1.5 flex items-center gap-1.5 text-sm font-semibold text-slate-700 dark:text-slate-300">
                <Car size={14} className="text-sky-500" /> Penggunaan kendaraan
              </span>
              <div className="grid grid-cols-3 gap-2">
                {VEHICLES.map((v) => (
                  <button
                    key={v.id}
                    type="button"
                    onClick={() => setForm((f) => ({ ...f, vehicleType: v.id }))}
                    aria-pressed={form.vehicleType === v.id}
                    className={`rounded-xl border px-1 py-2.5 text-[11px] font-semibold transition ${
                      form.vehicleType === v.id
                        ? 'border-teal-500 bg-teal-50 text-teal-700 ring-4 ring-teal-500/15 dark:bg-teal-500/15 dark:text-teal-300'
                        : 'border-slate-200 text-slate-500 hover:border-slate-300 dark:border-slate-700 dark:text-slate-400'
                    }`}
                  >
                    {v.label}
                  </button>
                ))}
              </div>
              <input
                type="number"
                min="0"
                value={form.vehicleKm}
                onChange={(e) => setForm((f) => ({ ...f, vehicleKm: e.target.value }))}
                placeholder="Jarak per minggu (km)"
                className="input mt-2"
                aria-label="Jarak tempuh kendaraan per minggu"
              />
            </div>
            <div>
              <label htmlFor="cf-lpg" className="mb-1.5 flex items-center gap-1.5 text-sm font-semibold text-slate-700 dark:text-slate-300">
                <Flame size={14} className="text-sky-500" /> Penggunaan LPG (kg/bulan)
              </label>
              <input
                id="cf-lpg"
                type="number"
                min="0"
                value={form.lpgKg}
                onChange={(e) => setForm((f) => ({ ...f, lpgKg: e.target.value }))}
                placeholder="cth: 3 (1 tabung kecil)"
                className="input"
              />
            </div>
          </div>

          {/* Tombol Berikan Tips — di bawah form */}
          {tipsStatus === 'idle' ? (
            <button
              type="button"
              onClick={handleGenerateTips}
              className="group mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 to-teal-500 px-4 py-3 text-sm font-bold text-white shadow-md shadow-teal-500/20 transition hover:shadow-lg hover:shadow-teal-500/30"
            >
              <Leaf size={16} /> Berikan Tips AI Hemat
            </button>
          ) : tipsStatus === 'loading' ? (
            <div className="mt-4 flex items-center gap-3 rounded-xl border border-teal-200 bg-teal-50 p-3 dark:border-teal-500/25 dark:bg-teal-500/10">
              <span className="relative grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-teal-100 text-teal-600 dark:bg-teal-500/15 dark:text-teal-400">
                <span className="absolute inset-0 animate-ping rounded-lg bg-teal-400/40" aria-hidden="true" />
                <Leaf size={14} className="relative" />
              </span>
              <p className="text-xs font-bold text-teal-700 dark:text-teal-300">AI menyusun tips…</p>
            </div>
          ) : (
            <button
              type="button"
              onClick={handleRegenerateTips}
              className="mt-4 inline-flex items-center gap-1.5 rounded-xl border border-teal-200 bg-teal-50 px-4 py-2.5 text-xs font-bold text-teal-700 transition hover:bg-teal-100 dark:border-teal-500/30 dark:bg-teal-500/10 dark:text-teal-300 dark:hover:bg-teal-500/20"
            >
              <RotateCcw size={13} /> Buat Ulang Tips
            </button>
          )}
        </div>

        <div className="space-y-5 lg:col-span-3">
          {/* Estimasi Emisi — tampil otomatis */}
          <div className="card p-6 sm:p-8">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">Estimasi Emisi CO₂</h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">Perhitungan bulanan</p>
              </div>
              <div className="text-right">
                <p className="text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white">
                  {formatDecimal(result.total)} <span className="text-lg font-bold text-slate-400">kg</span>
                </p>
                <p className="text-xs text-slate-400">≈ setara {formatNumber(trees)} pohon/tahun</p>
              </div>
            </div>

            {comparison && (
              <div
                className={`mt-4 flex items-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold ${
                  comparison.pct <= 0
                    ? 'bg-teal-50 text-teal-700 dark:bg-teal-500/10 dark:text-teal-300'
                    : 'bg-rose-50 text-rose-600 dark:bg-rose-500/10 dark:text-rose-300'
                }`}
              >
                {comparison.pct <= 0 ? <TrendingDown size={16} /> : <TrendingUp size={16} />}
                {comparison.pct <= 0
                  ? `Emisi turun ${formatDecimal(Math.abs(comparison.pct))}% dibanding bulan lalu — bagus!`
                  : `Emisi naik ${formatDecimal(comparison.pct)}% dibanding bulan lalu`}
                <span className="font-normal opacity-70">
                  ({formatDecimal(comparison.curCo2)} vs {formatDecimal(comparison.prevCo2)} kg dari listrik)
                </span>
              </div>
            )}

            <div className="mt-6 grid items-center gap-6 sm:grid-cols-2">
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      dataKey="value"
                      nameKey="name"
                      innerRadius={55}
                      outerRadius={95}
                      paddingAngle={3}
                      strokeWidth={0}
                    >
                      {pieData.map((d) => (
                        <Cell key={d.name} fill={d.color} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={TOOLTIP_STYLE} formatter={(v) => [`${v} kg`, 'CO₂']} />
                    <Legend iconType="circle" wrapperStyle={{ fontSize: 12 }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <ul className="space-y-3">
                <li className="flex items-center justify-between rounded-xl bg-slate-50 px-5 py-4 dark:bg-slate-800/60">
                  <span className="flex items-center gap-2.5 text-sm text-slate-600 dark:text-slate-300">
                    <span className="h-3 w-3 rounded-full bg-sirkuit-500" /> Listrik
                  </span>
                  <span className="text-base font-bold text-slate-900 dark:text-white">{formatDecimal(result.electricity)} kg</span>
                </li>
                <li className="flex items-center justify-between rounded-xl bg-slate-50 px-5 py-4 dark:bg-slate-800/60">
                  <span className="flex items-center gap-2.5 text-sm text-slate-600 dark:text-slate-300">
                    <span className="h-3 w-3 rounded-full bg-neon-400" /> Transportasi
                  </span>
                  <span className="text-base font-bold text-slate-900 dark:text-white">{formatDecimal(result.transport)} kg</span>
                </li>
                <li className="flex items-center justify-between rounded-xl bg-slate-50 px-5 py-4 dark:bg-slate-800/60">
                  <span className="flex items-center gap-2.5 text-sm text-slate-600 dark:text-slate-300">
                    <span className="h-3 w-3 rounded-full bg-voltase-500" /> LPG
                  </span>
                  <span className="text-base font-bold text-slate-900 dark:text-white">{formatDecimal(result.lpg)} kg</span>
                </li>
              </ul>
            </div>
          </div>

        </div>
      </div>

      {/* Tips AI — div baru full-width di bawah grid */}
      {(tipsStatus === 'done' || tipsStatus === 'fallback' || tipsStatus === 'quota') && (
        <div className="card mt-5 p-6">
          <div className="mb-4 flex items-center justify-between gap-2">
            <h2 className="text-base font-bold text-slate-900 dark:text-white">Tips AI Hemat Energi</h2>
            {tipsStatus === 'fallback' && (
              <div className="flex items-start gap-2 text-[11px] text-sky-600 dark:text-sky-400">
                <AlertCircle size={13} className="mt-0.5 shrink-0" />
                <span>tips umum</span>
              </div>
            )}
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
            {ensureFiveTips(tips || CARBON_TIPS).map((tip) => (
              <div key={tip.title} className="rounded-xl border border-slate-100 bg-white p-4 transition hover:border-teal-200 dark:border-slate-800 dark:bg-white/[0.03] dark:hover:border-teal-500/40">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-bold text-slate-900 dark:text-white">{tip.title}</p>
                  <Badge tone="emerald" className="!text-[9px] shrink-0">{tip.saves}</Badge>
                </div>
                <p className="mt-1.5 text-xs leading-relaxed text-slate-500 dark:text-slate-400">{tip.text}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
