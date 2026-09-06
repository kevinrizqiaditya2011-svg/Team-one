-- ============================================================
-- EnergiKita — skema database (TANPA data contoh)
-- ------------------------------------------------------------
-- File ini HANYA berisi struktur tabel + katalog badge & tantangan.
-- Tidak ada akun/records/goals dummy — database mulai dari nol,
-- data diisi lewat aplikasi (registrasi + Energy Monitor).
--
-- Catatan: tabel `places` dan kolom `energy_records.place_id`
-- (fitur analisis per gedung) ditambahkan lewat migrasi Laravel:
--     cd backend && php artisan migrate
-- ============================================================

CREATE DATABASE IF NOT EXISTS energikita
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE energikita;

SET FOREIGN_KEY_CHECKS = 0;
DROP TABLE IF EXISTS user_challenges, achievements, goals, energy_records,
                    challenges, badges, users;
SET FOREIGN_KEY_CHECKS = 1;

CREATE TABLE users (
  id            INT UNSIGNED     NOT NULL AUTO_INCREMENT,
  firebase_uid  VARCHAR(128)     NULL COMMENT 'UID Firebase Auth (opsional)',
  name          VARCHAR(100)     NOT NULL COMMENT 'Nama lengkap',
  email         VARCHAR(150)     NOT NULL COMMENT 'Email login (unik)',
  password_hash VARCHAR(255)     NOT NULL COMMENT 'Hash dari password_hash() PHP',
  role          ENUM('user','admin') NOT NULL DEFAULT 'user',
  user_type     ENUM('Rumah','Sekolah','UMKM') NOT NULL DEFAULT 'Rumah',
  energy_target DECIMAL(8,1)     NOT NULL DEFAULT 300.0 COMMENT 'Target kWh/bulan',
  points        INT              NOT NULL DEFAULT 0 COMMENT 'XP / poin sustainabilitas',
  level         INT              NOT NULL DEFAULT 1 COMMENT 'Level (diturunkan dari poin)',
  created_at    TIMESTAMP        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_users_email (email),
  UNIQUE KEY uq_users_firebase_uid (firebase_uid)
) ENGINE = InnoDB COMMENT = 'Akun pengguna EnergiKita';

CREATE TABLE energy_records (
  id            INT UNSIGNED  NOT NULL AUTO_INCREMENT,
  user_id       INT UNSIGNED  NOT NULL,
  record_date   DATE          NOT NULL COMMENT 'Tanggal pemakaian',
  kwh           DECIMAL(10,2) NOT NULL COMMENT 'Konsumsi listrik (kWh)',
  cost          INT UNSIGNED  NOT NULL COMMENT 'Estimasi biaya (Rp)',
  location_type ENUM('Rumah','Sekolah','UMKM') NOT NULL DEFAULT 'Rumah',
  estimated_co2 DECIMAL(10,2) NOT NULL COMMENT 'Estimasi emisi CO2 (kg)',
  created_at    TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_records_user_date (user_id, record_date),
  CONSTRAINT fk_records_user FOREIGN KEY (user_id)
    REFERENCES users (id) ON DELETE CASCADE
) ENGINE = InnoDB COMMENT = 'Catatan konsumsi energi harian pengguna';

CREATE TABLE goals (
  id          INT UNSIGNED  NOT NULL AUTO_INCREMENT,
  user_id     INT UNSIGNED  NOT NULL,
  title       VARCHAR(150)  NOT NULL COMMENT 'Judul target',
  description VARCHAR(255)  NULL,
  target      DECIMAL(12,2) NOT NULL COMMENT 'Nilai target',
  current     DECIMAL(12,2) NOT NULL DEFAULT 0 COMMENT 'Progres saat ini',
  unit        ENUM('%','Rp','kWh','kg') NOT NULL DEFAULT '%',
  deadline    DATE          NULL,
  status      ENUM('active','completed') NOT NULL DEFAULT 'active',
  created_at  TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_goals_user_status (user_id, status),
  CONSTRAINT fk_goals_user FOREIGN KEY (user_id)
    REFERENCES users (id) ON DELETE CASCADE
) ENGINE = InnoDB COMMENT = 'Target hemat energi pengguna';

CREATE TABLE badges (
  code        VARCHAR(50)  NOT NULL COMMENT 'Kode badge, mis. eco-starter',
  name        VARCHAR(100) NOT NULL,
  description VARCHAR(255) NOT NULL,
  icon        VARCHAR(50)  NOT NULL COMMENT 'Nama ikon Lucide',
  color       CHAR(7)      NOT NULL COMMENT 'Warna hex, mis. #10b981',
  PRIMARY KEY (code)
) ENGINE = InnoDB COMMENT = 'Katalog badge / achievement';

