const TONES = {
  konduktor: 'bg-konduktor-100 text-konduktor-700 dark:bg-konduktor-500/15 dark:text-konduktor-300',
  sirkuit: 'bg-sirkuit-100 text-sirkuit-700 dark:bg-sirkuit-500/15 dark:text-sirkuit-300',
  neon: 'bg-neon-100 text-neon-700 dark:bg-neon-500/15 dark:text-neon-300',
  voltase: 'bg-voltase-100 text-voltase-700 dark:bg-voltase-500/15 dark:text-voltase-300',
  panel: 'bg-panel-100 text-panel-700 dark:bg-panel-500/15 dark:text-panel-300',
  rose: 'bg-rose-50 text-rose-600 dark:bg-rose-500/15 dark:text-rose-400',
  slate: 'bg-slate-100 text-slate-600 dark:bg-slate-700/40 dark:text-slate-300',
}

export default function StatCard({ icon: Icon, photo, photoAlt = '', label, value, sub, tone = 'konduktor', trend }) {
  return (
    <div className="card group flex items-start gap-4 p-5 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md">
      {photo ? (
        <img
          src={photo}
          alt={photoAlt}
          loading="lazy"
          className="h-11 w-11 shrink-0 rounded-full object-cover shadow-soft ring-2 ring-white/80 transition-transform duration-300 group-hover:scale-105 dark:ring-white/10"
        />
      ) : (
        <div
          className={`grid h-11 w-11 shrink-0 place-items-center rounded-full transition-transform duration-300 group-hover:scale-105 ${TONES[tone] || TONES.konduktor}`}
        >
          <Icon size={20} />
        </div>
      )}
      <div className="min-w-0 flex-1">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
          {label}
        </p>
        <p className="font-mono mt-0.5 truncate text-xl font-bold tracking-tight text-slate-900 dark:text-white">
          {value}
        </p>
        {sub && (
          <p className={`mt-0.5 flex items-center gap-1 text-xs font-medium ${trend === 'up' ? 'text-rose-500' : trend === 'down' ? 'text-konduktor-600' : 'text-slate-400 dark:text-slate-500'}`}>
            {sub}
          </p>
        )}
      </div>
    </div>
  )
}
