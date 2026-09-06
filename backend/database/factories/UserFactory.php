<?php

namespace Database\Factories;

use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Facades\Hash;

/**
 * @extends Factory<User>
 */
class UserFactory extends Factory
{
    protected static ?string $password;

    /**
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'name'           => fake()->name(),
            'email'          => fake()->unique()->safeEmail(),
            'password_hash'  => static::$password ??= Hash::make('password'),
            'role'           => 'user',
            'user_type'      => 'Rumah',
            'energy_target'  => 300,
        ];
    }
}
