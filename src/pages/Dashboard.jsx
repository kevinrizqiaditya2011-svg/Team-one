import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import {
  FileText,
  Zap,
  Wallet,
  Leaf,
  TrendingUp,
  TrendingDown,
  Minus,
  Flame,
  Lightbulb,
  ArrowRight,
  RotateCcw,
  Sparkles,
} from 'lucide-react'
import {
  AreaChart,
  Area,
  ResponsiveContainer,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from 'recharts'
import { useAuth } from '../context/AuthContext'
import { useUserData } from '../hooks/useUserData'
import { usePlaces, usePlaceRecords, usePlaceRooms } from '../context/PlaceContext'
import {
  monthRange,
  periodFromRecords,
  sumStats,
  savingsVsPrevious,
  monthlyTrend,
  roomConsumption,
} from '../services/energyService'
import { formatRupiah, formatNumber, formatDecimal } from '../utils/format'
import { usePageTitle } from '../utils/hooks'
import PageHeader from '../components/ui/PageHeader'
import EnergyBar from '../components/ui/EnergyBar'
import Badge from '../components/ui/Badge'
import EmptyState from '../components/ui/EmptyState'
import PlaceSwitcher from '../components/PlaceSwitcher'
import { useAiRecommendations, REC_ICONS } from '../hooks/useAiRecommendations'

const TOOLTIP_STYLE = {
  borderRadius: 12,
  border: '1px solid #e2e8f0',
  fontSize: 12,
  background: '#fff',
  color: '#0f172a',
}

function AiChip({ label = 'Dianalisis AI' }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-teal-300/30 bg-gradient-to-r from-cyan-500/15 via-teal-500/15 to-emerald-500/15 px-3 py-1 text-[11px] font-bold text-teal-700 shadow-sm dark:text-teal-300">
      <Sparkles size={12} className="text-teal-500" /> {label}
    </span>
  )
}

