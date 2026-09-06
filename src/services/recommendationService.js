import { EMISSION_FACTOR, TARIFF, monthRange, periodFromRecords, sumStats, savingsVsPrevious, recentTrend } from './energyService'
import { formatNumber } from '../utils/format'

// Kategori ruangan → perangkat yang umum ada di ruangan tersebut
// (diekspor agar dipakai juga saat menyusun prompt AI)
export const ROOM_DEVICE_MAP = {
  // Kamar tidur: AC, lampu, kipas angin, charger
  'Kamar Tidur': ['ac', 'lampu', 'kipas', 'charger'],
  'Kamar tidur': ['ac', 'lampu', 'kipas', 'charger'],
  'Kamar': ['ac', 'lampu', 'kipas', 'charger'],

  // Ruang tamu: AC/kipas, TV, lampu, sound system
  'Ruang Tamu': ['ac', 'lampu', 'tv', 'kipas'],
  'Ruang tamu': ['ac', 'lampu', 'tv', 'kipas'],

  // Ruang keluarga: TV, AC/kipas, lampu, konsol game
  'Ruang Keluarga': ['ac', 'lampu', 'tv', 'kipas'],
  'Ruang keluarga': ['ac', 'lampu', 'tv', 'kipas'],

  // Dapur: kompor, kulkas, rice cooker, blender, oven, lampu
  'Dapur': ['kompor', 'kulkas', 'lampu', 'blender', 'rice cooker'],
  'dapur': ['kompor', 'kulkas', 'lampu', 'blender', 'rice cooker'],

  // Ruang makan: lampu, AC/kipas
  'Ruang Makan': ['ac', 'lampu', 'kipas'],
  'Ruang makan': ['ac', 'lampu', 'kipas'],

  // Kamar mandi: water heater, lampu, hair dryer, pompa air
  'Kamar Mandi': ['water heater', 'lampu', 'pompa air'],
  'Kamar mandi': ['water heater', 'lampu', 'pompa air'],

  // Garasi: lampu, charger EV (kalau ada), pompa ban
  'Garasi': ['lampu', 'charger'],
  'garasi': ['lampu', 'charger'],

  // Ruang Kerja: komputer/laptop, lampu, AC/kipas, printer
  'Ruang Kerja': ['komputer', 'ac', 'lampu', 'printer', 'kipas'],
  'Ruang kerja': ['komputer', 'ac', 'lampu', 'printer', 'kipas'],

  // Ruang TV: TV, konsol, soundbar, AC/kipas, lampu
  'Ruang TV': ['tv', 'ac', 'lampu', 'kipas'],
  'Ruang tv': ['tv', 'ac', 'lampu', 'kipas'],

  // Gudang: lampu (jarang perangkat lain)
  'Gudang': ['lampu'],
  'gudang': ['lampu'],

  // Teras: lampu, kipas angin
  'Teras': ['lampu', 'kipas'],
  'teras': ['lampu', 'kipas'],

  // Balkon: lampu
  'Balkon': ['lampu'],
  'balkon': ['lampu'],

  // Laundry: mesin cuci, lampu, setrika
  'Laundry': ['mesin cuci', 'lampu', 'setrika'],
  'laundry': ['mesin cuci', 'lampu', 'setrika'],

  // Ruang Serbaguna: AC, lampu, proyektor
  'Ruang Serbaguna': ['ac', 'lampu', 'proyektor'],
  'Ruang serbaguna': ['ac', 'lampu', 'proyektor'],

  // Lobi: AC, lampu
  'Lobi': ['ac', 'lampu'],
  'lobi': ['ac', 'lampu'],
}