CREATE TABLE achievements (
  id          INT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id     INT UNSIGNED NOT NULL,
  badge_code  VARCHAR(50)  NOT NULL,
  unlocked_at TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_ach_user_badge (user_id, badge_code),
  CONSTRAINT fk_ach_user FOREIGN KEY (user_id)
    REFERENCES users (id) ON DELETE CASCADE,
  CONSTRAINT fk_ach_badge FOREIGN KEY (badge_code)
    REFERENCES badges (code) ON DELETE CASCADE
) ENGINE = InnoDB COMMENT = 'Badge yang sudah terbuka per pengguna';

CREATE TABLE challenges (
  id          INT UNSIGNED NOT NULL AUTO_INCREMENT,
  code        VARCHAR(50)  NOT NULL COMMENT 'Kode, mis. ch_standby',
  title       VARCHAR(150) NOT NULL,
  description VARCHAR(255) NOT NULL,
  reward      INT UNSIGNED NOT NULL COMMENT 'XP yang didapat saat selesai',
  difficulty  ENUM('Mudah','Sedang','Sulit') NOT NULL DEFAULT 'Mudah',
  icon        VARCHAR(50)  NOT NULL COMMENT 'Nama ikon Lucide',
  target      INT UNSIGNED NOT NULL COMMENT 'Nilai target penyelesaian',
  PRIMARY KEY (id),
  UNIQUE KEY uq_challenges_code (code)
) ENGINE = InnoDB COMMENT = 'Katalog tantangan hemat energi';

CREATE TABLE user_challenges (
  id             INT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id        INT UNSIGNED NOT NULL,
  challenge_id   INT UNSIGNED NOT NULL,
  progress       INT UNSIGNED NOT NULL DEFAULT 0 COMMENT 'Progres saat ini',
  target         INT UNSIGNED NOT NULL COMMENT 'Target tantangan',
  completed      BOOLEAN      NOT NULL DEFAULT FALSE,
  reward_claimed BOOLEAN      NOT NULL DEFAULT FALSE,
  joined_at      TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_uc_user_challenge (user_id, challenge_id),
  CONSTRAINT fk_uc_user FOREIGN KEY (user_id)
    REFERENCES users (id) ON DELETE CASCADE,
  CONSTRAINT fk_uc_challenge FOREIGN KEY (challenge_id)
    REFERENCES challenges (id) ON DELETE CASCADE
) ENGINE = InnoDB COMMENT = 'Tantangan yang diikuti pengguna';

-- Katalog badge (konfigurasi aplikasi — bukan data dummy)
INSERT INTO badges (code, name, description, icon, color) VALUES
  ('eco-starter',        'Eco Starter',         'Catat data energi pertamamu di Energy Monitor.', 'sprout',  '#10b981'),
  ('data-collector',     'Data Collector',      'Catat 7 data energi secara rutin.',               'clipboard','#0ea5e9'),
  ('energy-saver',       'Energy Saver',        'Hemat total 50 kWh energi.',                      'zap',     '#f59e0b'),
  ('green-champion',     'Green Champion',      'Kurangi 20 kg emisi CO2.',                        'leaf',    '#059669'),
  ('goal-setter',        'Goal Setter',         'Selesaikan 1 goal hemat energi.',                 'target',  '#8b5cf6'),
  ('sustainability-hero','Sustainability Hero', 'Selesaikan 3 challenge hemat energi.',            'trophy',  '#e11d48');

-- Katalog tantangan (konfigurasi aplikasi — bukan data dummy)
INSERT INTO challenges (code, title, description, reward, difficulty, icon, target) VALUES
  ('ch_standby',  '7 Hari Tanpa Standby',      'Cabut semua perangkat yang tidak dipakai selama 7 hari berturut-turut.',     150, 'Mudah', 'plug',          7),
  ('ch_10pct',    'Hemat 10% Minggu Ini',      'Kurangi penggunaan listrik sebesar 10% dibanding minggu lalu.',             200, 'Sedang','trending-down', 10),
  ('ch_led',      'Ganti ke LED',              'Ganti minimal 3 lampu konvensional menjadi lampu LED di rumah.',             120, 'Mudah', 'lamp',          3),
  ('ch_natural',  '5 Hari Cahaya Alami',       'Gunakan pencahayaan alami dan matikan lampu pada siang hari selama 5 hari.',  180, 'Sedang','sun',           5),
  ('ch_public',   'Naik Transportasi Umum',    'Gunakan transportasi umum 5 kali dalam seminggu sebagai pengganti kendaraan pribadi.', 250, 'Sulit', 'bus', 5),
  ('ch_monthly',  'Tagihan Turun 15%',         'Kurangi tagihan listrik bulanan sebesar 15% dari bulan sebelumnya.',        300, 'Sulit', 'wallet',        15);

CREATE OR REPLACE VIEW v_monthly_consumption AS
SELECT user_id,
       DATE_FORMAT(record_date, '%Y-%m') AS bulan,
       ROUND(SUM(kwh), 1)          AS total_kwh,
       SUM(cost)                    AS total_biaya,
       ROUND(SUM(estimated_co2), 2) AS total_co2,
       COUNT(*)                     AS jumlah_catatan
FROM energy_records
GROUP BY user_id, DATE_FORMAT(record_date, '%Y-%m');
