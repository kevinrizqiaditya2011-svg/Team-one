<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Place extends Model
{
    protected $table = 'places';

    public $timestamps = false;

    protected $fillable = [
        'user_id',
        'name',
        'photo',
        'location_type',
        'rooms',
        'energy_target',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function energyRecords(): HasMany
    {
        return $this->hasMany(EnergyRecord::class);
    }

    protected function casts(): array
    {
        return [
            'energy_target' => 'float',
        ];
    }
}