// Template tips per perangkat
const DEVICE_TIPS = {
  ac: {
    id: 'ac-tip',
    type: 'tips',
    icon: 'ac',
    title: 'Atur suhu AC di 24–26°C',
    description: 'Menaikkan suhu AC 1°C menghemat ±6% energi pendinginan. Matikan AC saat ruangan kosong dan tutup jendela saat AC menyala.',
    savingsKwh: 18,
    priority: 'Tinggi',
  },
  lampu: {
    id: 'light-tip',
    type: 'tips',
    icon: 'sun',
    title: 'Gunakan lampu LED & pencahayaan alami',
    description: 'Ganti lampu konvensional ke LED yang hemat energi hingga 80%. Manfaatkan sinar matahari di siang hari untuk mengurangi penggunaan lampu.',
    savingsKwh: 9,
    priority: 'Sedang',
  },
  tv: {
    id: 'tv-tip',
    type: 'tips',
    icon: 'device',
    title: 'Matikan TV saat tidak ditonton',
    description: 'TV dalam mode standby tetap menyedot daya. Gunakan remote power-off dan cabut dari stopkontak jika tidak dipakai lama.',
    savingsKwh: 5,
    priority: 'Sedang',
  },
  kipas: {
    id: 'fan-tip',
    type: 'tips',
    icon: 'ac',
    title: 'Kipas angin lebih hemat dari AC',
    description: 'Kipas angin hanya mengonsumsi 50-70 watt dibanding AC 700-1000 watt. Gunakan kipas di ruangan dengan sirkulasi udara baik.',
    savingsKwh: 10,
    priority: 'Sedang',
  },
  kompor: {
    id: 'stove-tip',
    type: 'tips',
    icon: 'device',
    title: 'Gunakan kompor sesuai ukuran panci',
    description: 'Panci yang terlalu kecil untuk kompor gas membuang energi hingga 40%. Tutup panci saat memasak untuk mempercepat proses.',
    savingsKwh: 8,
    priority: 'Sedang',
  },
  kulkas: {
    id: 'fridge-tip',
    type: 'tips',
    icon: 'device',
    title: 'Jaga suhu kulkas di 3–5°C',
    description: 'Kulkas yang terlalu dingin mengonsumsi lebih banyak energi. Jangan simpan makanan panas langsung ke kulkas. Bersihkan kondensor secara berkala.',
    savingsKwh: 12,
    priority: 'Tinggi',
  },
  'water heater': {
    id: 'water-heater-tip',
    type: 'tips',
    icon: 'ac',
    title: 'Batasi waktu water heater',
    description: 'Water heater adalah salah satu perangkat terboros. Matikan setelah digunakan dan pertimbangkan shower hemat air.',
    savingsKwh: 20,
    priority: 'Tinggi',
  },
  komputer: {
    id: 'pc-tip',
    type: 'tips',
    icon: 'device',
    title: 'Aktifkan mode sleep pada komputer',
    description: 'Atur komputer ke sleep/hibernate setelah 10 menit tidak digunakan. Matikan monitor jika tidak dipakai.',
    savingsKwh: 8,
    priority: 'Sedang',
  },
  'mesin cuci': {
    id: 'washer-tip',
    type: 'tips',
    icon: 'device',
    title: 'Cuci pakaian dengan muatan penuh',
    description: 'Mesin cuci paling efisien saat muatan penuh. Gunakan mode cold wash untuk menghemat energi pemanas air.',
    savingsKwh: 7,
    priority: 'Sedang',
  },
  charger: {
    id: 'charger-tip',
    type: 'tips',
    icon: 'plug',
    title: 'Cabut charger setelah terisi penuh',
    description: 'Charger yang tercolok tanpa perangkat tetap menyedot daya. Cabut charger dari stopkontak setelah baterai penuh.',
    savingsKwh: 2,
    priority: 'Rendah',
  },
  blender: {
    id: 'blender-tip',
    type: 'tips',
    icon: 'device',
    title: 'Gunakan blender sesuai kebutuhan',
    description: 'Blender hanya perlu 30-60 detik untuk menghaluskan. Jangan jalankan terlalu lama karena memboroskan energi.',
    savingsKwh: 1,
    priority: 'Rendah',
  },
  'rice cooker': {
    id: 'ricecooker-tip',
    type: 'tips',
    icon: 'device',
    title: 'Cabut rice cooker setelah masak selesai',
    description: 'Rice cooker dalam mode warm tetap mengonsumsi 30-50 watt. Cabut setelah nasi matang untuk menghemat energi.',
    savingsKwh: 3,
    priority: 'Sedang',
  },
  printer: {
    id: 'printer-tip',
    type: 'tips',
    icon: 'device',
    title: 'Matikan printer saat tidak dipakai',
    description: 'Printer dalam standby tetap menyedot daya. Matikan printer dari tombol power dan cabut dari stopkontak.',
    savingsKwh: 3,
    priority: 'Rendah',
  },
  setrika: {
    id: 'iron-tip',
    type: 'tips',
    icon: 'device',
    title: 'Setrika pakaian sekaligus dalam satu sesi',
    description: 'Menyetrika sekaligus banyak pakaian lebih efisien daripada beberapa kali. Matikan setrika segera setelah selesai.',
    savingsKwh: 4,
    priority: 'Rendah',
  },
  proyektor: {
    id: 'projector-tip',
    type: 'tips',
    icon: 'device',
    title: 'Matikan proyektor saat tidak dipakai',
    description: 'Proyektor mengonsumsi banyak daya. Matikan saat presentasi selesai dan gunakan mode eco jika tersedia.',
    savingsKwh: 5,
    priority: 'Rendah',
  },
  'pompa air': {
    id: 'pump-tip',
    type: 'tips',
    icon: 'device',
    title: 'Periksa pompa air secara berkala',
    description: 'Pompa air yang bocor atau aus mengonsumsi lebih banyak energi. Pastikan pipa tidak bocor dan pompa dalam kondisi baik.',
    savingsKwh: 5,
    priority: 'Sedang',
  },
}

