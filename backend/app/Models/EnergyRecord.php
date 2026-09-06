<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class EnergyRecord extends Model
{
    protected $table = 'energy_records';

    public $timestamps = false;    protected $fillable = [
        'user_id', 'place_id', 'record_date', 'kwh', 'cost', 'room', 'location_type', 'estimated_co2',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function place(): BelongsTo
    {
        return $this->belongsTo(Place::class);
    }

    protected function casts(): array
    {
        return [
            'kwh' => 'float',
            'cost' => 'integer',
            'estimated_co2' => 'float',
        ];
    }
}
