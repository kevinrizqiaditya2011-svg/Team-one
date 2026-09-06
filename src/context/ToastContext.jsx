import { createContext, useCallback, useContext, useState } from 'react'
import { CheckCircle2, AlertTriangle, Info, X } from 'lucide-react'

const ToastContext = createContext(null)
let idSeq = 0

const STYLES = {
  success: {
    bar: 'bg-konduktor-500',
    icon: <CheckCircle2 size={18} className="shrink-0 text-konduktor-500" />,
  },
  error: {
    bar: 'bg-rose-500',
    icon: <AlertTriangle size={18} className="shrink-0 text-rose-500" />,
  },
  info: {
    bar: 'bg-sirkuit-500',
    icon: <Info size={18} className="shrink-0 text-sirkuit-500" />,
  },
}

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])

  const dismiss = useCallback((id) => {
    setToasts((t) => t.filter((x) => x.id !== id))
  }, [])

  const toast = useCallback(
    (type = 'success', message) => {
      const id = ++idSeq
      setToasts((t) => [...t, { id, type, message }])
      setTimeout(() => dismiss(id), 4200)
    },
    [dismiss],
  )

  return (
    <ToastContext.Provider value={toast}>
      {children}
      <div
        aria-live="polite"
        className="pointer-events-none fixed right-4 top-4 z-[100] flex w-[calc(100vw-2rem)] max-w-sm flex-col gap-2"
      >
        {toasts.map((t) => {
          const s = STYLES[t.type] || STYLES.info
          return (
            <div
              key={t.id}
              role="status"
              className="animate-toast-in pointer-events-auto relative flex items-start gap-3 overflow-hidden rounded-xl border border-slate-200 bg-white/95 p-3.5 shadow-lg backdrop-blur dark:border-slate-700 dark:bg-slate-800/95"
            >
              <span className={`absolute left-0 top-0 h-full w-1 ${s.bar}`} />
              {s.icon}
              <p className="flex-1 text-sm font-medium leading-snug text-slate-700 dark:text-slate-200">
                {t.message}
              </p>
              <button
                onClick={() => dismiss(t.id)}
                aria-label="Tutup notifikasi"
                className="rounded-lg p-1 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-700"
              >
                <X size={15} />
              </button>
            </div>
          )
        })}
      </div>
    </ToastContext.Provider>
  )
}

export const useToast = () => useContext(ToastContext)