/** Panel ringkasan energi — hero hijau, tanpa biru: angka besar, bar target, 3 stat singkat. */
function EnergyHero({ stats, avgDaily, hasPrev, save }) {
  const pct = save.pctChange
  const trendUp = pct > 0
  const isStable = pct === 0

  // Rasio pemakaian terhadap target ideal (300 kWh)
  const ratio = Math.min(1, Math.max(0.05, stats.totalKwh / 300))

  return (
    <section className="relative overflow-hidden rounded-[1.6rem] bg-gradient-to-br from-sirkuit-700 via-sirkuit-900 to-isolasi-950 p-5 shadow-lg shadow-sirkuit-900/20 sm:p-6">
      <EnergyBar className="absolute inset-x-0 top-0 h-1 w-full rounded-none" />
      <div aria-hidden className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-sirkuit-400/20 blur-3xl" />
      <div aria-hidden className="pointer-events-none absolute -bottom-24 left-1/3 h-56 w-56 rounded-full bg-neon-400/10 blur-3xl" />

      <div className="relative mt-5">
        
        <div className="mb-4 flex items-end gap-3">
          <p className="text-4xl font-extrabold tracking-tight text-white sm:text-5xl">
            {formatNumber(stats.totalKwh)}
          </p>
          <span className="mb-1 text-lg font-bold text-teal-200/80">kWh</span>
          <span className="mb-1 text-sm text-teal-100/60">bulanan</span>
        </div>

        {/* Bar visual pemakaian vs target */}
        <div className="mb-4">
          <div className="mb-1.5 flex items-center justify-between text-[11px] text-teal-100/60">
            <span>Pemakaian bulan ini</span>
            <span>{Math.round(ratio * 100)}% dari target</span>
          </div>
          <div className="h-3 w-full overflow-hidden rounded-full bg-white/10">
            <div
              className="h-full rounded-full transition-all duration-700"
              style={{
                width: `${Math.round(ratio * 100)}%`,
                background: ratio > 0.8 ? 'linear-gradient(90deg, #f5b50a, #ef4444)' : 'linear-gradient(90deg, #22d3ee, #10b981)',
              }}
            />
          </div>
          <p className="mt-1.5 text-[10px] text-teal-100/50">
            {stats.count} catatan · Rata-rata {formatDecimal(avgDaily)} kWh/hari
          </p>
        </div>

        {/* 3 kartu stat — simpel, jelas */}
        <div className="grid grid-cols-3 gap-3">
          {/* Biaya */}
          <div className="rounded-2xl bg-white/10 p-4 backdrop-blur transition-colors hover:bg-white/15">
            <Wallet size={18} className="text-teal-300" />
            <p className="mt-2 text-base font-extrabold text-white sm:text-lg">{formatRupiah(stats.totalCost)}</p>
            <p className="text-[10px] uppercase tracking-wider text-teal-200/70">Estimasi biaya</p>
          </div>

          {/* CO₂ */}
          <div className="rounded-2xl bg-white/10 p-4 backdrop-blur transition-colors hover:bg-white/15">
            <Leaf size={18} className="text-teal-300" />
            <p className="mt-2 text-base font-extrabold text-white sm:text-lg">{formatDecimal(stats.totalCo2)} kg</p>
            <p className="text-[10px] uppercase tracking-wider text-teal-200/70">Emisi CO₂</p>
          </div>

          {/* Perubahan vs bulan lalu */}
          <div className="rounded-2xl bg-white/10 p-4 backdrop-blur transition-colors hover:bg-white/15">
            {hasPrev ? (
              <>
                <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-extrabold ${
                  trendUp ? 'bg-rose-400/20 text-rose-200' : isStable ? 'bg-white/10 text-teal-100' : 'bg-emerald-400/20 text-emerald-200'
                }`}>
                  {trendUp ? <TrendingUp size={11} /> : isStable ? <Minus size={11} /> : <TrendingDown size={11} />}
                  {isStable ? 'Stabil' : `${formatDecimal(Math.abs(pct))}%`}
                </span>
                <p className="mt-2 text-[10px] uppercase tracking-wider text-teal-200/70">
                  {trendUp ? 'Naik dari bulan lalu' : isStable ? 'Sama seperti bulan lalu' : 'Turun dari bulan lalu'}
                </p>
                {!trendUp && !isStable && save.savedKwh > 0 && (
                  <p className="mt-1 text-[10px] text-emerald-200/80">
                    Hemat {formatRupiah(save.savedRp)}
                  </p>
                )}
              </>
            ) : (
              <p className="mt-2 text-[11px] text-teal-100/60">Belum ada data pembanding</p>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}

export default function Dashboard() {
  usePageTitle('Dashboard')
  const { user } = useAuth()
  const { selectedPlaceId, placeById, places } = usePlaces()
  const { records: allRecords, loading } = useUserData('energyRecords')
  const records = usePlaceRecords(allRecords)
  const rooms = usePlaceRooms()
  const placeLabel = selectedPlaceId ? placeById(selectedPlaceId)?.name || 'Gedung' : 'Gedung'
  const activePlace = useMemo(() => {
    if (!selectedPlaceId) return null
    return places.find((p) => String(p.id) === String(selectedPlaceId)) || null
  }, [places, selectedPlaceId])

  const data = useMemo(() => {
    const cur = monthRange(0)
    const prev = monthRange(-1)
    const curRecs = periodFromRecords(records, cur.start, cur.end)
    const prevRecs = periodFromRecords(records, prev.start, prev.end)
    const stats = sumStats(curRecs)
    const save = savingsVsPrevious(curRecs, prevRecs)
    return {
      stats,
      save,
      hasPrev: prevRecs.length > 0,
      avgDaily: stats.count ? stats.totalKwh / stats.count : 0,
    }
  }, [records])

  // Tren konsumsi 6 bulan terakhir
  const trend = useMemo(() => monthlyTrend(records, 6), [records])

  // Perbandingan ruangan — paling boros & paling hemat
  const roomRank = useMemo(() => roomConsumption(records), [records])
  const mostWasteful = roomRank[0]
  const mostEfficient = roomRank[roomRank.length - 1]

  const ai = useAiRecommendations({
    records,
    rooms,
    roomScope: null,
    placeName: placeLabel,
    placeType: activePlace?.locationType || '',
    user,
    loading,
  })

  const today = new Date().toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })

  if (loading) return <DashboardSkeleton />

  const pct = data.save.pctChange
  const trendUp = pct > 0
  const isStable = pct === 0

  return (
    <div>
      <PageHeader
        title="Rekapitulasi Energi"
        subtitle={`Rekap data pemakaian listrik · ${placeLabel} · ${today}`}
        actions={
          <Link to="/app/reports" className="btn-secondary">
            <FileText size={16} /> Laporan
          </Link>
        }
      />

      {/* Toolbar gedung */}
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-3 dark:border-slate-800 dark:bg-slate-900">
        <PlaceSwitcher />
        <p className="text-[11px] text-slate-400">Analisis untuk {placeLabel}.</p>
      </div>

      {data.stats.count === 0 ? (
        <EmptyState
          icon={Zap}
          title="Belum ada data energi untuk direkap"
          description="Catat pemakaianmu di Energy Monitor agar dashboard terisi tren, perbandingan ruangan, dan rekomendasi AI."
          action={
            <Link to="/app/monitor" className="btn-primary">
              <Zap size={15} /> Catat Data Pertama
            </Link>
          }
        />
      ) : (
        <>
          
          <EnergyHero
            stats={data.stats}
            avgDaily={data.avgDaily}
            hasPrev={data.hasPrev}
            save={data.save}
          />

          
          <div className="mt-5 grid gap-5 lg:grid-cols-2">
            <div className="card p-6">
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <h2 className="text-base font-bold text-slate-900 dark:text-white">Tren Konsumsi</h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400">6 bulan terakhir · kWh</p>
                </div>
                <Badge tone="sirkuit">kWh</Badge>
              </div>
              {trend.some((t) => t.kwh > 0) ? (
                <div className="h-56 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={trend} margin={{ top: 4, right: 4, left: -14, bottom: 0 }}>
                      <defs>
                        <linearGradient id="dashTrendGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#2456E6" stopOpacity={0.3} />
                          <stop offset="100%" stopColor="#2456E6" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} className="text-slate-200 dark:text-slate-800" />
                      <XAxis dataKey="label" tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: '#94a3b8' }} />
                      <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: '#94a3b8' }} />
                      <Tooltip contentStyle={TOOLTIP_STYLE} formatter={(v) => [`${formatNumber(v)} kWh`, 'Konsumsi']} />
                      <Area type="monotone" dataKey="kwh" stroke="#2456E6" strokeWidth={2.5} fill="url(#dashTrendGrad)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="grid h-56 w-full place-items-center text-sm text-slate-400 dark:text-slate-500">
                  Belum cukup data untuk menampilkan tren.
                </div>
              )}
            </div>

            <div className="card p-6">
              <h2 className="mb-4 text-base font-bold text-slate-900 dark:text-white">Ringkasan Bulan Ini</h2>
              <dl className="space-y-2.5">
                {[
                  ['Total konsumsi', `${formatDecimal(data.stats.totalKwh)} kWh`],
                  ['Estimasi biaya', formatRupiah(data.stats.totalCost)],
                  ['Emisi CO₂', `${formatDecimal(data.stats.totalCo2)} kg`],
                  ['Rata-rata harian', `${formatDecimal(data.avgDaily)} kWh`],
                  ['Jumlah catatan', `${data.stats.count} data`],
                ].map(([label, value]) => (
                  <div key={label} className="flex items-center justify-between rounded-xl bg-slate-50 px-4 py-2.5 dark:bg-slate-800/60">
                    <dt className="text-xs text-slate-500 dark:text-slate-400">{label}</dt>
                    <dd className="font-mono text-sm font-bold text-slate-900 dark:text-white">{value}</dd>
                  </div>
                ))}
              </dl>
              {data.hasPrev && (
                <div
                  className={`mt-4 flex items-center gap-3 rounded-2xl border p-4 ${
                    trendUp
                      ? 'border-rose-200 bg-rose-50/70 dark:border-rose-500/25 dark:bg-rose-500/10'
                      : 'border-emerald-200 bg-emerald-50/70 dark:border-emerald-500/25 dark:bg-emerald-500/10'
                  }`}
                >
                  <span
                    className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl ${
                      trendUp
                        ? 'bg-rose-100 text-rose-600 dark:bg-rose-500/15 dark:text-rose-400'
                        : 'bg-emerald-100 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-400'
                    }`}
                  >
                    {trendUp ? <TrendingUp size={18} /> : isStable ? <Minus size={18} /> : <TrendingDown size={18} />}
                  </span>
                  <div>
                    <p className="text-sm font-bold text-slate-900 dark:text-white">
                      {trendUp
                        ? `Konsumsi naik ${formatDecimal(pct)}% dari bulan lalu`
                        : isStable
                          ? 'Konsumsi stabil dari bulan lalu'
                          : `Hemat ${formatDecimal(data.save.savedKwh)} kWh dari bulan lalu`}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {trendUp
                        ? 'Periksa ruangan paling boros untuk mencari penyebabnya.'
                        : isStable
                          ? 'Pertahankan pola konsumsi yang konsisten.'
                          : `${formatRupiah(data.save.savedRp)} · ${formatDecimal(data.save.savedCo2)} kg CO₂ berhasil dihemat`}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          
          <RoomCompare roomRank={roomRank} most={mostWasteful} least={mostEfficient} />

          {/* ---- Rekomendasi AI ---- */}
          <DashboardAiRecs ai={ai} />
        </>
      )}
    </div>
  )
}

