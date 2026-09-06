import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Eye, EyeOff } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { useToast } from '../../context/ToastContext'
import { Spinner } from '../../components/ui/Loading'
import AuthShell from './AuthShell'

export default function Login() {
  const { login } = useAuth()
  const toast = useToast()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    const trimmed = email.trim()
    if (!trimmed || !password) {
      toast('error', 'Email dan password wajib diisi.')
      return
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      toast('error', 'Format email tidak valid.')
      return
    }
    setLoading(true)
    try {
      await login(trimmed, password)
      toast('success', 'Selamat datang kembali!')
      navigate('/app')
    } catch (err) {
      toast('error', err.message || 'Gagal masuk. Coba lagi.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthShell title="Masuk">
      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        <div>
          <label htmlFor="email" className="mb-1.5 block text-sm font-semibold text-slate-700 dark:text-slate-300">
            Email
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="nama@email.com"
            className="input"
            autoComplete="email"
            required
          />
        </div>
        <div>
          <div className="mb-1.5 flex items-center justify-between">
            <label htmlFor="password" className="block text-sm font-semibold text-slate-700 dark:text-slate-300">
              Password
            </label>
            <Link to="/forgot-password" className="text-xs font-semibold text-sirkuit-600 transition hover:text-sirkuit-700 dark:text-sirkuit-300">
              Lupa password?
            </Link>
          </div>
          <div className="relative">
            <input
              id="password"
              type={showPw ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="input !pr-10"
              autoComplete="current-password"
              required
            />
            <button
              type="button"
              tabIndex={-1}
              onClick={() => setShowPw((s) => !s)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 transition hover:text-slate-600 dark:hover:text-slate-200"
              aria-label={showPw ? 'Sembunyikan password' : 'Tampilkan password'}
            >
              {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
        </div>
        <button type="submit" disabled={loading} className="eco-btn w-full !py-3.5">
          {loading ? <Spinner /> : 'Masuk'}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-slate-500 dark:text-slate-400">
        Belum punya akun?{' '}
        <Link to="/register" className="font-bold text-sirkuit-600 hover:underline dark:text-sirkuit-300">
          Daftar gratis
        </Link>
      </p>
    </AuthShell>
  )
}
