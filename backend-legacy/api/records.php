<?php
require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../config/security.php';
require_once __DIR__ . '/../includes/auth.php';

cors_headers();

$user   = require_login();
$method = $_SERVER['REQUEST_METHOD'];

define('TARIF_PER_KWH', 1450);
define('FAKTOR_CO2', 0.85);

switch ($method) {

    case 'GET':
        $where  = 'WHERE user_id = ?';
        $params = [$user['id']];

        if (!empty($_GET['from']) && valid_date_ymd($_GET['from'])) {
            $where .= ' AND record_date >= ?';
            $params[] = $_GET['from'];
        }
        if (!empty($_GET['to']) && valid_date_ymd($_GET['to'])) {
            $where .= ' AND record_date <= ?';
            $params[] = $_GET['to'];
        }

        $orderCols = ['date' => 'record_date', 'kwh' => 'kwh', 'cost' => 'cost', 'co2' => 'estimated_co2'];
        $orderCol  = $orderCols[$_GET['order'] ?? 'date'] ?? 'record_date';
        $orderDir  = ($_GET['dir'] ?? 'desc') === 'asc' ? 'ASC' : 'DESC';

        $limit = isset($_GET['limit']) ? max(1, min(500, (int)$_GET['limit'])) : 60;

        $sql = "SELECT id, record_date, kwh, cost, estimated_co2, location_type
                  FROM energy_records
                  $where
                 ORDER BY $orderCol $orderDir
                 LIMIT $limit";

        $stmt = db()->prepare($sql);
        $stmt->execute($params);
        json_ok(['records' => $stmt->fetchAll()]);

    case 'POST':
        $body = read_json_body();
        $recordDate   = sanitize_string($body['record_date'] ?? '');
        $kwh          = valid_float($body['kwh'] ?? 0);
        $locationType = valid_enum($body['location_type'] ?? 'Rumah', ['Rumah', 'Sekolah', 'UMKM'], 'Rumah');

        if (!valid_date_ymd($recordDate)) {
            json_error('Format tanggal harus YYYY-MM-DD.', 422);
        }
        if ($kwh === false || $kwh <= 0 || $kwh > 100000) {
            json_error('Nilai kWh harus lebih dari 0.', 422);
        }

        $cost = (int)round($kwh * TARIF_PER_KWH);
        $co2  = round($kwh * FAKTOR_CO2, 2);

        $stmt = db()->prepare(
            'INSERT INTO energy_records (user_id, record_date, kwh, cost, estimated_co2, location_type)
             VALUES (?, ?, ?, ?, ?, ?)'
        );
        $stmt->execute([$user['id'], $recordDate, $kwh, $cost, $co2, $locationType]);

        json_ok([
            'message' => 'Catatan energi tersimpan.',
            'record' => [
                'id'            => (int)db()->lastInsertId(),
                'record_date'   => $recordDate,
                'kwh'           => $kwh,
                'cost'          => $cost,
                'estimated_co2' => $co2,
                'location_type' => $locationType,
            ],
        ], 201);

    case 'DELETE':
        $id = (int)($_GET['id'] ?? 0);
        if ($id <= 0) {
            json_error('ID catatan tidak valid.', 422);
        }

        $stmt = db()->prepare('DELETE FROM energy_records WHERE id = ? AND user_id = ?');
        $stmt->execute([$id, $user['id']]);

        if ($stmt->rowCount() === 0) {
            json_error('Catatan tidak ditemukan.', 404);
        }
        json_ok(['message' => 'Catatan dihapus.']);

    default:
        json_error('Metode tidak diizinkan.', 405);
}
