import { storage } from './storage'

// Base URL API. Di dev memakai '/api' relatif atau URL API absolut
const API_URL = (import.meta.env.VITE_API_URL || '/api').replace(/\/+$/, '')

const SESSION_KEY = 'session'

// Id user yang login (dari session) — dipakai sebagai userId di data hasil mapping.
// Tetap bertipe number agar cocok dengan user.id hasil toAppUser (dibandingkan dengan ===).
function currentUserId() {
  const session = storage.get(SESSION_KEY, null)
  return session && session.id != null ? session.id : null
}

// ——— Cache in-memory per koleksi (per user) ———
// Tanpa cache, setiap pindah halaman memicu beberapa request ke server PHP yang
// single-threaded (diproses satu per satu) sehingga dashboard terasa lambat.
// TTL pendek: data segar cukup, dan semua mutasi lewat apiData otomatis
// membatalkan cache koleksi terkait.
const CACHE_TTL = 30_000 // 30 detik
const _cache = new Map() // 'koleksi:userId' -> { data, expires }

function cacheKey(name) {
  return `${name}:${currentUserId() ?? 'anon'}`
}

function cacheGet(name) {
  const entry = _cache.get(cacheKey(name))
  if (!entry) return undefined
  if (Date.now() > entry.expires) {
    _cache.delete(cacheKey(name))
    return undefined
  }
  return entry.data
}

function cacheSet(name, data) {
  _cache.set(cacheKey(name), { data, expires: Date.now() + CACHE_TTL })
}

function cacheClear(name) {
  if (name) _cache.delete(cacheKey(name))
  else _cache.clear()
}

// '2026-08-02 21:52:24' (dari MySQL) -> ISO string yang aman untuk new Date()
function toISO(dt) {
  if (!dt) return null
  return new Date(String(dt).replace(' ', 'T')).toISOString()
}

async function request(path, options = {}) {
  let res
  try {
    res = await fetch(`${API_URL}/${path}`, {
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      ...options,
    })
  } catch {
    const err = new Error(`Tidak dapat terhubung ke server (${API_URL}). Pastikan backend Laravel berjalan.`)
    err.status = 0
    throw err
  }

  let data = null
  try {
    data = await res.json()
  } catch {
  }

  if (!res.ok || (data && data.success === false)) {
    const err = new Error(data?.message || 'Terjadi kesalahan pada server.')
    err.status = res.status
    throw err
  }
  return data
}

// ——— Mapping snake_case (MySQL) -> camelCase (shape frontend) ———

function mapRecord(r) {
  return {
    id: String(r.id),
    userId: currentUserId(),
    placeId: r.place_id != null ? String(r.place_id) : null,
    placeName: r.place_name || null,
    date: r.record_date,
    kwh: Number(r.kwh),
    cost: Number(r.cost),
    locationType: r.location_type,
    room: r.room || '',
    estimatedCO2: Number(r.estimated_co2),
  }
}

function mapPlace(p) {
  return {
    id: String(p.id),
    userId: p.user_id,
    name: p.name,
    photo: p.photo || '',
    locationType: p.location_type,
    rooms: p.rooms || '',
    energyTarget: Number(p.energy_target),
    recordCount: Number(p.record_count || 0),
    totalKwh: Number(p.total_kwh || 0),
    createdAt: toISO(p.created_at) || new Date().toISOString(),
  }
}

function mapUser(u) {
  if (!u) return null
  return {
    id: u.id,
    uid: String(u.id),
    name: u.name,
    email: u.email,
    role: u.role,
    userType: u.user_type ?? u.userType ?? 'Rumah',
    energyTarget: Number(u.energy_target ?? u.energyTarget ?? 300),
    points: Number(u.points ?? 0),
    level: Number(u.level ?? 1),
    createdAt: toISO(u.created_at) || new Date().toISOString(),
  }
}

/**
 * Implementasi antarmuka `db` yang dibackend oleh API Laravel.
 * Dipakai otomatis oleh db.js ketika Firebase TIDAK dikonfigurasi
 * (semua data tersimpan permanen di MySQL).
 */
