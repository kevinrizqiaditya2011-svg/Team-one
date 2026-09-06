# EnergiKita — Backend PHP Aman (PDO + Prepared Statement)

Backend REST API untuk database MySQL `energikita` (XAMPP / phpMyAdmin).
Semua akses database memakai **PDO prepared statement asli** — tidak ada
satu pun input user yang digabung langsung ke SQL → **anti SQL injection**.

## Struktur folder

```
backend/
├── .htaccess                  # keamanan Apache (blokir folder internal)
├── README.md
├── config/
│   ├── database.php           # koneksi PDO (satu-satunya tempat koneksi)
│   └── security.php           # CORS, JSON, validasi input, error handler
├── includes/
│   └── auth.php               # session login/logout yang aman
├── api/
│   ├── index.php              # daftar endpoint
│   ├── login.php              # login (email + password)
│   ├── register.php           # daftar akun baru
│   ├── logout.php             # logout
│   ├── me.php                 # profil user (GET/PUT)
│   ├── records.php            # CRUD energy_records
│   ├── goals.php              # CRUD goals
│   ├── challenges.php         # katalog + ikut + progres tantangan
│   └── achievements.php       # badge & achievements
└── tools/
    └── set_demo_passwords.php # perbaiki hash password akun demo (CLI)
```

## Cara pasang (3 langkah)

### 1. Salin ke htdocs

Salin folder `backend` ke `C:\xampp\htdocs\` lalu ganti nama menjadi
`energikita-api` (atau nama lain). Hasilnya:

```
C:\xampp\htdocs\energikita-api\
```

Pastikan database `energikita` sudah diimpor dari `database/energikita.sql`
(lihat README di project utama). Apache & MySQL di XAMPP harus **Running**.

### 2. (Disarankan) Buat user MySQL khusus — jangan pakai root

Buka **http://localhost/phpmyadmin** → tab **SQL** → jalankan:

```sql
CREATE USER 'energikita_app'@'localhost' IDENTIFIED BY 'ganti_password_kuat';
GRANT SELECT, INSERT, UPDATE, DELETE ON energikita.* TO 'energikita_app'@'localhost';
FLUSH PRIVILEGES;
```

Lalu ubah kredensial di `config/database.php`:

```php
define('DB_USER', 'energikita_app');
define('DB_PASS', 'ganti_password_kuat');
```

### 3. Aktifkan password akun demo

Hash password di tabel `users` masih placeholder (sengaja dari file SQL).
Jalankan sekali dari terminal (folder `backend`):

```
C:\xampp\php\php.exe tools\set_demo_passwords.php
```

Selesai. Akun demo kini bisa login dengan password **`demo1234`**:
`demo@energikita.id`, `sari@example.com`, `budi@example.com`.

Cek API: buka **http://localhost/energikita-api/api/index.php** — harus
muncul JSON berisi daftar endpoint.

## Contoh pemakaian (curl)

```bash
# 1. Login -> simpan cookie session
curl -c cookies.txt -X POST http://localhost/energikita-api/api/login.php \
  -H "Content-Type: application/json" \
  -d '{"email":"demo@energikita.id","password":"demo1234"}'

# 2. Ambil catatan energi
curl -b cookies.txt "http://localhost/energikita-api/api/records.php?limit=5"

# 3. Tambah catatan energi (biaya & CO2 dihitung server)
curl -b cookies.txt -X POST http://localhost/energikita-api/api/records.php \
  -H "Content-Type: application/json" \
  -d '{"record_date":"2026-08-02","kwh":13.4,"location_type":"Rumah"}'

# 4. Ikut tantangan & update progres
curl -b cookies.txt -X POST http://localhost/energikita-api/api/challenges.php \
  -H "Content-Type: application/json" -d '{"challenge_id":3}'
curl -b cookies.txt -X PATCH http://localhost/energikita-api/api/challenges.php \
  -H "Content-Type: application/json" -d '{"user_challenge_id":3,"progress":3}'
```

## Mengapa aman dari SQL injection?

1. **Prepared statement asli** — `PDO::ATTR_EMULATE_PREPARES => false`.
   Query dan data dikirim terpisah ke MySQL; input `' OR 1=1 --` hanya
   dianggap *data*, bukan perintah SQL.
2. **Tidak ada string concatenation** untuk nilai input. Kolom `ORDER BY`
   hanya boleh dari daftar putih; `LIMIT` dipaksa integer; nilai ENUM
   divalidasi terhadap daftar yang diizinkan.
3. **Server menghitung biaya & CO2** — client tidak bisa memalsukan angka.
4. **Password di-hash** dengan `password_hash()` (bcrypt) dan dicek dengan
   `password_verify()` — tidak pernah disimpan/dibandingkan sebagai teks.
5. **Otorisasi per-baris** — setiap query data milik user selalu memakai
   `WHERE user_id = ?` dari session, jadi user lain tidak bisa baca/ubah/hapus
   data milik orang lain.
6. **Error detail tidak bocor** — exception hanya masuk log server
   (`error_log`), client hanya mendapat pesan umum.
7. **Brute-force protection** di login (5x percobaan / 15 menit).
8. **`.htaccess`** memblokir akses browser ke `config/`, `includes/`,
   `tools/` dan file `.sql`.

## Ceklist produksi (jika di-deploy)

- [ ] Ganti `root` dengan user MySQL khusus (langkah 2 di atas).
- [ ] Hapus/amankan folder `tools/`.
- [ ] Aktifkan HTTPS, lalu set `'secure' => true` di `includes/auth.php`.
- [ ] Matikan `display_errors` di `php.ini` (biarkan `log_errors` = On).
- [ ] Gunakan `POST` untuk login/logout (sudah default di sini).
- [ ] Pertimbangkan CSRF token bila dipakai lintas situs.
