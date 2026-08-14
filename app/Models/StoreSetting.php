<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class StoreSetting extends Model
{
    protected $fillable = ['key', 'value'];

    public static function getValue(string $key, mixed $default = null): mixed
    {
        return static::query()->where('key', $key)->value('value') ?? $default;
    }

    /**
     * @return array<string, string>
     */
    public static function frontendValues(): array
    {
        return static::query()->pluck('value', 'key')->all();
    }

    public static function currency(): string
    {
        return strtoupper((string) static::getValue('currency', 'UGX'));
    }

    public static function freeShippingThreshold(): float
    {
        return (float) static::getValue('free_shipping_threshold', 150);
    }

    public static function lowStockThreshold(): int
    {
        return (int) static::getValue('low_stock_threshold', 10);
    }

    public static function orderPrefix(): string
    {
        return strtoupper((string) static::getValue('order_prefix', 'ELN'));
    }
}
