<?php
require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../config/security.php';
require_once __DIR__ . '/../includes/auth.php';

cors_headers();

$user   = require_login();
$method = $_SERVER['REQUEST_METHOD'];

switch ($method) {

    case 'GET':
        $stmt = db()->prepare(
            'SELECT b.code, b.name, b.description, b.icon, b.color,
                    (a.badge_code IS NOT NULL) AS unlocked,
                    a.unlocked_at
               FROM badges b
               LEFT JOIN achievements a
                      ON a.badge_code = b.code AND a.user_id = ?
              ORDER BY b.code'
        );
        $stmt->execute([$user['id']]);
        json_ok(['badges' => $stmt->fetchAll()]);

    case 'POST':
        $body = read_json_body();
        $code = sanitize_string($body['badge_code'] ?? '');
        if ($code === '') {
            json_error('Kode badge wajib diisi.', 422);
        }
        if (strlen($code) > 50) {
            json_error('Kode badge terlalu panjang.', 422);
        }

        $stmt = db()->prepare('SELECT code FROM badges WHERE code = ?');
        $stmt->execute([$code]);
        if ($stmt->fetch() === false) {
            json_error('Badge tidak dikenal.', 404);
        }

        try {
            $stmt = db()->prepare(
                'INSERT INTO achievements (user_id, badge_code) VALUES (?, ?)'
            );
            $stmt->execute([$user['id'], $code]);
        } catch (PDOException $e) {
            if ($e->getCode() === '23000') {
                json_error('Badge sudah terbuka.', 409);
            }
            throw $e;
        }

        json_ok(['message' => 'Badge terbuka!', 'badge_code' => $code], 201);

    default:
        json_error('Metode tidak diizinkan.', 405);
}
