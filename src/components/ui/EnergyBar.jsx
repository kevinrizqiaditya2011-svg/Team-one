/**
 * Signature element EnergiKita: Energy Bar — arus listrik mengalir.
 * - Tanpa `value`: strip tipis dekoratif, cahaya putih berjalan di atas
 *   gradient Sirkuit → Neon → Voltase (dipakai di tepi atas hero & stats).
 * - Dengan `value` (0–100): progres statis bergaya kabel bermuatan.
 */
export default function EnergyBar({ value, className = '' }) {
  const hasValue = value !== undefined && value !== null
  const pct = hasValue ? Math.min(100, Math.max(0, Number(value) || 0)) : 0

  if (!hasValue) {
    return <div aria-hidden="true" className={`energy-bar ${className}`} />
  }

  return (
    <div
      role="progressbar"
      aria-valuenow={Math.round(pct)}
      aria-valuemin={0}
      aria-valuemax={100}
      className={`h-2 w-full overflow-hidden rounded-full bg-slate-200/80 dark:bg-white/10 ${className}`}
    >
      <div className="energy-bar-fill" style={{ width: `${pct}%` }} />
    </div>
  )
}
