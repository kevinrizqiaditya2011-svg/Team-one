import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Plus,
  Pencil,
  Trash2,
  Home,
  School,
  Store,
  Briefcase,
  ShoppingBag,
  BedDouble,
  BarChart3,
  Building2,
  Upload,
  X,
  Camera,
  Search,
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { usePlaces } from '../context/PlaceContext'
import { useUserData } from '../hooks/useUserData'
import { useToast } from '../context/ToastContext'
import { db } from '../services/db'
import { formatNumber, formatDecimal } from '../utils/format'
import { usePageTitle } from '../utils/hooks'
import PageHeader from '../components/ui/PageHeader'
import Modal from '../components/ui/Modal'
import ConfirmDialog from '../components/ui/ConfirmDialog'
import Badge from '../components/ui/Badge'
import EmptyState from '../components/ui/EmptyState'
import { Spinner } from '../components/ui/Loading'

const TYPE_ICONS = {
  Rumah: Home,
  Sekolah: School,
  UMKM: Store,
  Kantor: Briefcase,
  Toko: ShoppingBag,
  Kost: BedDouble,
}

const TYPE_OPTIONS = [
  { id: 'Rumah', icon: Home },
  { id: 'Sekolah', icon: School },
  { id: 'UMKM', icon: Store },
  { id: 'Kantor', icon: Briefcase },
  { id: 'Toko', icon: ShoppingBag },
  { id: 'Kost', icon: BedDouble },
]

const PREDEFINED_ROOMS = [
  'Ruang Tamu',
  'Dapur',
  'Kamar Tidur',
  'Kamar Mandi',
  'Ruang Keluarga',
  'Ruang Makan',
  'Ruang Kerja',
  'Ruang TV',
  'Gudang',
  'Garasi',
  'Teras',
  'Balkon',
  'Laundry',
  'Ruang Serbaguna',
  'Lobi',
]

const EMPTY_FORM = { name: '', rooms: '', locationType: 'Rumah', photo: '' }


function fileToDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result)
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