function RoomCompare({ roomRank, most, least }) {
  return (
    <section className="card mt-5 p-6">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="text-base font-bold text-slate-900 dark:text-white">Pemakaian per Ruangan</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">Ruangan paling boros & paling hemat dari gedung ini</p>
        </div>
        <Link to="/app/monitor" className="text-[11px] font-semibold text-sirkuit-600 transition hover:text-sirkuit-700 dark:text-sirkuit-300">
          Kelola data ruangan
        </Link>
      </div>

      {roomRank.length === 0 ? (
        <p className="rounded-xl bg-slate-50 px-4 py-6 text-center text-sm text-slate-400 dark:bg-slate-800/60">
          Belum ada catatan dengan ruangan. Pilih ruangan saat mencatat di Energy Monitor untuk melihat perbandingan ini.
        </p>
      ) : roomRank.length === 1 ? (
        <p className="rounded-xl bg-slate-50 px-4 py-6 text-center text-sm text-slate-400 dark:bg-slate-800/60">
          Hanya ada satu ruangan yang tercatat (<span className="font-bold text-slate-600 dark:text-slate-300">{most.room}</span>).
          Catat ruangan lain untuk membandingkan mana yang paling boros dan paling hemat.
        </p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          
          <div className="rounded-2xl border border-rose-200 bg-rose-50/60 p-5 dark:border-rose-500/25 dark:bg-rose-500/10">
            <div className="flex items-center gap-2">
              <span className="grid h-8 w-8 place-items-center rounded-lg bg-rose-100 text-rose-600 dark:bg-rose-500/15 dark:text-rose-400">
                <Flame size={15} />
              </span>
              <p className="text-[11px] font-bold uppercase tracking-wider text-rose-600 dark:text-rose-400">Paling Boros</p>
            </div>
            <p className="mt-3 text-xl font-extrabold text-slate-900 dark:text-white">{most.room}</p>
            <p className="mt-1 font-mono text-sm font-bold text-rose-600 dark:text-rose-400">{formatDecimal(most.kwh)} kWh</p>
            <div className="mt-3 space-y-1.5 text-xs text-slate-600 dark:text-slate-300">
              <p className="flex items-center justify-between">
                <span className="text-slate-500 dark:text-slate-400">Estimasi biaya</span>
                <span className="font-bold">{formatRupiah(most.cost)}</span>
              </p>
              <p className="flex items-center justify-between">
                <span className="text-slate-500 dark:text-slate-400">Porsi pemakaian gedung</span>
                <span className="font-bold">{formatDecimal(most.share)}%</span>
              </p>
            </div>
            <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-rose-200/70 dark:bg-rose-500/20">
              <div className="h-full rounded-full bg-rose-500" style={{ width: `${Math.min(100, Math.max(4, most.share))}%` }} />
            </div>
          </div>

          
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50/60 p-5 dark:border-emerald-500/25 dark:bg-emerald-500/10">
            <div className="flex items-center gap-2">
              <span className="grid h-8 w-8 place-items-center rounded-lg bg-emerald-100 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-400">
                <Leaf size={15} />
              </span>
              <p className="text-[11px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">Paling Hemat</p>
            </div>
            <p className="mt-3 text-xl font-extrabold text-slate-900 dark:text-white">{least.room}</p>
            <p className="mt-1 font-mono text-sm font-bold text-emerald-600 dark:text-emerald-400">{formatDecimal(least.kwh)} kWh</p>
            <div className="mt-3 space-y-1.5 text-xs text-slate-600 dark:text-slate-300">
              <p className="flex items-center justify-between">
                <span className="text-slate-500 dark:text-slate-400">Estimasi biaya</span>
                <span className="font-bold">{formatRupiah(least.cost)}</span>
              </p>
              <p className="flex items-center justify-between">
                <span className="text-slate-500 dark:text-slate-400">Porsi pemakaian gedung</span>
                <span className="font-bold">{formatDecimal(least.share)}%</span>
              </p>
            </div>
            <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-emerald-200/70 dark:bg-emerald-500/20">
              <div className="h-full rounded-full bg-emerald-500" style={{ width: `${Math.min(100, Math.max(4, least.share))}%` }} />
            </div>
          </div>
        </div>
      )}
    </section>
  )
}

