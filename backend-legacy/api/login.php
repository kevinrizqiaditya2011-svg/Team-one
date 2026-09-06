<?php
require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../config/security.php';
require_once __DIR__ . '/../includes/auth.php';

cors_headers();

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    json_error('Metode tidak diizinkan.', 405);
}

$body = read_json_body();
$email    = sanitize_string($body['email'] ?? '');
$password = (string)($body['password'] ?? '');

if (!valid_email($email) || $password === '') {
    json_error('Email dan password wajib diisi.', 422);
}

secure_session_start();
$key = 'attempts_' . md5(strtolower($email));
$attempts = $_SESSION[$key] ?? ['count' => 0, 'time' => 0];

if (time() - (int)$attempts['time'] >= 900) {
    $attempts = ['count' => 0, 'time' => 0];
}

if ($attempts['count'] >= 5) {
    json_error('Terlalu banyak percobaan login. Coba lagi nanti.', 429);
}

$stmt = db()->prepare(
    'SELECT id, name, email, password_hash, role, user_type
       FROM users
      WHERE email = ?
      LIMIT 1'
);
$stmt->execute([$email]);
$user = $stmt->fetch();

$dummyHash = '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi';

if ($user === false) {
    password_verify($password, $dummyHash);
    $_SESSION[$key] = ['count' => (int)$attempts['count'] + 1, 'time' => time()];
    json_error('Email atau password salah.', 401);
}

if (!password_verify($password, $user['password_hash'])) {
    $_SESSION[$key] = ['count' => (int)$attempts['count'] + 1, 'time' => time()];
    json_error('Email atau password salah.', 401);
}

unset($_SESSION[$key]);
login_user($user);

json_ok([
    'message' => 'Login berhasil.',
    'user' => [
        'id'       => (int)$user['id'],
        'name'     => $user['name'],
        'email'    => $user['email'],
        'role'     => $user['role'],
        'userType' => $user['user_type'],
    ],
]);