/**
 * Perangkat unik dari daftar ruangan.
 * @param {string[]} rooms
 */
export function devicesForRooms(rooms = []) {
  const set = new Set()
  rooms.forEach((room) => {
    ;(ROOM_DEVICE_MAP[room] || []).forEach((d) => set.add(d))
  })
  return [...set]
}

/**
 * Build recommendations berdasarkan records dan ruangan yang tersedia.
 * @param {Array} records - energy records
 * @param {string[]} availableRooms - daftar nama ruangan yang ada di gedung
 * @param {object} [opts]
 * @param {string|null} [opts.roomScope] - bila diisi, rekomendasi hanya untuk ruangan
 *   tersebut (mis. "Garasi") — perangkat di ruangan lain TIDAK ikut dipertimbangkan.
 */
export function buildRecommendations(records, availableRooms = [], { roomScope = null } = {}) {
  const recs = []
  const cur = monthRange(0)
  const prev = monthRange(-1)
  const curRecs = periodFromRecords(records, cur.start, cur.end)
  const prevRecs = periodFromRecords(records, prev.start, prev.end)
  const curStats = sumStats(curRecs)

  // === Trend analysis ===
  const trend = recentTrend(records, 7)
  if (trend && trend.pctChange > 8) {
    const extraKwh = Math.round((trend.recentAvg - trend.beforeAvg) * 30 * 10) / 10
    recs.push({
      id: 'trend-increase',
      type: 'trend',
      icon: 'trending-up',
      title: 'Konsumsi energi meningkat',
      description: `Penggunaan energi naik ${formatNumber(Math.round(trend.pctChange))}% dibanding 7 hari sebelumnya. Jika dibiarkan, estimasi tambahan ±${formatNumber(extraKwh)} kWh per bulan (${formatNumber(extraKwh * TARIFF)}).`,
      savingsKwh: Math.round(extraKwh * 0.5 * 10) / 10,
      savingsRp: Math.round(extraKwh * 0.5 * TARIFF),
      co2Impact: Math.round(extraKwh * 0.5 * EMISSION_FACTOR * 10) / 10,
      priority: 'Tinggi',
    })
  } else if (trend && trend.pctChange < -5) {
    recs.push({
      id: 'trend-decrease',
      type: 'trend',
      icon: 'trending-down',
      title: 'Penghematan tercatat!',
      description: `Konsumsi turun ${formatNumber(Math.abs(Math.round(trend.pctChange)))}% dibanding 7 hari sebelumnya. Pertahankan kebiasaan baikmu dan ajak orang lain melakukan hal yang sama.`,
      savingsKwh: 0,
      savingsRp: 0,
      co2Impact: 0,
      priority: 'Sedang',
    })
  }

  // === Monthly comparison ===
  if (curStats.totalKwh > 0) {
    const save = savingsVsPrevious(curRecs, prevRecs)
    if (save.pctChange > 5) {
      recs.push({
        id: 'month-over',
        type: 'month',
        icon: 'alert',
        title: 'Konsumsi bulan ini lebih tinggi',
        description: `Pemakaian bulan ini naik ${formatNumber(Math.round(save.pctChange))}% dibanding bulan lalu. Periksa penggunaan di ruangan dengan konsumsi tertinggi.`,
        savingsKwh: Math.round(curStats.totalKwh * 0.1 * 10) / 10,
        savingsRp: Math.round(curStats.totalKwh * 0.1 * TARIFF),
        co2Impact: Math.round(curStats.totalKwh * 0.1 * EMISSION_FACTOR * 10) / 10,
        priority: 'Tinggi',
      })
    } else {
      recs.push({
        id: 'month-ok',
        type: 'month',
        icon: 'check',
        title: 'Konsumsi terkendali',
        description: 'Pemakaian bulan ini sebanding dengan bulan lalu. Lanjutkan pemantauan rutin agar tagihan tetap terkendali.',
        savingsKwh: 0,
        savingsRp: 0,
        co2Impact: 0,
        priority: 'Rendah',
      })
    }
  }

  // === Room-aware tips ===
  // Saat ruangan tertentu dipilih (roomScope), hanya perangkat ruangan itu yang
  // dipertimbangkan — mis. "Garasi" hanya dapat tips lampu/charger, bukan AC.
  const roomList = roomScope ? [roomScope] : availableRooms

  // device -> daftar ruangan yang memilikinya (untuk deskripsi yang spesifik)
  const deviceRooms = {}
  roomList.forEach((room) => {
    const devices = ROOM_DEVICE_MAP[room] || []
    devices.forEach((d) => {
      if (!deviceRooms[d]) deviceRooms[d] = []
      if (!deviceRooms[d].includes(room)) deviceRooms[d].push(room)
    })
  })
  const allDevices = new Set(Object.keys(deviceRooms))

  // Jika tidak ada data ruangan, berikan tips umum yang netral — tanpa menebak
  // ada-tidaknya AC (menghindari saran AC untuk gedung yang tidak memilikinya).
  if (allDevices.size === 0) {
    allDevices.add('lampu')
    allDevices.add('charger')
    allDevices.add('kipas')
  }

  // Urutkan prioritas perangkat: ac & water heater (high saving) duluan
  const priorityOrder = ['water heater', 'ac', 'kulkas', 'kompor', 'komputer', 'tv', 'kipas', 'lampu', 'mesin cuci', 'rice cooker', 'printer', 'setrika', 'blender', 'charger', 'pompa air', 'proyektor']
  const sortedDevices = [...allDevices].sort((a, b) => {
    const ia = priorityOrder.indexOf(a)
    const ib = priorityOrder.indexOf(b)
    return (ia === -1 ? 999 : ia) - (ib === -1 ? 999 : ib)
  })

  // Tambahkan tips untuk setiap perangkat yang relevan (maks 5 tips)
  sortedDevices.slice(0, 5).forEach((device) => {
    const tip = DEVICE_TIPS[device]
    if (!tip) return
    const roomsWithDevice = deviceRooms[device]
    // Deskripsi dibuat spesifik per ruangan agar nyambung dengan gedung tsb
    const description = roomsWithDevice && roomsWithDevice.length
      ? `Di ruangan ${roomsWithDevice.join(', ')}: ${tip.description}`
      : tip.description
    recs.push({
      ...tip,
      description,
      savingsRp: tip.savingsKwh * TARIFF,
      co2Impact: Math.round(tip.savingsKwh * EMISSION_FACTOR * 10) / 10,
    })
  })

  // === Standby power tip (selalu ada) ===
  recs.push({
    id: 'standby-tip',
    type: 'tips',
    icon: 'plug',
    title: 'Matikan perangkat standby',
    description: 'Cabut charger, TV, dan perangkat elektronik dalam mode standby. Perangkat standby menyedot hingga 10% tagihan listrik.',
    savingsKwh: 12,
    savingsRp: 12 * TARIFF,
    co2Impact: Math.round(12 * EMISSION_FACTOR * 10) / 10,
    priority: 'Sedang',
  })

  return recs
}
