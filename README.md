  <div align="center">

  # ⚡ EnergiKita

  ### Pantau listrik, hemat tanpa tebak-tebakan.

  Platform digital untuk memantau pemakaian listrik, memprediksi tagihan, dan membangun kebiasaan hemat energi dengan bantuan AI.

  [![Live Demo](https://img.shields.io/badge/🚀_Live_Demo-Visit_Site-success?style=for-the-badge)](https://energikita.my.id/)
  [![GitHub](https://img.shields.io/badge/GitHub-Repository-181717?style=for-the-badge&logo=github)](https://github.com/kevinrizqiaditya2011-svg/Team-one)

  **Submission for ITECHNO CUP 2026 - Web Development**

  **By Team One**

  </div>

  ---

  ## 📋 Daftar Isi

  - [Tentang Proyek](#-tentang-proyek)
  - [Fitur Unggulan](#-fitur-unggulan)
  - [Demo & Screenshot](#-demo--screenshot)
  - [Teknologi](#-teknologi)
  - [Arsitektur Sistem](#-arsitektur-sistem)
  - [Instalasi & Setup](#-instalasi--setup)
  - [Penggunaan](#-penggunaan)
  - [API Documentation](#-api-documentation)
  - [Testing](#-testing)
  - [Tim Developer](#-tim-developer)
  - [Lisensi](#-lisensi)

  ---

  ## 👥 Tim Developer

  | Nama | Peran | GitHub |
  |------|-------|--------|
  | **I Nyoman Ananta Murdita** | Project Lead & Full Stack Developer | [GitHub](https://github.com/[AnantaMurdita]) |
  | **Kevin Rizqi Aditya** | Frontend Developer | [GitHub](https://github.com/sucaya-host/) |
  | **I Made Dwi Sucaya Putra** | Backend Developer | [GitHub](https://github.com/kevinrizqiaditya2011-svg/) |

  ---

  ## 🎯 Tentang Proyek

  ### Latar Belakang

  Banyak rumah tangga, sekolah, dan UMKM tidak menyadari ke mana pemakaian listriknya
  mengalir — tagihan baru diketahui saat sudah jatuh tempo, tanpa tahu penyebabnya.
  Tanpa data, upaya hemat energi hanya mengandalkan tebakan. EnergiKita hadir untuk
  menutup celah itu: setiap kWh dicatat, dianalisis, dan diterjemahkan menjadi
  tindakan hemat yang konkret.

  ### Solusi yang Ditawarkan

  EnergiKita adalah **Sistem Manajemen Energi Cerdas** berbasis web yang menggabungkan:

  - **Pencatatan harian yang sederhana** — input angka meteran per hari, per gedung,
    bahkan per ruangan, cukup beberapa detik.
  - **Analisis otomatis** — tren konsumsi, perbandingan antar periode, dan pemakaian
    per ruangan (paling boros vs paling hemat) dihitung secara real-time.
  - **Rekomendasi AI (Google Gemini)** — saran hemat yang spesifik dan personal,
    disesuaikan dengan ruangan yang benar-benar ada di gedung pengguna (misalnya
    tidak menyarankan AC untuk garasi).
  - **Dampak lingkungan** — setiap kWh diterjemahkan menjadi estimasi biaya dan
    emisi CO₂, lengkap dengan kalkulator jejak karbon (listrik, transportasi, LPG).

  ### Tujuan Proyek

  - 🎯 **Tujuan Utama**: Membantu pengguna memantau, mengelola, dan mengoptimalkan
    konsumsi listrik secara berkelanjutan.
  - 📊 **Target Pengguna**: Rumah tangga, sekolah, UMKM, kantor, toko, dan kost —
    siapa pun yang ingin mengontrol tagihan listriknya.
  - 💡 **Value Proposition**: Berbeda dari sekadar kalkulator tagihan, EnergiKita
    menautkan data nyata per gedung/ruangan dengan rekomendasi AI yang kontekstual,
    plus laporan PDF yang bisa diexport.

  ---

  ## ✨ Fitur Unggulan

  ### Fitur Utama

  | Fitur | Deskripsi | Keunggulan |
  |----------|--------------|---------------|
  | **Dashboard Rekapitulasi** | Rekap pemakaian bulanan, tren konsumsi 6 bulan, dan ringkasan biaya/emisi | Visualisasi cepat: angka besar + grafik + bar target |
  | **Energy Monitor** | Catat pemakaian harian per gedung & ruangan, lengkap dengan riwayat | Grafik 7/30 hari, perbandingan bulanan, dan pemakaian per ruangan |
  | **Multi-gedung & Ruangan** | Kelola beberapa lokasi (Rumah, Sekolah, UMKM, Kantor, Toko, Kost) beserta daftar ruangannya | Analisis terpisah per gedung, pencarian berdasarkan nama gedung |
  | **Rekomendasi AI Hemat** | Saran penghematan dari Google Gemini yang disesuaikan dengan ruangan gedung | Kontekstual (tidak menyarankan AC untuk garasi), bisa disimpan sebagai tips |
  | **Laporan & Export PDF** | Susun laporan per tanggal/bulan/tahun lalu unduh sebagai PDF | Termasuk tren, perbandingan periode, pemakaian per ruangan, dan tips tersimpan |
  | **Kalkulator Karbon** | Hitung jejak karbon dari listrik, transportasi, dan LPG | Terjemahan kWh → kg CO₂ yang mudah dipahami |

  ### Fitur Tambahan

  - **Paling Boros vs Paling Hemat** - sorotan ruangan dengan konsumsi tertinggi dan terendah di dashboard.
  - **Tips Tersimpan** - simpan rekomendasi favorit dan hapus langsung dari halaman laporan.
  - **Autentikasi lengkap** - registrasi, login, lupa password, dan ganti password.
  - **Mode terang/gelap** - tampilan responsif dengan tema yang bisa diganti.
  - **Dual data mode** - memakai Firebase (Auth + Firestore) bila dikonfigurasi, atau API Laravel + MySQL sebagai mode utama.

  ---

  ## 📸 Demo & Screenshot

  ### Live Demo

  🔗 **[Kunjungi Website](https://energikita.my.id)**

  ### Screenshot Aplikasi

  <div align="center">
    <img src="https://drive.google.com/file/d/1Md2eE9K8gz-X8Sxzus1zYxJ72ujg0doS/view?usp=drive_link" alt="Homepage" width="800"/>
    <p><em>Homepage - Tampilan utama aplikasi</em></p>

    <img src="https://drive.google.com/file/d/10TvacanPo5QScWFCjPhQflJwF7DPjjly/view" alt="Dashboard" width="800"/>
    <p><em>Dashboard - Rekapitulasi energi & rekomendasi AI</em></p>

    <img src="[https://drive.google.com/file/d/1NMGodMkkKUYeakXRw0XN6P6LE6URwfwt/view?usp=drive_link]" alt="Laporan PDF" width="800"/>
    <p><em>Laporan - Export PDF pemakaian energi</em></p>
  </div>

  ### Video Demo

  📹 **[Link Video Demo](https://[URL_VIDEO])** _(opsional)_

  ---

  ## 🛠️ Teknologi

  ### Tech Stack

  #### Frontend
  ```
  Framework    : React 18 + Vite 5
  UI Library   : Tailwind CSS 3 + lucide-react (ikon)
  State Mgmt   : Context API (Auth, Places, Theme, Toast)
  Chart        : Recharts
  Export PDF   : jsPDF (+ canvg)
  Routing      : React Router 6
  ```

  #### Backend
  ```
  Runtime      : PHP 8.3+ (XAMPP)
  Framework    : Laravel 13
  Database     : MySQL (opsional SQLite untuk dev ringan)
  ORM          : Eloquent (prepared statement — anti SQL injection)
  Auth         : Session cookie (bukan token) + bcrypt
  AI           : Google Gemini API (rekomendasi hemat)
  ```

  #### DevOps & Tools
  ```
  Dev server   : Vite proxy /api → php artisan serve (port 8000)
  Testing      : PHPUnit (backend) · npm run build (frontend)
  Formatting   : Laravel Pint (backend)
  ```

  ### Alasan Pemilihan Teknologi

  | Teknologi | Alasan Pemilihan |
  |-----------|------------------|
  | **React + Vite** | Ekosistem besar, HMR cepat, dan cocok untuk SPA dashboard yang kaya grafik |
  | **Tailwind CSS** | Desain konsisten dengan palet kustom (Sirkuit, Voltase, Neon, Konduktor) tanpa CSS terpisah |
  | **Recharts** | Grafik area/bar/line interaktif yang ringan dan mudah dikonfigurasi |
  | **Laravel + Eloquent** | Keamanan (prepared statement), migrasi, dan REST API yang rapi |
  | **Session cookie auth** | Simpel untuk aplikasi web monolitik frontend+backend yang di-deploy bersama |
  | **Google Gemini** | Rekomendasi hemat yang dinamis dan kontekstual tanpa perlu melatih model sendiri |

  ### Dependencies Utama

  ```json
  {
    "dependencies": {
      "firebase": "^10.14.1",
      "jspdf": "^4.2.1",
      "lucide-react": "^0.454.0",
      "react": "^18.3.1",
      "react-dom": "^18.3.1",
      "react-router-dom": "^6.28.0",
      "recharts": "^2.13.3"
    },
    "devDependencies": {
      "autoprefixer": "^10.4.20",
      "postcss": "^8.4.49",
      "tailwindcss": "^3.4.15",
      "vite": "^5.4.11",
      "@vitejs/plugin-react": "^4.3.4"
    }
  }
  ```

  ```json
  {
    "require": {
      "php": "^8.3",
      "laravel/framework": "^13.8",
      "barryvdh/laravel-dompdf": "*",
      "laravel/tinker": "^3.0"
    }
  }
  ```

  ---

  ## 🏗️ Arsitektur Sistem

  ### System Architecture

  ```mermaid
  flowchart LR
      A[Browser - React SPA<br/>localhost:5173] -->|GET /api/* same-origin| B[Vite Proxy]
      B --> C[Laravel API<br/>php artisan serve :8000]
      C --> D[(MySQL<br/>database/energikita.sql)]
      C --> E[Google Gemini API<br/>rekomendasi hemat]
      A -.opsional Firebase Auth/Firestore.-> F[(Firebase)]
  ```

  Alur data utama:

  1. Frontend memakai `VITE_API_URL` (dev: `/api`) — Vite meneruskan ke Laravel
    lewat proxy di `vite.config.js` agar **same-origin** (cookie sesi tetap terkirim).
  2. Laravel memproses request dengan **Eloquent / prepared statement**, menghitung
    biaya & emisi CO₂ di server, lalu mengembalikan JSON `{ success: true, ... }`.
  3. Bila Firebase dikonfigurasi di `.env`, frontend otomatis beralih ke
    Firebase Auth + Firestore untuk seluruh koleksi data.
  4. Rekomendasi AI memanggil Google Gemini dengan konteks ruangan gedung
    (hasilnya di-cache 7 hari untuk hemat kuota).

  ### Database Schema

  Skema utama diimpor dari **`database/energikita.sql`** (MySQL), lalu migrasi
  Laravel menambahkan tabel/kolom untuk fitur multi-gedung:

  ```
  users              -> akun pengguna (bcrypt password_hash, user_type, energy_target)
  energy_records     -> catatan pemakaian harian (kwh, cost, place_id, room, estimated_co2)
  places             -> gedung/lokasi (name, photo, location_type, rooms, energy_target)
  ```

  ### Folder Structure

  ```
  energikita/
  ├── src/                     # Frontend React (Vite)
  │   ├── components/          # Komponen reusable (ui/, PlaceSwitcher)
  │   ├── pages/               # Halaman (Dashboard, Monitor, Rekomendasi, dll.)
  │   ├── layouts/             # AppLayout (sidebar + header)
  │   ├── hooks/               # Custom hooks (useUserData, useAiRecommendations)
  │   ├── context/             # AuthContext, PlaceContext, ThemeContext, ToastContext
  │   ├── services/            # db.js, authService, energyService, geminiService
  │   ├── utils/               # format.js, hooks.js
  │   └── config/              # firebase.js
  ├── backend/                 # Backend Laravel (API + MySQL)
  │   ├── app/Http/Controllers/Api/
  │   ├── routes/api.php       # Definisi endpoint REST
  │   └── database/migrations/ # Migrasi fitur multi-gedung
  ├── database/                # Skema utama: energikita.sql
  ├── index.html
  ├── vite.config.js           # Proxy /api → 127.0.0.1:8000
  └── tailwind.config.js       # Palet kustom EnergiKita
  ```

  ---

  ## ⚙️ Instalasi & Setup

  ### Prerequisites

  Pastikan Anda telah menginstall:

  - **Node.js** (v18+)
  - **npm**
  - **PHP 8.3+** dan **Composer 2.x**
  - **MySQL** (mis. XAMPP) — atau SQLite untuk dev ringan
  - **Git**

  ### Langkah Instalasi

  #### 1️⃣ Clone Repository

  ```bash
  git clone https://github.com/kevinrizqiaditya2011-svg/Team-one.git
  cd [Team-one]
  ```

  #### 2️⃣ Setup Backend (Laravel)

  ```bash
  # Impor skema + katalog badge/tantangan ke MySQL
  # Buka phpMyAdmin -> tab SQL -> jalankan isi database/energikita.sql

  cd backend
  composer install
  cp .env.example .env
  php artisan key:generate
  ```

  Sesuaikan kredensial database di `backend/.env`:

  ```env
  DB_CONNECTION=mysql
  DB_HOST=127.0.0.1
  DB_PORT=3306
  DB_DATABASE=energikita
  DB_USERNAME=root
  DB_PASSWORD=
  ```

  > Untuk dev ringan tanpa MySQL, cukup set `DB_CONNECTION=sqlite` dan buat file
  > `backend/database/database.sqlite`.

  ```bash
  # Jalankan migrasi tambahan (tabel places + place_id, otomatis membuat
  # gedung 'Utama' untuk setiap akun)
  php artisan migrate

  # Jalankan server API
  php artisan serve --port=8000
  ```

  #### 3️⃣ Setup Frontend (React + Vite)

  ```bash
  npm install
  cp .env.example .env
  ```

  Isi variabel di `.env` sesuai kebutuhan:

  ```env
  # API Laravel (dev memakai /api — diteruskan Vite ke backend via proxy)
  VITE_API_URL=/api

  # Opsional: Firebase Auth + Firestore (bila dikosongkan, memakai Laravel API + MySQL)
  VITE_FIREBASE_API_KEY=
  VITE_FIREBASE_AUTH_DOMAIN=
  VITE_FIREBASE_PROJECT_ID=
  VITE_FIREBASE_STORAGE_BUCKET=
  VITE_FIREBASE_MESSAGING_SENDER_ID=
  VITE_FIREBASE_APP_ID=

  # Google Gemini AI (untuk rekomendasi hemat energi)
  # Ambil kunci gratis di https://aistudio.google.com/apikey
  VITE_GEMINI_API_KEY=
  VITE_GEMINI_MODEL=gemini-3.6-flash
  ```

  #### 4️⃣ Run Development Server

  ```bash
  npm run dev
  ```

  Aplikasi akan berjalan di **http://localhost:5173** (backend di :8000).

  > 💡 Backend PHP single-threaded — untuk dev yang lebih responsif jalankan
  > `PHP_CLI_SERVER_WORKERS=4 php artisan serve --port=8000`.

  ---

  ## 🚀 Penggunaan

  ### Menjalankan Aplikasi

  ```bash
  # Terminal 1 — backend
  cd backend && php artisan serve --port=8000

  # Terminal 2 — frontend
  npm run dev

  # Production build
  npm run build
  npm run preview

  # Test backend
  cd backend && php artisan test
  ```

  ### User Guide

  1. **Registrasi/Login** — daftar gratis, pilih jenis gedung (Rumah, Sekolah,
    UMKM, Kantor, Toko, Kost). Verifikasi email opsional; tersedia tombol login
    demo (`demo@energikita.id` / `demo1234`) bila database berisi akun demo.
  2. **Tambah Gedung & Ruangan** — di halaman Gedung, unggah foto dan pilih minimal
    2 ruangan (Garasi, Dapur, Lobi, dll.). Cari gedung berdasarkan nama.
  3. **Catat Pemakaian** — di Energy Monitor, pilih tanggal, ruangan, dan isi kWh.
    Biaya & emisi CO₂ dihitung otomatis (tarif Rp1.450/kWh, faktor 0,85 kg/kWh).
  4. **Dashboard** — lihat tren konsumsi 6 bulan, ruangan paling boros vs paling
    hemat, dan rekomendasi AI yang kontekstual.
  5. **Rekomendasi AI** — pilih gedung (dan ruangan opsional); AI memberi saran
    sesuai perangkat yang ada. Simpan tips favorit untuk dibawa ke laporan.
  6. **Laporan** — pilih periode (tanggal/bulan/tahun), pratinjau, lalu export PDF.
    Tips tersimpan bisa dihapus langsung dari halaman laporan.
  7. **Kalkulator Karbon** — masukkan pemakaian listrik, jarak kendaraan, dan LPG
    untuk melihat jejak karbon total.

  ---

  ## 📚 API Documentation

  ### Base URL

  ```
  Development: http://localhost:8000/api  (via Vite proxy: /api)
  Production:  https://api.energikita.my.id/api
  ```

  Semua respons JSON: `{ success: true, ... }` atau `{ success: false, message }`.
  Autentikasi memakai **session cookie** — frontend mengirim `credentials: 'include'`.

  ### Endpoints

  #### Authentication

  ```http
  POST   /api/login             # login (email + password)
  POST   /api/register          # daftar akun baru
  POST   /api/logout            # logout
  GET    /api/me                # profil user yang login
  PUT    /api/me                # update profil (parsial)
  PUT    /api/me/password       # ganti password
  POST   /api/email/verification-notification   # kirim email verifikasi
  GET    /api/verify-email/{token}              # verifikasi email via token
  ```

  #### Data Energi

  ```http
  GET    /api/records           # daftar catatan energi
  POST   /api/records           # tambah catatan (biaya/CO₂ dihitung server)
  DELETE /api/records?id=X      # hapus catatan

  GET    /api/places            # daftar gedung/lokasi + statistik
  POST   /api/places            # tambah gedung
  PUT    /api/places            # update gedung (parsial)
  DELETE /api/places?id=X       # hapus gedung beserta catatannya
  ```

  #### Gallery Rewards & Treks

  ```http
  GET    /api/achievements      # daftar badge + status terbuka
  POST   /api/achievements      # buka badge

  GET    /api/challenges        # katalog tantangan + progres
  POST   /api/challenges        # ikut tantangan
  PATCH  /api/challenges        # update progres / klaim reward
  ```

  ### Example Request

  ```javascript
  // Login
  const response = await fetch('/api/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({
      email: 'user@example.com',
      password: 'password123',
    }),
  });

  // Tambah catatan energi
  const res = await fetch('/api/records', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({
      record_date: '2026-09-04',
      kwh: 12.5,
      place_id: 1,
      room: 'Dapur',
    }),
  });
  ```

  > 🔒 Keamanan: login dibatasi 5 percobaan/15 menit per email, route login/register
  > memakai rate limiting, dan semua query memakai Eloquent/prepared statement.

  ---

  ## 🧪 Testing

  ### Running Tests

  ```bash
  # Backend — unit test Laravel (PHPUnit)
  cd backend && php artisan test

  # Frontend — verifikasi build produksi
  npm run build
  ```

  ### Test Coverage

  ```bash
  # Backend
  cd backend && php artisan test --coverage
  ```

  ---

  ## 📄 Lisensi

  Proyek ini dilisensikan di bawah [MIT License](LICENSE) - lihat file LICENSE untuk detail lebih lanjut.

  ---

  <div align="center">

  **Made with ❤️ by Team One for ITECHNO CUP 2026**

  </div>