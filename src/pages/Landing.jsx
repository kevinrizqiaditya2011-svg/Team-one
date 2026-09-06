import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  ArrowRight,
  Check,
  Sun,
  Moon,
  Wallet,
  Leaf,
  Phone,
  Mail,
  MapPin,
  Home,
  School,
  Store,
  Briefcase,
  ShoppingBag,
  BedDouble,
  Gauge,
  TrendingDown,
  CloudFog,
} from 'lucide-react'
import Logo from '../components/ui/Logo'
import Reveal from '../components/ui/Reveal'
import Typewriter from '../components/ui/Typewriter'
import EnergyBar from '../components/ui/EnergyBar'
import PartnerOrb from '../components/ui/PartnerOrb'
import { useAuth } from '../context/AuthContext'
import { useTheme } from '../context/ThemeContext'
import { useUserData } from '../hooks/useUserData'
import { monthRange, periodFromRecords, sumStats, EMISSION_FACTOR } from '../services/energyService'
import { formatRupiah, formatDecimal } from '../utils/format'

const HERO_STATS = [
  { value: '24/7', label: 'Pemantauan real-time' },
  { value: '±12%', label: 'Hemat tagihan rata-rata' },
  { value: '2.400+', label: 'Pengguna aktif' },
]

const FEATURES = [
  ['Pemantauan real-time', 'Pantau pemakaian harian dengan grafik yang mudah dibaca.'],
  ['Prediksi tagihan AI', 'Ketahui perkiraan tagihan bulan depan sejak sekarang.'],
  ['Hitung emisi karbon', 'Setiap kWh diterjemahkan menjadi dampak CO₂.'],
  ['Rekomendasi hemat', 'Saran personal sesuai kebiasaan dan perangkatmu.'],
  ['Multi-gedung', 'Kelola rumah, sekolah, dan usaha dalam satu akun.'],
]

const STEPS = [
  ['Tambah gedung & ruangan', 'Daftarkan rumah, sekolah, atau usaha yang ingin dipantau.'],
  ['Catat pemakaian', 'Isi angka meteran harian — cukup beberapa detik.'],
  ['Biarkan AI menganalisis', 'Pola, prediksi, dan saran hemat muncul otomatis.'],
]

// Konstanta array di modul scope — stabil agar Typewriter tidak restart per render
// Tanpa tanda baca (koma/titik) agar tampilan tetap bersih saat diketik.
const HERO_LINES = ['Kelola konsumsi energi Anda']
const FEATURES_TITLE = ['Semua yang Anda butuhkan untuk hemat energi']
const STEPS_TITLE = ['Tiga langkah menuju tagihan lebih ringan']
const PARTNER_TITLE = ['Mitra & kolaborator kami']

// Simulator kartu meteran hero — angka dasar dikalibrasi agar konsisten
// dengan contoh lama (312 kWh → Rp453.000 → 265 kg).
const TARIFF = 1450 // Rp/kWh
const CO2_PER_KWH = 0.85 // kg CO₂ per kWh
const BASE_TOTAL_KWH = 312 // pemakaian rumah normal

// Tiga gaya pemakaian — satu klik untuk melihat pengaruhnya ke tagihan.
const PRESETS = [
  { id: 'hemat', label: 'Hemat', kwh: 260 },
  { id: 'normal', label: 'Normal', kwh: 312 },
  { id: 'boros', label: 'Boros', kwh: 410 },
]

// Dampak singkat — panel statis ringan di section Fitur
const IMPACT_STATS = [
  { icon: TrendingDown, value: '±12%', label: 'tagihan lebih ringan' },
  { icon: Gauge, value: '±38 kWh', label: 'dihemat per bulan' },
  { icon: CloudFog, value: '±265 kg', label: 'CO₂ berkurang per tahun' },
]

