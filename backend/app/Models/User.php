<?php

namespace App\Models;

use Database\Factories\UserFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;

class User extends Authenticatable
{
    /** @use HasFactory<UserFactory> */
    use HasFactory, Notifiable;

    protected $table = 'users';

    // Tabel memakai created_at bawaan MySQL, tanpa kolom updated_at
    public $timestamps = false;    protected $fillable = [
        'name', 'email', 'password_hash', 'role', 'user_type', 'energy_target', 'points', 'level',
    ];

    protected $hidden = ['password_hash'];

    /**
     * Kolom hash password sesuai skema lama (bukan kolom `password` bawaan Laravel).
     */
    public function getAuthPassword(): string
    {
        return $this->password_hash;
    }

    public function energyRecords()
    {
        return $this->hasMany(EnergyRecord::class);
    }



    protected function casts(): array
    {
        return [
            'energy_target' => 'float',
            'points' => 'integer',
            'level' => 'integer',
        ];
    }
}
