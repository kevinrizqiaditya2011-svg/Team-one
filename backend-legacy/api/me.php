<?php
require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../config/security.php';
require_once __DIR__ . '/../includes/auth.php';

cors_headers();

$user   = require_login();
$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    json_ok(['user' => $user]);
}

if ($method === 'PUT') {
    $body = read_json_body();

    $name         = sanitize_string($body['name'] ?? $user['name']);
    $userType     = valid_enum($body['user_type'] ?? $user['user_type'], ['Rumah', 'Sekolah', 'UMKM'], $user['user_type']);
    $energyTarget = isset($body['energy_target'])
        ? valid_float($body['energy_target'])
        : (float)$user['energy_target'];

    if (mb_strlen($name) < 2 || mb_strlen($name) > 100) {
        json_error('Nama harus 2-100 karakter.', 422);
    }
    if ($energyTarget === false || $energyTarget <= 0 || $energyTarget > 100000) {
        json_error('Target energi tidak valid.', 422);
    }

    $stmt = db()->prepare(
        'UPDATE users
            SET name = ?, user_type = ?, energy_target = ?
          WHERE id = ?'
    );
    $stmt->execute([$name, $userType, $energyTarget, $user['id']]);

    if (isset($body['points_delta'])) {
        $delta = (int)$body['points_delta'];
        if ($delta < -500 || $delta > 500) {
            json_error('Nilai perubahan poin tidak valid.', 422);
        }
        $stmt = db()->prepare('UPDATE users SET points = GREATEST(points + ?, 0) WHERE id = ?');
        $stmt->execute([$delta, $user['id']]);
    }

    $stmt = db()->prepare(
        'SELECT id, name, email, role, user_type, energy_target, points, level
           FROM users WHERE id = ? LIMIT 1'
    );
    $stmt->execute([$user['id']]);
    $updated = $stmt->fetch();

    json_ok(['message' => 'Profil diperbarui.', 'user' => $updated]);
}

json_error('Metode tidak diizinkan.', 405);
