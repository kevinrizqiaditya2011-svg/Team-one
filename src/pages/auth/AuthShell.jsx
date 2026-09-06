import { Link } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import Logo from '../../components/ui/Logo'
import EnergyBar from '../../components/ui/EnergyBar'

export default function AuthShell({ title, subtitle, children, backTo = '/' }) {
  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-paper-50 px-4 py-10 dark:bg-isolasi-950">
      <div className="circuit-grid pointer-events-none absolute inset-0 opacity-60 dark:opacity-30" aria-hidden="true" />
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_70%_60%_at_50%_-10%,rgb(36_86_230/0.12),transparent)] dark:bg-[radial-gradient(ellipse_70%_60%_at_50%_0%,rgb(36_86_230/0.14),transparent)]"
        aria-hidden="true"
      />

      <div className="relative grid w-full max-w-4xl items-stretch overflow-hidden rounded-[2rem] border border-paper-200 bg-white shadow-soft dark:border-white/10 dark:bg-white/[0.04] dark:shadow-eco-card dark:backdrop-blur-2xl lg:grid-cols-2">
        {/* Panel kiri — branding, ilustrasi & tagline dengan background pattern */}
        <div className="relative hidden flex-col items-center justify-center overflow-hidden p-10 text-center lg:flex">
          {/* Background gradient */}
          <div className="absolute inset-0 bg-gradient-to-br from-sirkuit-600 via-sirkuit-700 to-isolasi-900" />
          {/* Circuit grid pattern overlay */}
          <div className="circuit-grid absolute inset-0 opacity-30" />
          {/* Floating orbs dekoratif */}
          <div className="pointer-events-none absolute -left-20 -top-20 h-64 w-64 rounded-full bg-neon-400/15 blur-3xl" aria-hidden="true" />
          <div className="pointer-events-none absolute -bottom-20 -right-20 h-64 w-64 rounded-full bg-sirkuit-400/20 blur-3xl" aria-hidden="true" />
          <div className="pointer-events-none absolute left-1/2 top-1/3 h-40 w-40 -translate-x-1/2 -translate-y-1/2 rounded-full bg-konduktor-400/10 blur-2xl" aria-hidden="true" />
          <EnergyBar className="absolute inset-x-0 top-0 h-1 w-full rounded-none" />
          <Link to="/" className="relative inline-block">
            <Logo subtitle size="xl" stacked dark />
          </Link>

        </div>

        {/* Panel form */}
        <div className="bg-white/90 p-8 backdrop-blur-xl dark:bg-transparent sm:p-10">
          <Link
            to={backTo}
            className="mb-6 inline-flex items-center gap-1.5 text-xs font-semibold text-slate-400 transition hover:text-sirkuit-600 dark:hover:text-sirkuit-300"
          >
            <ArrowLeft size={14} /> Kembali
          </Link>
          <div className="lg:hidden">
            <span className="inline-flex rounded-full bg-sirkuit-600 px-5 py-3 shadow-glow">
              <Logo dark subtitle size="xl" />
            </span>
          </div>
          <h1 className="font-heading mt-2 text-2xl font-extrabold tracking-tight text-ink dark:text-white lg:mt-0">
            {title}
          </h1>
          {subtitle && <p className="mt-1.5 text-sm text-slate-500 dark:text-slate-400">{subtitle}</p>}
          <div className="mt-7">{children}</div>
        </div>
      </div>
    </div>
  )
}
