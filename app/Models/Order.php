<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Order extends Model
{
    protected $fillable = [
        'user_id', 'number', 'status', 'payment_status', 'customer_name',
        'email', 'phone', 'address', 'city', 'country', 'notes',
        'checkout_token', 'delivery_method', 'estimated_delivery_date',
        'payment_method', 'payment_provider', 'payment_reference', 'payment_merchant_reference',
        'payment_redirect_url', 'payment_confirmation_code', 'payment_status_message', 'paid_at',
        'expires_at', 'expired_at', 'resources_released_at', 'payment_checked_at', 'confirmation_sent_at',
        'subtotal', 'discount_id', 'discount_code', 'discount_amount', 'shipping', 'total',
    ];

    protected function casts(): array
    {
        return [
            'subtotal' => 'decimal:2',
            'discount_amount' => 'decimal:2',
            'shipping' => 'decimal:2',
            'total' => 'decimal:2',
            'estimated_delivery_date' => 'date',
            'paid_at' => 'datetime',
            'expires_at' => 'datetime',
            'expired_at' => 'datetime',
            'resources_released_at' => 'datetime',
            'payment_checked_at' => 'datetime',
            'confirmation_sent_at' => 'datetime',
        ];
    }

    /**
     * @param  Builder<Order>  $query
     * @return Builder<Order>
     */
    public function scopeReviewEligible(Builder $query): Builder
    {
        return $query
            ->where('payment_status', 'paid')
            ->where('status', '!=', 'cancelled');
    }

    /**
     * @return BelongsTo<User, $this>
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * @return BelongsTo<Discount, $this>
     */
    public function discount(): BelongsTo
    {
        return $this->belongsTo(Discount::class);
    }

    /**
     * @return HasMany<OrderItem, $this>
     */
    public function items(): HasMany
    {
        return $this->hasMany(OrderItem::class);
    }

    /**
     * @return HasMany<OrderPaymentEvent, $this>
     */
    public function paymentEvents(): HasMany
    {
        return $this->hasMany(OrderPaymentEvent::class)->latest();
    }
}
