<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;

class Discount extends Model
{
    protected $fillable = [
        'name', 'code', 'type', 'value', 'minimum_order', 'usage_limit',
        'times_used', 'starts_at', 'ends_at', 'is_active',
    ];

    protected function casts(): array
    {
        return [
            'value' => 'decimal:2',
            'minimum_order' => 'decimal:2',
            'starts_at' => 'datetime',
            'ends_at' => 'datetime',
            'is_active' => 'boolean',
        ];
    }

    /**
     * @param  Builder<Discount>  $query
     * @return Builder<Discount>
     */
    public function scopeAvailable(Builder $query): Builder
    {
        return $query
            ->where('is_active', true)
            ->where(fn (Builder $query) => $query->whereNull('starts_at')->orWhere('starts_at', '<=', now()))
            ->where(fn (Builder $query) => $query->whereNull('ends_at')->orWhere('ends_at', '>=', now()))
            ->where(fn (Builder $query) => $query->whereNull('usage_limit')->orWhereColumn('times_used', '<', 'usage_limit'));
    }

    public function isEligibleFor(float $subtotal): bool
    {
        return $subtotal >= (float) ($this->minimum_order ?? 0);
    }

    public function amountFor(float $subtotal): float
    {
        if (! $this->isEligibleFor($subtotal)) {
            return 0;
        }

        $amount = $this->type === 'percentage'
            ? $subtotal * ((float) $this->value / 100)
            : (float) $this->value;

        return round(min($subtotal, max(0, $amount)), 2);
    }
}