// Tipe pengguna untuk section pendaftaran di landing
const REGISTER_TYPES = [
  { icon: Home, label: 'Rumah', desc: 'Rumah tinggal dengan pemakaian harian normal' },
  { icon: School, label: 'Sekolah', desc: 'Sekolah atau kampus dengan jam operasional tetap' },
  { icon: Store, label: 'UMKM', desc: 'Usaha kecil dengan pola pemakaian spesifik' },
  { icon: Briefcase, label: 'Kantor', desc: 'Kantor perkantoran Senin–Jumat' },
  { icon: ShoppingBag, label: 'Toko', desc: 'Toko atau ruko dengan jam buka fleksibel' },
  { icon: BedDouble, label: 'Kost', desc: 'Kost atau apartemen dengan banyak unit' },
]

function ThemeButton() {
  const { theme, toggle } = useTheme()
  return (
    <button
      onClick={toggle}
      aria-label={theme === 'dark' ? 'Mode terang' : 'Mode gelap'}
      className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 transition hover:bg-slate-50 dark:border-white/15 dark:bg-white/[0.06] dark:text-slate-200 dark:hover:bg-white/10"
    >
      {theme === 'dark' ? <Sun size={17} /> : <Moon size={17} />}
    </button>
  )
}

// Navbar oval mengambang — efek hover yang interaktif & konsisten
function Navbar() {
  const { user } = useAuth()
  const { theme } = useTheme()
  const navigate = useNavigate()
  const dark = theme === 'dark'

  const [scrolled, setScrolled] = useState(false)
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <header className="fixed inset-x-0 top-0 z-50 px-3 pt-3 sm:px-5 sm:pt-4">
      <div
        className={`mx-auto flex h-[4.5rem] max-w-2xl items-center justify-between rounded-full pl-5 pr-3 backdrop-blur-xl transition-all duration-500 sm:h-[5rem] sm:pl-6 sm:pr-3 ${
          scrolled
            ? 'border border-sirkuit-200/60 bg-white/90 shadow-lg shadow-sirkuit-500/8 dark:border-sirkuit-400/20 dark:bg-isolasi-900/90 dark:shadow-glow-cyan-sm'
            : 'border border-paper-200 bg-white/85 shadow-soft dark:border-white/10 dark:bg-isolasi-900/80 dark:shadow-eco-card-sm'
        }`}
      >
        <EnergyBar className="absolute inset-x-3 top-0 h-[2px] w-[calc(100%-24px)] rounded-full" />

        <button
          type="button"
          onClick={() => document.getElementById('hero')?.scrollIntoView({ behavior: 'smooth' })}
          aria-label="EnergiKita"
          className="relative shrink-0 cursor-pointer transition-opacity hover:opacity-90"
        >
          <Logo dark={dark} />
        </button>
        <nav className="hidden items-center gap-1 md:flex" aria-label="Navigasi utama">
          {[
            ['#fitur', 'Fitur'],
            ['#cara-kerja', 'Cara Kerja'],
            ['#partner', 'Mitra'],
          ].map(([href, label]) => (
            <a
              key={href}
              href={href}
              className="group relative overflow-hidden rounded-full px-5 py-2.5 text-[15px] font-semibold text-slate-600 transition-all duration-300 hover:text-sirkuit-700 dark:text-slate-300 dark:hover:text-white"
            >
              <span className="relative z-10">{label}</span>
              <span className="absolute inset-0 rounded-full bg-gradient-to-r from-sirkuit-500/0 via-sirkuit-400/10 to-sirkuit-500/0 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
              <span className="absolute bottom-1 left-1/2 h-[2px] w-0 -translate-x-1/2 rounded-full bg-gradient-to-r from-sirkuit-500 to-neon-400 transition-all duration-300 group-hover:w-3/4" />
            </a>
          ))}
        </nav>
        <div className="flex items-center gap-1.5 sm:gap-2.5">
          <ThemeButton />
          {user ? (
            <button onClick={() => navigate('/app')} className="eco-btn hidden sm:inline-flex">
              Buka Dashboard <ArrowRight size={16} />
            </button>
          ) : (
            <button onClick={() => navigate('/register')} className="eco-btn">
              Daftar <span className="hidden sm:inline">Gratis</span>
            </button>
          )}
        </div>
      </div>
    </header>
  )
}

