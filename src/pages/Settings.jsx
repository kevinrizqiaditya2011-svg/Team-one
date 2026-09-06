import { useState, useRef } from 'react'
import {
  User,
  Mail,
  Save,
  KeyRound,
  Camera,
  Eye,
  EyeOff,
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import { initials, formatDate } from '../utils/format'
import { usePageTitle } from '../utils/hooks'
import PageHeader from '../components/ui/PageHeader'
import { Spinner } from '../components/ui/Loading'

export default function Settings() {
  usePageTitle('Settings')
  const { user, updateUser, changePassword } = useAuth()
  const toast = useToast()
  const fileInputRef = useRef(null)
  const [form, setForm] = useState({
    name: user?.name || '',
    photoUrl: user?.photoUrl || '',
  })
  const [saving, setSaving] = useState(false)

  const [pw, setPw] = useState({ current: '', next: '', confirm: '' })
  const [pwSaving, setPwSaving] = useState(false)

  const [pwShow, setPwShow] = useState({ current: false, next: false, confirm: false })

  const handlePhotoUpload = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 2 * 1024 * 1024) {
      toast('error', 'Ukuran foto maksimal 2MB.')
      return
    }
    const reader = new FileReader()
    reader.onload = async (ev) => {
      const dataUrl = ev.target.result
      setForm((f) => ({ ...f, photoUrl: dataUrl }))
      try {
        await updateUser({ photoUrl: dataUrl })
        toast('success', 'Foto profil berhasil diperbarui.')
      } catch {
        toast('error', 'Gagal menyimpan foto profil.')
      }
    }
    reader.readAsDataURL(file)
  }

  const handleSave = async (e) => {
    e.preventDefault()
    if (!form.name.trim()) {
      toast('error', 'Nama tidak boleh kosong.')
      return
    }
    setSaving(true)
    try {
      await updateUser({
        name: form.name.trim(),
      })
      toast('success', 'Profil berhasil diperbarui')
    } catch {
      toast('error', 'Gagal menyimpan profil.')
    } finally {
      setSaving(false)
    }
  }

  const handleChangePassword = async (e) => {
    e.preventDefault()
    if (!pw.current) {
      toast('error', 'Masukkan password lama.')
      return
    }
    if (pw.next.length < 8) {
      toast('error', 'Password baru minimal 8 karakter.')
      return
    }
    if (pw.next !== pw.confirm) {
      toast('error', 'Konfirmasi password tidak sama.')
      return
    }
    setPwSaving(true)
    try {
      await changePassword({ currentPassword: pw.current, newPassword: pw.next })
      toast('success', 'Password berhasil diganti.')
      setPw({ current: '', next: '', confirm: '' })
    } catch (err) {
      toast('error', err.message || 'Gagal mengganti password.')
    } finally {
      setPwSaving(false)
    }
  }

  const togglePwShow = (key) => setPwShow((s) => ({ ...s, [key]: !s[key] }))

  return (
    <div>
      <PageHeader title="Settings & Profil" subtitle="Kelola profil dan keamanan akun." />

      <div className="grid gap-5 lg:grid-cols-3">
        {/* Kartu profil — compact */}
        <div className="card p-6 text-center">
          <div className="relative mx-auto w-20 h-20">
            {form.photoUrl ? (
              <img
                src={form.photoUrl}
                alt="Foto profil"
                className="h-20 w-20 rounded-3xl object-cover shadow-glow-teal ring-2 ring-teal-300/40"
              />
            ) : (
              <span className="grid h-20 w-20 place-items-center rounded-3xl bg-gradient-to-br from-teal-400 to-teal-600 text-2xl font-extrabold text-white shadow-glow-teal">
                {initials(user?.name)}
              </span>
            )}
            <button
              onClick={() => fileInputRef.current?.click()}
              className="absolute -bottom-1 -right-1 grid h-7 w-7 place-items-center rounded-full bg-white text-teal-600 shadow-md ring-2 ring-slate-100 transition hover:bg-teal-50 dark:bg-isolasi-800 dark:ring-isolasi-700"
              aria-label="Ubah foto profil"
            >
              <Camera size={13} />
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handlePhotoUpload}
              className="hidden"
            />
          </div>
          <h2 className="mt-4 text-lg font-extrabold text-slate-900 dark:text-white">{user?.name}</h2>
          <p className="flex items-center justify-center gap-1.5 text-sm text-slate-500 dark:text-slate-400">
            <Mail size={13} /> {user?.email}
          </p>

          <p className="mt-3 text-[11px] text-slate-400">Bergabung sejak {formatDate(user?.createdAt)}</p>
        </div>

        <div className="space-y-5 lg:col-span-2">
          {/* Informasi profil */}
          <div className="card p-5">
            <h2 className="mb-3 text-base font-bold text-slate-900 dark:text-white">Informasi Profil</h2>
            <form onSubmit={handleSave} className="space-y-3" noValidate>
              <div>
                <label htmlFor="s-name" className="mb-1.5 flex items-center gap-1.5 text-sm font-semibold text-slate-700 dark:text-slate-300">
                  <User size={14} className="text-teal-500" /> Nama
                </label>
                <input
                  id="s-name"
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  className="input"
                  required
                />
              </div>
              <button type="submit" disabled={saving} className="btn-primary !px-6">
                {saving ? <Spinner /> : <Save size={16} />} Simpan Perubahan
              </button>
            </form>
          </div>

          {/* Ganti password — compact */}
          <div className="card p-5">
            <h2 className="mb-3 flex items-center gap-2 text-base font-bold text-slate-900 dark:text-white">
              <KeyRound size={16} className="text-teal-500" /> Ganti Password
            </h2>
            <form onSubmit={handleChangePassword} className="space-y-3" noValidate>
              <div>
                <label htmlFor="pw-current" className="mb-1.5 block text-sm font-semibold text-slate-700 dark:text-slate-300">
                  Password lama
                </label>
                <div className="relative">
                  <input
                    id="pw-current"
                    type={pwShow.current ? 'text' : 'password'}
                    value={pw.current}
                    onChange={(e) => setPw((p) => ({ ...p, current: e.target.value }))}
                    placeholder="••••••••"
                    className="input !pr-10"
                    autoComplete="current-password"
                    required
                  />
                  <button type="button" tabIndex={-1} onClick={() => togglePwShow('current')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 transition hover:text-slate-600 dark:hover:text-slate-200">
                    {pwShow.current ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label htmlFor="pw-next" className="mb-1.5 block text-sm font-semibold text-slate-700 dark:text-slate-300">
                    Password baru
                  </label>
                  <div className="relative">
                    <input
                      id="pw-next"
                      type={pwShow.next ? 'text' : 'password'}
                      value={pw.next}
                      onChange={(e) => setPw((p) => ({ ...p, next: e.target.value }))}
                      placeholder="Minimal 8 karakter"
                      className="input !pr-10"
                      autoComplete="new-password"
                      required
                    />
                    <button type="button" tabIndex={-1} onClick={() => togglePwShow('next')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 transition hover:text-slate-600 dark:hover:text-slate-200">
                      {pwShow.next ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                  </div>
                </div>
                <div>
                  <label htmlFor="pw-confirm" className="mb-1.5 block text-sm font-semibold text-slate-700 dark:text-slate-300">
                    Ulangi password baru
                  </label>
                  <div className="relative">
                    <input
                      id="pw-confirm"
                      type={pwShow.confirm ? 'text' : 'password'}
                      value={pw.confirm}
                      onChange={(e) => setPw((p) => ({ ...p, confirm: e.target.value }))}
                      placeholder="••••••••"
                      className="input !pr-10"
                      autoComplete="new-password"
                      required
                    />
                    <button type="button" tabIndex={-1} onClick={() => togglePwShow('confirm')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 transition hover:text-slate-600 dark:hover:text-slate-200">
                      {pwShow.confirm ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                  </div>
                </div>
              </div>
              <button type="submit" disabled={pwSaving} className="btn-secondary !px-6">
                {pwSaving ? <Spinner /> : <KeyRound size={15} />} Ganti Password
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}
