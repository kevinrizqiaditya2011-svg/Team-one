import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { useToast } from '../../context/ToastContext'
import { Spinner } from '../../components/ui/Loading'
import AuthShell from './AuthShell'

export default function ForgotPassword() {
  const { resetPassword } = useAuth()
  const toast = useToast()
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!email) {
      toast('error', 'Masukkan email terdaftar.')
      return
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      toast('error', 'Format email tidak valid.')
      return
    }
    setLoading(true)
    try {
      await resetPassword(email.trim())
      setSent(true)
    } catch (err) {
      toast('error', err.message || 'Email tidak terdaftar.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthShell title="Atur ulang password" subtitle="Kami akan mengirimkan instruksi ke emailmu.">
      {sent ? (
        <div className="flex flex-col items-center rounded-[1.4rem] border border-konduktor-200 bg-konduktor-50 p-6 text-center dark:border-konduktor-500/30 dark:bg-konduktor-500/10">
          <h2 className="font-heading text-lg font-bold text-slate-900 dark:text-white">Cek email kamu</h2>
          <p className="mt-1.5 text-sm text-slate-500 dark:text-slate-400">
            {email ? `Instruksi pemulihan telah dikirim ke ${email}.` : 'Instruksi pemulihan telah dikirim ke emailmu.'}
          </p>
          <Link to="/login" className="eco-btn mt-5 w-full">
            Kembali ke Login
          </Link>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          <div>
            <label htmlFor="fp-email" className="mb-1.5 block text-sm font-semibold text-slate-700 dark:text-slate-300">
              Email terdaftar
            </label>
            <input
              id="fp-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="nama@email.com"
              className="input"
              autoComplete="email"
              required
            />
          </div>
          <button type="submit" disabled={loading} className="eco-btn w-full !py-3.5">
            {loading ? <Spinner /> : 'Kirim Instruksi'}
          </button>
          <p className="text-center text-xs text-slate-400">
            Mode demo: tidak ada email yang dikirim — cukup kembali ke halaman login.
          </p>
        </form>
      )}
    </AuthShell>
  )
}
