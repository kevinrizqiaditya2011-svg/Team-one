<?php

use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\PlaceController;
use App\Http\Controllers\Api\RecordController;
use Illuminate\Support\Facades\Route;

Route::get('/', function () {
    return response()->json([
        'success' => true,
        'app'     => 'EnergiKita API (Laravel)',
        'message' => 'API berjalan. Semua query memakai Eloquent + prepared statement (anti SQL injection).',
        'endpoints' => [
            'POST   /api/login          -> login (email + password)',
            'POST   /api/register       -> daftar akun baru',
            'POST   /api/logout         -> logout',
            'GET    /api/me             -> profil user yang login',
            'PUT    /api/me             -> update profil',
            'GET    /api/records        -> daftar catatan energi',
            'POST   /api/records        -> tambah catatan energi',
            'DELETE /api/records?id=X   -> hapus catatan energi',
            'GET    /api/places         -> daftar gedung/lokasi',
            'POST   /api/places         -> tambah gedung',
            'PUT    /api/places         -> update gedung',
            'DELETE /api/places?id=X    -> hapus gedung',
        ],
    ]);
});

Route::post('/login', [AuthController::class, 'login'])->middleware('throttle:20,1');
Route::post('/register', [AuthController::class, 'register'])->middleware('throttle:10,1');

Route::middleware('auth.energikita')->group(function () {
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/me', [AuthController::class, 'me']);
    Route::put('/me', [AuthController::class, 'updateMe']);
    Route::put('/me/password', [AuthController::class, 'changePassword']);

    Route::get('/records', [RecordController::class, 'index']);
    Route::post('/records', [RecordController::class, 'store']);
    Route::delete('/records', [RecordController::class, 'destroy']);

    Route::get('/places', [PlaceController::class, 'index']);
    Route::post('/places', [PlaceController::class, 'store']);
    Route::put('/places', [PlaceController::class, 'update']);
    Route::delete('/places', [PlaceController::class, 'destroy']);
});
