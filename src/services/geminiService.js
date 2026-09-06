// Layanan pemanggilan Google Gemini API (REST) — dipakai untuk
// rekomendasi hemat energi & tips pengurangan emisi karbon.
//
// Atur kunci API di file .env (lihat .env.example):
//   VITE_GEMINI_API_KEY=your_key_here
//   VITE_GEMINI_MODEL=gemini-3.6-flash   (opsional)

const API_KEY = (import.meta.env.VITE_GEMINI_API_KEY || '').trim()
const CONFIGURED_MODEL = (import.meta.env.VITE_GEMINI_MODEL || '').trim()

// Daftar model cadangan — beberapa model lama (mis. gemini-2.5-flash) sudah
// tidak tersedia untuk pengguna baru, jadi sistem otomatis mencoba model
// berikutnya bila model utama gagal.
const FALLBACK_MODELS = ['gemini-3.6-flash', 'gemini-3.5-flash', 'gemini-2.5-flash']
const MODELS = Array.from(new Set([CONFIGURED_MODEL, ...FALLBACK_MODELS].filter(Boolean)))

export function isGeminiConfigured() {
  return Boolean(API_KEY)
}

let lastUsedModel = null
let lastFinishReason = null
let lastJoinedText = null

// Pembatas laju panggilan global — kuota gratis hanya ±20 permintaan/menit.
// Semua panggilan (rekomendasi & tips) diantre dengan jarak minimum agar
// tidak pernah meledak melebihi batas dalam satu menit.
let lastCallAt = 0
const MIN_CALL_INTERVAL_MS = 3500

function waitForSlot() {
  const now = Date.now()
  const wait = lastCallAt + MIN_CALL_INTERVAL_MS - now
  lastCallAt = Math.max(lastCallAt + MIN_CALL_INTERVAL_MS, now)
  return wait > 0 ? new Promise((r) => setTimeout(r, wait)) : Promise.resolve()
}

export function geminiModel() {
  return lastUsedModel || MODELS[0] || 'gemini-3.6-flash'
}

function extractText(data) {
  const parts = data?.candidates?.[0]?.content?.parts || []
  const texts = parts.map((p) => p.text || '').filter(Boolean)
  // Model "thinking" (Gemini 3.x) bisa menyertakan teks penalaran di part awal;
  // jawaban akhir yang bisa di-parse biasanya ada di part terakhir.
  return texts[texts.length - 1] || texts.join('') || ''
}

async function callModel(model, prompt, generationConfig) {
  let res
  try {
    res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(API_KEY)}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig,
        }),
      },
    )
  } catch {
    return { ok: false, status: 0, message: 'Tidak dapat terhubung ke AI. Periksa koneksi internetmu.' }
  }

  if (!res.ok) {
    let message = `AI API error (HTTP ${res.status})`
    try {
      const err = await res.json()
      message = err?.error?.message || message
    } catch {}
    // Kuota gratis habis (429 atau pesan berisi "quota/rate limit")
    const quota = res.status === 429 || /quota|rate limit|rate_limit/i.test(message)
    return { ok: false, status: res.status, message, quota }
  }

  const data = await res.json()
  const parts = data?.candidates?.[0]?.content?.parts || []
  return {
    ok: true,
    text: extractText(data),
    joined: parts.map((p) => p.text || '').join(''),
    finishReason: data?.candidates?.[0]?.finishReason || 'STOP',
  }
}

// Error yang berarti model tidak tersedia (bukan masalah kunci/quota/network)
function isModelIssue(result) {
  if (result.status === 404) return true
  if (result.status === 400 && /model|not found|no longer available|tidak tersedia/i.test(result.message)) return true
  return false
}

/**
 * Kirim prompt ke Gemini dan minta jawaban JSON.
 * Otomatis mencoba model cadangan bila model utama tidak tersedia.
 * @param {string} prompt Instruksi + konteks untuk model.
 * @param {object} [opts]
 * @param {number} [opts.temperature]
 * @param {number} [opts.maxOutputTokens]
 * @param {object} [opts.schema] responseSchema (opsional)
 * @returns {Promise<string>} Teks jawaban mentah dari model.
 */