export const apiData = {
  async _fetch(name) {
    switch (name) {
      case 'energyRecords': {
        const d = await request('records')
        return (d.records || []).map(mapRecord)
      }
      case 'places': {
        const d = await request('places')
        return (d.places || []).map(mapPlace)
      }
      case 'users': {
        try {
          const d = await request('me')
          return d.user ? [mapUser(d.user)] : []
        } catch (e) {
          if (e.status === 401) return []
          throw e
        }
      }
      case 'savedTips': {
        const key = 'savedTips:' + (currentUserId() || 'anon')
        return JSON.parse(localStorage.getItem(key) || '[]')
      }
      default:
        return []
    }
  },

  async get(name) {
    const cached = cacheGet(name)
    if (cached !== undefined) return cached
    const data = await this._fetch(name)
    cacheSet(name, data)
    return data
  },

  // Batal cache satu koleksi (string), beberapa koleksi (array), atau semua (tanpa argumen)
  invalidate(name) {
    if (Array.isArray(name)) {
      name.forEach((n) => cacheClear(n))
      return
    }
    cacheClear(name)
  },

  async getById(name, id) {
    if (name === 'users') {
      try {
        const d = await request('me')
        return d.user ? mapUser(d.user) : null
      } catch (e) {
        if (e.status === 401) return null
        throw e
      }
    }
    const col = await this.get(name)
    return col.find((x) => x.id === id) ?? null
  },

  async add(name, data) {
    switch (name) {
      case 'energyRecords': {
        const d = await request('records', {
          method: 'POST',
          body: JSON.stringify({
            record_date: data.date,
            kwh: data.kwh,
            location_type: data.locationType,
            place_id: data.placeId || undefined,
            room: data.room || '',
          }),
        })
        cacheClear('energyRecords')
        return d.record ? mapRecord(d.record) : d.id
      }
      case 'places': {
        const d = await request('places', {
          method: 'POST',
          body: JSON.stringify({
            name: data.name,
            photo: data.photo || '',
            location_type: data.locationType || 'Rumah',
            rooms: data.rooms || '',
            energy_target: data.energyTarget || 300,
          }),
        })
        cacheClear('places')
        return d.place ? mapPlace(d.place) : d.id
      }
      case 'savedTips': {
        const key = 'savedTips:' + (currentUserId() || 'anon')
        const list = JSON.parse(localStorage.getItem(key) || '[]')
        const newId = 'tip_' + Date.now()
        const item = { id: newId, ...data }
        list.push(item)
        localStorage.setItem(key, JSON.stringify(list))
        return newId
      }
      default:
        return data && data.id
    }
  },

  async update(name, id, patch) {
    switch (name) {
      case 'places': {
        await request('places', {
          method: 'PUT',
          body: JSON.stringify({ id, ...patch }),
        })
        cacheClear('places')
        return
      }
      default:
        cacheClear(name) // tutup celah koleksi lain (mis. update points 'users')
        return
    }
  },

  async remove(name, id) {
    if (name === 'savedTips') {
      const key = 'savedTips:' + (currentUserId() || 'anon')
      const list = JSON.parse(localStorage.getItem(key) || '[]')
      localStorage.setItem(key, JSON.stringify(list.filter((t) => t.id !== id)))
      return
    }
    if (name === 'energyRecords') {
      await request(`records?id=${encodeURIComponent(id)}`, { method: 'DELETE' })
      cacheClear('energyRecords')
      return
    }
    if (name === 'places') {
      await request(`places?id=${encodeURIComponent(id)}`, { method: 'DELETE' })
      cacheClear('places')
      cacheClear('energyRecords')
      return
    }
  },

  async query(name, field, value) {
    const col = await this.get(name)
    return col.filter((x) => x[field] === value)
  },

  async set() {
    // Akun dikelola server — tidak ada set lokal di mode API
    return null
  },

  async replace() {
    return
  },

  resetLocal() {
    return
  },
}
