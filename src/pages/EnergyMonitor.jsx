import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Zap,
  Wallet,
  TrendingUp,
  TrendingDown,
  Leaf,
  Trash2,
  Plus,
  BarChart3,
  CheckCircle2,
  Info,
  Calendar,
  Search,
} from 'lucide-react'
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  ResponsiveContainer,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from 'recharts'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import { useUserData } from '../hooks/useUserData'
import { usePlaces, usePlaceRecords } from '../context/PlaceContext'
import { db } from '../services/db'
import {
  TARIFF,
  EMISSION_FACTOR,
  monthRange,
  periodFromRecords,
  sumStats,
  savingsVsPrevious,
} from '../services/energyService'
import { formatRupiah, formatNumber, formatDecimal, todayISO, formatDateShort, formatDateLong, addDays } from '../utils/format'
import { usePageTitle } from '../utils/hooks'
import PageHeader from '../components/ui/PageHeader'
import Badge from '../components/ui/Badge'
import EmptyState from '../components/ui/EmptyState'
import PlaceSwitcher from '../components/PlaceSwitcher'
import { Spinner } from '../components/ui/Loading'

const TOOLTIP_STYLE = {
  borderRadius: 12,
  border: '1px solid #e2e8f0',
  fontSize: 12,
  background: '#fff',
  color: '#0f172a',
}

