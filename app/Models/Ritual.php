<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class Ritual extends Model
{
    protected $fillable = [
        'name', 'slug', 'eyebrow', 'description', 'image', 'discount_percent',
        'steps', 'sort_order', 'is_featured', 'is_active',
    ];

    protected function casts(): array
    {
        return [
            'discount_percent' => 'decimal:2',
            'steps' => 'array',
            'is_featured' => 'boolean',
            'is_active' => 'boolean',
        ];
    }

    /**
     * @return BelongsToMany<Product, $this>
     */
    public function products(): BelongsToMany
    {
        return $this->belongsToMany(Product::class)
            ->withPivot(['step_order', 'instruction'])
            ->orderByPivot('step_order');
    }

    /**
     * @param  Builder<Ritual>  $query
     * @return Builder<Ritual>
     */
    public function scopeAvailable(Builder $query): Builder
    {
        return $query->where('is_active', true);
    }
}
