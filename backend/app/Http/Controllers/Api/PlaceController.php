<?php

namespace App\Http\Controllers\Api;

use App\Models\Place;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class PlaceController extends ApiController
{
    private const LOCATION_TYPES = ['Rumah', 'Sekolah', 'UMKM', 'Kantor', 'Toko', 'Kost'];

    private function shape(array $place): array
    {
        return [
            'id' => (int) $place['id'],
            'user_id' => (int) $place['user_id'],
            'name' => $place['name'],
            'photo' => $place['photo'] ?? null,
            'location_type' => $place['location_type'],
            'rooms' => $place['rooms'] ?? '',
            'energy_target' => (float) ($place['energy_target'] ?? 300),
            'record_count' => (int) ($place['record_count'] ?? 0),
            'total_kwh' => (float) ($place['total_kwh'] ?? 0),
            'created_at' => $place['created_at'] ?? null,
        ];
    }

    public function index(Request $request)
    {
        $query = DB::table('places as p')
            ->leftJoin('energy_records as r', function ($join) {
                $join->on('r.place_id', '=', 'p.id');
            })
            ->where('p.user_id', $this->user($request)->id);

        // Search: filter by name (case-insensitive LIKE)
        $search = trim((string) $request->input('search', ''));
        if (mb_strlen($search) > 0) {
            $query->where('p.name', 'like', '%' . $search . '%');
        }

        $rows = $query->select(
                'p.id', 'p.user_id', 'p.name', 'p.photo', 'p.location_type', 'p.rooms', 'p.energy_target', 'p.created_at',
                DB::raw('COUNT(r.id) as record_count'),
                DB::raw('COALESCE(SUM(r.kwh), 0) as total_kwh')
            )
            ->groupBy('p.id', 'p.user_id', 'p.name', 'p.photo', 'p.location_type', 'p.rooms', 'p.energy_target', 'p.created_at')
            ->orderBy('p.created_at')
            ->orderBy('p.id')
            ->get()
            ->map(fn ($row) => (array) $row)
            ->toArray();

        return $this->ok(['places' => array_map(fn ($p) => $this->shape($p), $rows)]);
    }

    public function store(Request $request)
    {
        $name = trim((string) $request->input('name'));
        $locationType = $request->input('location_type', 'Rumah');
        $energyTarget = is_numeric($request->input('energy_target', 300))
            ? (float) $request->input('energy_target')
            : 300.0;
        $photo = $request->input('photo');
        $rooms = trim((string) $request->input('rooms', ''));

        if (mb_strlen($name) < 1 || mb_strlen($name) > 100) {
            return $this->fail('Nama gedung harus 1-100 karakter.', 422);
        }
        if (! in_array($locationType, self::LOCATION_TYPES, true)) {
            return $this->fail('Jenis tempat tidak valid.', 422);
        }
        if ($energyTarget <= 0 || $energyTarget > 100000) {
            return $this->fail('Target energi tidak valid.', 422);
        }

        // Photo wajib saat menambah gedung baru
        if (empty($photo)) {
            return $this->fail('Foto gedung wajib diunggah.', 422);
        }

        // Minimal 2 ruangan
        $roomList = array_filter(array_map('trim', explode(',', $rooms)));
        if (count($roomList) < 2) {
            return $this->fail('Minimal harus ada 2 ruangan.', 422);
        }

        $place = Place::create([
            'user_id' => $this->user($request)->id,
            'name' => $name,
            'photo' => $photo,
            'location_type' => $locationType,
            'rooms' => $rooms,
            'energy_target' => $energyTarget,
        ]);

        return $this->ok([
            'message' => 'Gedung ditambahkan.',
            'place' => $this->shape((array) $place->fresh()->toArray()),
        ], 201);
    }

    public function update(Request $request)
    {
        $id = (int) $request->input('id', 0);
        if ($id <= 0) {
            return $this->fail('ID gedung tidak valid.', 422);
        }

        $place = Place::where('id', $id)
            ->where('user_id', $this->user($request)->id)
            ->first();

        if (! $place) {
            return $this->fail('Gedung tidak ditemukan.', 404);
        }

        $body = $request->all();
        $changed = false;

        if (array_key_exists('name', $body)) {
            $name = trim((string) $body['name']);
            if (mb_strlen($name) < 1 || mb_strlen($name) > 100) {
                return $this->fail('Nama gedung harus 1-100 karakter.', 422);
            }
            $place->name = $name;
            $changed = true;
        }

        if (array_key_exists('location_type', $body)) {
            $locationType = $body['location_type'];
            if (! in_array($locationType, self::LOCATION_TYPES, true)) {
                return $this->fail('Jenis tempat tidak valid.', 422);
            }
            $place->location_type = $locationType;
            $changed = true;
        }

        if (array_key_exists('photo', $body)) {
            $place->photo = $body['photo'] ?? null;
            $changed = true;
        }

        if (array_key_exists('rooms', $body)) {
            $place->rooms = trim((string) $body['rooms']);
            $changed = true;
        }

        if (array_key_exists('energy_target', $body)) {
            $target = is_numeric($body['energy_target']) ? (float) $body['energy_target'] : null;
            if ($target === null || $target <= 0 || $target > 100000) {
                return $this->fail('Target energi tidak valid.', 422);
            }
            $place->energy_target = $target;
            $changed = true;
        }

        if (! $changed) {
            return $this->fail('Tidak ada data yang diperbarui.', 422);
        }

        $place->save();

        return $this->ok([
            'message' => 'Gedung diperbarui.',
            'place' => $this->shape((array) $place->fresh()->toArray()),
        ]);
    }

    public function destroy(Request $request)
    {
        $id = (int) $request->query('id', 0);
        if ($id <= 0) {
            return $this->fail('ID gedung tidak valid.', 422);
        }

        $place = Place::where('id', $id)
            ->where('user_id', $this->user($request)->id)
            ->first();

        if (! $place) {
            return $this->fail('Gedung tidak ditemukan.', 404);
        }

        // Hapus gedung beserta seluruh catatan energinya — tanpa syarat tambahan.
        DB::transaction(function () use ($place) {
            DB::table('energy_records')->where('place_id', $place->id)->delete();
            $place->delete();
        });

        return $this->ok(['message' => 'Gedung beserta catatannya dihapus.']);
    }
}
