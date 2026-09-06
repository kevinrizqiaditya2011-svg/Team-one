import { useEffect, useRef, useState } from 'react'

// Logo mitra asli resolusi tinggi & berbentuk persegi — biar semua logo pas
// di kotak seragam. Tiap logo punya beberapa sumber berurutan (HD → 256px → 128px).
const FAV = (d, sz = 256) => `https://www.google.com/s2/favicons?domain=${d}&sz=${sz}`

const PARTNERS = [
  {
    name: 'PLN Group',
    srcs: ['https://commons.wikimedia.org/wiki/Special:FilePath/Logo%20PLN%20(cropped).svg?width=512', FAV('pln.co.id'), FAV('pln.co.id', 128)],
  },
  { name: 'Kementerian ESDM', srcs: [FAV('esdm.go.id'), FAV('esdm.go.id', 128)] },
  { name: 'BRIN', srcs: ['https://www.brin.go.id/favicon.ico', FAV('brin.go.id'), FAV('brin.go.id', 128)] },
  { name: 'ICLEI Indonesia', srcs: [FAV('iclei.org'), FAV('iclei.org', 128)] },
  { name: 'BPS', srcs: [FAV('bps.go.id'), FAV('bps.go.id', 128)] },
]

const REPEAT = 2 // logo diulang agar ring terisi tanpa terlalu rapat
const TOTAL = PARTNERS.length * REPEAT // 10 logo di atas ring horizontal

/**
 * Logo mitra — pakai sumber HD berurutan; jika semua gagal, tampilkan
 * monogram agar slot tidak pernah kosong.
 */
function PartnerLogo({ srcs, name }) {
  const [idx, setIdx] = useState(0)

  if (idx >= srcs.length) {
    return (
      <span className="flex h-16 w-16 flex-col items-center justify-center gap-0.5 rounded-xl border border-white/70 bg-white p-1 shadow-lg dark:border-white/15 sm:h-20 sm:w-20">
        <span className="grid h-8 w-8 place-items-center rounded-full bg-gradient-to-br from-sirkuit-600 to-neon-500 text-xs font-extrabold text-white">
          {name[0]}
        </span>
        <span className="max-w-full truncate text-[6.5px] font-bold leading-tight text-slate-600">{name}</span>
      </span>
    )
  }

  return (
    <img
      src={srcs[idx]}
      alt={name}
      title={name}
      loading="lazy"
      draggable={false}
      onError={() => setIdx((i) => i + 1)}
      className="h-16 w-16 rounded-xl border border-white/70 bg-white object-contain p-1.5 shadow-lg dark:border-white/15 dark:bg-white sm:h-20 sm:w-20"
    />
  )
}

/**
 * GlobeSVG — bumi 3D bergaya flat-vector dengan rotasi halus.
 * Menggantikan bola biru abstrak dengan visualisasi bumi yang relevan.
 */