export default function EnergyMonitor() {
  usePageTitle('Energy Monitor')
  const { user } = useAuth()
  const { records: allRecords, refresh } = useUserData('energyRecords')
  const { places, selectedPlaceId } = usePlaces()
  const records = usePlaceRecords(allRecords)
  const toast = useToast()
  const [form, setForm] = useState({ date: todayISO(), kwh: '', cost: '', room: '' })
  const [result, setResult] = useState(null)
  const [saving, setSaving] = useState(false)
  const [search, setSearch] = useState('')
  const [chartRange, setChartRange] = useState('month')


  
  const activePlace = places.find((p) => String(p.id) === String(selectedPlaceId)) || places[0] || null

  
  const roomPresets = useMemo(() => {
    if (!activePlace || !activePlace.rooms) return []
    return activePlace.rooms.split(',').map((r) => r.trim()).filter(Boolean)
  }, [activePlace])

  
  const existingRooms = useMemo(() => {
    const rooms = new Set()
    records.forEach((r) => {
      if (r.room) rooms.add(r.room)
    })
    return [...rooms]
  }, [records])

  
  const allRooms = useMemo(() => {
    const set = new Set([...roomPresets, ...existingRooms])
    return [...set]
  }, [roomPresets, existingRooms])

  
  const roomStats = useMemo(() => {
    const stats = {}
    const cur = monthRange(0)
    const curRecs = periodFromRecords(records, cur.start, cur.end)
    curRecs.forEach((r) => {
      const room = r.room || 'Tanpa Ruangan'
      if (!stats[room]) stats[room] = { kwh: 0, cost: 0, co2: 0, count: 0 }
      stats[room].kwh += Number(r.kwh) || 0
      stats[room].cost += Number(r.cost) || 0
      stats[room].co2 += Number(r.estimatedCO2) || 0
      stats[room].count += 1
    })
    return stats
  }, [records])

  const summary = useMemo(() => {
    const cur = monthRange(0)
    const prev = monthRange(-1)
    const curRecs = periodFromRecords(records, cur.start, cur.end)
    const prevRecs = periodFromRecords(records, prev.start, prev.end)
    return {
      ...sumStats(curRecs),
      save: savingsVsPrevious(curRecs, prevRecs),
      prevStats: sumStats(prevRecs),
    }
  }, [records])

  const history = useMemo(() => {
    const sorted = [...records]
      .sort((a, b) => b.date.localeCompare(a.date) || (b.id || '').localeCompare(a.id || ''))
      .slice(0, 50)
    if (!search.trim()) return sorted.slice(0, 14)
    const q = search.toLowerCase()
    return sorted.filter(
      (r) =>
        r.date.includes(q) ||
        (r.room && r.room.toLowerCase().includes(q)) ||
        String(r.kwh).includes(q) ||
        String(r.cost).includes(q),
    )
  }, [records, search])

  const duplicateDate = useMemo(
    () =>
      allRecords.some(
        (r) => r.date === form.date && (!activePlace || r.placeId === String(activePlace.id)) && (!form.room || r.room === form.room),
      ),
    [allRecords, form.date, activePlace, form.room],
  )

  
  useEffect(() => {
    setResult(null)
  }, [selectedPlaceId])

  const chartData = useMemo(() => {
    const sorted = [...records].sort((a, b) => a.date.localeCompare(b.date))
    const items = chartRange === 'week' ? sorted.slice(-7) : sorted.slice(-30)
    return items.map((r) => ({
      label: formatDateShort(r.date),
      kwh: Number(r.kwh),
    }))
  }, [records, chartRange])

  const setKwh = (e) => {
    const v = e.target.value
    const kwh = Number(v)
    const cost = Number.isFinite(kwh) && kwh > 0 ? String(Math.round(kwh * TARIFF)) : ''
    setForm((f) => ({ ...f, kwh: v, cost }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const kwh = Number(form.kwh)
    if (!kwh || kwh <= 0) {
      toast('error', 'Masukkan konsumsi listrik yang valid (kWh).')
      return
    }
    const cost = Number(form.cost) > 0 ? Math.round(Number(form.cost)) : Math.round(kwh * TARIFF)
    const estimatedCO2 = Math.round(kwh * EMISSION_FACTOR * 100) / 100
    if (!activePlace) {
      toast('error', 'Tambahkan gedung dulu di halaman Gedung.')
      return
    }
    setSaving(true)
    try {
      await db.add('energyRecords', {
        userId: user.id,
        placeId: activePlace.id,
        date: form.date || todayISO(),
        kwh,
        cost,
        estimatedCO2,
        room: form.room || '',
      })
      setResult({ kwh, cost, estimatedCO2, date: form.date || todayISO(), placeName: activePlace.name, room: form.room || '' })
      toast('success', `Data ${form.date} tersimpan`)
      setForm((f) => ({ ...f, kwh: '', cost: '' }))
      refresh()
    } catch {
      toast('error', 'Gagal menyimpan data. Coba lagi.')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (rec) => {
    try {
      await db.remove('energyRecords', rec.id)
      toast('info', 'Catatan dihapus.')
      refresh()
    } catch {
      toast('error', 'Gagal menghapus catatan.')
    }
  }

  const pct = summary.save.pctChange

  return (
    <div>
      <PageHeader
        title="Energy Monitor"
        subtitle="Catat penggunaan energi harianmu — per gedung atau per ruangan."
      />

      <div className="mb-5 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-3 dark:border-slate-800 dark:bg-slate-900">
        <PlaceSwitcher />
      </div>

      <div className="grid gap-5 lg:grid-cols-5">
        <div className="space-y-5 lg:col-span-2">
        <form onSubmit={handleSubmit} className="card h-fit p-6" noValidate>
          <h2 className="mb-4 flex items-center gap-2 text-base font-bold text-slate-900 dark:text-white">
            <span className="grid h-8 w-8 place-items-center rounded-lg bg-teal-50 text-teal-600 dark:bg-teal-500/15 dark:text-teal-400">
              <Plus size={16} />
            </span>
            Input Data Baru
          </h2>

          <div className="space-y-4">
            <div>
              <label htmlFor="period" className="mb-1.5 flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-300">
                Tanggal konsumsi
                <span className="rounded-full bg-teal-500/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-teal-600 dark:bg-teal-500/20 dark:text-teal-300">
                  per hari
                </span>
              </label>
              <input
                id="period"
                type="date"
                value={form.date}
                max={todayISO()}
                onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))}
                className="input"
                required
              />
              <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-1.5">
                  {[
                    { label: 'Hari ini', value: todayISO() },
                    { label: 'Kemarin', value: addDays(todayISO(), -1) },
                  ].map((q) => (
                    <button
                      key={q.label}
                      type="button"
                      onClick={() => setForm((f) => ({ ...f, date: q.value }))}
                      className={`rounded-lg border px-2.5 py-1 text-[11px] font-semibold transition ${
                        form.date === q.value
                          ? 'border-teal-500 bg-teal-50 text-teal-700 dark:bg-teal-500/15 dark:text-teal-300'
                          : 'border-slate-200 text-slate-500 hover:border-slate-300 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-400 dark:hover:bg-slate-800'
                      }`}
                    >
                      {q.label}
                    </button>
                  ))}
                </div>
                <p className="flex items-center gap-1.5 text-[11px] font-medium text-slate-500 dark:text-slate-400">
                  <Calendar size={13} className="shrink-0 text-sirkuit-500 dark:text-sirkuit-300" />
                  {formatDateLong(form.date)}
                </p>
              </div>
              {duplicateDate && (
                <p className="mt-1.5 flex items-center gap-1.5 rounded-lg border border-teal-300/60 bg-teal-50 px-3 py-2 text-[11px] font-medium text-teal-700 dark:border-teal-400/30 dark:bg-teal-400/10 dark:text-teal-300">
                  <Info size={12} className="shrink-0" />
                  Kamu sudah punya catatan untuk tanggal ini — menyimpan lagi akan membuat data rangkap.
                </p>
              )}
            </div>

            {/* Pilihan ruangan */}
            <div>
              <label className="mb-1.5 block text-sm font-semibold text-slate-700 dark:text-slate-300">
                Ruangan
              </label>
              <div className="grid grid-cols-2 gap-2">
                {allRooms.map((room) => (
                  <button
                    key={room}
                    type="button"
                    onClick={() => setForm((f) => ({ ...f, room }))}
                    className={`rounded-xl border px-3 py-2.5 text-center text-xs font-semibold transition ${
                      form.room === room
                        ? 'border-teal-500 bg-teal-50 text-teal-700 ring-2 ring-teal-500/15 dark:bg-teal-500/15 dark:text-teal-300'
                        : 'border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800'
                    }`}
                  >
                    {room}
                  </button>
                ))}
              </div>
              {allRooms.length === 0 && (
                <p className="mt-2 text-[11px] text-slate-400">
                  Belum ada ruangan. Tambahkan di halaman Gedung.
                </p>
              )}
            </div>

            <div>
              <label htmlFor="kwh" className="mb-1.5 block text-sm font-semibold text-slate-700 dark:text-slate-300">
                Konsumsi listrik (kWh)
              </label>
              <input
                id="kwh"
                type="number"
                min="0"
                step="0.1"
                value={form.kwh}
                onChange={setKwh}
                placeholder="cth: 12,5"
                className="input"
                required
              />
              <p className="mt-1 text-[11px] text-slate-400">
                Biaya dihitung otomatis dari tarif Rp{TARIFF.toLocaleString('id-ID')}/kWh
              </p>
            </div>
            <div className="rounded-xl border border-teal-200 bg-teal-50/60 p-3 dark:border-teal-500/25 dark:bg-teal-500/10">
              <p className="flex items-center gap-1.5 text-xs font-bold text-teal-700 dark:text-teal-300">
                Dicatat ke: {activePlace ? activePlace.name : '—'} {form.room ? `· ${form.room}` : ''}
              </p>
            </div>
            <button type="submit" disabled={saving} className="btn-primary w-full !py-3">
              {saving ? <Spinner /> : <CheckCircle2 size={17} />} Simpan & Analisis
            </button>
          </div>
        </form>

        <div className="card p-6">
            <div className="mb-4 flex items-center justify-between gap-2">
              <h2 className="text-base font-bold text-slate-900 dark:text-white">Riwayat Catatan</h2>
            </div>
            <div className="relative mb-3">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Cari tanggal, ruangan, kWh…"
                className="input !pl-9 !py-2 text-xs"
              />
            </div>
            {history.length === 0 ? (
              <EmptyState
                icon={BarChart3}
                title="Belum ada catatan"
                description="Catatan pertama akan muncul di sini."
              />
            ) : (
              <ul className="divide-y divide-slate-100 dark:divide-slate-800">
                {history.map((r) => (
                  <li key={r.id} className="group flex items-center gap-3 py-3">
                    <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400">
                      <Zap size={15} />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-slate-900 dark:text-white">
                        {formatNumber(r.kwh)} kWh · {formatRupiah(r.cost)}
                      </p>
                      <p className="text-xs text-slate-400">
                        {formatDateShort(r.date)} · {r.room || 'Gedung'} · {formatDecimal(r.estimatedCO2)} kg CO₂
                      </p>
                    </div>
                    <button
                      onClick={() => handleDelete(r)}
                      aria-label={`Hapus catatan ${r.date}`}
                      className="rounded-lg p-2 text-slate-300 transition hover:bg-rose-50 hover:text-rose-500 focus-visible:opacity-100 dark:text-slate-600 dark:hover:bg-rose-500/10 sm:opacity-0 sm:group-hover:opacity-100"
                    >
                      <Trash2 size={15} />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        <div className="space-y-5 lg:col-span-3">
          {/* Hasil Analisis saat input */}
          {result && (
            <div className="animate-fade-in card p-6">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="flex items-center gap-2 text-base font-bold text-slate-900 dark:text-white">
                  <BarChart3 size={17} className="text-teal-500" /> Hasil Analisis
                </h2>
                <div className="flex flex-wrap gap-1.5">
                  {result.room && <Badge tone="sirkuit">{result.room}</Badge>}
                  <Badge tone="slate">{result.date}</Badge>
                </div>
              </div>
              <div className="grid gap-3 sm:grid-cols-3">
                <div className="rounded-2xl bg-slate-50 p-4 dark:bg-slate-800/60">
                  <Zap size={18} className="text-slate-500 dark:text-slate-400" />
                  <p className="mt-2 text-lg font-extrabold text-slate-900 dark:text-white">{formatDecimal(result.kwh)} kWh</p>
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Konsumsi</p>
                </div>
                <div className="rounded-2xl bg-slate-50 p-4 dark:bg-slate-800/60">
                  <Wallet size={18} className="text-slate-500 dark:text-slate-400" />
                  <p className="mt-2 text-lg font-extrabold text-slate-900 dark:text-white">{formatRupiah(result.cost)}</p>
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Estimasi biaya</p>
                </div>
                <div className="rounded-2xl bg-slate-50 p-4 dark:bg-slate-800/60">
                  <Leaf size={18} className="text-slate-500 dark:text-slate-400" />
                  <p className="mt-2 text-lg font-extrabold text-slate-900 dark:text-white">{formatDecimal(result.estimatedCO2)} kg</p>
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Emisi CO₂</p>
                </div>
              </div>
              <div className="mt-4 flex items-center gap-3 rounded-2xl border border-slate-100 p-4 dark:border-slate-800">
                <span
                  className={`grid h-10 w-10 place-items-center rounded-xl ${
                    pct <= 0
                      ? 'bg-teal-500/10 text-teal-600 dark:bg-teal-500/15 dark:text-teal-400'
                      : 'bg-rose-500/10 text-rose-600 dark:bg-rose-500/15 dark:text-rose-400'
                  }`}
                >
                  <TrendingUp size={18} className={pct <= 0 ? 'rotate-180' : ''} />
                </span>
                <div>
                  <p className="text-sm font-bold text-slate-900 dark:text-white">
                    {pct <= 0
                      ? `Penghematan ${formatDecimal(Math.abs(pct))}% dibanding bulan lalu`
                      : `Konsumsi naik ${formatDecimal(pct)}% dibanding bulan lalu`}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Bulan ini total {formatDecimal(summary.totalKwh)} kWh · {formatRupiah(summary.totalCost)}
                  </p>
                </div>
              </div>
              <Link to="/app/recommendations" className="btn-primary mt-4 w-full">
                Lihat Rekomendasi Penghematan <TrendingUp size={15} />
              </Link>
            </div>
          )}

          {/* Grafik tren harian — minggu / bulan */}
          <div className="card p-6">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-base font-bold text-slate-900 dark:text-white">Grafik Konsumsi Harian</h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">{chartRange === 'week' ? '7 hari terakhir' : '30 hari terakhir'} · kWh</p>
              </div>
              <div className="flex rounded-xl border border-slate-200 bg-white p-1 shadow-sm dark:border-white/10 dark:bg-slate-800/70">
                {[
                  ['week', '7 Hari'],
                  ['month', '30 Hari'],
                ].map(([id, label]) => (
                  <button
                    key={id}
                    onClick={() => setChartRange(id)}
                    className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                      chartRange === id
                        ? 'bg-teal-50 text-teal-700 shadow-sm dark:bg-teal-500/15 dark:text-teal-300'
                        : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
            {chartData.length > 1 ? (
              <div className="h-52 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData} margin={{ top: 8, right: 8, left: -12, bottom: 0 }}>
                    <defs>
                      <linearGradient id="monitorGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#2456E6" stopOpacity={0.35} />
                        <stop offset="100%" stopColor="#2456E6" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} className="text-slate-200 dark:text-white/10" />
                    <XAxis dataKey="label" tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: '#94a3b8' }} interval="preserveStartEnd" />
                    <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: '#94a3b8' }} />
                    <Tooltip contentStyle={TOOLTIP_STYLE} formatter={(v) => [`${v} kWh`, 'Konsumsi']} />
                    <Line type="monotone" dataKey="kwh" stroke="#2456E6" strokeWidth={2.5} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="grid h-52 w-full place-items-center text-sm text-slate-400 dark:text-slate-500">
                Belum cukup data untuk ditampilkan.
              </div>
            )}
          </div>

          {/* Perbandingan Bulanan — Bulan ini vs Bulan lalu (hanya jika ada data bulan lalu) */}
          {summary.prevStats.count > 0 && (
          <div className="card p-6">
            <h2 className="mb-4 text-base font-bold text-slate-900 dark:text-white">Perbandingan Bulanan</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              {/* Bulan ini */}
              <div className="rounded-2xl border border-teal-200 bg-teal-50/60 p-4 dark:border-teal-500/25 dark:bg-teal-500/10">
                <p className="text-xs font-bold uppercase tracking-wider text-teal-600 dark:text-teal-400">Bulan Ini</p>
                <div className="mt-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-slate-500 dark:text-slate-400">Total konsumsi</span>
                    <span className="text-sm font-extrabold text-slate-900 dark:text-white">{formatDecimal(summary.totalKwh)} kWh</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-slate-500 dark:text-slate-400">Estimasi biaya</span>
                    <span className="text-sm font-extrabold text-slate-900 dark:text-white">{formatRupiah(summary.totalCost)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-slate-500 dark:text-slate-400">Emisi CO₂</span>
                    <span className="text-sm font-extrabold text-slate-900 dark:text-white">{formatDecimal(summary.totalCo2)} kg</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-slate-500 dark:text-slate-400">Jumlah catatan</span>
                    <span className="text-sm font-extrabold text-slate-900 dark:text-white">{summary.count} hari</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-slate-500 dark:text-slate-400">Rata-rata harian</span>
                    <span className="text-sm font-extrabold text-slate-900 dark:text-white">{summary.count ? formatDecimal(summary.totalKwh / summary.count) : '-'} kWh</span>
                  </div>
                </div>
              </div>

              {/* Bulan lalu */}
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-800/60">
                <p className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Bulan Lalu</p>
                <div className="mt-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-slate-500 dark:text-slate-400">Total konsumsi</span>
                    <span className="text-sm font-extrabold text-slate-900 dark:text-white">{formatDecimal(summary.prevStats.totalKwh)} kWh</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-slate-500 dark:text-slate-400">Estimasi biaya</span>
                    <span className="text-sm font-extrabold text-slate-900 dark:text-white">{formatRupiah(summary.prevStats.totalCost)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-slate-500 dark:text-slate-400">Emisi CO₂</span>
                    <span className="text-sm font-extrabold text-slate-900 dark:text-white">{formatDecimal(summary.prevStats.totalCo2)} kg</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-slate-500 dark:text-slate-400">Jumlah catatan</span>
                    <span className="text-sm font-extrabold text-slate-900 dark:text-white">{summary.prevStats.count} hari</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-slate-500 dark:text-slate-400">Rata-rata harian</span>
                    <span className="text-sm font-extrabold text-slate-900 dark:text-white">{summary.prevStats.count ? formatDecimal(summary.prevStats.totalKwh / summary.prevStats.count) : '-'} kWh</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Ringkasan perubahan */}
            <div className="mt-4 flex items-center gap-3 rounded-2xl border border-slate-100 p-4 dark:border-slate-800">
              <span
                className={`grid h-10 w-10 place-items-center rounded-xl ${
                  pct <= 0
                    ? 'bg-teal-500/10 text-teal-600 dark:bg-teal-500/15 dark:text-teal-400'
                    : 'bg-rose-500/10 text-rose-600 dark:bg-rose-500/15 dark:text-rose-400'
                }`}
              >
                <TrendingUp size={18} className={pct <= 0 ? 'rotate-180' : ''} />
              </span>
              <div>
                <p className="text-sm font-bold text-slate-900 dark:text-white">
                  {pct <= 0
                    ? `Penghematan ${formatDecimal(Math.abs(pct))}% dari bulan lalu`
                    : `Konsumsi naik ${formatDecimal(pct)}% dari bulan lalu`}
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {summary.save.savedKwh > 0 && `Hemat ${formatDecimal(summary.save.savedKwh)} kWh · ${formatRupiah(summary.save.savedRp)}`}
                  {summary.save.savedKwh === 0 && 'Tidak ada perubahan signifikan'}
                </p>
              </div>
            </div>
          </div>
          )}

          {/* Statistik per ruangan */}
          {Object.keys(roomStats).length > 0 && (
            <div className="card p-6">
              <h2 className="mb-4 text-base font-bold text-slate-900 dark:text-white">
                Pemakaian per Ruangan
              </h2>
              <div className="space-y-2">
                {Object.entries(roomStats)
                  .sort((a, b) => b[1].kwh - a[1].kwh)
                  .map(([room, s]) => {
                    const maxKwh = Math.max(...Object.values(roomStats).map((v) => v.kwh))
                    const ratio = maxKwh > 0 ? s.kwh / maxKwh : 0
                    return (
                      <div key={room} className="flex items-center gap-3 rounded-xl bg-slate-50 px-3 py-2.5 dark:bg-slate-800/60">
                        <span className="min-w-[100px] text-xs font-bold text-slate-700 dark:text-slate-200 truncate">{room}</span>
                        <div className="flex-1">
                          <div className="h-2 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700">
                            <div
                              className="h-full rounded-full bg-gradient-to-r from-teal-500 to-emerald-400 transition-all duration-500"
                              style={{ width: `${Math.round(ratio * 100)}%` }}
                            />
                          </div>
                        </div>
                        <span className="min-w-[70px] text-right font-mono text-xs font-bold text-slate-900 dark:text-white">
                          {formatDecimal(s.kwh)} kWh
                        </span>
                        <span className="min-w-[60px] text-right text-[10px] text-slate-400">{s.count} data</span>
                      </div>
                    )
                  })}
              </div>
            </div>
          )}

          <div className="card p-6">
            <h2 className="mb-4 text-base font-bold text-slate-900 dark:text-white">14 Hari Terakhir</h2>
            {chartData.length > 1 ? (
              <div className="h-44 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} margin={{ top: 4, right: 4, left: -14, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} className="text-slate-200 dark:text-slate-800" />
                    <XAxis dataKey="label" tickLine={false} axisLine={false} tick={{ fontSize: 10, fill: '#94a3b8' }} interval={1} />
                    <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 10, fill: '#94a3b8' }} />
                    <Tooltip contentStyle={TOOLTIP_STYLE} formatter={(v) => [`${v} kWh`, 'Konsumsi']} />
                    <Bar dataKey="kwh" fill="#2456E6" radius={[5, 5, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <p className="text-sm text-slate-400">Belum cukup data untuk ditampilkan.</p>
            )}
          </div>

        </div>
      </div>
    </div>
  )
}
