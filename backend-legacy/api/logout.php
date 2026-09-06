<?php
require_once __DIR__ . '/../config/security.php';
require_once __DIR__ . '/../includes/auth.php';

cors_headers();

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    json_error('Metode tidak diizinkan.', 405);
}

logout_user();

json_ok(['message' => 'Logout berhasil.']);
