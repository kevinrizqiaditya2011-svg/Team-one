import { useMemo, useState, useEffect } from 'react'
import { Download, Zap, Wallet, PiggyBank, Leaf, FileText, CalendarDays, BookmarkCheck, Lightbulb, Trash2 } from 'lucide-react'
import { jsPDF } from 'jspdf'
import {
  LineChart,
  Line,
  ResponsiveContainer,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  AreaChart,
  Area,
} from 'recharts'
import { useAuth } from '../context/AuthContext'
import { useUserData } from '../hooks/useUserData'
import { usePlaces, usePlaceRecords, usePlaceRooms } from '../context/PlaceContext'
import { db } from '../services/db'
import { buildRecommendations } from '../services/recommendationService'
import { periodFromRecords, sumStats, savingsVsPrevious } from '../services/energyService'
import { formatRupiah, formatNumber, formatDecimal, formatDateShort } from '../utils/format'
import { usePageTitle } from '../utils/hooks'
import PageHeader from '../components/ui/PageHeader'
import Badge from '../components/ui/Badge'
import StatCard from '../components/ui/StatCard'
import EmptyState from '../components/ui/EmptyState'
import PlaceSwitcher from '../components/PlaceSwitcher'
import { LoadingBlock } from '../components/ui/Loading'
import { useToast } from '../context/ToastContext'
import Modal from '../components/ui/Modal'
import { Spinner } from '../components/ui/Loading'

const TOOLTIP_STYLE = {
  borderRadius: 12,
  border: '1px solid #e2e8f0',
  fontSize: 12,
  background: '#fff',
  color: '#0f172a',
}

const DAY_MS = 86400000

function pad(n) {
  return String(n).padStart(2, '0')
}

function localISO(d) {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

function fmtDate(isoStr) {
  return new Date(isoStr + 'T00:00:00').toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

/** Hitung rentang [start, end] + label berdasarkan mode & nilai custom. */
function computeRange(mode, custom) {
  const today = new Date()
  if (mode === 'date') {
    const s = custom.date || localISO(today)
    return { start: s, end: s, curLabel: fmtDate(s), prevLabel: 'Sehari sebelumnya', trend: 'day' }
  }
  if (mode === 'monthpick') {
    const parts = (custom.month || localISO(today).slice(0, 7)).split('-')
    const y = Number(parts[0])
    const m = Number(parts[1])
    const lastDay = new Date(y, m, 0).getDate()
    const label = new Date(y, m - 1, 1).toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })
    return {
      start: `${y}-${pad(m)}-01`,
      end: `${y}-${pad(m)}-${pad(lastDay)}`,
      curLabel: `Bulan ${label}`,
      prevLabel: 'Bulan sebelumnya',
      trend: 'day',
    }
  }
  // yearpick
  const y = Number(custom.year || today.getFullYear())
  return {
    start: `${y}-01-01`,
    end: `${y}-12-31`,
    curLabel: `Tahun ${y}`,
    prevLabel: 'Tahun sebelumnya',
    trend: 'month',
  }
}

/** Tren bulanan: agregasi per bulan dalam rentang. */
function monthlyTrend(records, start, end) {
  const buckets = []
  const cur = new Date(start + 'T00:00:00')
  const e = new Date(end + 'T00:00:00')
  cur.setDate(1)
  while (cur <= e) {
    const mStart = localISO(cur)
    const lastDay = new Date(cur.getFullYear(), cur.getMonth() + 1, 0).getDate()
    const mEnd = `${cur.getFullYear()}-${pad(cur.getMonth() + 1)}-${pad(lastDay)}`
    const s = sumStats(periodFromRecords(records, mStart, mEnd))
    buckets.push({
      label: cur.toLocaleDateString('id-ID', { month: 'short' }),
      kwh: Math.round(s.totalKwh),
      cost: Math.round(s.totalCost),
    })
    cur.setMonth(cur.getMonth() + 1)
  }
  return buckets
}

