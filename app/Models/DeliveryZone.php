<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class DeliveryZone extends Model
{
    protected $fillable = ['country', 'district', 'area', 'fee', 'minimum_days', 'maximum_days', 'free_above', 'is_active'];

    protected function casts(): array
    {
        return ['fee' => 'decimal:2', 'free_above' => 'decimal:2', 'is_active' => 'boolean'];
    }
}
