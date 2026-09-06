// Logo EnergiKita — marka SVG custom (bukan ikon template):
// badge squircle gradasi biru→cyan dengan petir putih dan daun hijau
// (energi listrik + lingkungan). Digambar manual agar khas & profesional.
export default function Logo({ dark = false, size = 'md', subtitle = false, stacked = false }) {
  const box = size === 'lg' ? 'h-11 w-11' : size === 'xl' ? 'h-12 w-12' : 'h-9 w-9'
  const textSize = size === 'lg' ? 'text-xl' : size === 'xl' ? 'text-2xl' : 'text-lg'
  const textColor = dark ? 'text-white' : 'text-ink'

  const mark = (
    <span
      className={`relative grid ${box} shrink-0 place-items-center rounded-[30%] shadow-glow-cyan`}
      aria-hidden="true"
    >
      <svg viewBox="0 0 48 48" className="h-full w-full" role="img" aria-label="Logo EnergiKita">
        <defs>
          <linearGradient id="ek-badge" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#2456E6" />
            <stop offset="100%" stopColor="#06b6d4" />
          </linearGradient>
        </defs>
        {/* Badge squircle */}
        <rect x="3" y="3" width="42" height="42" rx="13.5" fill="url(#ek-badge)" />
        {/* Petir putih — energi */}
        <path
          d="M26.2 7.5 13.6 25.8h7.6L18.6 40.5 33.4 21.8h-8l.8-14.3z"
          fill="#ffffff"
        />
        {/* Daun hijau di pojok kanan bawah — lingkungan */}
        <path
          d="M29.6 40.6c4.9-1.4 8.7-5.2 10.1-10.1 1.5.4 2.9 1.4 3.7 2.9 1 4.4-1.4 9.2-5.4 12-2.3 1.7-5 2.4-7.6 2.1l-.8-6.9z"
          fill="#34D399"
          opacity="0.95"
        />
        {/* Kilau tipis di tepi atas */}
        <path d="M6 13a7 7 0 0 1 7-7h1a9 9 0 0 0-9 9v-2z" fill="#ffffff" opacity="0.35" />
      </svg>
    </span>
  )

  const wordmark = (
    <span className={`flex flex-col leading-none ${stacked ? 'items-center' : ''}`}>
      <span className={`font-heading font-extrabold tracking-tight ${textSize} ${textColor}`}>
        EnergiKita
      </span>
      {subtitle && (
        <span
          className={`mt-1.5 text-[8.5px] font-bold uppercase tracking-[0.32em] ${
            dark ? 'text-neon-300/90' : 'text-sirkuit-500/80'
          }`}
        >
          Energi Cerdas
        </span>
      )}
    </span>
  )

  if (stacked) {
    return (
      <span className="inline-flex flex-col items-center gap-3.5">
        {mark}
        {wordmark}
      </span>
    )
  }

  return (
    <span className="inline-flex items-center gap-3">
      {mark}
      {wordmark}
    </span>
  )
}
