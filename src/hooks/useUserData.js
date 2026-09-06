import { useCallback, useEffect, useState } from 'react'
import { db } from '../services/db'
import { useAuth } from '../context/AuthContext'

// Fetch data pengguna. Untuk mempercepat halaman yang tidak butuh semua koleksi,
// lewati daftar yang diperlukan, mis. useUserData('energyRecords').
// Default: ambil energyRecords saja.
export function useUserData(needs = 'energyRecords') {
  const { user } = useAuth()
  const wanted = new Set(needs.split(/\s+/).filter(Boolean))
  const [records, setRecords] = useState([])
  const [loading, setLoading] = useState(true)
  const [version, setVersion] = useState(0)

  const refresh = useCallback(() => {
    db.invalidate(needs.split(/\s+/).filter(Boolean))
    setVersion((v) => v + 1)
  }, [needs])

  useEffect(() => {
    let cancelled = false
    if (!user) {
      setLoading(false)
      return undefined
    }
    ;(async () => {
      setLoading(true)
      const tasks = []
      if (wanted.has('energyRecords')) tasks.push(db.get('energyRecords').then((d) => ['records', d]))
      try {
        const results = await Promise.all(tasks)
        if (cancelled) return
        for (const [key, list] of results) {
          const mine = list.filter((x) => x.userId === user.id)
          if (key === 'records') setRecords(mine)
        }
      } catch {
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [user, version, needs])

  return { records, loading, refresh }
}
