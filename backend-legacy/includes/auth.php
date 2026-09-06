<?php
declare(strict_types=1);

function secure_session_start(): void
{
    if (session_status() === PHP_SESSION_ACTIVE) {
        return;
    }
    session_name('energikita_session');
    session_set_cookie_params([
        'httponly' => true,
        'samesite' => 'Lax',
        'secure'   => false,
    ]);
    session_start();
}

function login_user(array $user): void
{
    secure_session_start();
    session_regenerate_id(true);
    $_SESSION['user_id']   = (int)$user['id'];
    $_SESSION['user_role'] = $user['role'];
}

function logout_user(): void
{
    secure_session_start();
    $_SESSION = [];

    if (ini_get('session.use_cookies')) {
        $p = session_get_cookie_params();
        setcookie(
            session_name(),
            '',
            time() - 42000,
            $p['path'],
            $p['domain'],
            $p['secure'],
            $p['httponly']
        );
    }

    session_destroy();
}

function current_user_id(): ?int
{
    secure_session_start();
    return isset($_SESSION['user_id']) ? (int)$_SESSION['user_id'] : null;
}

function require_login(): array
{
    $id = current_user_id();
    if ($id === null) {
        json_error('Anda harus login terlebih dahulu.', 401);
    }

    $stmt = db()->prepare(
        'SELECT id, name, email, role, user_type, energy_target, points, level
           FROM users
          WHERE id = ?
          LIMIT 1'
    );
    $stmt->execute([$id]);
    $user = $stmt->fetch();

    if ($user === false) {
        logout_user();
        json_error('Sesi tidak valid, silakan login ulang.', 401);
    }

    return $user;
}
