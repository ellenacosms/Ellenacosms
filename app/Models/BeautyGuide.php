<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class BeautyGuide extends Model
{
    public const CATEGORIES = [
        'hair-care' => 'Hair care',
        'body-care' => 'Body care',
        'baby-care' => 'Baby care',
        'fragrance' => 'Fragrance',
        'beauty-rituals' => 'Beauty rituals',
    ];

    protected $fillable = [
        'title', 'slug', 'category', 'eyebrow', 'excerpt', 'body', 'hero_image',
        'sections', 'steps', 'faqs', 'seo_title', 'seo_description',
        'read_minutes', 'sort_order', 'is_featured', 'is_published', 'published_at',
    ];

    protected function casts(): array
    {
        return [
            'sections' => 'array',
            'steps' => 'array',
            'faqs' => 'array',
            'is_featured' => 'boolean',
            'is_published' => 'boolean',
            'published_at' => 'datetime',
        ];
    }

    public function products(): BelongsToMany
    {
        return $this->belongsToMany(Product::class)
            ->withPivot(['sort_order', 'note'])
            ->orderByPivot('sort_order');
    }

    public function scopePublished(Builder $query): Builder
    {
        return $query
            ->where('is_published', true)
            ->where(fn (Builder $publication) => $publication
                ->whereNull('published_at')
                ->orWhere('published_at', '<=', now()));
    }

    public function getCategoryLabelAttribute(): string
    {
        return self::CATEGORIES[$this->category] ?? str($this->category)->headline()->toString();
    }
}