export async function askGemini(prompt, { temperature = 0.5, maxOutputTokens = 8192, schema } = {}) {
  if (!isGeminiConfigured()) {
    throw new Error('VITE_GEMINI_API_KEY belum diatur di file .env')
  }

  await waitForSlot()

  const generationConfig = { temperature, maxOutputTokens, responseMimeType: 'application/json' }
  if (schema) generationConfig.responseSchema = schema

  lastFinishReason = null
  lastJoinedText = null
  let lastError = null
  for (const model of MODELS) {
    const result = await callModel(model, prompt, generationConfig)
    if (result.ok) {
      lastUsedModel = model
      lastFinishReason = result.finishReason
      lastJoinedText = result.joined
      return result.text
    }
    lastError = result
    // Kuota habis pada satu model — kuota dihitung per model, jadi coba model
    // lain dulu; kalau semuanya habis, error kuota tetap diteruskan ke pemanggil.
    if (result.quota) continue
    if (!isModelIssue(result)) break // kunci invalid / jaringan — tidak ada gunanya coba model lain
  }
  const error = new Error(lastError?.message || 'AI gagal dihubungi.')
  if (lastError?.quota) error.quota = true
  throw error
}

function stripFences(text) {
  const fence = text.match(/```(?:json)?\s*([\s\S]*?)```/)
  return fence ? fence[1].trim() : text.trim()
}

/**
 * Parse JSON dari teks jawaban Gemini — toleran terhadap:
 * - markdown fence ```json
 * - prosa di sekitar JSON (model "thinking" atau penjelasan tambahan)
 * - beberapa blok JSON (diambil blok lengkap pertama yang valid)
 */
function extractJSON(text) {
  const cleaned = stripFences(text)

  // 1) Coba parse seluruh teks langsung
  try {
    return JSON.parse(cleaned)
  } catch {}

  // 2) Cari setiap kemungkinan awal array/objek, lalu coba parse
  //    struktur JSON terluar yang lengkap (perhatikan string & kurung bersarang)
  const starts = []
  for (let i = 0; i < cleaned.length; i += 1) {
    const ch = cleaned[i]
    if (ch === '[' || ch === '{') starts.push(i)
  }

  for (const start of starts) {
    const open = cleaned[start]
    const close = open === '[' ? ']' : '}'
    let depth = 0
    let inString = false
    let escaped = false
    for (let i = start; i < cleaned.length; i += 1) {
      const ch = cleaned[i]
      if (inString) {
        if (escaped) escaped = false
        else if (ch === '\\') escaped = true
        else if (ch === '"') inString = false
      } else if (ch === '"') {
        inString = true
      } else if (ch === open) {
        depth += 1
      } else if (ch === close) {
        depth -= 1
        if (depth === 0) {
          try {
            return JSON.parse(cleaned.slice(start, i + 1))
          } catch {
            break
          }
        }
      }
    }
  }

  if (lastFinishReason === 'MAX_TOKENS') {
    throw new Error('Respons AI terpotong karena batas token tercapai. Muat ulang halaman untuk mencoba lagi.')
  }
  throw new Error('Respons AI tidak berupa JSON yang valid.')
}

/**
 * Variasi askGemini yang langsung mengembalikan JSON ter-parse.
 * @returns {Promise<any>}
 */
export async function askGeminiJSON(prompt, schema = undefined, opts = {}) {
  const raw = await askGemini(prompt, { ...opts, schema })
  try {
    return extractJSON(raw)
  } catch (err) {
    // Jawaban valid bisa terbelah ke beberapa part — coba gabungan semua part
    if (lastJoinedText && lastJoinedText !== raw && lastFinishReason !== 'MAX_TOKENS') {
      try {
        return extractJSON(lastJoinedText)
      } catch {}
    }
    throw err
  }
}
