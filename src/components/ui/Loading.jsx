import { Loader2 } from 'lucide-react'

export function Spinner({ className = '' }) {
  return (
    <Loader2 size={20} className={`animate-spin ${className}`} aria-hidden="true" />
  )
}

export function LoadingBlock({ label = 'Memuat data...' }) {
  return (
    <div className="card flex flex-col items-center justify-center gap-3 px-6 py-16 text-slate-500 dark:text-slate-400">
      <Spinner size={22} className="text-sirkuit-500" />
      <p className="text-sm font-medium">{label}</p>
    </div>
  )
}

export function FullLoader() {
  return (
    <div className="grid min-h-screen place-items-center bg-paper-50 dark:bg-isolasi-950">
      <div className="flex flex-col items-center gap-4">
        <div className="grid h-14 w-14 animate-pulse place-items-center rounded-full bg-gradient-to-br from-sirkuit-600 to-neon-500 text-white shadow-glow">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
          </svg>
        </div>
        <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">Memuat EnergiKita…</p>
      </div>
    </div>
  )
}
