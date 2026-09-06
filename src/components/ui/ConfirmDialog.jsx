import { useEffect } from 'react'
import { AlertTriangle, CheckCircle2 } from 'lucide-react'
import Modal from './Modal'
import { Spinner } from './Loading'

/**
 * Dialog konfirmasi yang rapi — pengganti window.confirm().
 * tone: 'danger' (merah, untuk hapus) | 'primary' (sirkuit, untuk aksi utama).
 * Enter = konfirmasi, Escape = batal (otomatis dari Modal).
 */
export default function ConfirmDialog({
  open,
  onClose,
  title,
  description,
  confirmLabel = 'Ya, Lanjutkan',
  cancelLabel = 'Batal',
  tone = 'danger',
  loading = false,
  onConfirm,
}) {
  // Enter menegaskan, kecuali sedang memproses (loading). Dilewati bila targetnya
  // elemen interaktif (tombol fokus) supaya tidak dobel-submit dengan klik native.
  useEffect(() => {
    if (!open) return undefined
    const onKey = (e) => {
      if (e.key !== 'Enter' || e.repeat || loading) return
      const t = e.target
      if (t instanceof HTMLElement && ['BUTTON', 'INPUT', 'TEXTAREA', 'SELECT'].includes(t.tagName)) return
      onConfirm()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open, loading, onConfirm])

  const danger = tone === 'danger'

  return (
    <Modal open={open} onClose={loading ? () => {} : onClose} title={title} maxWidth="max-w-sm">
      <div className="flex items-start gap-3.5">
        <span
          className={`grid h-11 w-11 shrink-0 place-items-center rounded-full transition-transform ${
            danger
              ? 'bg-rose-50 text-rose-500 dark:bg-rose-500/15 dark:text-rose-400'
              : 'bg-sirkuit-100 text-sirkuit-600 dark:bg-sirkuit-500/15 dark:text-sirkuit-300'
          }`}
        >
          {danger ? <AlertTriangle size={20} /> : <CheckCircle2 size={20} />}
        </span>
        <p className="flex-1 pt-1 text-sm leading-relaxed text-slate-600 dark:text-slate-300">{description}</p>
      </div>

      <div className="mt-6 flex gap-2.5">
        <button type="button" onClick={onClose} disabled={loading} className="btn-secondary flex-1">
          {cancelLabel}
        </button>
        <button
          type="button"
          onClick={onConfirm}
          disabled={loading}
          className={`flex-1 rounded-full px-4 py-2.5 text-sm font-bold text-white transition-all duration-200 focus:outline-none focus:ring-4 disabled:cursor-not-allowed disabled:opacity-60 ${
            danger
              ? 'bg-rose-500 shadow-sm shadow-rose-500/30 hover:-translate-y-0.5 hover:bg-rose-600 focus:ring-rose-400/30'
              : 'bg-sirkuit-600 shadow-sm shadow-sirkuit-600/30 hover:-translate-y-0.5 hover:bg-sirkuit-700 focus:ring-sirkuit-400/30'
          }`}
        >
          {loading ? <Spinner /> : confirmLabel}
        </button>
      </div>
    </Modal>
  )
}
