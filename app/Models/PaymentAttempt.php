<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class PaymentAttempt extends Model
{
    protected $guarded = [];

    protected $hidden = ['client_secret', 'publishable_key'];

    protected function casts(): array
    {
        return ['amount' => 'decimal:2', 'client_secret' => 'encrypted'];
    }
}
