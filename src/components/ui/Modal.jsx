import { useEffect } from 'react'
import { X } from 'lucide-react'

export default function Modal({ open, onClose, title, children, maxWidth = 'max-w-md' }) {
  useEffect(() => {
    if (!open) return undefined
    const onKey = (e) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [open, onClose])

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-[90] flex items-center justify-center overflow-y-auto bg-isolasi-950/50 p-4 backdrop-blur-sm"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={title}
    >
      <div
        className={`animate-fade-up m-auto max-h-[90vh] w-full overflow-y-auto ${maxWidth} rounded-[1.4rem] border border-slate-200 bg-white p-6 shadow-2xl dark:border-white/10 dark:bg-isolasi-800`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <h3 className="font-heading text-lg font-bold text-slate-900 dark:text-white">{title}</h3>
          <button
            onClick={onClose}
            aria-label="Tutup"
            className="rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-white/10"
          >
            <X size={18} />
          </button>
        </div>
        {children}
      </div>
    </div>
  )
}
