<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('places', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('user_id');
            $table->longText('photo')->nullable();
            $table->string('name', 100);
            $table->string('location_type', 30)->default('Rumah');
            $table->string('rooms', 500)->nullable();
            $table->decimal('energy_target', 8, 1)->default(300);
            $table->timestamp('created_at')->useCurrent();

            $table->index('user_id');
            $table->foreign('user_id')->references('id')->on('users')->onDelete('cascade');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('places');
    }
};
