import { storage } from './storage'
import { isFirebaseConfigured } from '../config/firebase'
import { apiData } from './apiDataService'

const remote = isFirebaseConfigured()

let _fsPromise = null
function fsPromise() {
  if (!_fsPromise) {
    _fsPromise = (async () => {
      const { getFirestore } = await import('firebase/firestore')
      const { app } = await import('../config/firebase')
      return getFirestore(app)
    })()
  }
  return _fsPromise
}

// Mode penyimpanan data:
// - Firebase terkonfigurasi -> Firestore
// - Firebase TIDAK dikonfigurasi -> API Laravel (backend MySQL)
export const db = {
  isRemote: remote,

  async get(name) {
    if (remote) {
      const { collection, getDocs } = await import('firebase/firestore')
      const fs = await fsPromise()
      const snap = await getDocs(collection(fs, name))
      return snap.docs.map((d) => ({ id: d.id, ...d.data() }))
    }
    return apiData.get(name)
  },

  async getById(name, id) {
    if (remote) {
      const { doc, getDoc } = await import('firebase/firestore')
      const fs = await fsPromise()
      const ref = await getDoc(doc(fs, name, id))
      return ref.exists() ? { id: ref.id, ...ref.data() } : null
    }
    return apiData.getById(name, id)
  },

  async add(name, data) {
    if (remote) {
      const { collection, addDoc } = await import('firebase/firestore')
      const fs = await fsPromise()
      const ref = await addDoc(collection(fs, name), data)
      return ref.id
    }
    return apiData.add(name, data)
  },

  async set(name, id, data) {
    if (remote) {
      const { doc, setDoc } = await import('firebase/firestore')
      const fs = await fsPromise()
      await setDoc(doc(fs, name, id), data, { merge: true })
      return id
    }
    return apiData.set(name, id, data)
  },

  async update(name, id, patch) {
    if (remote) {
      const { doc, updateDoc } = await import('firebase/firestore')
      const fs = await fsPromise()
      await updateDoc(doc(fs, name, id), patch)
      return
    }
    return apiData.update(name, id, patch)
  },

  async remove(name, id) {
    if (remote) {
      const { doc, deleteDoc } = await import('firebase/firestore')
      const fs = await fsPromise()
      await deleteDoc(doc(fs, name, id))
      return
    }
    return apiData.remove(name, id)
  },

  async query(name, field, value) {
    if (remote) {
      const { collection, query, where, getDocs } = await import('firebase/firestore')
      const fs = await fsPromise()
      const q = query(collection(fs, name), where(field, '==', value))
      const snap = await getDocs(q)
      return snap.docs.map((d) => ({ id: d.id, ...d.data() }))
    }
    return apiData.query(name, field, value)
  },

  async replace(name, docs) {
    if (remote) return
    return apiData.replace(name, docs)
  },

  // Batal cache (dipakai refresh() agar selalu ambil data terbaru). No-op di Firebase.
  invalidate(name) {
    if (remote) return
    apiData.invalidate(name)
  },

  resetLocal() {
    storage.clearAll()
  },
}