/** Kartu meteran simpel & interaktif — pilih gaya pemakaian (Hemat/Normal/Boros)
 *  dan angka konsumsi, biaya, serta emisi berubah. Jika user login & punya data,
 *  tampilkan data dashboard real-time. */
function MeterCard() {
  const { user } = useAuth()
  const { records: allRecords } = useUserData('energyRecords')
  const [preset, setPreset] = useState('normal')

  // Hitung data real dari records jika user login & punya data
  const realData = useMemo(() => {
    if (!user || !allRecords || allRecords.length === 0) return null
    const cur = monthRange(0)
    const curRecs = periodFromRecords(allRecords, cur.start, cur.end)
    if (curRecs.length === 0) return null
    const stats = sumStats(curRecs)
    return {
      totalKwh: stats.totalKwh,
      totalCost: stats.totalCost,
      totalCo2: stats.totalCo2,
      count: stats.count,
    }
  }, [user, allRecords])

  // Gunakan data real jika ada,否则 pakai preset
  const total = realData ? Math.round(realData.totalKwh) : PRESETS.find((p) => p.id === preset).kwh
  const cost = realData ? Math.round(realData.totalCost) : total * TARIFF
  const co2 = realData ? realData.totalCo2 : total * CO2_PER_KWH
  const saving = realData ? 0 : BASE_TOTAL_KWH - total
  const ratio = Math.min(1, Math.max(0.06, total / (realData ? Math.max(total * 1.2, 300) : 320)))

  return (
    <div className="relative mx-auto w-full max-w-md">
      <div
        className="pointer-events-none absolute -inset-6 rounded-[2.5rem] bg-gradient-to-br from-sirkuit-500/20 via-neon-400/15 to-voltase-500/20 blur-2xl"
        aria-hidden="true"
      />
      <div className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-gradient-to-b from-isolasi-700/90 via-isolasi-800 to-isolasi-900 p-6 shadow-eco-card backdrop-blur-xl dark:border-white/25 dark:shadow-glow-cyan sm:p-7">
        <EnergyBar className="absolute inset-x-0 top-0 h-1 w-full rounded-none" />
        <div className="circuit-grid pointer-events-none absolute inset-0 opacity-40" aria-hidden="true" />

        <div className="relative">
          <div className="flex items-center justify-between">
            <span className="badge bg-sirkuit-500/15 text-sirkuit-300">
              {realData ? `Data Aktual · ${realData.count} catatan` : 'Bulan ini'}
            </span>
          </div>

          <p className="mt-5 text-[11px] font-bold uppercase tracking-[0.16em] text-slate-400">
            {realData ? 'Total pemakaian bulan ini' : 'Total pemakaian'}
          </p>
          <p className="mt-1 font-mono text-5xl font-bold tracking-tight text-white sm:text-6xl">
            {total.toLocaleString('id-ID')} <span className="text-xl font-semibold text-slate-400">kWh</span>
          </p>
          {realData ? (
            <p className="mt-1.5 text-xs font-semibold text-konduktor-300">
              {formatRupiah(cost)} estimasi biaya · {formatDecimal(co2)} kg CO₂
            </p>
          ) : (
            <p
              className={`mt-1.5 text-xs font-semibold ${
                saving > 0 ? 'text-konduktor-300' : saving < 0 ? 'text-voltase-300' : 'text-slate-300'
              }`}
            >
              {saving > 0 && `▼ Hemat ${saving} kWh dari bulan lalu`}
              {saving === 0 && 'Setara dengan bulan lalu'}
              {saving < 0 && `▲ ${-saving} kWh di atas bulan lalu`}
            </p>
          )}

          <div className="mt-4">
            <div className="mb-1.5 flex items-center justify-between text-[10px] font-semibold text-slate-400">
              <span>Pemakaian</span>
              <span>{Math.round(ratio * 100)}%</span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-white/10">
              <div
                className="energy-bar-fill transition-all duration-500"
                style={{ width: `${Math.round(ratio * 100)}%` }}
              />
            </div>
          </div>

          {!realData && (
            <>
              <p className="mt-4 text-[10px] font-medium text-slate-300">Pilih gaya pemakaianmu</p>
              <div className="mt-2 grid grid-cols-3 gap-2">
                {PRESETS.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => setPreset(p.id)}
                    aria-pressed={preset === p.id}
                    className={`rounded-xl border px-2 py-2.5 text-center transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sirkuit-300/70 ${
                      preset === p.id
                        ? 'border-sirkuit-300/80 bg-sirkuit-500/25 shadow-sm'
                        : 'border-white/25 bg-white/15 hover:bg-white/25'
                    }`}
                  >
                    <span className={`block text-xs font-bold ${preset === p.id ? 'text-white' : 'text-slate-100'}`}>
                      {p.label}
                    </span>
                    <span className="mt-0.5 block font-mono text-[10px] text-slate-300">{p.kwh} kWh</span>
                  </button>
                ))}
              </div>
            </>
          )}

          <div className="mt-4 grid grid-cols-2 gap-3">
            <div className="rounded-xl bg-white/[0.08] p-3.5 transition-colors duration-300 hover:bg-white/[0.12]">
              <Wallet size={17} className="text-neon-300" />
              <p className="mt-1.5 font-mono text-base font-bold text-white">
                Rp{cost.toLocaleString('id-ID')}
              </p>
              <p className="text-[10px] text-slate-400">Estimasi biaya</p>
            </div>
            <div className="rounded-xl bg-white/[0.08] p-3.5 transition-colors duration-300 hover:bg-white/[0.12]">
              <Leaf size={17} className="text-konduktor-300" />
              <p className="mt-1.5 font-mono text-base font-bold text-white">
                {co2.toFixed(0)} kg
              </p>
              <p className="text-[10px] text-slate-400">Emisi CO₂</p>
            </div>
          </div>

          {realData && (
            <Link to="/app" className="mt-4 block rounded-xl bg-white/10 py-2.5 text-center text-xs font-bold text-white transition hover:bg-white/15">
              Buka Dashboard →
            </Link>
          )}
        </div>
      </div>
    </div>
  )
}

