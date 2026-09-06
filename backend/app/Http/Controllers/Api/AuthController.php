<?php

namespace App\Http\Controllers\Api;

use App\Models\Place;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;

class AuthController extends ApiController
{
    private const MAX_ATTEMPTS = 5;

    private const LOCKOUT_SECONDS = 900;

    private const USER_TYPES = ['Rumah', 'Sekolah', 'UMKM', 'Kantor', 'Toko', 'Kost'];

    private function userPayload(User $user): array
    {
        return [
            'id' => (int) $user->id,
            'name' => $user->name,
            'email' => $user->email,
            'role' => $user->role,
            'user_type' => $user->user_type,
            'energy_target' => (float) $user->energy_target,
            'points' => (int) $user->points,
            'level' => (int) $user->level,
        ];
    }

    private function startSession(Request $request, User $user): void
    {
        $request->session()->regenerate();
        $request->session()->put('auth_user_id', $user->id);
    }

    public function login(Request $request)
    {
        $email = trim((string) $request->input('email'));
        $password = (string) $request->input('password');

        if (! filter_var($email, FILTER_VALIDATE_EMAIL) || $password === '') {
            return $this->fail('Email dan password wajib diisi.', 422);
        }

        // Proteksi brute-force: maksimal 5 percobaan / 15 menit per email
        $key = 'attempts_'.md5(strtolower($email));
        $attempts = $request->session()->get($key, ['count' => 0, 'time' => 0]);

        if (time() - (int) $attempts['time'] >= self::LOCKOUT_SECONDS) {
            $attempts = ['count' => 0, 'time' => 0];
        }

        if ((int) $attempts['count'] >= self::MAX_ATTEMPTS) {
            return $this->fail('Terlalu banyak percobaan login. Coba lagi nanti.', 429);
        }

        $user = User::where('email', $email)->first();

        // Hash dummy agar durasi verifikasi konsisten walau email tidak terdaftar
        $dummyHash = '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi';
        $valid = $user !== null && Hash::check($password, $user->password_hash);
        if (! $user) {
            Hash::check($password, $dummyHash);
        }

        if (! $valid) {
            $request->session()->put($key, ['count' => (int) $attempts['count'] + 1, 'time' => time()]);

            return $this->fail('Email atau password salah.', 401);
        }

        $request->session()->forget($key);
        $this->startSession($request, $user);

        return $this->ok([
            'message' => 'Login berhasil.',
            'user' => $this->userPayload($user),
        ]);
    }

    public function register(Request $request)
    {
        $name = trim((string) $request->input('name'));
        $email = trim((string) $request->input('email'));
        $password = (string) $request->input('password');
        $userType = in_array($request->input('user_type'), self::USER_TYPES, true)
            ? $request->input('user_type')
            : 'Rumah';
        $energyTarget = is_numeric($request->input('energy_target', 300))
            ? (float) $request->input('energy_target')
            : 300.0;

        if (mb_strlen($name) < 2 || mb_strlen($name) > 100) {
            return $this->fail('Nama harus 2-100 karakter.', 422);
        }
        if (! filter_var($email, FILTER_VALIDATE_EMAIL) || strlen($email) > 150) {
            return $this->fail('Format email tidak valid.', 422);
        }
        if (strlen($password) < 8 || strlen($password) > 72) {
            return $this->fail('Password harus 8-72 karakter.', 422);
        }
        if ($energyTarget <= 0 || $energyTarget > 100000) {
            return $this->fail('Target energi tidak valid.', 422);
        }

        if (User::where('email', $email)->exists()) {
            return $this->fail('Email sudah terdaftar.', 409);
        }

        $user = User::create([
            'name' => $name,
            'email' => $email,
            'password_hash' => Hash::make($password),
            'role' => 'user',
            'user_type' => $userType,
            'energy_target' => $energyTarget,
        ]);

        // Setiap akun baru otomatis punya 1 gedung default 'Utama'
        Place::create([
            'user_id' => $user->id,
            'name' => 'Utama',
            'location_type' => $userType,
            'energy_target' => $energyTarget,
        ]);

        $this->startSession($request, $user);

        return $this->ok([
            'message' => 'Registrasi berhasil.',
            'user' => $this->userPayload($user),
        ], 201);
    }

    public function me(Request $request)
    {
        return $this->ok(['user' => $this->userPayload($this->user($request))]);
    }

    public function updateMe(Request $request)
    {
        $user = $this->user($request);
        $data = $request->all();
        $changed = false;

        if (array_key_exists('name', $data)) {
            $name = trim((string) $data['name']);
            if (mb_strlen($name) < 2 || mb_strlen($name) > 100) {
                return $this->fail('Nama harus 2-100 karakter.', 422);
            }
            $user->name = $name;
            $changed = true;
        }

        if (array_key_exists('user_type', $data)) {
            $user->user_type = in_array($data['user_type'], self::USER_TYPES, true)
                ? $data['user_type']
                : $user->user_type;
            $changed = true;
        }

        if (array_key_exists('energy_target', $data)) {
            $target = is_numeric($data['energy_target']) ? (float) $data['energy_target'] : null;
            if ($target === null || $target <= 0 || $target > 100000) {
                return $this->fail('Target energi tidak valid.', 422);
            }
            $user->energy_target = $target;
            $changed = true;
        }

        if ($changed) {
            $user->save();
        }

        if (isset($data['points_delta'])) {
            $delta = (int) $data['points_delta'];
            if ($delta < -500 || $delta > 500) {
                return $this->fail('Nilai perubahan poin tidak valid.', 422);
            }
            DB::table('users')
                ->where('id', $user->id)
                ->update(['points' => DB::raw('GREATEST(points + '.(int) $delta.', 0)')]);
            $user->refresh();
        }

        return $this->ok([
            'message' => 'Profil diperbarui.',
            'user' => $this->userPayload($user),
        ]);
    }

    /**
     * Ganti password — wajib menyertakan password lama untuk keamanan.
     */
    public function changePassword(Request $request)
    {
        $user = $this->user($request);
        $current = (string) $request->input('current_password');
        $newPassword = (string) $request->input('new_password');

        if ($current === '' || ! Hash::check($current, $user->password_hash)) {
            return $this->fail('Password lama salah.', 422);
        }
        if (strlen($newPassword) < 8 || strlen($newPassword) > 72) {
            return $this->fail('Password baru harus 8-72 karakter.', 422);
        }

        $user->password_hash = Hash::make($newPassword);
        $user->save();

        return $this->ok(['message' => 'Password berhasil diganti.']);
    }

    public function logout(Request $request)
    {
        $request->session()->flush();

        return $this->ok(['message' => 'Logout berhasil.']);
    }
}
