import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Eye, EyeOff } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { useToast } from '../../context/ToastContext'
import { Spinner } from '../../components/ui/Loading'
import AuthShell from './AuthShell'

function PasswordInput({ id, value, onChange, placeholder, label }) {
  const [show, setShow] = useState(false)
  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-sm font-semibold text-slate-700 dark:text-slate-300">
        {label}
      </label>
      <div className="relative">
        <input
          id={id}
          type={show ? 'text' : 'password'}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          className="input !pr-10"
          autoComplete="new-password"
          required
        />
        <button
          type="button"
          tabIndex={-1}
          onClick={() => setShow((s) => !s)}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 transition hover:text-slate-600 dark:hover:text-slate-200"
          aria-label={show ? 'Sembunyikan password' : 'Tampilkan password'}
        >
          {show ? <EyeOff size={16} /> : <Eye size={16} />}
        </button>
      </div>
    </div>
  )
}

export default function Register() {
  const { register } = useAuth()
  const toast = useToast()
  const navigate = useNavigate()
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  })
  const [loading, setLoading] = useState(false)

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.name || !form.email || !form.password) {
      toast('error', 'Semua kolom wajib diisi.')
      return
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
      toast('error', 'Format email tidak valid.')
      return
    }
    if (form.password.length < 8) {
      toast('error', 'Password minimal 8 karakter.')
      return
    }
    if (form.password !== form.confirmPassword) {
      toast('error', 'Konfirmasi password tidak sama.')
      return
    }
    setLoading(true)
    try {
      const payload = { ...form }
      delete payload.confirmPassword
      await register(payload)
      toast('success', 'Akun berhasil dibuat. Selamat datang!')
      navigate('/app')
    } catch (err) {
      toast('error', err.message || 'Gagal mendaftar. Coba lagi.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthShell title="Buat akun baru" subtitle="Gratis. Mulai pantau energi hari ini.">
      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        <div>
          <label htmlFor="name" className="mb-1.5 block text-sm font-semibold text-slate-700 dark:text-slate-300">
            Nama lengkap
          </label>
          <input
            id="name"
            value={form.name}
            onChange={set('name')}
            placeholder="cth: Andi Pratama"
            className="input"
            autoComplete="name"
            required
          />
        </div>
        <div>
          <label htmlFor="reg-email" className="mb-1.5 block text-sm font-semibold text-slate-700 dark:text-slate-300">
            Email
          </label>
          <input
            id="reg-email"
            type="email"
            value={form.email}
            onChange={set('email')}
            placeholder="nama@email.com"
            className="input"
            autoComplete="email"
            required
          />
        </div>
        <PasswordInput
          id="reg-password"
          value={form.password}
          onChange={set('password')}
          placeholder="Minimal 8 karakter"
          label="Password"
        />
        <PasswordInput
          id="reg-confirm-password"
          value={form.confirmPassword}
          onChange={set('confirmPassword')}
          placeholder="Ulangi password"
          label="Konfirmasi Password"
        />

        <button type="submit" disabled={loading} className="eco-btn w-full !py-3.5">
          {loading ? <Spinner /> : 'Daftar Sekarang'}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-slate-500 dark:text-slate-400">
        Sudah punya akun?{' '}
        <Link to="/login" className="font-bold text-sirkuit-600 hover:underline dark:text-sirkuit-300">
          Masuk
        </Link>
      </p>
    </AuthShell>
  )
}
