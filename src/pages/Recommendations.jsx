import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Lightbulb,
  Zap,
  PiggyBank,
  Leaf,
  ArrowRight,
  RotateCcw,
  Bookmark,
  BookmarkCheck,
  CheckCircle2,
  Home,
} from 'lucide-react'
import { useUserData } from '../hooks/useUserData'
import { useAuth } from '../context/AuthContext'
import { usePlaces, usePlaceRecords } from '../context/PlaceContext'
import { db } from '../services/db'
import { useAiRecommendations, REC_ICONS } from '../hooks/useAiRecommendations'
import { isGeminiConfigured } from '../services/geminiService'
import { formatRupiah, formatNumber, formatDecimal } from '../utils/format'
import { usePageTitle } from '../utils/hooks'
import PageHeader from '../components/ui/PageHeader'
import Badge from '../components/ui/Badge'
import EmptyState from '../components/ui/EmptyState'
import { LoadingBlock } from '../components/ui/Loading'
import { useToast } from '../context/ToastContext'

function PriorityBadge({ priority }) {
  return <Badge tone="slate">Prioritas {priority}</Badge>
}

function AiChip({ label = 'Dianalisis AI' }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-teal-300/30 bg-gradient-to-r from-cyan-500/15 via-teal-500/15 to-emerald-500/15 px-3 py-1 text-[11px] font-bold text-teal-700 shadow-sm dark:text-teal-300">
      <Lightbulb size={12} className="text-teal-500" /> {label}
    </span>
  )
}

