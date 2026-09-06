import { useEffect, useRef, useState } from 'react'

/**
 * Typewriter — judul/section diketik per karakter (tanpa kursor).
 * - `lines`: array baris; tiap baris diketik berurutan, baris berikutnya
 *   mulai otomatis setelah sebelumnya selesai.
 * - `startOnView`: mulai mengetik saat elemen masuk viewport (default true).
 * - Jeda alami saat spasi (spacePause), `speed` ms/karakter.
 * - `onComplete` dipanggil setelah seluruh baris selesai.
 * - prefers-reduced-motion: seluruh teks langsung tampil.
 */
export default function Typewriter({
  lines = [],
  className = '',
  lineClassName = '',
  speed = 46,
  spacePause = 130,
  lineGap = 380,
  startOnView = true,
  startDelay = 0,
  onComplete,
}) {
  const rootRef = useRef(null)
  const [started, setStarted] = useState(!startOnView)
  const [li, setLi] = useState(0) // baris yang sedang/selesai diketik
  const [ci, setCi] = useState(0) // jumlah karakter tampil di baris aktif
  const [reduced, setReduced] = useState(false)
  const doneRef = useRef(false)

  useEffect(() => {
    if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) return undefined
    setReduced(true)
    setStarted(true)
    return undefined
  }, [])

  useEffect(() => {
    if (!startOnView || reduced) return undefined
    const el = rootRef.current
    if (!el) return undefined
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setStarted(true)
          obs.disconnect()
        }
      },
      { threshold: 0.4 },
    )
    obs.observe(el)
    return () => obs.disconnect()
  }, [startOnView, reduced])

  // Loop pengetikan
  useEffect(() => {
    if (!started || reduced) return undefined
    if (li >= lines.length) {
      if (!doneRef.current) {
        doneRef.current = true
        onComplete?.()
      }
      return undefined
    }
    const text = lines[li] || ''
    let t
    if (li === 0 && ci === 0 && startDelay > 0) {
      t = setTimeout(() => setCi(1), startDelay)
    } else if (ci < text.length) {
      const delay = text[ci] === ' ' ? spacePause : speed
      t = setTimeout(() => setCi((c) => c + 1), delay)
    } else {
      // Baris selesai → jeda, lalu lanjut baris berikutnya
      t = setTimeout(() => {
        setLi((l) => l + 1)
        setCi(0)
      }, lineGap)
    }
    return () => clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [started, reduced, li, ci, lines, speed, spacePause, lineGap, startDelay, onComplete])

  return (
    <span
      ref={rootRef}
      className={className}
      aria-label={lines.join(' ')}
      role="text"
    >
      <span aria-hidden="true">
        {lines.map((line, i) => {
          const done = reduced || li > i
          const active = !reduced && li === i
          return (
            <span key={i} className={`relative block ${lineClassName}`}>
              {/* Teks penuh tersembunyi — menahan tinggi/lebar baris sehingga
                  posisi & ukuran heading TIDAK berubah selama pengetikan. */}
              <span className="invisible">{line || '\u00A0'}</span>
              {done && <span className="absolute inset-0">{line}</span>}
              {active && <span className="absolute inset-0">{line.slice(0, ci)}</span>}
            </span>
          )
        })}
      </span>
    </span>
  )
}