function DashboardAiRecs({ ai }) {
  const { recs, aiStatus, quotaWait, handleRetry, handleRegenerate } = ai

  return (
    <section className="card mt-5 p-6">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-teal-50 text-teal-600 dark:bg-teal-500/15 dark:text-teal-400">
            <Lightbulb size={17} />
          </span>
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white">Rekomendasi AI Hemat Energi</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">Rekomendasi yang cocok dengan ruangan di gedung ini</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {aiStatus === 'done' && <AiChip />}
          <Link to="/app/recommendations" className="inline-flex items-center gap-1 text-[11px] font-semibold text-sirkuit-600 transition hover:text-sirkuit-700 dark:text-sirkuit-300">
            Lihat Semua <ArrowRight size={12} />
          </Link>
        </div>
      </div>

      {aiStatus === 'loading' ? (
        <div className="grid gap-4 sm:grid-cols-2">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="animate-pulse rounded-2xl bg-slate-100 p-5 dark:bg-white/5">
              <div className="h-10 w-10 rounded-xl bg-slate-200 dark:bg-white/10" />
              <div className="mt-3 h-4 w-3/4 rounded bg-slate-200 dark:bg-white/10" />
              <div className="mt-2 h-3 w-full rounded bg-slate-200/70 dark:bg-white/5" />
              <div className="mt-1.5 h-3 w-2/3 rounded bg-slate-200/70 dark:bg-white/5" />
            </div>
          ))}
        </div>
      ) : (
        <>
          {aiStatus === 'fallback' && (
            <div className="mb-4 flex justify-end">
              <button
                type="button"
                onClick={handleRetry}
                className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-[11px] font-semibold text-slate-500 transition hover:border-teal-300 hover:text-teal-600 dark:border-slate-700 dark:text-slate-400 dark:hover:text-teal-300"
              >
                <RotateCcw size={12} /> Coba Lagi AI
              </button>
            </div>
          )}
          {aiStatus === 'quota' && (
            <div className="mb-4 flex justify-end">
              <button
                onClick={handleRetry}
                disabled={quotaWait > 0}
                className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-[11px] font-semibold transition ${
                  quotaWait > 0
                    ? 'cursor-not-allowed border-slate-200 text-slate-400 dark:border-slate-700 dark:text-slate-500'
                    : 'border-slate-200 text-slate-500 hover:border-teal-300 hover:text-teal-600 dark:border-slate-700 dark:text-slate-400 dark:hover:text-teal-300'
                }`}
              >
                <RotateCcw size={12} />
                {quotaWait > 0 ? `Coba Lagi dalam ${quotaWait}s` : 'Coba Lagi AI'}
              </button>
            </div>
          )}

          {aiStatus === 'off' && (
            <p className="mb-4 rounded-xl bg-slate-50 px-4 py-3 text-xs text-slate-500 dark:bg-slate-800/60 dark:text-slate-400">
              AI belum dikonfigurasi — menampilkan rekomendasi otomatis yang disesuaikan dengan ruangan gedung ini.
            </p>
          )}

          {recs.length === 0 ? (
            <p className="rounded-xl bg-slate-50 px-4 py-6 text-center text-sm text-slate-400 dark:bg-slate-800/60">
              Belum ada rekomendasi yang bisa disusun dari data ini.
            </p>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              {recs.slice(0, 4).map((r) => {
                const Icon = REC_ICONS[r.icon] || Lightbulb
                return (
                  <div key={r.id} className="rounded-2xl border border-slate-100 p-4 transition hover:border-teal-200 dark:border-slate-800 dark:hover:border-teal-500/30">
                    <div className="flex items-start gap-3">
                      <span
                        className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl ${
                          r.icon === 'trending-up'
                            ? 'bg-rose-50 text-rose-500 dark:bg-rose-500/15 dark:text-rose-400'
                            : r.icon === 'lightbulb'
                              ? 'bg-amber-50 text-amber-500 dark:bg-amber-500/15 dark:text-amber-400'
                              : 'bg-teal-50 text-teal-600 dark:bg-teal-500/15 dark:text-teal-400'
                        }`}
                      >
                        <Icon size={18} />
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="text-sm font-bold text-slate-900 dark:text-white">{r.title}</p>
                          <Badge tone="slate">Prioritas {r.priority}</Badge>
                        </div>
                        <p className="mt-1 line-clamp-2 text-[11px] leading-relaxed text-slate-500 dark:text-slate-400">{r.description}</p>
                        {r.savingsKwh > 0 && (
                          <p className="mt-2 text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
                            Hemat ±{formatDecimal(r.savingsKwh)} kWh · {formatRupiah(r.savingsRp)}/bulan
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          {aiStatus === 'done' && (
            <div className="mt-4 flex justify-end">
              <button
                type="button"
                onClick={handleRegenerate}
                className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-[11px] font-semibold text-slate-500 transition hover:border-teal-300 hover:text-teal-600 dark:border-slate-700 dark:text-slate-400 dark:hover:border-teal-500/40 dark:hover:text-teal-300"
              >
                <RotateCcw size={12} /> Buat Ulang Rekomendasi
              </button>
            </div>
          )}
        </>
      )}
    </section>
  )
}


function Skeleton({ className = '', dark = false }) {
  return (
    <div
      className={`animate-pulse rounded-2xl ${dark ? 'bg-white/10' : 'bg-slate-200/70 dark:bg-white/5'} ${className}`}
    />
  )
}

function DashboardSkeleton() {
  return (
    <div>
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div className="space-y-2">
          <Skeleton className="h-6 w-52" />
          <Skeleton className="h-4 w-64" />
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-10 w-32" />
          <Skeleton className="h-10 w-28" />
        </div>
      </div>
      <Skeleton dark className="h-48 w-full" />
      <div className="mt-5 grid gap-5 lg:grid-cols-2">
        <Skeleton className="h-72" />
        <Skeleton className="h-72" />
      </div>
      <Skeleton className="mt-5 h-64 w-full" />
    </div>
  )
}