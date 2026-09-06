<?php

namespace App\Http\Controllers\Api;

use App\Models\EnergyRecord;
use App\Models\Place;
use Illuminate\Http\Request;

class RecordController extends ApiController
{
    private const TARIFF_PER_KWH = 1450;

    private const CO2_FACTOR = 0.85;

    private const LOCATION_TYPES = ['Rumah', 'Sekolah', 'UMKM', 'Kantor', 'Toko', 'Kost'];

    private const ORDER_COLUMNS = [
        'date' => 'record_date',
        'kwh' => 'kwh',
        'cost' => 'cost',
        'co2' => 'estimated_co2',
    ];

    private function shape(EnergyRecord $record, ?string $placeName = null): array
    {
        return [
            'id' => (int) $record->id,
            'place_id' => $record->place_id !== null ? (int) $record->place_id : null,
            'place_name' => $placeName ?? $record->place?->name,
            'record_date' => $record->record_date,
            'kwh' => $record->kwh,
            'cost' => (int) $record->cost,
            'estimated_co2' => $record->estimated_co2,
            'location_type' => $record->location_type,
            'room' => $record->room ?? '',
        ];
    }

    public function index(Request $request)
    {
        $user = $this->user($request);

        $query = EnergyRecord::where('energy_records.user_id', $user->id)
            ->leftJoin('places', 'places.id', '=', 'energy_records.place_id')
            ->select('energy_records.*', 'places.name as place_name');

        if ($request->filled('from') && $this->validDate($request->input('from'))) {
            $query->where('energy_records.record_date', '>=', $request->input('from'));
        }
        if ($request->filled('to') && $this->validDate($request->input('to'))) {
            $query->where('energy_records.record_date', '<=', $request->input('to'));
        }

        $orderCol = self::ORDER_COLUMNS[$request->input('order', 'date')] ?? 'record_date';
        $orderDir = $request->input('dir', 'desc') === 'asc' ? 'asc' : 'desc';
        $limit = max(1, min(500, (int) $request->input('limit', 60)));

        $records = $query->orderBy('energy_records.'.$orderCol, $orderDir)->limit($limit)->get();

        return $this->ok([
            'records' => $records->map(fn (EnergyRecord $r) => $this->shape($r, $r->place_name)),
        ]);
    }

    public function store(Request $request)
    {
        $recordDate = trim((string) $request->input('record_date'));
        $kwh = is_numeric($request->input('kwh')) ? (float) $request->input('kwh') : null;
        $user = $this->user($request);

        if (! $this->validDate($recordDate)) {
            return $this->fail('Format tanggal harus YYYY-MM-DD.', 422);
        }
        if ($kwh === null || $kwh <= 0 || $kwh > 100000) {
            return $this->fail('Nilai kWh harus lebih dari 0.', 422);
        }

        // Gedung tujuan: wajib milik user; jika kosong pakai gedung pertama
        $placeId = (int) $request->input('place_id', 0);
        $place = null;
        if ($placeId <= 0) {
            $place = Place::where('user_id', $user->id)->orderBy('id')->first();
        } else {
            $place = Place::where('id', $placeId)->where('user_id', $user->id)->first();
            if (! $place) {
                return $this->fail('Gedung tidak ditemukan.', 404);
            }
        }

        $locationType = $place?->location_type ?? $request->input('location_type', 'Rumah');
        if (! in_array($locationType, self::LOCATION_TYPES, true)) {
            return $this->fail('Jenis tempat tidak valid.', 422);
        }

        // Biaya & emisi CO2 dihitung server — client tidak bisa memalsukan angka
        $cost = (int) round($kwh * self::TARIFF_PER_KWH);
        $co2 = round($kwh * self::CO2_FACTOR, 2);

        $room = trim((string) $request->input('room', ''));

        $record = EnergyRecord::create([
            'user_id' => $user->id,
            'place_id' => $place?->id,
            'record_date' => $recordDate,
            'kwh' => $kwh,
            'cost' => $cost,
            'room' => $room,
            'estimated_co2' => $co2,
            'location_type' => $locationType,
        ]);

        return $this->ok([
            'message' => 'Catatan energi tersimpan.',
            'record' => $this->shape($record, $place?->name),
        ], 201);
    }

    public function destroy(Request $request)
    {
        $id = (int) $request->query('id', 0);
        if ($id <= 0) {
            return $this->fail('ID catatan tidak valid.', 422);
        }

        $deleted = EnergyRecord::where('id', $id)
            ->where('user_id', $this->user($request)->id)
            ->delete();

        if ($deleted === 0) {
            return $this->fail('Catatan tidak ditemukan.', 404);
        }

        return $this->ok(['message' => 'Catatan dihapus.']);
    }
}
