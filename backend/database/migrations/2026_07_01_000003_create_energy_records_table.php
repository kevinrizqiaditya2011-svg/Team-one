<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('energy_records', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('user_id');
            $table->unsignedBigInteger('place_id')->nullable();
            $table->date('record_date');
            $table->decimal('kwh', 10, 2);
            $table->unsignedInteger('cost');
            $table->string('room', 200)->nullable();
            $table->enum('location_type', ['Rumah', 'Sekolah', 'UMKM', 'Kantor', 'Toko', 'Kost'])->default('Rumah');
            $table->decimal('estimated_co2', 10, 2);
            $table->timestamp('created_at')->useCurrent();

            $table->index(['user_id', 'record_date']);
            $table->foreign('user_id')->references('id')->on('users')->onDelete('cascade');
            $table->foreign('place_id')->references('id')->on('places')->onDelete('set null');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('energy_records');
    }
};
