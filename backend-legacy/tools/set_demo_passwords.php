<?php
declare(strict_types=1);

if (php_sapi_name() !== 'cli') {
    http_response_code(403);
    exit("Akses ditolak. Jalankan lewat terminal (CLI).\n");
}

require_once __DIR__ . '/../config/database.php';

$password = 'demo1234';
$hash     = password_hash($password, PASSWORD_DEFAULT);

$stmt = db()->prepare('SELECT id FROM users WHERE password_hash = ?');
$stmt->execute(['GANTI_DENGAN_HASH_PHP_demo1234']);
$users = $stmt->fetchAll();

$upd = db()->prepare('UPDATE users SET password_hash = ? WHERE id = ?');

$count = 0;
foreach ($users as $u) {
    $upd->execute([$hash, (int)$u['id']]);
    $count++;
}

echo "Selesai. $count akun demo kini berpassword '$password'.\n";