export default function Buildings() {
  usePageTitle('Gedung')
  const { user } = useAuth()
  const { places, selectPlace, refreshPlaces } = usePlaces()
  const { records, loading, refresh } = useUserData('energyRecords')
  const toast = useToast()
  const navigate = useNavigate()

  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState(EMPTY_FORM)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(null)
  const [deleteLoading, setDeleteLoading] = useState(false)
  const [photoPreview, setPhotoPreview] = useState(null)
  const [search, setSearch] = useState('')

  const monthKwhByPlace = (placeId) => {
    const now = new Date()
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10)
    return records
      .filter((r) => String(r.placeId) === String(placeId) && r.date >= firstDay)
      .reduce((s, r) => s + (Number(r.kwh) || 0), 0)
  }

  const parseRooms = (roomsStr) => {
    if (!roomsStr) return []
    return roomsStr.split(',').map((r) => r.trim()).filter(Boolean)
  }

  const filteredPlaces = useMemo(() => {
    if (!search.trim()) return places
    const q = search.toLowerCase()
    
    return places.filter((p) => (p.name || '').toLowerCase().includes(q))
  }, [places, search])

  const openCreate = () => {
    setEditing(null)
    setForm(EMPTY_FORM)
    setPhotoPreview(null)
    setModalOpen(true)
  }

  const openEdit = (p) => {
    setEditing(p)
    setForm({ name: p.name, rooms: p.rooms || '', locationType: p.locationType || 'Rumah', photo: p.photo || '' })
    setPhotoPreview(p.photo || null)
    setModalOpen(true)
  }

  const handlePhotoUpload = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 2 * 1024 * 1024) {
      toast('error', 'Ukuran foto maksimal 2MB.')
      return
    }
    try {
      const dataUrl = await fileToDataUrl(file)
      setForm((f) => ({ ...f, photo: dataUrl }))
      setPhotoPreview(dataUrl)
    } catch {
      toast('error', 'Gagal membaca foto.')
    }
  }

  const removePhoto = () => {
    setForm((f) => ({ ...f, photo: '' }))
    setPhotoPreview(null)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const name = form.name.trim()
    if (!name) {
      toast('error', 'Nama gedung wajib diisi.')
      return
    }
    
    if (!editing && !form.photo) {
      toast('error', 'Foto gedung wajib diunggah.')
      return
    }
    
    const roomList = parseRooms(form.rooms)
    if (!editing && roomList.length < 2) {
      toast('error', 'Minimal harus ada 2 ruangan.')
      return
    }
    setSaving(true)
    try {
      const payload = {
        name,
        locationType: form.locationType,
        rooms: form.rooms || '',
        photo: form.photo || '',
      }
      if (editing) {
        await db.update('places', editing.id, payload)
        toast('success', 'Gedung diperbarui.')
      } else {
        await db.add('places', payload)
        toast('success', `Gedung "${name}" ditambahkan!`)
      }
      setModalOpen(false)
      await refreshPlaces()
    } catch (err) {
      toast('error', err.message || 'Gagal menyimpan gedung.')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = (p) => setDeleting(p)

  const confirmDelete = async () => {
    if (!deleting) return
    setDeleteLoading(true)
    try {
      await db.remove('places', deleting.id)
      toast('info', 'Gedung dihapus.')
      await refreshPlaces()
      refresh()
      setDeleting(null)
    } catch (err) {
      toast('error', err.message || 'Gagal menghapus gedung.')
    } finally {
      setDeleteLoading(false)
    }
  }

  const handleAnalyze = (p) => {
    selectPlace(p.id)
    navigate('/app/monitor')
  }

  return (
    <div>
      <PageHeader
        title="Gedung & Lokasi"
        subtitle="Kelola beberapa tempat dan lihat analisis energi per gedung."
        actions={
          <button onClick={openCreate} className="btn-primary">
            <Plus size={16} /> Tambah Gedung
          </button>
        }
      />

      {/* Search bar */}
      {places.length > 0 && (
        <div className="mb-4">
          <div className="relative max-w-md">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari nama gedung..."
              className="input pl-9"
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X size={14} />
              </button>
            )}
          </div>
        </div>
      )}

      {!loading && places.length === 0 ? (
        <EmptyState
          icon={Building2}
          title="Belum ada gedung"
          description="Tambahkan gedung pertamamu untuk mulai mencatat energi."
          action={
            <button onClick={openCreate} className="btn-primary">
              <Plus size={15} /> Tambah Gedung Pertama
            </button>
          }
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filteredPlaces.map((p) => {
            const monthKwh = monthKwhByPlace(p.id)
            const TypeIcon = TYPE_ICONS[p.locationType] || Home
            return (
              <div key={p.id} className="card group flex flex-col p-5 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md">
                {/* Photo or type icon */}
                {p.photo ? (
                  <div className="relative mb-3 h-32 overflow-hidden rounded-xl">
                    <img src={p.photo} alt={p.name} className="h-full w-full object-cover" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                    <span className="absolute bottom-2 left-2 inline-flex items-center gap-1 rounded-full bg-white/90 px-2 py-0.5 text-[10px] font-bold text-slate-700 shadow-sm">
                      <TypeIcon size={11} /> {p.locationType}
                    </span>
                  </div>
                ) : (
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-sirkuit-50 to-neon-50 text-sirkuit-600 dark:from-sirkuit-500/15 dark:to-neon-500/15 dark:text-sirkuit-300">
                        <TypeIcon size={20} />
                      </span>
                      <div>
                        <h3 className="text-sm font-bold text-slate-900 dark:text-white">{p.name}</h3>
                        <div className="mt-1 flex flex-wrap items-center gap-1.5">
                          <Badge tone="slate">{p.locationType}</Badge>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {p.photo && (
                  <div className="mb-1">
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white">{p.name}</h3>
                  </div>
                )}

                {!p.photo && (
                  <div className="flex items-start justify-end gap-1 -mt-1">
                    <button
                      onClick={() => openEdit(p)}
                      aria-label={`Edit ${p.name}`}
                      className="rounded-lg p-2 text-slate-300 transition hover:bg-slate-100 hover:text-teal-600 dark:text-slate-600 dark:hover:bg-white/10 dark:hover:text-teal-300"
                    >
                      <Pencil size={14} />
                    </button>
                    <button
                      onClick={() => handleDelete(p)}
                      aria-label={`Hapus ${p.name}`}
                      className="rounded-lg p-2 text-slate-300 transition hover:bg-rose-50 hover:text-rose-500 dark:text-slate-600 dark:hover:bg-rose-500/10"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                )}

                {p.rooms && parseRooms(p.rooms).length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-1">
                    {parseRooms(p.rooms).slice(0, 4).map((room) => (
                      <span key={room} className="rounded-full bg-teal-50 px-2 py-0.5 text-[10px] font-semibold text-teal-600 dark:bg-teal-500/10 dark:text-teal-400">
                        {room}
                      </span>
                    ))}
                    {parseRooms(p.rooms).length > 4 && (
                      <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-500 dark:bg-slate-700 dark:text-slate-400">
                        +{parseRooms(p.rooms).length - 4}
                      </span>
                    )}
                  </div>
                )}

                <div className="mt-4 grid grid-cols-2 gap-3">
                  <div className="rounded-xl bg-slate-50 p-3 dark:bg-slate-800/60">
                    <p className="text-lg font-extrabold text-slate-900 dark:text-white">{formatNumber(p.recordCount)}</p>
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Total catatan</p>
                  </div>
                  <div className="rounded-xl bg-slate-50 p-3 dark:bg-slate-800/60">
                    <p className="text-lg font-extrabold text-teal-600 dark:text-teal-400">{formatDecimal(monthKwh)} kWh</p>
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Bulan ini</p>
                  </div>
                </div>

                <div className="mt-4 flex gap-2">
                  <button onClick={() => handleAnalyze(p)} className="btn-primary flex-1">
                    <BarChart3 size={15} /> Analisis
                  </button>
                  <button
                    onClick={() => openEdit(p)}
                    className="inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-600 transition hover:border-teal-300 hover:text-teal-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:border-teal-500/50 dark:hover:text-teal-300"
                  >
                    <Pencil size={14} />
                  </button>
                </div>
              </div>
            )
          })}

          <button
            onClick={openCreate}
            className="grid min-h-[220px] place-items-center rounded-2xl border-2 border-dashed border-slate-200 p-6 text-center transition hover:border-teal-400 hover:bg-teal-50/40 dark:border-slate-700 dark:hover:border-teal-500/50 dark:hover:bg-teal-500/5"
          >
            <span>
              <span className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-teal-50 text-teal-600 dark:bg-teal-500/15 dark:text-teal-400">
                <Plus size={22} />
              </span>
              <span className="mt-3 block text-sm font-bold text-slate-700 dark:text-slate-200">Tambah Gedung</span>
              <span className="mt-1 block text-xs text-slate-400">Rumah, kantor, sekolah, kios — semuanya bisa</span>
            </span>
          </button>
        </div>
      )}

      <ConfirmDialog
        open={!!deleting}
        onClose={() => setDeleting(null)}
        title="Hapus Gedung"
        description={`Yakin ingin menghapus gedung "${deleting?.name}"? Seluruh catatan energinya juga ikut terhapus.`}
        confirmLabel="Ya, Hapus"
        loading={deleteLoading}
        onConfirm={confirmDelete}
      />

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? `Edit "${editing.name}"` : 'Tambah Gedung Baru'}
      >
        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          {/* Photo upload */}
          <div>
            <label className="mb-1.5 block text-sm font-semibold text-slate-700 dark:text-slate-300">
              Foto Gedung <span className="text-rose-500">*</span>
            </label>
            {photoPreview ? (
              <div className="relative overflow-hidden rounded-xl border border-slate-200 dark:border-slate-700">
                <img src={photoPreview} alt="Preview" className="h-40 w-full object-cover" />
                <button
                  type="button"
                  onClick={removePhoto}
                  className="absolute right-2 top-2 grid h-7 w-7 place-items-center rounded-full bg-black/50 text-white transition hover:bg-black/70"
                >
                  <X size={14} />
                </button>
              </div>
            ) : (
              <label className="flex cursor-pointer flex-col items-center gap-2 rounded-xl border-2 border-dashed border-slate-300 bg-slate-50 px-4 py-6 text-center transition hover:border-teal-400 hover:bg-teal-50/40 dark:border-slate-600 dark:bg-slate-800/60 dark:hover:border-teal-500/50">
                <Camera size={24} className="text-slate-400" />
                <div>
                  <p className="text-xs font-bold text-slate-600 dark:text-slate-300">Klik untuk upload foto</p>
                  <p className="text-[10px] text-slate-400">JPG, PNG, maks 2MB</p>
                </div>
                <input type="file" accept="image/*" onChange={handlePhotoUpload} className="hidden" />
              </label>
            )}
          </div>

          <div>
            <label htmlFor="place-name" className="mb-1.5 block text-sm font-semibold text-slate-700 dark:text-slate-300">
              Nama gedung / lokasi
            </label>
            <input
              id="place-name"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              placeholder="cth: Rumah, Kantor Cabang, Kios Pasar"
              className="input"
              required
            />
          </div>

          {/* Building type selector */}
          <div>
            <label className="mb-1.5 block text-sm font-semibold text-slate-700 dark:text-slate-300">
              Jenis gedung
            </label>
            <div className="grid grid-cols-3 gap-2">
              {TYPE_OPTIONS.map((t) => {
                const Icon = t.icon
                return (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setForm((f) => ({ ...f, locationType: t.id }))}
                    aria-pressed={form.locationType === t.id}
                    className={`flex items-center justify-center gap-1.5 rounded-xl border px-2 py-2.5 text-[11px] font-semibold transition ${
                      form.locationType === t.id
                        ? 'border-sirkuit-500 bg-sirkuit-100 text-sirkuit-700 ring-4 ring-sirkuit-500/15 dark:bg-sirkuit-500/15 dark:text-sirkuit-300'
                        : 'border-slate-200 text-slate-500 hover:border-slate-300 hover:bg-slate-50 dark:border-white/15 dark:text-slate-400 dark:hover:border-sirkuit-300/30 dark:hover:bg-white/5'
                    }`}
                  >
                    <Icon size={13} /> {t.id}
                  </button>
                )
              })}
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-semibold text-slate-700 dark:text-slate-300">
              Pilih Ruangan <span className="text-rose-500">*</span>
            </label>
            <p className="mb-2 text-[11px] text-slate-400">Klik untuk memilih/membatalkan. Minimal 2 ruangan.</p>
            <div className="flex flex-wrap gap-1.5">
              {PREDEFINED_ROOMS.map((room) => {
                const selected = parseRooms(form.rooms).includes(room)
                return (
                  <button
                    key={room}
                    type="button"
                    onClick={() => {
                      const current = parseRooms(form.rooms)
                      if (selected) {
                        const remaining = current.filter((r) => r !== room)
                        setForm((f) => ({ ...f, rooms: remaining.join(', ') }))
                      } else {
                        setForm((f) => ({ ...f, rooms: f.rooms ? f.rooms + ', ' + room : room }))
                      }
                    }}
                    className={`rounded-full border px-3 py-1.5 text-[11px] font-semibold transition ${
                      selected
                        ? 'border-teal-400 bg-teal-50 text-teal-700 dark:border-teal-500/50 dark:bg-teal-500/15 dark:text-teal-300'
                        : 'border-slate-200 bg-slate-50 text-slate-500 hover:border-teal-300 hover:bg-teal-50/50 hover:text-teal-600 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-400 dark:hover:border-teal-500/30 dark:hover:text-teal-300'
                    }`}
                  >
                    {selected && <span className="mr-1">✓</span>}
                    {room}
                  </button>
                )
              })}
            </div>
            {form.rooms && (
              <div className="mt-2 flex flex-wrap gap-1.5">
                {parseRooms(form.rooms).map((room) => (
                  <span key={room} className="inline-flex items-center gap-1 rounded-full border border-teal-200 bg-teal-50 px-2.5 py-1 text-[11px] font-semibold text-teal-700 dark:border-teal-500/30 dark:bg-teal-500/10 dark:text-teal-300">
                    {room}
                    <button
                      type="button"
                      onClick={() => {
                        const remaining = parseRooms(form.rooms).filter((r) => r !== room)
                        setForm((f) => ({ ...f, rooms: remaining.join(', ') }))
                      }}
                      className="ml-0.5 rounded-full p-0.5 transition hover:bg-teal-100 dark:hover:bg-teal-500/20"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          <div className="flex gap-2 pt-1">
            <button type="button" onClick={() => setModalOpen(false)} className="btn-secondary flex-1">
              Batal
            </button>
            <button type="submit" disabled={saving} className="btn-primary flex-1">
              {saving ? <Spinner /> : editing ? 'Simpan Perubahan' : 'Simpan Gedung'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
