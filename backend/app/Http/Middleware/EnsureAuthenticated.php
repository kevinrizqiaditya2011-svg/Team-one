<?php

namespace App\Http\Middleware;

use App\Models\User;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureAuthenticated
{
    /**
     * Autentikasi berbasis session (cocok dengan pola backend PHP lama):
     * id user disimpan di session saat login, diverifikasi per-request.
     */
    public function handle(Request $request, Closure $next): Response
    {
        $userId = $request->session()->get('auth_user_id');

        if (! $userId) {
            return response()->json([
                'success' => false,
                'message' => 'Anda harus login terlebih dahulu.',
            ], 401);
        }

        $user = User::find($userId);

        if (! $user) {
            $request->session()->flush();

            return response()->json([
                'success' => false,
                'message' => 'Sesi tidak valid, silakan login ulang.',
            ], 401);
        }

        $request->attributes->set('auth_user', $user);

        return $next($request);
    }
}
