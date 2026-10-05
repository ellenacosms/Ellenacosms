<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ContactSubmission extends Model
{
    protected $fillable = [
        'name',
        'email',
        'phone',
        'topic',
        'order_number',
        'preferred_contact_method',
        'message',
        'ip_hash',
        'read_at',
    ];

    protected $casts = [
        'read_at' => 'datetime',
    ];
}
