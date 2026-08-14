<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class N8nCheckoutSession extends Model
{
    protected $fillable = [
        'token',
        'items',
        'customer',
        'expires_at',
        'used_at',
    ];

    protected function casts(): array
    {
        return [
            'items' => 'array',
            'customer' => 'array',
            'expires_at' => 'datetime',
            'used_at' => 'datetime',
        ];
    }
}
