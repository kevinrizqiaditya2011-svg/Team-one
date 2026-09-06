import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { useAuth } from './AuthContext'
import { db } from '../services/db'
import { storage } from '../services/storage'

const SELECTED_KEY = 'selectedPlace'

const PlaceContext = createContext(null)

export function PlaceProvider({ children }) {
  const { user } = useAuth()
  const [places, setPlaces] = useState([])
  const [selectedPlaceId, setSelectedPlaceId] = useState(() => storage.get(SELECTED_KEY, null))

  const load = useCallback(async () => {
    if (!user) {
      setPlaces([])
      return []
    }
    const list = await db.get('places').catch(() => [])
    setPlaces(list)
    return list
  }, [user])

  useEffect(() => {
    load()
  }, [load])

  // Pastikan pilihan tetap valid saat daftar gedung berubah — auto pilih gedung pertama
  useEffect(() => {
    setSelectedPlaceId((prev) => {
      if (prev === 'all') return 'all'
      const valid = prev && places.some((p) => String(p.id) === String(prev))
      return valid ? prev : places.length ? String(places[0].id) : null
    })
  }, [places])

  const selectPlace = useCallback((id) => {
    const next = String(id)
    setSelectedPlaceId(next)
    storage.set(SELECTED_KEY, next)
  }, [])

  const value = useMemo(
    () => ({
      places,
      selectedPlaceId,
      selectPlace,
      refreshPlaces: load,
      placeById: (id) => places.find((p) => String(p.id) === String(id)) || null,
    }),
    [places, selectedPlaceId, selectPlace, load],
  )

  return <PlaceContext.Provider value={value}>{children}</PlaceContext.Provider>
}

export const usePlaces = () => useContext(PlaceContext)

/**
 * Filter records sesuai gedung terpilih — dasar "analisis per gedung".
 * 'all' mengembalikan seluruh catatan (tampilan gabungan).
 * Terima records dari useUserData milik halaman agar tidak fetch ganda.
 */
export function usePlaceRecords(records) {
  const { selectedPlaceId } = usePlaces()

  return useMemo(() => {
    if (!selectedPlaceId || selectedPlaceId === 'all') return records
    return records.filter((r) => String(r.placeId) === String(selectedPlaceId))
  }, [records, selectedPlaceId])
}

/**
 * Ambil semua ruangan unik dari gedung terpilih (atau semua gedung jika 'all').
 */
export function usePlaceRooms() {
  const { places, selectedPlaceId } = usePlaces()

  return useMemo(() => {
    const target = selectedPlaceId === 'all'
      ? places
      : places.filter((p) => String(p.id) === String(selectedPlaceId))
    const rooms = new Set()
    target.forEach((p) => {
      if (p.rooms) {
        p.rooms.split(',').map((r) => r.trim()).filter(Boolean).forEach((r) => rooms.add(r))
      }
    })
    return [...rooms]
  }, [places, selectedPlaceId])
}
