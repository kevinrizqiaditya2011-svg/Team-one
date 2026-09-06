import { useEffect, useState } from 'react'
import { NavLink, Link, Outlet, useNavigate, useLocation } from 'react-router-dom'
import {
  LayoutDashboard,
  Activity,
  Lightbulb,
  Footprints,
  Building2,
  FileText,
  Settings as SettingsIcon,
  Menu,
  X,
  LogOut,
  Sun,
  Moon,
  ChevronRight,
  Home,
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useTheme } from '../context/ThemeContext'
import { useToast } from '../context/ToastContext'
import { initials } from '../utils/format'
import Logo from '../components/ui/Logo'

// Sidebar: section berlabel — 1 klik = 1 tujuan jelas.
const NAV_GROUPS = [
  {
    label: 'Navigasi',
    items: [{ to: '/', label: 'Beranda', icon: Home }],
  },
  {
    label: 'Ringkasan',
    items: [{ to: '/app', label: 'Dashboard', icon: LayoutDashboard, end: true }],
  },
  {
    label: 'Lokasi',
    items: [{ to: '/app/buildings', label: 'Gedung', icon: Building2 }],
  },
  {
    label: 'Analisis',
    items: [
      { to: '/app/monitor', label: 'Energy Monitor', icon: Activity },
      { to: '/app/recommendations', label: 'Rekomendasi AI', icon: Lightbulb },
    ],
  },
  {
    label: 'Lainnya',
    items: [
      { to: '/app/carbon', label: 'Kalkulator Karbon', icon: Footprints },
      { to: '/app/reports', label: 'Reports', icon: FileText },
      { to: '/app/settings', label: 'Settings', icon: SettingsIcon },
    ],
  },
]

const FLAT_NAV = NAV_GROUPS.flatMap((g) => g.items.map((item) => ({ ...item, group: g.label })))

function Breadcrumb() {
  const { pathname } = useLocation()
  const current = FLAT_NAV.find((n) => (n.end ? pathname === n.to : pathname.startsWith(n.to)))
  if (!current) return null
  return (
    <nav aria-label="Breadcrumb" className="mb-4 flex items-center gap-1.5 text-xs text-slate-400 dark:text-slate-500">
      <span>{current.group}</span>
      <ChevronRight size={12} />
      <span className="font-semibold text-slate-600 dark:text-slate-200">{current.label}</span>
    </nav>
  )
}

function ThemeButton({ className = '' }) {
  const { theme, toggle } = useTheme()
  return (
    <button
      onClick={toggle}
      aria-label={theme === 'dark' ? 'Mode terang' : 'Mode gelap'}
      className={`inline-flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 transition hover:bg-slate-50 dark:border-white/15 dark:bg-white/[0.06] dark:text-slate-200 dark:hover:bg-white/10 ${className}`}
    >
      {theme === 'dark' ? <Sun size={17} /> : <Moon size={17} />}
    </button>
  )
}

