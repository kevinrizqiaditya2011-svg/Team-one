<?php

namespace Database\Seeders;

use App\Models\Place;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    /**
     * Buat akun demo + gedung default untuk testing.
     */
    public function run(): void
    {
        // Akun demo — hanya jika belum ada
        if (!User::where('email', 'demo@energikita.id')->exists()) {
            $user = User::create([
                'name'           => 'Demo User',
                'email'          => 'demo@energikita.id',
                'password_hash'  => Hash::make('demo1234'),
                'role'           => 'user',
                'user_type'      => 'Rumah',
                'energy_target'  => 300,
            ]);

            Place::create([
                'user_id'       => $user->id,
                'name'          => 'Utama',
                'location_type' => 'Rumah',
                'energy_target' => 300,
            ]);

            $this->command?->info("Akun demo dibuat: demo@energikita.id / demo1234");
        }
    }
}