export default function Landing() {
  const heroRef = useRef(null)
  const meterRef = useRef(null)
  const fiturRef = useRef(null)
  const impactRef = useRef(null)

  useEffect(() => {
    // Tint viewport scrollbar untuk landing.
    document.documentElement.classList.add('landing-scroll')
    return () => document.documentElement.classList.remove('landing-scroll')
  }, [])

  // Parallax tipis kartu meteran mengikuti mouse (dinonaktifkan pada reduced motion)
  useEffect(() => {
    const hero = heroRef.current
    const meter = meterRef.current
    if (!hero || !meter) return undefined
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return undefined
    const onMove = (e) => {
      const r = hero.getBoundingClientRect()
      const x = (e.clientX - (r.left + r.width / 2)) / r.width
      const y = (e.clientY - (r.top + r.height / 2)) / r.height
      meter.style.transform = `translate3d(${x * -12}px, ${y * -8}px, 0)`
    }
    const onLeave = () => {
      meter.style.transform = 'translate3d(0, 0, 0)'
    }
    hero.addEventListener('mousemove', onMove)
    hero.addEventListener('mouseleave', onLeave)
    return () => {
      hero.removeEventListener('mousemove', onMove)
      hero.removeEventListener('mouseleave', onLeave)
    }
  }, [])

  // Parallax tipis panel dampak di section Fitur — efek gerak yang sama seperti hero
  useEffect(() => {
    const fitur = fiturRef.current
    const impact = impactRef.current
    if (!fitur || !impact) return undefined
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return undefined
    const onMove = (e) => {
      const r = fitur.getBoundingClientRect()
      const x = (e.clientX - (r.left + r.width / 2)) / r.width
      const y = (e.clientY - (r.top + r.height / 2)) / r.height
      impact.style.transform = `translate3d(${x * -10}px, ${y * -7}px, 0)`
    }
    const onLeave = () => {
      impact.style.transform = 'translate3d(0, 0, 0)'
    }
    fitur.addEventListener('mousemove', onMove)
    fitur.addEventListener('mouseleave', onLeave)
    return () => {
      fitur.removeEventListener('mousemove', onMove)
      fitur.removeEventListener('mouseleave', onLeave)
    }
  }, [])

  return (
    <div id="top" className="min-h-screen bg-paper-50 text-ink antialiased dark:bg-[#0a0e1a] dark:text-slate-100">
      <Navbar />

      {/* ============ 1. HERO (konten kiri) ============ */}
      <section
        id="hero"
        ref={heroRef}
        className="relative overflow-hidden pb-14 pt-32 sm:pb-16 sm:pt-40"
      >
        {/* Energy-bar strip tipis di tepi atas */}
        <EnergyBar className="absolute inset-x-0 top-0 h-1 w-full rounded-none" />
        <div className="circuit-grid pointer-events-none absolute inset-0 opacity-70" aria-hidden="true" />
        <div
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_70%_60%_at_50%_-10%,rgb(36_86_230/0.09),transparent)]"
          aria-hidden="true"
        />

        <div className="relative mx-auto grid max-w-6xl items-center gap-12 px-4 sm:px-6 lg:grid-cols-[1.1fr_0.9fr]">
          <div>
            <span className="eco-chip">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-sirkuit-400 opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-sirkuit-500" />
              </span>
              Sistem Manajemen Energi Cerdas
            </span>

            <h1 className="mt-7 font-heading text-[2.6rem] font-extrabold leading-[1.12] tracking-tight text-ink dark:text-white sm:text-6xl lg:text-[4rem]">
              <Typewriter
                lines={HERO_LINES}
                lineClassName="block"
                startOnView
                speed={52}
              />
            </h1>

            <p className="mt-6 max-w-xl text-base leading-relaxed text-slate-600 dark:text-slate-300 sm:text-lg">
              Cukup catat pemakaian listrik harian Anda. EnergiKita menganalisis polanya,
              memperkirakan tagihan, dan menyarankan langkah hemat — sebelum tagihan datang.
            </p>

            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Link to="/register" className="eco-btn">
                Mulai Gratis <ArrowRight size={16} />
              </Link>
              <a href="#cara-kerja" className="eco-btn-ghost">
                Lihat Cara Kerja
              </a>
            </div>

            <div className="mt-9 grid max-w-lg grid-cols-3 gap-6">
              {HERO_STATS.map((s) => (
                <div key={s.label}>
                  <p className="font-mono text-xl font-bold tracking-tight text-ink dark:text-white sm:text-2xl">
                    {s.value}
                  </p>
                  <p className="mt-1 text-[11px] font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    {s.label}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Kartu meteran listrik — parallax tipis mengikuti mouse */}
          <div className="relative mx-auto w-full max-w-md">
            <div ref={meterRef} className="transition-transform duration-300 ease-out">
              <MeterCard />
            </div>
          </div>
        </div>
      </section>

      {/* ============ 2. FITUR UTAMA (konten kanan) ============ */}
      <section id="fitur" ref={fiturRef} className="relative overflow-hidden bg-white py-16 sm:py-20 dark:bg-isolasi-950/80">          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_60%_50%_at_50%_100%,rgb(36_86_230/0.07),transparent)] dark:bg-[radial-gradient(ellipse_60%_50%_at_50%_100%,rgb(36_86_230/0.12),transparent)]"
          aria-hidden="true"
        />
        <div className="relative mx-auto max-w-6xl px-4 sm:px-6">
          <div className="grid items-center gap-12 lg:grid-cols-2">
            {/* Panel dampak — kiri, bergeser mengikuti mouse seperti hero */}
            <Reveal delay={120}>
              <div ref={impactRef} className="transition-transform duration-300 ease-out">
                <div className="relative mx-auto w-full max-w-md">
                  <div
                    className="pointer-events-none absolute -inset-5 rounded-[2.2rem] bg-gradient-to-br from-sirkuit-500/15 via-neon-400/10 to-voltase-500/15 blur-2xl"
                    aria-hidden="true"
                  />
                <div className="relative overflow-hidden rounded-[1.8rem] border border-paper-200 bg-white/85 p-6 shadow-eco-card backdrop-blur dark:border-white/20 dark:bg-[#111827] sm:p-7">
                  <EnergyBar className="absolute inset-x-0 top-0 h-1 w-full rounded-none" />
                  <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-sirkuit-600 dark:text-neon-300">
                    Dampak nyata
                  </p>
                  <h3 className="mt-2 font-heading text-xl font-extrabold tracking-tight text-slate-900 dark:text-white">
                    Hasil yang bisa Anda ukur
                  </h3>
                  <div className="mt-5 space-y-3">
                    {IMPACT_STATS.map((s) => (
                      <div
                        key={s.label}
                        className="flex items-center gap-4 rounded-2xl border border-paper-200 bg-white/80 px-4 py-3.5 transition-colors hover:border-sirkuit-300 dark:border-white/10 dark:bg-white/[0.08]"
                      >
                        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-sirkuit-50 text-sirkuit-600 dark:bg-sirkuit-500/15 dark:text-sirkuit-300">
                          <s.icon size={17} />
                        </span>
                        <div>
                          <p className="font-mono text-lg font-extrabold tracking-tight text-slate-900 dark:text-white">
                            {s.value}
                          </p>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400">{s.label}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                    <p className="mt-4 text-[10px] leading-relaxed text-slate-400">
                      *Estimasi berdasarkan rata-rata pengguna aktif EnergiKita.
                    </p>
                  </div>
                </div>
              </div>
            </Reveal>

            {/* Teks fitur — kanan */}
            <div>
              <Reveal>
                <span className="eco-eyebrow">Fitur</span>
              </Reveal>
              <h2 className="mt-4 font-heading text-3xl font-extrabold leading-tight tracking-tight text-ink dark:text-white sm:text-4xl">
                <Typewriter lines={FEATURES_TITLE} startOnView speed={42} />
              </h2>

              <ul className="mt-8 space-y-4">
                {FEATURES.map(([title, text], i) => (
                  <Reveal key={title} delay={i * 40}>
                    <li className="group -mx-3 flex items-start gap-3.5 rounded-2xl px-3 py-2 transition-colors duration-200 hover:bg-sirkuit-50/70 dark:hover:bg-white/[0.08]">
                      <span className="mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full bg-konduktor-500/15 text-konduktor-600 transition-transform duration-300 group-hover:scale-110 dark:text-konduktor-300">
                        <Check size={14} strokeWidth={3} />
                      </span>
                      <div>
                        <p className="text-sm font-bold text-ink dark:text-white sm:text-base">{title}</p>
                        <p className="mt-0.5 text-sm leading-relaxed text-slate-500 dark:text-slate-400">{text}</p>
                      </div>
                    </li>
                  </Reveal>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* ============ 3. CARA KERJA ============ */}
      <section id="cara-kerja" className="relative overflow-hidden py-16 sm:py-20">
        <div
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_60%_50%_at_50%_0%,rgb(36_86_230/0.06),transparent)] dark:bg-[radial-gradient(ellipse_60%_50%_at_50%_0%,rgb(36_86_230/0.1),transparent)]"
          aria-hidden="true"
        />
        <div className="relative mx-auto max-w-6xl px-4 sm:px-6">
          <Reveal className="mx-auto max-w-2xl text-center">
            <span className="eco-eyebrow">Cara kerja</span>
            <h2 className="mt-4 font-heading text-3xl font-extrabold tracking-tight text-ink dark:text-white sm:text-4xl">
              <Typewriter lines={STEPS_TITLE} startOnView speed={42} />
            </h2>
          </Reveal>

          <Reveal delay={100} className="mt-12">
            <div className="relative overflow-hidden rounded-[2rem] border border-paper-200 bg-white shadow-soft backdrop-blur dark:border-white/15 dark:bg-[#111827]">
              <EnergyBar className="absolute inset-x-0 top-0 h-0.5 w-full rounded-none" />
              <div className="circuit-grid pointer-events-none absolute inset-0 opacity-40" aria-hidden="true" />
              <div className="relative grid gap-8 p-7 sm:p-10 md:grid-cols-3 md:gap-0">
                {STEPS.map(([title, text], i) => (
                  <div
                    key={title}
                    className={`group rounded-2xl px-4 py-6 text-center transition-all duration-300 hover:-translate-y-1 hover:bg-sirkuit-50/80 hover:shadow-lg md:px-8 dark:hover:bg-white/[0.08] ${
                      i > 0 ? 'md:border-l md:border-paper-200 dark:md:border-white/10' : ''
                    }`}
                  >
                    <span className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-sirkuit-50 font-mono text-xl font-bold text-sirkuit-600 ring-2 ring-sirkuit-200 transition-all duration-300 group-hover:scale-110 group-hover:ring-sirkuit-300 group-hover:shadow-md dark:bg-sirkuit-500/15 dark:text-sirkuit-300 dark:ring-sirkuit-500/30 dark:group-hover:ring-sirkuit-400/50">
                      {i + 1}
                    </span>
                    <h3 className="mt-4 font-heading text-lg font-bold text-ink dark:text-white">{title}</h3>
                    <p className="mt-2 text-sm leading-relaxed text-slate-500 dark:text-slate-400">{text}</p>
                  </div>
                ))}
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ============ 4. MITRA & KOLABORASI — lambat & ringkas ============ */}
      <section id="partner" className="relative flex min-h-screen flex-col items-center justify-center py-10">
        <div
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_60%_60%_at_50%_45%,rgb(36_86_230/0.08),transparent)]"
          aria-hidden="true"
        />
        <div className="relative mx-auto w-full max-w-4xl px-4 text-center sm:px-6">
          <Reveal>
            <span className="eco-eyebrow">Mitra & kolaborator</span>
            <h2 className="mt-4 font-heading text-3xl font-extrabold tracking-tight text-ink dark:text-white sm:text-4xl">
              <Typewriter lines={PARTNER_TITLE} startOnView speed={42} />
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-sm leading-relaxed text-slate-600 dark:text-slate-300 sm:text-base">
              Bersama membangun budaya hemat energi di Indonesia.
            </p>
          </Reveal>

          <Reveal delay={120} className="mt-10">
            <PartnerOrb />
          </Reveal>
        </div>
      </section>

      {/* ============ 5. TIPE PENGGUNA — kartu besar seperti Cara Kerja ============ */}
      <section className="relative bg-white py-16 sm:py-20 dark:bg-isolasi-950/60">
        <div className="relative mx-auto max-w-6xl px-4 sm:px-6">
          <Reveal className="mx-auto max-w-2xl text-center">
            <span className="eco-eyebrow">Untuk siapa?</span>
            <h2 className="mt-4 font-heading text-3xl font-extrabold tracking-tight text-ink dark:text-white sm:text-4xl">
              Satu akun, satu jenis gedung — fokus dan tepat sasaran
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-sm leading-relaxed text-slate-600 dark:text-slate-300 sm:text-base">
              Saat mendaftar, pilih jenis gedung yang Anda kelola. Semua analisis dan
              rekomendasi AI disesuaikan dengan kebutuhan jenis tersebut.
            </p>
          </Reveal>
          <div className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {REGISTER_TYPES.map((t, i) => (
              <Reveal key={t.label} delay={i * 50}>
                <div className="group flex h-full flex-col items-center gap-3 rounded-2xl border border-paper-200 bg-white/80 p-6 text-center shadow-soft transition-all duration-300 hover:-translate-y-0.5 hover:border-sirkuit-300 hover:shadow-md dark:border-white/12 dark:bg-[#111827]">
                  <span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-sirkuit-50 text-sirkuit-600 transition-transform duration-300 group-hover:scale-105 dark:bg-sirkuit-500/15 dark:text-sirkuit-300">
                    <t.icon size={20} />
                  </span>
                  <div className="min-w-0 text-center">
                    <span className="block text-sm font-bold text-slate-800 dark:text-slate-100">{t.label}</span>
                    <span className="mt-1 block text-xs leading-relaxed text-slate-500 dark:text-slate-400">{t.desc}</span>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ============ 6. CTA AKHIR ============ */}
      <section className="relative overflow-hidden bg-gradient-to-b from-white to-slate-50 py-16 sm:py-24 dark:from-isolasi-950 dark:to-[#0a0e1a]">
        <div
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_60%_70%_at_50%_50%,rgb(36_86_230/0.12),transparent)] dark:bg-[radial-gradient(ellipse_60%_70%_at_50%_50%,rgb(36_86_230/0.18),transparent)]"
          aria-hidden="true"
        />
        <div className="relative mx-auto max-w-4xl px-4 text-center sm:px-6">
          <Reveal>
            <h2 className="font-heading text-3xl font-extrabold leading-tight tracking-tight text-ink dark:text-white sm:text-5xl">
              Tagihan bulan depan bisa lebih ringan.
            </h2>
            <p className="mx-auto mt-5 max-w-xl text-base leading-relaxed text-slate-600 dark:text-slate-300">
              Mulai dari satu catatan meteran hari ini. EnergiKita yang akan
              menganalisis, memprediksi, dan menuntun Anda hemat.
            </p>
            <div className="mt-9 flex flex-wrap items-center justify-center gap-3">
              <Link to="/register" className="eco-btn !px-8 !py-3.5 !text-base">
                Daftar Gratis <ArrowRight size={18} />
              </Link>
              <Link to="/login" className="eco-btn-ghost !px-8 !py-3.5">
                Saya sudah punya akun
              </Link>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ============ 7. FOOTER (dengan kontak) ============ */}
      <footer className="border-t border-white/[0.08] bg-[#060a14] py-14 text-white">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="grid gap-10 md:grid-cols-[1.4fr_1fr_1fr_1.2fr]">
            <div className="flex flex-col items-start gap-4">
              <Link to="/" aria-label="EnergiKita" className="transition-opacity hover:opacity-90">
                <Logo dark subtitle />
              </Link>
              <p className="max-w-xs text-sm leading-relaxed text-slate-400">
                Platform digital untuk memantau pemakaian listrik, memprediksi tagihan,
                dan membangun kebiasaan hemat energi.
              </p>
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-500">Produk</p>
              <ul className="mt-4 space-y-2.5 text-sm">
                <li><a href="#fitur" className="text-slate-300 transition hover:text-white">Fitur</a></li>
                <li><a href="#cara-kerja" className="text-slate-300 transition hover:text-white">Cara kerja</a></li>
                <li><a href="#partner" className="text-slate-300 transition hover:text-white">Mitra</a></li>
              </ul>
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-500">Wawasan</p>
              <ul className="mt-4 space-y-2.5 text-sm">
                <li><Link to="/app/monitor" className="text-slate-300 transition hover:text-white">Energy Monitor</Link></li>
                <li><Link to="/app/recommendations" className="text-slate-300 transition hover:text-white">Rekomendasi</Link></li>
                <li><Link to="/app/reports" className="text-slate-300 transition hover:text-white">Laporan</Link></li>
              </ul>
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-500">Kontak</p>
              <ul className="mt-4 space-y-3 text-sm">
                <li>
                  <a href="mailto:anantamurdita9@gmail.com" className="flex items-start gap-2.5 text-slate-300 transition hover:text-white">
                    <Mail size={15} className="mt-0.5 shrink-0 text-neon-300" />
                    anantamurdita9@gmail.com
                  </a>
                </li>
                <li>
                  <a href="tel:+6289520278435" className="flex items-start gap-2.5 text-slate-300 transition hover:text-white">
                    <Phone size={15} className="mt-0.5 shrink-0 text-neon-300" />
                    0895-2027-8435
                  </a>
                </li>
                <li className="flex items-start gap-2.5 text-slate-300">
                  <MapPin size={15} className="mt-0.5 shrink-0 text-neon-300" />
                  Jl. Cokroaminoto No. 84, Pemecutan Kaja
                </li>
              </ul>
            </div>
          </div>
          <p className="mt-12 border-t border-white/[0.06] pt-6 text-center text-xs text-slate-500">
            © {new Date().getFullYear()} EnergiKita · Dibuat untuk masa depan yang lebih hemat
          </p>
        </div>
      </footer>
    </div>
  )
}
