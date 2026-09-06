const TONES = {
  konduktor: 'bg-konduktor-100 text-konduktor-700 dark:bg-konduktor-500/15 dark:text-konduktor-300',
  voltase: 'bg-voltase-100 text-voltase-800 dark:bg-voltase-500/15 dark:text-voltase-300',
  rose: 'bg-rose-100 text-rose-700 dark:bg-rose-500/15 dark:text-rose-400',
  sirkuit: 'bg-sirkuit-100 text-sirkuit-700 dark:bg-sirkuit-500/15 dark:text-sirkuit-300',
  neon: 'bg-neon-100 text-neon-700 dark:bg-neon-500/15 dark:text-neon-300',
  violet: 'bg-violet-100 text-violet-700 dark:bg-violet-500/15 dark:text-violet-400',
  panel: 'bg-panel-100 text-panel-700 dark:bg-panel-500/15 dark:text-panel-300',
  slate: 'bg-slate-100 text-slate-600 dark:bg-slate-700/40 dark:text-slate-300',
}

export default function Badge({ children, tone = 'slate', className = '' }) {
  return (
    <span className={`badge ${TONES[tone] || TONES.slate} ${className}`}>{children}</span>
  )
}
