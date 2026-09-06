import { useLayoutEffect, useRef, useState } from 'react'

/**
 * Scroll-reveal SATU ARAH — elemen muncul (fade + slide halus) saat pertama kali
 * masuk viewport, lalu TETAP tampil selamanya (tidak menghilang lagi saat keluar
 * layar, agar teks yang sudah selesai diketik tidak terasa "diam"/hilang saat scroll).
 * Elemen yang sudah berada di viewport saat halaman dimuat langsung ditampilkan
 * tanpa blink. Hormati prefers-reduced-motion: langsung tampil penuh.
 */
export default function Reveal({ children, delay = 0, className = '' }) {
  const ref = useRef(null)
  const [visible, setVisible] = useState(false)

  // useLayoutEffect: set visible sebelum paint — menghindari kedipan opacity-0 saat load.
  useLayoutEffect(() => {
    const el = ref.current
    if (!el) return undefined
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setVisible(true)
      return undefined
    }
    // Elemen yang sudah di layar (atau di atas layar saat reload di tengah halaman)
    // langsung ditampilkan tanpa blink. Sisanya muncul sekali saat masuk viewport.
    const rect = el.getBoundingClientRect()
    if (rect.top < window.innerHeight) {
      setVisible(true)
      return undefined
    }
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true)
          obs.disconnect() // satu arah — setelah muncul, jangan disembunyikan lagi
        }
      },
      { threshold: 0.12, rootMargin: '0px 0px -6% 0px' },
    )
    obs.observe(el)
    return () => obs.disconnect()
  }, [])

  return (
    <div
      ref={ref}
      style={{ transitionDelay: `${delay}ms` }}
      className={`${className} transition-all duration-700 ease-out ${
        visible ? 'translate-y-0 opacity-100' : 'translate-y-7 opacity-0'
      }`}
    >
      {children}
    </div>
  )
}
