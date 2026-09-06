// Cache hasil AI Gemini di localStorage — mencegah pemanggilan API berulang
// yang cepat menghabiskan kuota gratis (≈20 permintaan/menit).
//
// Prinsip hemat kuota:
// 1. Hasil yang SUDAH berhasil dibuat disimpan lama (7 hari) → tidak dipanggil ulang.
// 2. Kalau kuota habis, disimpan masa "cooldown" → aplikasi TIDAK memanggil API
//    lagi selama beberapa saat, sehingga tidak menyia-nyiakan permintaan.
import { storage } from './storage'

const PREFIX = 'gemini:'
const DEFAULT_MAX_AGE = 1000 * 60 * 60 * 24 * 7 // 7 hari — sekali dibuat, tidak dibuat lagi
const DEFAULT_COOLDOWN_MS = 1000 * 90 // 90 detik jeda setelah kuota habis

export function geminiHash(value) {
  let h = 5381
  const s = typeof value === 'string' ? value : JSON.stringify(value)
  for (let i = 0; i < s.length; i += 1) {
    h = ((h << 5) + h + s.charCodeAt(i)) | 0
  }
  return 'h' + (h >>> 0).toString(36)
}

export function readGeminiCache(key, maxAgeMs = DEFAULT_MAX_AGE) {
  const entry = storage.get(PREFIX + key, null)
  if (!entry || entry.data == null) return null
  const ttl = Number(entry.ttl) || maxAgeMs
  if (Date.now() - (Number(entry.at) || 0) > ttl) return null
  return entry.data
}

export function writeGeminiCache(key, data, ttl = DEFAULT_MAX_AGE) {
  storage.set(PREFIX + key, { data, at: Date.now(), ttl })
}

export function removeGeminiCache(key) {
  storage.remove(PREFIX + key)
}

// --- Cooldown kuota (GLOBAL) -------------------------------------------
// Cooldown bersifat global, bukan per-konten: begitu kuota habis di halaman
// mana pun, SEMUA panggilan AI berhenti selama masa jeda. Input baru atau
// pindah halaman tidak akan memicu request sia-sia lagi.

export function setGeminiCooldown(ms = DEFAULT_COOLDOWN_MS) {
  storage.set(`${PREFIX}global:cooldown`, { at: Date.now(), ms })
}

export function clearGeminiCooldown() {
  storage.remove(`${PREFIX}global:cooldown`)
}

/** Sisa waktu tunggu dalam ms (0 = boleh mencoba lagi). */
export function getGeminiCooldownMs() {
  const entry = storage.get(`${PREFIX}global:cooldown`, null)
  if (!entry) return 0
  const ms = Number(entry.ms) || DEFAULT_COOLDOWN_MS
  const remaining = (Number(entry.at) || 0) + ms - Date.now()
  return remaining > 0 ? remaining : 0
}
