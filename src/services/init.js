import { seedIfNeeded } from '../data/seed'
import { isFirebaseConfigured } from '../config/firebase'

export async function initData() {
  // Mode API (Laravel + MySQL): data diambil dari server, tidak perlu seed lokal
  if (!isFirebaseConfigured()) return
  seedIfNeeded()
}