function SidebarContent({ onNavigate }) {
  const { user, logout } = useAuth()
  const toast = useToast()
  const navigate = useNavigate()

  const handleLogout = async () => {
    await logout()
    toast('error', 'Kamu berhasil keluar. Sampai jumpa!')
    navigate('/')
  }

  return (
    <div className="flex h-full flex-col border-r border-white/[0.06] bg-isolasi-950 text-slate-300">
      <div className="flex items-center justify-between px-5 pb-2 pt-5">
        <Link to="/app" aria-label="EnergiKita" className="transition-opacity hover:opacity-90">
          <Logo dark />
        </Link>
        {onNavigate && (
          <button
            onClick={onNavigate}
            aria-label="Tutup menu"
            className="rounded-lg p-1.5 text-slate-400 transition hover:bg-white/10 lg:hidden"
          >
            <X size={18} />
          </button>
        )}
      </div>

      <nav className="mt-3 flex-1 overflow-y-auto px-3 pb-4">
        {NAV_GROUPS.map((group) => (
          <div key={group.label} className="mb-4">
            <p className="mb-1 px-3 text-[10px] font-bold uppercase tracking-[0.16em] text-slate-500">
              {group.label}
            </p>
            <div className="space-y-0.5">
              {group.items.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.end}
                  onClick={onNavigate}
                  className={({ isActive }) =>
                    `group flex items-center gap-3 rounded-full px-3 py-2 text-sm font-medium transition-all ${
                      isActive
                        ? 'bg-sirkuit-500/15 text-white shadow-[inset_0_0_0_1px_rgb(36_86_230/0.45)]'
                        : 'text-slate-400 hover:bg-white/5 hover:text-slate-100'
                    }`
                  }
                >
                  {({ isActive }) => (
                    <>
                      <item.icon
                        size={18}
                        className={isActive ? 'text-sirkuit-300' : 'text-slate-500 group-hover:text-slate-300'}
                      />
                      <span className="flex-1">{item.label}</span>
                      {isActive && <span className="h-1.5 w-1.5 rounded-full bg-sirkuit-300" />}
                    </>
                  )}
                </NavLink>
              ))}
            </div>
          </div>
        ))}
      </nav>

      <div className="border-t border-white/10 p-4">
        <div className="flex items-center gap-3">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-gradient-to-br from-sirkuit-600 to-neon-500 text-sm font-bold text-white shadow-glow">
            {initials(user?.name)}
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-white">{user?.name}</p>
            <p className="truncate text-xs text-slate-400">{user?.email}</p>
          </div>
          <button
            onClick={handleLogout}
            aria-label="Keluar"
            title="Keluar"
            className="rounded-full p-2 text-slate-400 transition hover:bg-rose-500/15 hover:text-rose-400"
          >
            <LogOut size={16} />
          </button>
        </div>
      </div>
    </div>
  )
}

export default function AppLayout() {
  const { user } = useAuth()
  const { pathname } = useLocation()
  const [drawerOpen, setDrawerOpen] = useState(false)

  useEffect(() => {
    if (!drawerOpen) return undefined
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = ''
    }
  }, [drawerOpen])

  return (
    <div className="min-h-screen bg-paper-50 dark:bg-isolasi-950 dark:[background-image:radial-gradient(55rem_24rem_at_50%_-7rem,rgba(36,86,230,0.08),transparent)]">
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 lg:block">
        <SidebarContent />
      </aside>

      {drawerOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="absolute inset-0 bg-isolasi-950/50"
            onClick={() => setDrawerOpen(false)}
            aria-hidden="true"
          />
          <div className="animate-fade-in absolute inset-y-0 left-0 w-72">
            <SidebarContent onNavigate={() => setDrawerOpen(false)} />
          </div>
        </div>
      )}

      <div className="flex min-h-screen flex-col lg:pl-64">
        <header className="glass sticky top-0 z-30 flex items-center gap-3 border-b border-paper-200 px-4 py-3 dark:border-white/10 sm:px-6">
          <button
            onClick={() => setDrawerOpen(true)}
            aria-label="Buka menu"
            className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 transition hover:bg-slate-50 dark:border-white/15 dark:bg-white/[0.06] dark:text-slate-200 lg:hidden"
          >
            <Menu size={18} />
          </button>
          <div className="min-w-0 flex-1 lg:hidden">
            <Link to="/app" aria-label="EnergiKita" className="inline-flex rounded-full bg-isolasi-950 px-3 py-1.5 shadow-glow transition-opacity hover:opacity-90">
              <Logo dark />
            </Link>
          </div>
          <div className="hidden flex-1 lg:block" />
          <ThemeButton />
          <Link
            to="/app/settings"
            className="hidden h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-sirkuit-600 to-neon-500 text-sm font-bold text-white shadow-glow transition hover:opacity-90 sm:inline-flex"
            aria-label="Buka profil"
          >
            {initials(user?.name)}
          </Link>
        </header>

        <main className="flex-1 px-4 pb-12 pt-6 sm:px-6 lg:pb-10 lg:pt-8">
          <div key={pathname} className="animate-fade-up mx-auto max-w-6xl">
            <Breadcrumb />
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  )
}
