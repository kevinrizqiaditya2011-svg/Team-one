<?php
declare(strict_types=1);

const ALLOWED_ORIGINS = [
    'http://localhost:5173',
    'http://127.0.0.1:5173',
];

function cors_headers(): void
{
    $origin = $_SERVER['HTTP_ORIGIN'] ?? '';

    if (in_array($origin, ALLOWED_ORIGINS, true)) {
        header('Access-Control-Allow-Origin: ' . $origin);
        header('Access-Control-Allow-Credentials: true');
    }

    header('Access-Control-Allow-Methods: GET, POST, PUT, PATCH, DELETE, OPTIONS');
    header('Access-Control-Allow-Headers: Content-Type, Authorization');

    if (($_SERVER['REQUEST_METHOD'] ?? '') === 'OPTIONS') {
        http_response_code(204);
        exit;
    }
}

function json_response(array $data, int $status = 200): void
{
    http_response_code($status);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode($data, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit;
}

function json_ok(array $data = [], int $status = 200): void
{
    json_response(['success' => true] + $data, $status);
}

function json_error(string $message, int $status = 400): void
{
    json_response(['success' => false, 'message' => $message], $status);
}

function read_json_body(): array
{
    $raw = file_get_contents('php://input');
    if ($raw === false || trim($raw) === '') {
        return [];
    }
    $data = json_decode($raw, true);
    return is_array($data) ? $data : [];
}

function sanitize_string(mixed $value): string
{
    return trim((string)($value ?? ''));
}

function valid_email(mixed $value): bool
{
    return filter_var((string)$value, FILTER_VALIDATE_EMAIL) !== false;
}

function valid_date_ymd(mixed $value): bool
{
    $value = (string)$value;
    if (!preg_match('/^\d{4}-\d{2}-\d{2}$/', $value)) {
        return false;
    }
    $date = DateTime::createFromFormat('Y-m-d', $value);
    return $date !== false && $date->format('Y-m-d') === $value;
}

function valid_enum(mixed $value, array $allowed, mixed $default): mixed
{
    return in_array($value, $allowed, true) ? $value : $default;
}

function valid_float(mixed $value): float|false
{
    if (!is_numeric($value)) {
        return false;
    }
    return (float)$value;
}

set_exception_handler(function (Throwable $e): void {
    error_log('[EnergiKita] ' . $e->getMessage());
    json_error('Terjadi kesalahan pada server.', 500);
});
