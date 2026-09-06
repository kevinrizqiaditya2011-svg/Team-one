import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { Building2, Plus, ChevronDown } from 'lucide-react'
import { usePlaces } from '../context/PlaceContext'

const MAX_VISIBLE = 4

export default function PlaceSwitcher({ className = '', variant = 'light' }) {
  const { places, selectedPlaceId, selectPlace } = usePlaces()
  const dark = variant === 'dark'
  const [open, setOpen] = useState(false)
  const popRef = useRef(null)

  // Tutup popover saat klik di luar
  useEffect(() => {
    if (!open) return undefined
    const onDoc = (e) => {
      if (popRef.current && !popRef.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('pointerdown', onDoc)
    return () => document.removeEventListener('pointerdown', onDoc)
  }, [open])

  const visible = places.slice(0, MAX_VISIBLE)
  const hidden = places.slice(MAX_VISIBLE)
  const moreCount = places.length - visible.length

  const pick = (id) => {
    selectPlace(id)
    setOpen(false)
  }

  const isAll = selectedPlaceId === 'all'

  // Gaya tombol pill — aktif / tidak aktif, disesuaikan variant gelap/terang
  const btnCls = (active) =>
    dark
      ? active
        ? 'bg-white text-sirkuit-700 shadow-sm'
        : 'border border-white/20 bg-white/10 text-teal-50/90 hover:bg-white/20 hover:text-white'
      : active
        ? 'bg-sirkuit-600 text-white shadow-sm shadow-sirkuit-600/30'
        : 'border border-slate-200 bg-white text-slate-600 hover:border-sirkuit-300 hover:text-sirkuit-700 dark:border-slate-700 dark:bg-abyss-900 dark:text-slate-300 dark:hover:border-sirkuit-500/50 dark:hover:text-sirkuit-300'

  return (
    <div className={`flex flex-wrap items-center gap-2 ${className}`}>
      <span
        className={`text-[11px] font-bold uppercase tracking-wider ${
          dark ? 'text-teal-100/70' : 'text-slate-400'
        }`}
      >
        Analisis:
      </span>

      <div className="flex flex-wrap items-center gap-2">
        {places.length === 0 && (
          <span className="text-[11px] text-slate-400 dark:text-slate-500">Belum ada gedung</span>
        )}
        {/* Semua Gedung button */}
        {places.length > 1 && (
          <button
            type="button"
            onClick={() => pick('all')}
            aria-pressed={isAll}
            className={`inline-flex items-center gap-1.5 rounded-full px-3.5 py-2 text-xs font-bold transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sirkuit-400/60 ${btnCls(isAll)}`}
          >
            Semua Gedung
          </button>
        )}
        {visible.map((p) => (
          <button
            key={p.id}
            type="button"
            onClick={() => pick(p.id)}
            aria-pressed={selectedPlaceId === String(p.id)}
            className={`inline-flex max-w-[10rem] items-center gap-1.5 rounded-full px-3.5 py-2 text-xs font-bold transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sirkuit-400/60 ${btnCls(selectedPlaceId === String(p.id))}`}
          >
            <Building2 size={13} className="shrink-0" />
            <span className="truncate">{p.name}</span>
          </button>
        ))}

        {hidden.length > 0 && (
          <div className="relative" ref={popRef}>
            <button
              type="button"
              onClick={() => setOpen((o) => !o)}
              aria-expanded={open}
              className={`inline-flex items-center gap-1.5 rounded-full border border-dashed px-3.5 py-2 text-xs font-bold transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sirkuit-400/60 ${
                dark
                  ? 'border-white/30 bg-white/5 text-teal-100 hover:bg-white/15'
                  : 'border-slate-300 bg-white/70 text-slate-500 hover:border-sirkuit-400 hover:text-sirkuit-700 dark:border-slate-600 dark:bg-abyss-900 dark:text-slate-300 dark:hover:border-sirkuit-500/50'
              }`}
            >
              +{moreCount} lainnya
              <ChevronDown size={12} className={`transition-transform duration-200 ${open ? 'rotate-180' : ''}`} />
            </button>

            {open && (
              <div className="animate-fade-up absolute left-0 z-40 mt-2 w-56 rounded-2xl border border-paper-200 bg-white p-2 shadow-lg dark:border-white/15 dark:bg-isolasi-900">
                {hidden.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => pick(p.id)}
                    aria-pressed={selectedPlaceId === String(p.id)}
                    className={`flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-xs font-semibold transition ${
                      selectedPlaceId === String(p.id)
                        ? 'bg-sirkuit-600 text-white'
                        : 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-white/10'
                    }`}
                  >
                    <Building2 size={13} className="shrink-0" />
                    <span className="truncate">{p.name}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      <Link
        to="/app/buildings"
        className={`inline-flex items-center gap-1 rounded-full border border-dashed px-3 py-2 text-xs font-semibold transition ${
          dark
            ? 'border-white/20 text-teal-100/90 hover:border-teal-300/50 hover:text-white'
            : 'border-slate-300 text-slate-500 hover:border-teal-400 hover:text-teal-600 dark:border-slate-700 dark:text-slate-400 dark:hover:border-teal-500/50 dark:hover:text-teal-300'
        }`}
        title="Kelola gedung"
      >
        <Plus size={13} /> Gedung
      </Link>
    </div>
  )
}
