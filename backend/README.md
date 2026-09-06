# EnergiKita — Backend Laravel 13 (API + MySQL)

Backend REST API resmi untuk frontend React (Vite) EnergiKita.
Menggantikan backend PHP polos lama (masih tersimpan di `backend-legacy/`).

Semua query memakai **Eloquent / prepared statement** — tidak ada input user
yang digabung langsung ke SQL → **anti SQL injection**. Biaya & emisi CO₂
dihitung di server, dan setiap data di-scope ke user yang login.

## Persyaratan

- PHP **8.2+** (proyek ini memakai XAMPP PHP 8.3.33; backup versi lama ada di
  `C:\xampp\php-8.0.30-backup`)
- Composer 2.x
- MySQL berjalan (XAMPP) dengan database `energikita`

## Setup (jika dari repo baru)

```bash
# 1. Impor skema + data contoh ke MySQL
#    Buka phpMyAdmin -> tab SQL -> jalankan isi database/energikita.sql

# 2. Install dependency & siapkan .env
cd backend
composer install
cp .env.example .env
php artisan key:generate

# 3. Sesuaikan kredensial database di .env
#    DB_CONNECTION=mysql, DB_DATABASE=energikita, DB_USERNAME=root, DB_PASSWORD=

# 4. Jalankan migrasi tambahan (tabel places + place_id di energy_records,
#    otomatis membuat gedung 'Utama' dan menautkan catatan lama)
php artisan migrate

# 5. (Opsional) Aktifkan password akun lama bertanda placeholder — hanya relevan
#    bila database masih berisi user contoh lama (demo/sari/budi)
php artisan db:seed --class=SetDemoPasswordsSeeder

# 6. Jalankan server
php artisan serve --port=8000
```

> 💡 **Server dev PHP itu single-threaded** — setiap request diproses satu per
> satu, jadi request paralel dari frontend (records, goals, challenges, dll.)
> sebenarnya diantrekan. Untuk dev yang lebih responsif, jalankan dengan worker
> paralel (dari direktori `backend`):
>
> ```bash
> PHP_CLI_SERVER_WORKERS=4 php artisan serve --port=8000
> ```

> Skema tabel utama dibuat oleh `database/energikita.sql`; migrasi hanya
> menambah tabel `places` (fitur analisis per gedung) dan kolom
> `energy_records.place_id`. Akun baru otomatis mendapat gedung default
> bernama 'Utama'.

## Database mulai dari nol

`database/energikita.sql` **tidak lagi berisi data contoh** — hanya skema tabel +
katalog badge & tantangan. Tidak ada akun demo bawaan: akun dibuat lewat halaman
Registrasi aplikasi, lalu otomatis mendapat gedung 'Utama' dan mulai dengan
total catatan 0.

## Endpoint

Semua respons JSON: `{ success: true, ... }` atau `{ success: false, message }`.

| Metode | Path                  | Keterangan                    |
| ------ | --------------------- | ----------------------------- |
| GET    | /api                  | daftar endpoint               |
| POST   | /api/login            | login (email + password)      |
| POST   | /api/register         | daftar akun baru              |
| POST   | /api/logout           | logout                        |
| GET    | /api/me               | profil user yang login        |
| PUT    | /api/me               | update profil (parsial)       |
| GET    | /api/records          | daftar catatan energi         |
| POST   | /api/records          | tambah catatan (biaya/CO2 server) |
| DELETE | /api/records?id=X     | hapus catatan                 |
| GET    | /api/achievements     | daftar badge + status terbuka |
| POST   | /api/achievements     | buka badge                    |
| GET    | /api/challenges       | katalog tantangan + progres   |
| POST   | /api/challenges       | ikut tantangan                |
| PATCH  | /api/challenges       | update progres / klaim reward |
| GET    | /api/places           | daftar gedung/lokasi + statistik |
| POST   | /api/places           | tambah gedung                 |
| PUT    | /api/places           | update gedung (parsial)       |
| DELETE | /api/places?id=X      | hapus gedung beserta catatannya    |

## Catatan keamanan

1. Autentikasi session-cookie (bukan token), frontend memakai `credentials: 'include'`.
2. Proteksi brute-force login: maksimal 5 percobaan / 15 menit per email.
3. Rate limiting `throttle` pada route login/register.
4. CORS hanya mengizinkan origin dev frontend (`localhost:5173`) + credentials.
5. Password di-hash bcrypt (`password_hash`) — sama dengan backend lama, jadi
   data user yang sudah ada tetap bisa login.

## Menjalankan frontend + backend bersamaan

```bash
# Terminal 1 — backend
cd backend && php artisan serve --port=8000

# Terminal 2 — frontend
npm install
npm run dev        # http://localhost:5173
```

Frontend membaca URL API dari `VITE_API_URL` (di dev bernilai `/api` — diteruskan
Vite ke Laravel lewat **proxy** di `vite.config.js`, jadi semua request same-origin
ke `http://localhost:5173/api/*`. Ini menghindari masalah CORS, cookie sesi
cross-site, dan perbedaan host `localhost` vs `127.0.0.1`).
