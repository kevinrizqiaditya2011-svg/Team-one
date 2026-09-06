<?php
require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../config/security.php';
require_once __DIR__ . '/../includes/auth.php';

cors_headers();

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    json_error('Metode tidak diizinkan.', 405);
}

$body = read_json_body();
$name         = sanitize_string($body['name'] ?? '');
$email        = sanitize_string($body['email'] ?? '');
$password     = (string)($body['password'] ?? '');
$userType     = valid_enum($body['user_type'] ?? 'Rumah', ['Rumah', 'Sekolah', 'UMKM'], 'Rumah');
$energyTarget = valid_float($body['energy_target'] ?? 300);

if (mb_strlen($name) < 2 || mb_strlen($name) > 100) {
    json_error('Nama harus 2-100 karakter.', 422);
}
if (!valid_email($email) || strlen($email) > 150) {
    json_error('Format email tidak valid.', 422);
}
if (strlen($password) < 8 || strlen($password) > 72) {
    json_error('Password harus 8-72 karakter.', 422);
}
if ($energyTarget === false || $energyTarget <= 0 || $energyTarget > 100000) {
    json_error('Target energi tidak valid.', 422);
}

$stmt = db()->prepare('SELECT id FROM users WHERE email = ? LIMIT 1');
$stmt->execute([$email]);
if ($stmt->fetch() !== false) {
    json_error('Email sudah terdaftar.', 409);
}

$hash = password_hash($password, PASSWORD_DEFAULT);

try {
    $stmt = db()->prepare(
        'INSERT INTO users (name, email, password_hash, user_type, energy_target)
         VALUES (?, ?, ?, ?, ?)'
    );
    $stmt->execute([$name, $email, $hash, $userType, $energyTarget]);
} catch (PDOException $e) {
    if ($e->getCode() === '23000') {
        json_error('Email sudah terdaftar.', 409);
    }
    throw $e;
}
$id = (int)db()->lastInsertId();

login_user(['id' => $id, 'role' => 'user']);

json_ok([
    'message' => 'Registrasi berhasil.',
    'user' => [
        'id'       => $id,
        'name'     => $name,
        'email'    => $email,
        'role'     => 'user',
        'userType' => $userType,
    ],
], 201);
