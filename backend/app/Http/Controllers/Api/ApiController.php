<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;

abstract class ApiController extends Controller
{
    /**
     * Respons sukses dengan format kontrak API: { success: true, ...data }
     */
    protected function ok(array $data = [], int $status = 200)
    {
        return response()->json(['success' => true] + $data, $status);
    }

    /**
     * Respons error dengan format kontrak API: { success: false, message }
     */
    protected function fail(string $message, int $status = 400)
    {
        return response()->json(['success' => false, 'message' => $message], $status);
    }

    /**
     * User yang terautentikasi (diisi oleh middleware auth.energikita).
     */
    protected function user(Request $request)
    {
        return $request->attributes->get('auth_user');
    }

    protected function validDate(mixed $value): bool
    {
        $value = (string) $value;
        if (! preg_match('/^\d{4}-\d{2}-\d{2}$/', $value)) {
            return false;
        }

        $date = \DateTime::createFromFormat('Y-m-d', $value);

        return $date !== false && $date->format('Y-m-d') === $value;
    }
}
