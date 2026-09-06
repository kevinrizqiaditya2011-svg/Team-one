<?php
require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../config/security.php';
require_once __DIR__ . '/../includes/auth.php';

cors_headers();

$user           = require_login();
$method         = $_SERVER['REQUEST_METHOD'];
$allowedUnits   = ['%', 'Rp', 'kWh', 'kg'];
$allowedStatus  = ['active', 'completed'];

switch ($method) {

    case 'GET':
        $status = valid_enum($_GET['status'] ?? null, $allowedStatus, null);

        if ($status !== null) {
            $stmt = db()->prepare(
                'SELECT * FROM goals WHERE user_id = ? AND status = ? ORDER BY created_at DESC'
            );
            $stmt->execute([$user['id'], $status]);
        } else {
            $stmt = db()->prepare('SELECT * FROM goals WHERE user_id = ? ORDER BY created_at DESC');
            $stmt->execute([$user['id']]);
        }
        json_ok(['goals' => $stmt->fetchAll()]);

    case 'POST':
        $body = read_json_body();
        $title       = sanitize_string($body['title'] ?? '');
        $description = sanitize_string($body['description'] ?? '');
        $target      = valid_float($body['target'] ?? 0);
        $current     = valid_float($body['current'] ?? 0);
        $unit        = valid_enum($body['unit'] ?? '%', $allowedUnits, '%');
        $deadline    = (isset($body['deadline']) && $body['deadline'] !== '')
            ? sanitize_string($body['deadline'])
            : null;
        $status      = valid_enum($body['status'] ?? 'active', $allowedStatus, 'active');

        if (mb_strlen($title) < 3 || mb_strlen($title) > 150) {
            json_error('Judul goal harus 3-150 karakter.', 422);
        }
        if (mb_strlen($description) > 255) {
            json_error('Deskripsi maksimal 255 karakter.', 422);
        }
        if ($target === false || $target <= 0) {
            json_error('Nilai target harus lebih dari 0.', 422);
        }
        if ($current === false || $current < 0) {
            json_error('Nilai progres tidak valid.', 422);
        }
        if ($deadline !== null && !valid_date_ymd($deadline)) {
            json_error('Format deadline harus YYYY-MM-DD.', 422);
        }

        $stmt = db()->prepare(
            'INSERT INTO goals (user_id, title, description, target, current, unit, deadline, status)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
        );
        $stmt->execute([$user['id'], $title, $description, $target, $current, $unit, $deadline, $status]);

        json_ok(['message' => 'Goal ditambahkan.', 'id' => (int)db()->lastInsertId()], 201);

    case 'PUT':
        $body = read_json_body();
        $id = (int)($body['id'] ?? 0);
        if ($id <= 0) {
            json_error('ID goal tidak valid.', 422);
        }

        $stmt = db()->prepare('SELECT id FROM goals WHERE id = ? AND user_id = ?');
        $stmt->execute([$id, $user['id']]);
        if ($stmt->fetch() === false) {
            json_error('Goal tidak ditemukan.', 404);
        }

        $title       = sanitize_string($body['title'] ?? '');
        $description = sanitize_string($body['description'] ?? '');
        $target      = valid_float($body['target'] ?? 0);
        $current     = valid_float($body['current'] ?? 0);
        $unit        = valid_enum($body['unit'] ?? '%', $allowedUnits, '%');
        $deadline    = (isset($body['deadline']) && $body['deadline'] !== '')
            ? sanitize_string($body['deadline'])
            : null;
        $status      = valid_enum($body['status'] ?? 'active', $allowedStatus, 'active');

        if (mb_strlen($title) < 3 || mb_strlen($title) > 150) {
            json_error('Judul goal harus 3-150 karakter.', 422);
        }
        if (mb_strlen($description) > 255) {
            json_error('Deskripsi maksimal 255 karakter.', 422);
        }
        if ($target === false || $target <= 0) {
            json_error('Nilai target harus lebih dari 0.', 422);
        }
        if ($current === false || $current < 0) {
            json_error('Nilai progres tidak valid.', 422);
        }
        if ($deadline !== null && !valid_date_ymd($deadline)) {
            json_error('Format deadline harus YYYY-MM-DD.', 422);
        }

        $stmt = db()->prepare(
            'UPDATE goals
                SET title = ?, description = ?, target = ?, current = ?,
                    unit = ?, deadline = ?, status = ?
              WHERE id = ? AND user_id = ?'
        );
        $stmt->execute([$title, $description, $target, $current, $unit, $deadline, $status, $id, $user['id']]);

        json_ok(['message' => 'Goal diperbarui.']);

    case 'DELETE':
        $id = (int)($_GET['id'] ?? 0);
        if ($id <= 0) {
            json_error('ID goal tidak valid.', 422);
        }

        $stmt = db()->prepare('DELETE FROM goals WHERE id = ? AND user_id = ?');
        $stmt->execute([$id, $user['id']]);

        if ($stmt->rowCount() === 0) {
            json_error('Goal tidak ditemukan.', 404);
        }
        json_ok(['message' => 'Goal dihapus.']);

    default:
        json_error('Metode tidak diizinkan.', 405);
}
