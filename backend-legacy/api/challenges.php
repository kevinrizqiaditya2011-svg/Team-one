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
            'SELECT c.id, c.code, c.title, c.description, c.reward, c.difficulty,
                    c.icon, c.target,
                    uc.id AS user_challenge_id, uc.progress,
                    uc.completed, uc.reward_claimed
               FROM challenges c
               LEFT JOIN user_challenges uc
                      ON uc.challenge_id = c.id AND uc.user_id = ?
              ORDER BY c.id'
        );
        $stmt->execute([$user['id']]);
        json_ok(['challenges' => $stmt->fetchAll()]);

    case 'POST':
        $body = read_json_body();
        $challengeId = (int)($body['challenge_id'] ?? 0);
        if ($challengeId <= 0) {
            json_error('ID tantangan tidak valid.', 422);
        }

        $stmt = db()->prepare('SELECT id, target FROM challenges WHERE id = ?');
        $stmt->execute([$challengeId]);
        $challenge = $stmt->fetch();
        if ($challenge === false) {
            json_error('Tantangan tidak ditemukan.', 404);
        }

        $stmt = db()->prepare('SELECT id FROM user_challenges WHERE user_id = ? AND challenge_id = ?');
        $stmt->execute([$user['id'], $challengeId]);
        if ($stmt->fetch() !== false) {
            json_error('Anda sudah mengikuti tantangan ini.', 409);
        }

        $stmt = db()->prepare(
            'INSERT INTO user_challenges (user_id, challenge_id, target)
             VALUES (?, ?, ?)'
        );
        $stmt->execute([$user['id'], $challengeId, (int)$challenge['target']]);

        json_ok([
            'message' => 'Tantangan diikuti.',
            'user_challenge_id' => (int)db()->lastInsertId(),
        ], 201);

    case 'PATCH':
        $body = read_json_body();
        $ucId     = (int)($body['user_challenge_id'] ?? 0);
        $progress = (int)($body['progress'] ?? 0);
        if ($ucId <= 0) {
            json_error('ID tantangan user tidak valid.', 422);
        }
        if ($progress < 0) {
            $progress = 0;
        }

        $stmt = db()->prepare(
            'SELECT uc.id, uc.progress, uc.completed, uc.reward_claimed, uc.target,
                    c.reward
               FROM user_challenges uc
               JOIN challenges c ON c.id = uc.challenge_id
              WHERE uc.id = ? AND uc.user_id = ?
              LIMIT 1'
        );
        $stmt->execute([$ucId, $user['id']]);
        $uc = $stmt->fetch();
        if ($uc === false) {
            json_error('Tantangan tidak ditemukan.', 404);
        }

        $target = (int)$uc['target'];
        if ($progress > $target) {
            $progress = $target;
        }

        $db = db();
        $db->beginTransaction();
        try {
            $completed = $progress >= $target ? 1 : 0;

            $stmt = $db->prepare(
                'UPDATE user_challenges SET progress = ?, completed = ? WHERE id = ?'
            );
            $stmt->execute([$progress, $completed, $ucId]);

            if ($completed && (int)$uc['completed'] === 0 && (int)$uc['reward_claimed'] === 0) {
                $stmt = $db->prepare('UPDATE users SET points = points + ? WHERE id = ?');
                $stmt->execute([(int)$uc['reward'], $user['id']]);

                $stmt = $db->prepare('UPDATE user_challenges SET reward_claimed = 1 WHERE id = ?');
                $stmt->execute([$ucId]);
            }

            $db->commit();
        } catch (Throwable $e) {
            $db->rollBack();
            throw $e;
        }

        json_ok([
            'message'   => 'Progres diperbarui.',
            'progress'  => $progress,
            'completed' => (bool)$completed,
        ]);

    default:
        json_error('Metode tidak diizinkan.', 405);
}