function GlobeSVG({ rot }) {
  // Bumi berputar continuous — pakai CSS rotate untuk efek spinning mulus
  const spinDeg = rot * 0.8
  return (
    <svg
      viewBox="0 0 200 200"
      className="h-full w-full"
      style={{ filter: 'drop-shadow(0 8px 32px rgba(36,86,230,0.3))' }}
    >
      <defs>
        <radialGradient id="globeGrad" cx="40%" cy="35%" r="60%">
          <stop offset="0%" stopColor="#60a5fa" />
          <stop offset="45%" stopColor="#2563eb" />
          <stop offset="100%" stopColor="#1e3a8a" />
        </radialGradient>
        <radialGradient id="landGrad" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#22c55e" />
          <stop offset="100%" stopColor="#16a34a" />
        </radialGradient>
        <clipPath id="globeClip">
          <circle cx="100" cy="100" r="90" />
        </clipPath>
      </defs>

      {/* Bumi — lingkaran utama */}
      <circle cx="100" cy="100" r="90" fill="url(#globeGrad)" />

      {/* Daratan yang berputar — pola lebar 500px, translate kontinu dengan wrap seamless */}
      <g clipPath="url(#globeClip)" opacity="0.85">
        {/* Baris 1 — bergeser mengikuti rotasi */}
        <g style={{ transform: `translateX(${(spinDeg % 500) - 250}px)` }}>
          {[0, 100, 200, 300, 400, 500, 600].map((x) => (
            <g key={x}>
              <ellipse cx={40 + x} cy={58} rx={28} ry={13} fill="url(#landGrad)" />
              <ellipse cx={85 + x} cy={63} rx={18} ry={9} fill="url(#landGrad)" />
              <ellipse cx={130 + x} cy={56} rx={22} ry={11} fill="url(#landGrad)" />
            </g>
          ))}
        </g>
        {/* Baris 2 */}
        <g style={{ transform: `translateX(${((spinDeg + 50) % 500) - 250}px)` }}>
          {[0, 110, 220, 330, 440, 550, 660].map((x) => (
            <g key={x}>
              <ellipse cx={30 + x} cy={92} rx={32} ry={16} fill="url(#landGrad)" />
              <ellipse cx={100 + x} cy={88} rx={20} ry={10} fill="url(#landGrad)" />
              <ellipse cx={170 + x} cy={95} rx={26} ry={13} fill="url(#landGrad)" />
            </g>
          ))}
        </g>
        {/* Baris 3 */}
        <g style={{ transform: `translateX(${((spinDeg + 110) % 500) - 250}px)` }}>
          {[0, 120, 240, 360, 480, 600, 720].map((x) => (
            <g key={x}>
              <ellipse cx={45 + x} cy={128} rx={25} ry={12} fill="url(#landGrad)" />
              <ellipse cx={110 + x} cy={132} rx={16} ry={9} fill="url(#landGrad)" />
              <ellipse cx={175 + x} cy={126} rx={28} ry={14} fill="url(#landGrad)" />
            </g>
          ))}
        </g>
      </g>

      {/* Garis-garis latitude */}
      <g clipPath="url(#globeClip)" opacity="0.12" stroke="white" strokeWidth="0.7" fill="none">
        <ellipse cx="100" cy="100" rx="90" ry="30" />
        <ellipse cx="100" cy="100" rx="90" ry="60" />
        <ellipse cx="100" cy="100" rx="90" ry="78" />
        {/* Meridian yang berputar */}
        <ellipse cx="100" cy="100" rx="30" ry="90" transform={`rotate(${spinDeg * 0.3}, 100, 100)`} />
        <ellipse cx="100" cy="100" rx="60" ry="90" transform={`rotate(${spinDeg * 0.3}, 100, 100)`} />
        <ellipse cx="100" cy="100" rx="78" ry="90" transform={`rotate(${spinDeg * 0.3}, 100, 100)`} />
      </g>

      {/* Efek cahaya */}
      <circle cx="75" cy="70" r="35" fill="white" opacity="0.08" />
      <circle cx="65" cy="60" r="15" fill="white" opacity="0.12" />
    </svg>
  )
}

/**
 * PartnerOrb — ring 3D horizontal berisi logo mitra dengan bumi di tengah.
 * - Bumi bergaya flat-vector di pusat, logo mitra berputar mengelilingi.
 * - Terus berputar otomatis lebih lambat (velocity dikurangi untuk kenyamanan).
 * - Bisa digeser (drag) untuk memutar lebih cepat.
 */
