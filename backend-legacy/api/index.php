<?php
require_once __DIR__ . '/../config/security.php';

cors_headers();

json_ok([
    'app'     => 'EnergiKita API',
    'message' => 'API berjalan. Semua query memakai PDO prepared statement (anti SQL injection).',
    'endpoints' => [
        'POST   /api/login.php          -> login (email + password)',
        'POST   /api/register.php       -> daftar akun baru',
        'POST   /api/logout.php         -> logout',
        'GET    /api/me.php             -> profil user yang login',
        'PUT    /api/me.php             -> update profil',
        'GET    /api/records.php        -> daftar catatan energi',
        'POST   /api/records.php        -> tambah catatan energi',
        'DELETE /api/records.php?id=X   -> hapus catatan energi',
        'GET    /api/goals.php          -> daftar goal',
        'POST   /api/goals.php          -> tambah goal',
        'PUT    /api/goals.php          -> update goal',
        'DELETE /api/goals.php?id=X     -> hapus goal',
        'GET    /api/challenges.php     -> katalog tantangan + progres',
        'POST   /api/challenges.php     -> ikut tantangan',
        'PATCH  /api/challenges.php     -> update progres tantangan',
        'GET    /api/achievements.php   -> daftar badge + status terbuka',
        'POST   /api/achievements.php   -> buka badge',
    ],
]);
