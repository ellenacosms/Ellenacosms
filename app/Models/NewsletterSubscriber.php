<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;

class NewsletterSubscriber extends Model
{
    public const STATUS_PENDING = 'pending';

    public const STATUS_CONFIRMED = 'confirmed';

    public const STATUS_UNSUBSCRIBED = 'unsubscribed';

    protected $fillable = [
        'email',
        'whatsapp_phone',
        'status',
        'source',
        'confirmation_token_hash',
        'consent_ip_hash',
        'consent_at',
        'confirmed_at',
        'unsubscribed_at',
        'whatsapp_marketing_opted_in_at',
        'whatsapp_marketing_opted_out_at',
        'whatsapp_marketing_opt_in_source',
        'mailchimp_synced_at',
        'mailchimp_sync_error',
    ];

    protected function casts(): array
    {
        return [
            'consent_at' => 'datetime',
            'confirmed_at' => 'datetime',
            'unsubscribed_at' => 'datetime',
            'whatsapp_marketing_opted_in_at' => 'datetime',
            'whatsapp_marketing_opted_out_at' => 'datetime',
            'mailchimp_synced_at' => 'datetime',
        ];
    }

    /**
     * @param  Builder<NewsletterSubscriber>  $query
     */
    public function scopeConfirmed(Builder $query): void
    {
        $query->where('status', self::STATUS_CONFIRMED);
    }
}