export default function PartnerOrb({ className = '' }) {
  const stateRef = useRef({ rot: 0, tilt: -12, tiltBase: -12, dragging: false })
  const [spin, setSpin] = useState({ rot: 0, tilt: -12 })
  const [hover, setHover] = useState(false)

  // Putaran terus-menerus — lebih lambat dari sebelumnya untuk kenyamanan visual
  useEffect(() => {
    let raf = 0
    let last = performance.now()
    const loop = () => {
      const now = performance.now()
      const dt = Math.min(64, now - last)
      last = now
      const s = stateRef.current
      if (!s.dragging) {
        // Velocity dikurangi dari 0.05 menjadi 0.025 — lebih lambat & elegan
        s.rot = ((s.rot + dt * 0.025) % 360 + 360) % 360
        const rock = Math.sin(now / 3200) * 6 // goyangan halus lebih lambat
        setSpin({ rot: s.rot, tilt: s.tiltBase + rock })
      }
      raf = requestAnimationFrame(loop)
    }
    raf = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(raf)
  }, [])

  const onPointerDown = (e) => {
    const s = stateRef.current
    s.dragging = true
    s.x = e.clientX
    s.y = e.clientY
    e.currentTarget.setPointerCapture(e.pointerId)
  }

  const onPointerMove = (e) => {
    const s = stateRef.current
    if (!s.dragging) return
    const dx = e.clientX - s.x
    const dy = e.clientY - s.y
    s.x = e.clientX
    s.y = e.clientY
    s.rot = ((s.rot + dx * 0.4) % 360 + 360) % 360
    s.tiltBase = Math.max(-30, Math.min(30, s.tiltBase - dy * 0.25))
    s.tilt = s.tiltBase
    setSpin({ rot: s.rot, tilt: s.tiltBase })
  }

  const stopDrag = () => {
    stateRef.current.dragging = false
  }

  const { rot, tilt } = spin
  const rotRad = (rot * Math.PI) / 180
  const tiltRad = (tilt * Math.PI) / 180

  // Ring horizontal — logo berputar mengelilingi bumi di tengah
  const items = Array.from({ length: TOTAL }, (_, i) => {
    const p = PARTNERS[i % PARTNERS.length]
    const a = (i / TOTAL) * Math.PI * 2 + rotRad
    const depth = Math.cos(a) // 1 = depan, -1 = belakang
    const x = Math.sin(a) * 38 // % dari lebar kontainer
    const y = Math.sin(tiltRad) * Math.abs(Math.sin(a)) * 10
    return { ...p, depth, x, y }
  })

  return (
    <div
      className={`relative mx-auto w-full select-none ${className}`}
      style={{ perspective: '1100px' }}
      onPointerEnter={() => setHover(true)}
      onPointerLeave={() => setHover(false)}
    >
      <div
        role="img"
        aria-label="Logo mitra EnergiKita berputar mengelilingi bola bumi"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={stopDrag}
        onPointerCancel={stopDrag}
        onPointerLeave={stopDrag}
        className="relative mx-auto aspect-square w-full max-w-[600px] cursor-grab touch-none active:cursor-grabbing"
      >
        {/* Glow lembut di belakang bumi & logo */}
        <div
          className="pointer-events-none absolute left-1/2 top-1/2 h-[80%] w-[80%] -translate-x-1/2 -translate-y-1/2 rounded-full blur-3xl transition-opacity duration-500"
          style={{
            opacity: hover ? 1 : 0.7,
            background: 'radial-gradient(circle, rgba(36,86,230,0.3), rgba(34,197,94,0.15), rgba(10,17,32,0))',
          }}
          aria-hidden="true"
        />

        {/* Bayangan lantai */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute bottom-[8%] left-1/2 h-7 w-3/5 -translate-x-1/2 rounded-[100%] bg-isolasi-950/20 blur-xl dark:bg-black/45"
        />

        {/* Bumi di tengah — besar & statis di posisi tengah */}
        <div
          className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
          style={{ width: '55%', height: '55%', zIndex: 15 }}
        >
          <GlobeSVG rot={rot} />
        </div>

        {/* Logo mitra berputar di ring 3D */}
        {items.map((p, i) => {
          if (p.depth < -0.3) return null // logo di belakang — sembunyikan
          const t = (p.depth + 1) / 2 // 0 = paling belakang, 1 = paling depan
          const scale = 0.45 + 0.55 * t
          const opacity = 0.2 + 0.8 * t
          const blur = (1 - t) * 1.4 // logo jauh sedikit buram → kedalaman 3D
          const z = 50 + p.x
          const top = 50 + p.y
          return (
            <div
              key={`logo-${i}`}
              className="pointer-events-none absolute -translate-x-1/2 -translate-y-1/2"
              style={{
                left: `${z}%`,
                top: `${top}%`,
                transform: `translate(-50%, -50%) scale(${hover && p.depth > 0.4 ? scale * 1.06 : scale})`,
                opacity,
                zIndex: Math.round(p.depth * 10) + 20,
                filter: `blur(${blur}px)`,
                transition: 'transform 0.3s ease-out, opacity 0.3s ease-out, filter 0.3s ease-out',
              }}
            >
              <PartnerLogo srcs={p.srcs} name={p.name} />
            </div>
          )
        })}
      </div>
    </div>
  )
}
