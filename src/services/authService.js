import { db } from './db'
import { storage } from './storage'
import { isFirebaseConfigured, getFirebaseAuth } from '../config/firebase'

const SESSION_KEY = 'session'

// Dev: '/api' relatif diteruskan Vite ke Laravel (same-origin => cookie sesi jalan).
// Produksi tanpa proxy: set VITE_API_URL ke URL API absolut di .env.
const API_URL = (import.meta.env.VITE_API_URL || '/api').replace(/\/+$/, '')

export function hashPassword(pw) {
  let h = 5381
  for (let i = 0; i < pw.length; i += 1) {
    h = ((h << 5) + h + pw.charCodeAt(i)) | 0
  }
  return 'h' + (h >>> 0).toString(36)
}

export function isFirebaseReady() {
  return isFirebaseConfigured()
}

export function isApiMode() {
  return !isFirebaseConfigured()
}

export function getAuthInstance() {
  return getFirebaseAuth()
}

export function getSessionUser() {
  return storage.get(SESSION_KEY, null)
}

export function clearSession() {
  storage.remove(SESSION_KEY)
}

function setSession(user) {
  storage.set(SESSION_KEY, user)
}

// Perbarui user di session tanpa mengubah status login (mis. sinkronisasi data lokal)
export function updateSessionUser(user) {
  setSession(user)
}

async function apiRequest(path, options = {}) {
  let res
  try {
    res = await fetch(`${API_URL}/${path}`, {
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      ...options,
    })
  } catch {
    // API dilayani php artisan serve (bukan Apache/XAMPP) — pesan ini sengaja jelas
    throw new Error(`Tidak dapat terhubung ke server (${API_URL}). Pastikan backend Laravel berjalan: cd backend && php artisan serve --port=8000`)
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

function toAppUser(u) {
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
    createdAt: u.created_at ?? new Date().toISOString(),
  }
}

export async function getProfile(userId) {
  if (isApiMode()) {
    try {
      const res = await apiRequest('me')
      return toAppUser(res.user)
    } catch (err) {
      if (err.status === 401) return null
      throw err
    }
  }
  const profile = await db.getById('users', userId)
  return profile
}

async function findUserByEmail(email) {
  const users = await db.get('users')
  return users.find(
    (u) => u.email && u.email.toLowerCase() === String(email).toLowerCase(),
  )
}

export async function login(email, password) {
  if (isFirebaseReady()) {
    const auth = getFirebaseAuth()
    const { signInWithEmailAndPassword } = await import('firebase/auth')
    const cred = await signInWithEmailAndPassword(auth, email, password)
    const profile = await getProfile(cred.user.uid)
    const user = profile || {
      id: cred.user.uid,
      uid: cred.user.uid,
      name: cred.user.displayName || 'Pengguna',
      email: cred.user.email,
      userType: 'Rumah',
      role: 'user',
      points: 0,
      energyTarget: 300,
      createdAt: new Date().toISOString(),
    }
    setSession(user)
    return user
  }

  if (isApiMode()) {
    const res = await apiRequest('login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    })
    const profile = await getProfile(res.user.id).catch(() => null)
    const user = profile || toAppUser(res.user)
    setSession(user)
    return user
  }

  const user = await findUserByEmail(email)
  if (!user) throw new Error('Email tidak terdaftar')
  if (user.password !== hashPassword(password)) throw new Error('Password salah')
  setSession(user)
  return user
}

export async function register({ name, email, password, userType }) {
  if (isFirebaseReady()) {
    const auth = getFirebaseAuth()
    const { createUserWithEmailAndPassword, updateProfile } = await import('firebase/auth')
    const cred = await createUserWithEmailAndPassword(auth, email, password)
    await updateProfile(cred.user, { displayName: name })
    const user = {
      id: cred.user.uid,
      uid: cred.user.uid,
      name,
      email,
      role: 'user',
      userType,
      points: 0,
      energyTarget: 300,
      createdAt: new Date().toISOString(),
    }
    await db.set('users', user.id, user)
    setSession(user)
    return user
  }

  if (isApiMode()) {
    const res = await apiRequest('register', {
      method: 'POST',
      body: JSON.stringify({
        name,
        email,
        password,
        user_type: userType,
        energy_target: 300,
      }),
    })
    const profile = await getProfile(res.user.id).catch(() => null)
    const user = profile || { ...toAppUser(res.user), points: 0, level: 1, energyTarget: 300 }
    setSession(user)
    return user
  }

  const exists = await findUserByEmail(email)
  if (exists) throw new Error('Email sudah terdaftar')
  if (password.length < 6) throw new Error('Password minimal 6 karakter')

  const user = {
    id: 'u_' + Date.now().toString(36),
    name,
    email,
    role: 'user',
    userType,
    points: 0,
    energyTarget: 300,
    password: hashPassword(password),
    createdAt: new Date().toISOString(),
  }
  await db.add('users', user)
  setSession(user)
  return user
}

export async function loginDemo() {
  return login('demo@energikita.id', 'demo1234')
}

export async function logout() {
  if (isFirebaseReady()) {
    const auth = getFirebaseAuth()
    const { signOut } = await import('firebase/auth')
    if (auth) await signOut(auth)
  }
  if (isApiMode()) {
    try {
      await apiRequest('logout', { method: 'POST' })
    } catch {
    }
  }
  clearSession()
}

export async function resetPassword(email) {
  if (isFirebaseReady()) {
    const auth = getFirebaseAuth()
    const { sendPasswordResetEmail } = await import('firebase/auth')
    await sendPasswordResetEmail(auth, email)
    return
  }
  // Mode API: alur reset lewat email belum tersedia di server — tetap berhasil
  // agar alur demo tidak gagal (lihat catatan di halaman Forgot Password).
  return
}

// Ganti password akun yang sedang login (wajib password lama).
export async function changePassword({ currentPassword, newPassword }) {
  if (isFirebaseReady()) {
    const auth = getFirebaseAuth()
    const { EmailAuthProvider, reauthenticateWithCredential, updatePassword } = await import('firebase/auth')
    const user = auth?.currentUser
    if (!user) throw new Error('Belum login')
    await reauthenticateWithCredential(user, EmailAuthProvider.credential(user.email, currentPassword))
    await updatePassword(user, newPassword)
    return
  }
  await apiRequest('me/password', {
    method: 'PUT',
    body: JSON.stringify({ current_password: currentPassword, new_password: newPassword }),
  })
}

export async function updateUser(patch) {
  const current = getSessionUser()
  if (!current) throw new Error('Belum login')

  if (isApiMode()) {
    const body = {}
    if ('name' in patch) body.name = patch.name
    if ('userType' in patch) body.user_type = patch.userType
    if ('energyTarget' in patch) body.energy_target = patch.energyTarget
    if ('pointsDelta' in patch) body.points_delta = patch.pointsDelta

    const res = await apiRequest('me', { method: 'PUT', body: JSON.stringify(body) })
    const updated = toAppUser(res.user)
    setSession(updated)
    return updated
  }

  const fresh = await db.getById('users', current.id)
  if (!fresh) throw new Error('User tidak ditemukan')
  const next = { ...fresh }
  if ('name' in patch) next.name = patch.name
  if ('userType' in patch) next.userType = patch.userType
  if ('energyTarget' in patch) next.energyTarget = patch.energyTarget
  if ('pointsDelta' in patch) {
    next.points = Math.max(0, (Number(next.points) || 0) + Number(patch.pointsDelta))
  }
  if ('points' in patch) next.points = patch.points
  await db.update('users', current.id, next)
  const updated = { ...current, ...next }
  setSession(updated)
  return updated
}
