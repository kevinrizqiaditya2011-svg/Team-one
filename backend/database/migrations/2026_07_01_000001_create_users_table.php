<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('users', function (Blueprint $table) {
            $table->id();
            $table->string('firebase_uid', 128)->nullable()->unique();
            $table->string('name', 100);
            $table->string('email', 150)->unique();
            $table->string('password_hash');
            $table->enum('role', ['user', 'admin'])->default('user');
            $table->string('user_type', 30)->default('Rumah');
            $table->decimal('energy_target', 8, 1)->default(300);
            $table->integer('points')->default(0);
            $table->integer('level')->default(1);
            $table->timestamp('created_at')->useCurrent();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('users');
    }
};