export default function Reports() {
  usePageTitle('Laporan')
  const { user } = useAuth()
  const { records: allRecords, loading } = useUserData('energyRecords')
  const { selectedPlaceId, placeById, places } = usePlaces()
  const records = usePlaceRecords(allRecords)
  const placeRooms = usePlaceRooms()
  const placeLabel = selectedPlaceId === 'all'
    ? 'Semua Gedung'
    : selectedPlaceId ? placeById(selectedPlaceId)?.name || 'Gedung' : 'Gedung'
  const toast = useToast()

  // Mode export: date / monthpick / yearpick
  const [mode, setMode] = useState('monthpick')
  const [custom, setCustom] = useState({
    date: localISO(new Date()),
    month: localISO(new Date()).slice(0, 7),
    year: String(new Date().getFullYear()),
  })

  // Export popup state
  const [exportPopupOpen, setExportPopupOpen] = useState(false)
  const [exportLoading, setExportLoading] = useState(false)
  const [exportFormat, setExportFormat] = useState('pdf')

  // Saved tips for Excel export
  const [savedTips, setSavedTips] = useState([])
  useEffect(() => {
    if (!user) return
    ;(async () => {
      try {
        const all = await db.get('savedTips')
        setSavedTips(all.filter((t) => t.userId === user.id))
      } catch {
        // ignore
      }
    })()
  }, [user])

  // Hapus tips tersimpan langsung dari laporan
  const handleDeleteTip = async (tip) => {
    try {
      await db.remove('savedTips', tip.id)
      setSavedTips((prev) => prev.filter((t) => t.id !== tip.id))
      toast('info', 'Tips dihapus dari simpanan.')
    } catch {
      toast('error', 'Gagal menghapus tips.')
    }
  }

  const data = useMemo(() => {
    const range = computeRange(mode, custom)
    const { start, end, curLabel, prevLabel, trend } = range

    const sDate = new Date(start + 'T00:00:00')
    const eDate = new Date(end + 'T00:00:00')
    const spanDays = Math.max(1, Math.round((eDate - sDate) / DAY_MS))
    const prevEnd = new Date(sDate.getTime() - DAY_MS)
    const prevStart = new Date(prevEnd.getTime() - (spanDays - 1) * DAY_MS)

    const curRecs = periodFromRecords(records, start, end)
    const prevRecs = periodFromRecords(records, localISO(prevStart), localISO(prevEnd))
    const curStats = sumStats(curRecs)
    const prevStats = sumStats(prevRecs)
    const save = savingsVsPrevious(curRecs, prevRecs)

    const trendData =
      trend === 'month'
        ? monthlyTrend(records, start, end)
        : curRecs
            .slice()
            .sort((a, b) => a.date.localeCompare(b.date))
            .map((r) => ({
              label: formatDateShort(r.date),
              kwh: Math.round(Number(r.kwh)),
              cost: Math.round(Number(r.cost) || Number(r.kwh) * 1450),
            }))

    return {
      curStats,
      prevStats,
      save,
      trend: trendData,
      curLabel,
      prevLabel,
      curRange: `${start} s.d. ${end}`,
    }
  }, [records, mode, custom])

  const recs = useMemo(() => buildRecommendations(records, placeRooms).filter((r) => r.priority !== 'Rendah').slice(0, 5), [records, placeRooms])

  const currentYear = new Date().getFullYear()

  const openExportPopup = () => {
    setExportPopupOpen(true)
  }

  const handleExport = async () => {
    setExportLoading(true)
    await new Promise((r) => setTimeout(r, 300))

    try {
      const { curStats, prevStats, save, trend, curLabel, prevLabel, curRange } = data
      const avgDaily = curStats.count ? curStats.totalKwh / curStats.count : 0
      const peak = [...records].sort((a, b) => Number(b.kwh) - Number(a.kwh))[0]
      const num = (n) => Math.round(Number(n) || 0).toLocaleString('id-ID')
      const costDelta = curStats.totalCost - prevStats.totalCost
      const co2Delta = curStats.totalCo2 - prevStats.totalCo2
      const trendKwh = trend.reduce((s, t) => s + t.kwh, 0)
      const trendCost = trend.reduce((s, t) => s + t.cost, 0)
      const trendTitle = mode === 'yearpick' ? 'Tren Bulanan' : `Tren Harian (${curLabel})`

      // Room stats
      const roomStatsMap = {}
      const curRecs = records.filter((r) => {
        const d = r.date
        return d >= data.curRange.split(' s.d. ')[0] && d <= data.curRange.split(' s.d. ')[1]
      })
      curRecs.forEach((r) => {
        const room = r.room || ''
        if (!room) return
        if (!roomStatsMap[room]) roomStatsMap[room] = { kwh: 0, cost: 0, co2: 0, count: 0 }
        roomStatsMap[room].kwh += Number(r.kwh) || 0
        roomStatsMap[room].cost += Number(r.cost) || 0
        roomStatsMap[room].co2 += Number(r.estimatedCO2) || 0
        roomStatsMap[room].count += 1
      })
      const roomEntries = Object.entries(roomStatsMap).sort((a, b) => b[1].kwh - a[1].kwh)
      const roomTotalKwh = roomEntries.reduce((s, [, v]) => s + v.kwh, 0)
      roomEntries.forEach(([, v]) => {
        v.share = roomTotalKwh > 0 ? (v.kwh / roomTotalKwh) * 100 : 0
      })
      const roomTotalCost = roomEntries.reduce((s, [, v]) => s + v.cost, 0)
      const roomTotalCo2 = roomEntries.reduce((s, [, v]) => s + v.co2, 0)

      // ===== Build PDF with jsPDF =====
      const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
      const pageW = doc.internal.pageSize.getWidth()
      const margin = 15
      const contentW = pageW - margin * 2
      let y = margin

      const addPage = () => { doc.addPage(); y = margin }
      const checkPage = (needed) => { if (y + needed > doc.internal.pageSize.getHeight() - 15) addPage() }

      const setFont = (style, size) => doc.setFont('helvetica', style, size)
      const setColor = (r, g, b) => doc.setTextColor(r, g, b)

      // Helper: draw a section header
      const sectionHeader = (title) => {
        checkPage(16)
        doc.setFillColor(36, 86, 230)
        doc.roundedRect(margin, y, contentW, 9, 2, 2, 'F')
        setFont('bold', 10)
        setColor(255, 255, 255)
        doc.text(title, margin + 4, y + 6.5)
        y += 15
        setColor(31, 41, 55)
      }

      // Spasi antar baris teks isi tabel (mm) — dibuat lega agar aman dari tumpang tindih
      const BODY_LINE_MM = 3.6
      const CELL_INSET = 5 // jarak teks dari tepi kolom (mm)

      // Helper: tinggi baris tabel agar teks yang dibungkus tidak menabrak baris
      // berikutnya maupun kolom sebelahnya.
      const rowHFor = (row, colWidths) => {
        let maxLines = 1
        row.forEach((cell, ci) => {
          const lines = doc.splitTextToSize(String(cell), Math.max(14, colWidths[ci] - CELL_INSET))
          maxLines = Math.max(maxLines, lines.length)
        })
        return Math.max(9, maxLines * BODY_LINE_MM + 3)
      }

      // Helper: draw a simple table — teks otomatis di-wrap per kolom,
      // termasuk header (label periode panjang seperti "Bulan September 2026"
      // dibungkus agar tidak menabrak kolom sebelahnya).
      const drawTable = (headers, rows, colWidths) => {
        const headerLines = headers.map((h, i) => doc.splitTextToSize(String(h), Math.max(14, colWidths[i] - CELL_INSET)))
        const headerH = Math.max(10, Math.max(...headerLines.map((l) => l.length)) * BODY_LINE_MM + 4)
        // Header
        checkPage(headerH + 5)
        doc.setFillColor(239, 246, 255)
        doc.rect(margin, y, contentW, headerH, 'F')
        setFont('bold', 7)
        setColor(30, 64, 175)
        let x = margin + 3
        headers.forEach((h, i) => {
          doc.text(headerLines[i], x, y + 5)
          x += colWidths[i]
        })
        y += headerH
        // Rows
        rows.forEach((row, ri) => {
          const rh = rowHFor(row, colWidths)
          checkPage(rh + 4)
          if (ri % 2 === 1) {
            doc.setFillColor(248, 250, 252)
            doc.rect(margin, y, contentW, rh, 'F')
          }
          setFont('normal', 7.5)
          setColor(31, 41, 55)
          x = margin + 3
          row.forEach((cell, ci) => {
            const lines = doc.splitTextToSize(String(cell), Math.max(14, colWidths[ci] - CELL_INSET))
            doc.text(lines, x, y + 5)
            x += colWidths[ci]
          })
          y += rh
        })
        y += 4
      }

      // Helper: gambar kotak info dengan teks yang dibungkus otomatis.
      const drawBox = (text, fill, textColor, extraBottom = 5) => {
        const lines = doc.splitTextToSize(text, contentW - 10)
        const boxH = 8 + (lines.length - 1) * BODY_LINE_MM
        checkPage(boxH + 3)
        doc.setFillColor(...fill)
        doc.roundedRect(margin, y, contentW, boxH, 2, 2, 'F')
        setFont('bold', 7.5)
        setColor(...textColor)
        doc.text(lines, margin + 5, y + 5.5)
        y += boxH + extraBottom
      }

      // === Title ===
      setFont('bold', 22)
      setColor(30, 58, 138)
      doc.text('Laporan Energi', margin, y + 8)
      y += 12
      setFont('bold', 10)
      setColor(36, 86, 230)
      doc.text('EnergiKita', margin, y + 4)
      y += 8
      setFont('normal', 8)
      setColor(107, 114, 128)
      doc.text('Ringkasan konsumsi, biaya, penghematan, dan tips hemat energi', margin, y + 3)
      y += 7

      // Meta box — tiap baris di-wrap agar tidak melebihi lebar halaman
      const metaFont = 7
      const metaGap = 3.4
      const metaBlocks = [
        doc.splitTextToSize(`Dibuat: ${new Date().toLocaleString('id-ID')}`, contentW - 10),
        doc.splitTextToSize(`Pengguna: ${user?.name || '-'} (${user?.email || '-'})`, contentW - 10),
        doc.splitTextToSize(`Gedung: ${placeLabel}  |  Periode: ${curLabel} (${curRange})`, contentW - 10),
      ]
      const metaLines = metaBlocks.reduce((n, b) => n + b.length, 0)
      const metaH = 12 + (metaLines - 1) * metaGap
      doc.setFillColor(241, 245, 249)
      doc.roundedRect(margin, y, contentW, metaH, 2, 2, 'F')
      doc.setDrawColor(36, 86, 230)
      doc.setLineWidth(0.8)
      doc.line(margin, y, margin, y + metaH)
      setFont('normal', metaFont)
      setColor(148, 163, 184)
      let metaY = y + 5.5
      metaBlocks.forEach((block, bi) => {
        doc.text(block, margin + 5, metaY)
        metaY += block.length * metaGap + (bi < metaBlocks.length - 1 ? 2.5 : 0)
      })
      y += metaH + 6

      // === Ringkasan Periode Ini ===
      sectionHeader('Ringkasan Periode Ini')
      drawTable(
        ['Keterangan', 'Nilai'],
        [
          ['Konsumsi energi', `${formatDecimal(curStats.totalKwh)} kWh`],
          ['Estimasi biaya', formatRupiah(curStats.totalCost)],
          ['Emisi CO2', `${formatDecimal(curStats.totalCo2)} kg`],
          ['Jumlah catatan', String(curStats.count)],
          ['Rata-rata per hari', `${formatDecimal(avgDaily)} kWh`],
          ...(peak ? [['Hari pemakaian tertinggi', `${formatDecimal(peak.kwh)} kWh (${formatDateShort(peak.date)})`]] : []),
        ],
        [contentW * 0.55, contentW * 0.45],
      )

      // === Perbandingan Periode ===
      sectionHeader('Perbandingan Periode')
      // Label periode lengkap ditaruh di baris keterangan terpisah — header tabel
      // memakai label pendek agar tidak membungkus ke 2 baris (mis. "Bulan September
      // 2026" menjadi "2026" di baris bawah yang menimpa isi tabel).
      setFont('italic', 7)
      setColor(107, 114, 128)
      const cmpCaption = doc.splitTextToSize(`Perbandingan: ${prevLabel} vs ${curLabel}`, contentW - 10)
      doc.text(cmpCaption, margin + 2, y + 3.5)
      y += 2.5 + cmpCaption.length * 2.8
      setColor(31, 41, 55)
      drawTable(
        ['Indikator', 'Sebelumnya', 'Periode Ini', 'Perubahan'],
        [
          ['Konsumsi (kWh)', num(prevStats.totalKwh), num(curStats.totalKwh), `${save.pctChange >= 0 ? '+' : ''}${formatDecimal(save.pctChange)}%`],
          ['Biaya (Rp)', num(prevStats.totalCost), num(curStats.totalCost), `${costDelta >= 0 ? '+' : '-'}${formatRupiah(Math.abs(costDelta))}`],
          ['Emisi CO2 (kg)', num(prevStats.totalCo2), num(curStats.totalCo2), `${co2Delta >= 0 ? '+' : '-'}${formatDecimal(Math.abs(co2Delta))} kg`],
        ],
        [contentW * 0.22, contentW * 0.26, contentW * 0.26, contentW * 0.26],
      )

      // Savings summary
      drawBox(
        `Total penghematan ${curLabel.toLowerCase()}: ${formatRupiah(save.savedRp)} (${formatDecimal(save.savedKwh)} kWh / ${formatDecimal(save.savedCo2)} kg CO2)`,
        [236, 253, 245],
        [6, 95, 70],
      )

      // === Rekomendasi ===
      if (recs.length > 0) {
        sectionHeader('Rekomendasi Utama')
        drawTable(
          ['Rekomendasi', 'Prioritas'],
          recs.map((r) => [r.title, r.priority]),
          [contentW * 0.8, contentW * 0.2],
        )
      }

      // === Tips Tersimpan ===
      if (savedTips.length > 0) {
        sectionHeader('Tips Tersimpan')
        drawTable(
          ['Tips', 'Prioritas', 'Status'],
          savedTips.map((t) => [t.title, t.priority || '-', 'Disimpan']),
          [contentW * 0.65, contentW * 0.15, contentW * 0.2],
        )
      }

      // === Pemakaian per Ruangan ===
      if (roomEntries.length > 0) {
        sectionHeader('Pemakaian per Ruangan')
        drawTable(
          ['Ruangan', 'Konsumsi (kWh)', 'Biaya (Rp)', 'Emisi CO2 (kg)', 'Jumlah'],
          roomEntries.map(([room, s]) => [
            room,
            formatDecimal(s.kwh),
            formatRupiah(s.cost),
            formatDecimal(s.co2),
            String(s.count),
          ]),
          [contentW * 0.25, contentW * 0.2, contentW * 0.2, contentW * 0.2, contentW * 0.15],
        )
        // Total row
        checkPage(10)
        doc.setFillColor(254, 243, 199)
        doc.rect(margin, y, contentW, 8, 'F')
        setFont('bold', 7.5)
        setColor(146, 64, 14)
        doc.text('Total', margin + 3, y + 5.5)
        doc.text(formatDecimal(roomTotalKwh), margin + contentW * 0.25 + 3, y + 5.5)
        doc.text(formatRupiah(roomTotalCost), margin + contentW * 0.45 + 3, y + 5.5)
        doc.text(formatDecimal(roomTotalCo2), margin + contentW * 0.65 + 3, y + 5.5)
        y += 12

        // Sorotan ruangan paling boros & paling hemat
        if (roomEntries.length > 1) {
          const topRoom = roomEntries[0]
          const lowRoom = roomEntries[roomEntries.length - 1]
          drawBox(
            `Paling boros: ${topRoom[0]} (${formatDecimal(topRoom[1].kwh)} kWh · ${formatDecimal(topRoom[1].share)}% dari total)`,
            [254, 242, 242],
            [159, 18, 57],
            2,
          )
          drawBox(
            `Paling hemat: ${lowRoom[0]} (${formatDecimal(lowRoom[1].kwh)} kWh · ${formatDecimal(lowRoom[1].share)}% dari total)`,
            [236, 253, 245],
            [6, 95, 70],
          )
        }
      }

      // === Tren ===
      if (trend.length > 0) {
        sectionHeader(trendTitle)
        drawTable(
          ['Periode', 'Konsumsi (kWh)', 'Biaya (Rp)'],
          [
            ...trend.map((t) => [t.label, num(t.kwh), num(t.cost)]),
            ['Total', num(trendKwh), num(trendCost)],
          ],
          [contentW * 0.34, contentW * 0.33, contentW * 0.33],
        )
      }

      // Footer
      checkPage(12)
      doc.setDrawColor(226, 232, 240)
      doc.setLineWidth(0.3)
      doc.line(margin, y, pageW - margin, y)
      y += 5
      setFont('italic', 7)
      setColor(148, 163, 184)
      doc.text('Dibuat dengan EnergiKita - mari hemat energi bersama.', pageW / 2, y, { align: 'center' })

      // Save
      const filename = `laporan-energikita-${mode}-${new Date().toISOString().slice(0, 10)}.pdf`
      doc.save(filename)
      toast('success', `Laporan PDF (${data.curLabel}) berhasil diunduh`)
      setExportPopupOpen(false)
    } catch {
      toast('error', 'Gagal membuat laporan. Coba lagi.')
    } finally {
      setExportLoading(false)
    }
  }

  if (loading) return <LoadingBlock label="Menyusun laporan…" />

  return (
    <div>
      <PageHeader
        title="Laporan & Export"
        subtitle="Pilih periode laporan, pratinjau, lalu unduh sebagai PDF."
        actions={
          <button onClick={openExportPopup} disabled={records.length === 0} className="btn-primary">
            <Download size={16} /> Export Laporan
          </button>
        }
      />

      <div className="mb-5 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-3 dark:border-slate-800 dark:bg-slate-900">
        <PlaceSwitcher />
        <p className="text-[11px] text-slate-400">Laporan disusun untuk {placeLabel}.</p>
      </div>

      {records.length === 0 ? (
        <EmptyState
          icon={FileText}
          title="Belum ada data untuk dilaporkan"
          description="Catat data di Energy Monitor untuk mulai menyusun laporan."
        />
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard
              icon={Zap}
              label={`Konsumsi · ${data.curLabel}`}
              value={`${formatDecimal(data.curStats.totalKwh)} kWh`}
              sub={`${data.curStats.count} catatan`}
              tone="sirkuit"
            />
            <StatCard
              icon={Wallet}
              label="Estimasi biaya"
              value={formatRupiah(data.curStats.totalCost)}
              sub={`sebelumnya ${formatRupiah(data.prevStats.totalCost)}`}
              tone="panel"
            />
            <StatCard
              icon={PiggyBank}
              label="Penghematan"
              value={formatRupiah(data.save.savedRp)}
              sub={`${formatDecimal(data.save.savedKwh)} kWh dihemat`}
              tone="voltase"
            />
            <StatCard
              icon={Leaf}
              label="CO₂ dikurangi"
              value={`${formatDecimal(data.save.savedCo2)} kg`}
              sub={`emisi ${formatDecimal(data.curStats.totalCo2)} kg`}
              tone="konduktor"
            />
          </div>

          <div className="mt-5 grid gap-5 lg:grid-cols-2">
            <div className="card p-6">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-base font-bold text-slate-900 dark:text-white">
                  Tren Konsumsi · {data.curLabel}
                </h2>
                <Badge tone="slate">kWh</Badge>
              </div>
              <div className="h-56 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={data.trend} margin={{ top: 4, right: 4, left: -14, bottom: 0 }}>
                    <defs>
                      <linearGradient id="repGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#2456E6" stopOpacity={0.3} />
                        <stop offset="100%" stopColor="#2456E6" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} className="text-slate-200 dark:text-slate-800" />
                    <XAxis dataKey="label" tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: '#94a3b8' }} />
                    <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: '#94a3b8' }} />
                    <Tooltip contentStyle={TOOLTIP_STYLE} formatter={(v) => [`${formatNumber(v)} kWh`, 'Konsumsi']} />
                    <Area type="monotone" dataKey="kwh" stroke="#2456E6" strokeWidth={2.5} fill="url(#repGrad)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="card p-6">
              <h2 className="mb-4 text-base font-bold text-slate-900 dark:text-white">Perbandingan Periode</h2>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-200 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-400 dark:border-slate-700">
                      <th className="pb-2.5">Indikator</th>
                      <th className="pb-2.5 text-right">{data.prevLabel}</th>
                      <th className="pb-2.5 text-right">{data.curLabel}</th>
                      <th className="pb-2.5 text-right">Perubahan</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {(() => {
                      const costDelta = data.curStats.totalCost - data.prevStats.totalCost
                      const co2Delta = data.curStats.totalCo2 - data.prevStats.totalCo2
                      const rows = [
                        {
                          label: 'Konsumsi (kWh)',
                          prev: formatDecimal(data.prevStats.totalKwh),
                          cur: formatDecimal(data.curStats.totalKwh),
                          delta: data.save.pctChange,
                          text: `${data.save.pctChange >= 0 ? '+' : ''}${formatDecimal(data.save.pctChange)}%`,
                        },
                        {
                          label: 'Biaya (Rp)',
                          prev: formatRupiah(data.prevStats.totalCost),
                          cur: formatRupiah(data.curStats.totalCost),
                          delta: costDelta,
                          text: `${costDelta >= 0 ? '+' : '−'}${formatRupiah(Math.abs(costDelta))}`,
                        },
                        {
                          label: 'Emisi CO₂ (kg)',
                          prev: formatDecimal(data.prevStats.totalCo2),
                          cur: formatDecimal(data.curStats.totalCo2),
                          delta: co2Delta,
                          text: `${co2Delta >= 0 ? '+' : '−'}${formatDecimal(Math.abs(co2Delta))} kg`,
                        },
                      ]
                      return rows.map((row) => (
                        <tr key={row.label}>
                          <td className="py-3 font-semibold text-slate-700 dark:text-slate-200">{row.label}</td>
                          <td className="py-3 text-right text-slate-500 dark:text-slate-400">{row.prev}</td>
                          <td className="py-3 text-right font-bold text-slate-900 dark:text-white">{row.cur}</td>
                          <td className={`py-3 text-right font-semibold ${row.delta <= 0 ? 'text-teal-600 dark:text-teal-400' : 'text-rose-500'}`}>
                            {row.text}
                          </td>
                        </tr>
                      ))
                    })()}
                  </tbody>
                </table>
              </div>
              <div className="mt-4 rounded-xl bg-teal-50 p-4 text-xs leading-relaxed text-teal-800 dark:bg-teal-500/10 dark:text-teal-200">
                Total penghematan {data.curLabel.toLowerCase()}: <span className="font-bold">{formatRupiah(data.save.savedRp)}</span> ({formatDecimal(data.save.savedKwh)} kWh · {formatDecimal(data.save.savedCo2)} kg CO₂).
              </div>
            </div>
          </div>

          <div className="card mt-5 p-6">
            <h2 className="mb-4 text-base font-bold text-slate-900 dark:text-white">Rekomendasi Untuk Periode Berikutnya</h2>
            <ul className="grid gap-3 sm:grid-cols-3">
              {recs.map((r) => (
                <li key={r.id} className="rounded-2xl border border-slate-100 p-4 dark:border-slate-800">
                  <p className="text-xs font-bold text-slate-900 dark:text-white">{r.title}</p>
                  <p className="mt-1 line-clamp-3 text-[11px] leading-relaxed text-slate-500 dark:text-slate-400">{r.description}</p>
                  <Badge tone="slate" className="mt-2">{r.priority}</Badge>
                </li>
              ))}
            </ul>
          </div>

          {/* Tips Tersimpan */}
          {savedTips.length > 0 && (
            <div className="card mt-5 overflow-hidden">
              <div className="border-b border-slate-100 bg-amber-50/50 px-6 py-4 dark:border-slate-800 dark:bg-amber-500/5">
                <h2 className="flex items-center gap-2 text-base font-bold text-slate-900 dark:text-white">
                  <BookmarkCheck size={16} className="text-amber-500" />
                  Tips Tersimpan
                </h2>
                <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                  {savedTips.length} tips yang sudah kamu simpan dari halaman Rekomendasi.
                </p>
              </div>
              <div className="p-6">
                <ul className="space-y-3">
                  {savedTips.map((tip) => (
                    <li key={tip.id} className="flex items-start gap-3 rounded-2xl border border-slate-100 p-4 transition hover:border-amber-200 dark:border-slate-800 dark:hover:border-amber-500/30">
                      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-amber-50 text-amber-500 dark:bg-amber-500/15 dark:text-amber-400">
                        <Lightbulb size={16} />
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-bold text-slate-900 dark:text-white">{tip.title}</p>
                        {tip.description && (
                          <p className="mt-1 text-xs leading-relaxed text-slate-500 dark:text-slate-400">{tip.description}</p>
                        )}
                        <div className="mt-2 flex flex-wrap gap-1.5">
                          {tip.priority && <Badge tone="slate">Prioritas {tip.priority}</Badge>}
                          <Badge tone="emerald">✓ Disimpan</Badge>
                        </div>
                      </div>
                      <button
                        onClick={() => handleDeleteTip(tip)}
                        aria-label={`Hapus tips ${tip.title}`}
                        title="Hapus tips"
                        className="shrink-0 rounded-lg p-2 text-slate-300 transition hover:bg-rose-50 hover:text-rose-500 dark:text-slate-600 dark:hover:bg-rose-500/10"
                      >
                        <Trash2 size={15} />
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          <div className="card mt-5 p-6">
            <h2 className="mb-4 text-base font-bold text-slate-900 dark:text-white">Estimasi Biaya · {data.curLabel} (Rp)</h2>
            <div className="h-48 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data.trend} margin={{ top: 4, right: 4, left: 8, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} className="text-slate-200 dark:text-slate-800" />
                  <XAxis dataKey="label" tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: '#94a3b8' }} />
                  <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: '#94a3b8' }} tickFormatter={(v) => formatNumber(v)} />
                  <Tooltip contentStyle={TOOLTIP_STYLE} formatter={(v) => [formatRupiah(v), 'Biaya']} />
                  <Line type="monotone" dataKey="cost" stroke="#22d3ee" strokeWidth={2.5} dot={{ r: 3 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </>
      )}

      {/* ===== Export Popup ===== */}
      <Modal open={exportPopupOpen} onClose={() => setExportPopupOpen(false)} title="Export Laporan PDF" maxWidth="max-w-lg">
        <div className="space-y-5">
          {/* Pilih periode */}
          <div>
            <p className="mb-3 text-sm font-bold text-slate-900 dark:text-white">Pilih periode laporan:</p>
            <div className="flex flex-wrap gap-2">
              {[
                { id: 'date', label: 'Pilih Tanggal' },
                { id: 'monthpick', label: 'Pilih Bulan' },
                { id: 'yearpick', label: 'Pilih Tahun' },
              ].map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setMode(c.id)}
                  aria-pressed={mode === c.id}
                  className={`rounded-xl border px-4 py-2.5 text-xs font-bold transition-all duration-200 ${
                    mode === c.id
                      ? 'border-sirkuit-500 bg-sirkuit-600 text-white shadow-sm'
                      : 'border-slate-200 bg-white text-slate-600 hover:border-sirkuit-400 hover:text-sirkuit-700 dark:border-slate-600 dark:bg-abyss-900 dark:text-slate-300'
                  }`}
                >
                  {c.label}
                </button>
              ))}
            </div>
          </div>

          {/* Input periode */}
          <div>
            {mode === 'date' && (
              <div>
                <label className="mb-1.5 block text-sm font-semibold text-slate-700 dark:text-slate-300">Tanggal</label>
                <input
                  type="date"
                  value={custom.date}
                  onChange={(e) => setCustom((c) => ({ ...c, date: e.target.value }))}
                  className="input"
                />
              </div>
            )}
            {mode === 'monthpick' && (
              <div>
                <label className="mb-1.5 block text-sm font-semibold text-slate-700 dark:text-slate-300">Bulan & Tahun</label>
                <input
                  type="month"
                  value={custom.month}
                  onChange={(e) => setCustom((c) => ({ ...c, month: e.target.value }))}
                  className="input"
                />
              </div>
            )}
            {mode === 'yearpick' && (
              <div>
                <label className="mb-1.5 block text-sm font-semibold text-slate-700 dark:text-slate-300">Tahun</label>
                <select
                  value={custom.year}
                  onChange={(e) => setCustom((c) => ({ ...c, year: e.target.value }))}
                  className="input"
                >
                  {Array.from({ length: 8 }, (_, i) => currentYear - 5 + i).map((y) => (
                    <option key={y} value={y}>{y}</option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {/* Preview */}
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-800/60">
            <p className="text-xs font-bold text-slate-700 dark:text-slate-200">Pratinjau periode:</p>
            <p className="mt-1 text-sm font-bold text-sirkuit-600 dark:text-sirkuit-300">{data.curLabel}</p>
            <p className="text-[11px] text-slate-400">{data.curRange}</p>
            <div className="mt-3 grid grid-cols-3 gap-2">
              <div className="rounded-lg bg-white p-2 text-center dark:bg-slate-900">
                <p className="font-mono text-xs font-bold text-slate-900 dark:text-white">{formatDecimal(data.curStats.totalKwh)} kWh</p>
                <p className="text-[9px] text-slate-400">Konsumsi</p>
              </div>
              <div className="rounded-lg bg-white p-2 text-center dark:bg-slate-900">
                <p className="font-mono text-xs font-bold text-slate-900 dark:text-white">{formatRupiah(data.curStats.totalCost)}</p>
                <p className="text-[9px] text-slate-400">Biaya</p>
              </div>
              <div className="rounded-lg bg-white p-2 text-center dark:bg-slate-900">
                <p className="font-mono text-xs font-bold text-slate-900 dark:text-white">{formatDecimal(data.curStats.totalCo2)} kg</p>
                <p className="text-[9px] text-slate-400">CO₂</p>
              </div>
            </div>
            {savedTips.length > 0 && (
              <div className="mt-2 flex items-center gap-1.5 text-[11px] text-emerald-600 dark:text-emerald-400">
                <BookmarkCheck size={12} /> {savedTips.length} tips tersimpan akan disertakan
              </div>
            )}
          </div>

          {/* Konfirmasi */}
          <div className="flex gap-2.5 pt-1">
            <button type="button" onClick={() => setExportPopupOpen(false)} className="btn-secondary flex-1">
              Batal
            </button>
            <button onClick={handleExport} disabled={exportLoading} className="btn-primary flex-1">
              {exportLoading ? <Spinner /> : <><Download size={15} /> Ya, Export Sekarang</>}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