export default function Recommendations() {
  usePageTitle('Rekomendasi')
  const { records: allRecords, loading } = useUserData('energyRecords')
  const { user } = useAuth()
  const { places, selectedPlaceId, placeById, selectPlace } = usePlaces()
  const records = usePlaceRecords(allRecords)
  const placeLabel = selectedPlaceId ? placeById(selectedPlaceId)?.name || 'Gedung' : 'Gedung'
  const toast = useToast()

  const [choosingPlace, setChoosingPlace] = useState(true) // selalu mulai dari pemilihan gedung

  // Saved/bookmarked tips — stored per user in DB
  const [savedIds, setSavedIds] = useState(new Set())
  const [savedTips, setSavedTips] = useState([])

  // Load saved tips from DB
  useEffect(() => {
    if (!user) return
    ;(async () => {
      try {
        const all = await db.get('savedTips')
        const mine = all.filter((t) => t.userId === user.id)
        setSavedTips(mine)
        setSavedIds(new Set(mine.map((t) => t.title)))
      } catch {
        // ignore
      }
    })()
  }, [user])

  const handleSaveTip = async (rec) => {
    if (savedIds.has(rec.title)) {
      // Unsave
      const tip = savedTips.find((t) => t.title === rec.title)
      if (tip) {
        try {
          await db.remove('savedTips', tip.id)
          setSavedTips((prev) => prev.filter((t) => t.id !== tip.id))
          setSavedIds((prev) => {
            const next = new Set(prev)
            next.delete(rec.title)
            return next
          })
          toast('info', 'Tips dihapus dari simpanan.')
        } catch {
          toast('error', 'Gagal menghapus.')
        }
      }
      return
    }
    // Save
    try {
      const id = await db.add('savedTips', {
        userId: user.id,
        title: rec.title,
        description: rec.description,
        priority: rec.priority,
        savingsKwh: rec.savingsKwh,
        savingsRp: rec.savingsRp,
        co2Impact: rec.co2Impact,
        icon: rec.icon,
        savedAt: new Date().toISOString(),
      })
      setSavedTips((prev) => [...prev, { id, userId: user.id, ...rec }])
      setSavedIds((prev) => new Set([...prev, rec.title]))
      toast('success', 'Tips tersimpan!')
    } catch {
      toast('error', 'Gagal menyimpan tips.')
    }
  }

  // Ruangan dari gedung aktif
  const activePlace = useMemo(() => {
    if (!selectedPlaceId) return null
    return places.find((p) => String(p.id) === String(selectedPlaceId)) || null
  }, [places, selectedPlaceId])

  const availableRooms = useMemo(() => {
    if (!activePlace || !activePlace.rooms) return []
    return activePlace.rooms.split(',').map((r) => r.trim()).filter(Boolean)
  }, [activePlace])

  const [selectedRoom, setSelectedRoom] = useState('')

  // Filter records berdasarkan gedung + ruangan
  const filteredRecords = useMemo(() => {
    let result = records
    if (selectedRoom) {
      result = result.filter((r) => r.room === selectedRoom)
    }
    return result
  }, [records, selectedRoom])

  const {
    recs,
    aiStatus,
    totals,
    quotaWait,
    summary,
    handleRegenerate,
    handleRetry,
  } = useAiRecommendations({
    records: filteredRecords,
    rooms: availableRooms,
    roomScope: selectedRoom || null,
    placeName: placeLabel,
    placeType: activePlace?.locationType || '',
    user,
    loading,
  })

  if (loading) return <LoadingBlock label="Menganalisis data…" />

  const trendBanner = aiStatus !== 'done' && aiStatus !== 'loading' && recs.find((r) => r.type === 'trend')

  return (
    <div>
      <PageHeader
        title="Smart Recommendations"
        subtitle="Rekomendasi hemat energi yang dipersonalisasi oleh AI, berdasarkan pola konsumsimu."
        actions={isGeminiConfigured() ? <AiChip /> : undefined}
      />

      {/* Step 1: Pilih Gedung — tampil jika belum ada gedung dipilih atau sedang ganti */}
      {(choosingPlace || !selectedPlaceId) ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
          <div className="mb-4 flex items-center gap-3">
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-sirkuit-50 text-sirkuit-600 dark:bg-sirkuit-500/15 dark:text-sirkuit-300">
              <span className="font-mono text-sm font-bold">1</span>
            </span>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">Pilih Gedung</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">Pilih gedung mana yang ingin dianalisis</p>
            </div>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {places.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => {
                  selectPlace(p.id)
                  setChoosingPlace(false)
                  setSelectedRoom('')
                }}
                className="group flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-4 text-left transition-all duration-200 hover:-translate-y-0.5 hover:border-sirkuit-300 hover:shadow-md dark:border-slate-700 dark:bg-slate-800/60 dark:hover:border-sirkuit-500/50"
              >
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-sirkuit-50 text-sirkuit-600 transition-transform group-hover:scale-105 dark:bg-sirkuit-500/15 dark:text-sirkuit-300">
                  <Home size={18} />
                </span>
                <div className="min-w-0">
                  <p className="text-sm font-bold text-slate-900 dark:text-white truncate">{p.name}</p>
                  <p className="text-[11px] text-slate-400">{p.recordCount || 0} catatan · {p.locationType}</p>
                </div>
              </button>
            ))}
            {places.length === 0 && (
              <p className="col-span-full py-4 text-center text-sm text-slate-400">
                Belum ada gedung. Tambahkan di halaman Gedung.
              </p>
            )}
          </div>
        </div>
      ) : (
        <>
          {/* Step indicator — gedung terpilih */}
          <div className="mb-5 flex flex-wrap items-center gap-3 rounded-2xl border border-slate-200 bg-white p-3 dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center gap-2">
              <span className="grid h-7 w-7 place-items-center rounded-lg bg-konduktor-50 text-konduktor-600 dark:bg-konduktor-500/15 dark:text-konduktor-300">
                <CheckCircle2 size={14} />
              </span>
              <span className="text-sm font-bold text-slate-900 dark:text-white">{placeLabel}</span>
            </div>              <button
              type="button"
              onClick={() => {
                setChoosingPlace(true)
                setSelectedRoom('')
              }}
              className="text-[11px] font-semibold text-sirkuit-600 transition hover:text-sirkuit-700 dark:text-sirkuit-300"
            >
              Ganti gedung
            </button>
          </div>

          {/* Step 2: Pilih Ruangan (opsional) */}
          {availableRooms.length > 0 && (
            <div className="mb-5 rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
              <div className="mb-3 flex items-center gap-2">
                <span className="grid h-7 w-7 place-items-center rounded-lg bg-sirkuit-50 text-sirkuit-600 dark:bg-sirkuit-500/15 dark:text-sirkuit-300">
                  <span className="font-mono text-[11px] font-bold">2</span>
                </span>
                <p className="text-sm font-bold text-slate-900 dark:text-white">Pilih Ruangan <span className="font-normal text-slate-400">(opsional)</span></p>
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedRoom('')}
                  className={`rounded-full border px-3 py-2 text-xs font-semibold transition ${
                    !selectedRoom
                      ? 'border-teal-500 bg-teal-50 text-teal-700 ring-2 ring-teal-500/15 dark:bg-teal-500/15 dark:text-teal-300'
                      : 'border-slate-200 text-slate-600 hover:border-slate-300 dark:border-slate-700 dark:text-slate-300'
                  }`}
                >
                  Semua Ruangan
                </button>
                {availableRooms.map((room) => (
                  <button
                    key={room}
                    type="button"
                    onClick={() => setSelectedRoom(room)}
                    className={`rounded-full border px-3 py-2 text-xs font-semibold transition ${
                      selectedRoom === room
                        ? 'border-teal-500 bg-teal-50 text-teal-700 ring-2 ring-teal-500/15 dark:bg-teal-500/15 dark:text-teal-300'
                        : 'border-slate-200 text-slate-600 hover:border-slate-300 dark:border-slate-700 dark:text-slate-300'
                    }`}
                  >
                    {room}
                  </button>
                ))}
              </div>
            </div>
          )}

          {filteredRecords.length === 0 ? (
        <EmptyState
          icon={Lightbulb}
          title="Belum ada data untuk dianalisis"
          description="Catat data di Energy Monitor agar AI bisa menganalisis."
          action={
            <Link to="/app/monitor" className="btn-primary">
              Catat Data Sekarang <ArrowRight size={15} />
            </Link>
          }
        />
      ) : (
        <>
          <div className="card relative overflow-hidden bg-gradient-to-br from-teal-600 to-navy-900 p-6 text-white sm:p-8">
            <div className="pointer-events-none absolute -right-10 -top-10 h-48 w-48 rounded-full bg-white/10 blur-3xl" aria-hidden="true" />
            <div className="relative">
              <span className="badge bg-white/15 text-white">Potensi Penghematan</span>
              <h2 className="mt-3 text-2xl font-extrabold tracking-tight sm:text-3xl">
                Hemat hingga {formatRupiah(totals.rp)} per bulan
              </h2>
              <p className="mt-1.5 max-w-xl text-sm text-teal-100/90">
                Dengan menerapkan rekomendasi di bawah, kamu bisa mengurangi ±{formatDecimal(totals.kwh)} kWh dan ±{formatDecimal(totals.co2)} kg CO₂ setiap bulan.
              </p>
              <div className="mt-5 grid grid-cols-3 gap-3 max-w-md">
                <div className="rounded-xl bg-white/10 p-3 backdrop-blur">
                  <Zap size={16} className="text-teal-300" />
                  <p className="mt-1 text-sm font-bold">{formatDecimal(totals.kwh)} kWh</p>
                  <p className="text-[10px] uppercase tracking-wider text-teal-200">Energi</p>
                </div>
                <div className="rounded-xl bg-white/10 p-3 backdrop-blur">
                  <PiggyBank size={16} className="text-teal-300" />
                  <p className="mt-1 text-sm font-bold">{formatRupiah(totals.rp)}</p>
                  <p className="text-[10px] uppercase tracking-wider text-teal-200">Biaya</p>
                </div>
                <div className="rounded-xl bg-white/10 p-3 backdrop-blur">
                  <Leaf size={16} className="text-teal-300" />
                  <p className="mt-1 text-sm font-bold">{formatDecimal(totals.co2)} kg</p>
                  <p className="text-[10px] uppercase tracking-wider text-teal-200">CO₂</p>
                </div>
              </div>
            </div>
          </div>

          {/* Saved tips summary */}
          {savedTips.length > 0 && (
            <div className="mt-5 rounded-2xl border border-amber-200 bg-amber-50/60 p-4 dark:border-amber-500/25 dark:bg-amber-500/10">
              <p className="flex items-center gap-2 text-sm font-bold text-amber-800 dark:text-amber-200">
                <BookmarkCheck size={16} className="text-amber-500" />
                {savedTips.length} tips tersimpan
              </p>
              <p className="mt-1 text-xs text-amber-600/80 dark:text-amber-300/70">
                Tips yang kamu simpan akan ditampilkan di laporan PDF.
              </p>
            </div>
          )}

          {/* Status AI — tampilan minimal, tidak menampilkan error ke user */}
          {aiStatus === 'fallback' && (
            <div className="mt-4 flex justify-end">
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
            <div className="mt-4 flex justify-end">
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

          {aiStatus === 'loading' && (
            <div className="card mt-5 flex items-center gap-4 border-teal-200 bg-teal-50/70 p-5 dark:border-teal-500/25 dark:bg-teal-500/10">
              <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-teal-100 text-teal-600 dark:bg-teal-500/15 dark:text-teal-400">
                <Zap size={20} />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-bold text-slate-900 dark:text-white">AI sedang menganalisis pola konsumsimu…</p>
                <p className="mt-0.5 truncate text-xs text-slate-500 dark:text-slate-400">
                  Membaca {formatNumber(summary.count)} catatan energi untuk rekomendasi yang paling tepat.
                </p>
              </div>
            </div>
          )}

          {trendBanner && (
            <div className="card mt-5 border-teal-200 bg-teal-50/60 p-4 dark:border-teal-500/30 dark:bg-teal-500/10">
              <p className="text-sm leading-relaxed text-slate-700 dark:text-slate-200">{trendBanner.description}</p>
            </div>
          )}

          {aiStatus === 'loading' ? (
            <div className="mt-5">
              <LoadingBlock label="AI menyusun rekomendasi…" />
            </div>
          ) : (
            <>
              <div className="mt-5 grid gap-4 lg:grid-cols-2">
                {recs.map((r) => {
                  const Icon = REC_ICONS[r.icon] || Lightbulb
                  const isSaved = savedIds.has(r.title)
                  return (
                    <div key={r.id} className="card group p-5 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md">
                      <div className="flex items-start gap-4">
                        <span
                          className={`grid h-11 w-11 shrink-0 place-items-center rounded-xl transition-transform group-hover:scale-105 ${
                            r.icon === 'trending-up'
                              ? 'bg-rose-50 text-rose-500 dark:bg-rose-500/15 dark:text-rose-400'
                              : r.icon === 'lightbulb'
                                ? 'bg-amber-50 text-amber-500 dark:bg-amber-500/15 dark:text-amber-400'
                                : 'bg-teal-50 text-teal-600 dark:bg-teal-500/15 dark:text-teal-400'
                          }`}
                        >
                          <Icon size={20} />
                        </span>
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="text-sm font-bold text-slate-900 dark:text-white">{r.title}</h3>
                            <PriorityBadge priority={r.priority} />
                          </div>
                          <p className="mt-1.5 text-xs leading-relaxed text-slate-500 dark:text-slate-400">{r.description}</p>
                          {r.savingsKwh > 0 && (
                            <div className="mt-3 flex flex-wrap gap-2">
                              <span className="badge bg-sky-500/10 text-sky-600 dark:bg-sky-500/15 dark:text-sky-400">
                                <Zap size={11} /> {formatDecimal(r.savingsKwh)} kWh/bln
                              </span>
                              <span className="badge bg-teal-500/10 text-teal-600 dark:bg-teal-500/15 dark:text-teal-400">
                                <PiggyBank size={11} /> {formatRupiah(r.savingsRp)}/bln
                              </span>
                              <span className="badge bg-emerald-500/10 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-400">
                                <Leaf size={11} /> {formatDecimal(r.co2Impact)} kg CO₂/bln
                              </span>
                            </div>
                          )}
                        </div>
                        {/* Save/bookmark button */}
                        <button
                          onClick={() => handleSaveTip(r)}
                          aria-label={isSaved ? 'Hapus dari simpanan' : 'Simpan tips'}
                          title={isSaved ? 'Hapus dari simpanan' : 'Simpan tips'}
                          className={`shrink-0 rounded-lg p-2 transition ${
                            isSaved
                              ? 'text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-500/10'
                              : 'text-slate-300 hover:bg-slate-100 hover:text-amber-500 dark:text-slate-600 dark:hover:bg-white/10 dark:hover:text-amber-400'
                          }`}
                        >
                          {isSaved ? <BookmarkCheck size={18} /> : <Bookmark size={18} />}
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>
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

          <div className="mt-6 flex flex-col items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-5 text-center dark:border-slate-800 dark:bg-slate-900 sm:flex-row sm:text-left">
            <p className="text-sm text-slate-500 dark:text-slate-400">
              <span className="font-bold text-slate-700 dark:text-slate-200">{formatNumber(filteredRecords.length)} catatan energi</span> telah dianalisis untuk menyusun rekomendasi ini.
            </p>
            <Link to="/app/monitor" className="btn-secondary shrink-0">
              <Zap size={15} /> Tambah Data Lagi
            </Link>
          </div>
        </>
      )}
    </>
      )}
    </div>
  )
}
