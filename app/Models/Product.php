<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;

/**
 * @property array<int, string>|null $benefits
 * @property array<int, string>|null $concerns
 * @property array<int, string>|null $images
 * @property array<int, string>|null $ritual_steps
 */
class Product extends Model
{
    /**
     * @var list<string>
     */
    public const STOREFRONT_SORTS = [
        'featured',
        'newest',
        'price-low',
        'price-high',
        'name',
    ];

    protected $fillable = [
        'category_id', 'name', 'slug', 'sku', 'subtitle', 'color', 'size', 'description',
        'ingredients', 'usage', 'benefits', 'concerns', 'ritual_steps', 'price',
        'compare_price', 'wholesale_price', 'wholesale_min_qty', 'stock', 'stock_status',
        'images', 'is_featured', 'is_active',
    ];

    protected function casts(): array
    {
        return [
            'price' => 'decimal:2',
            'compare_price' => 'decimal:2',
            'wholesale_price' => 'decimal:2',
            'wholesale_min_qty' => 'integer',
            'benefits' => 'array',
            'concerns' => 'array',
            'ritual_steps' => 'array',
            'images' => 'array',
            'is_featured' => 'boolean',
            'is_active' => 'boolean',
        ];
    }

    /**
     * @return BelongsTo<Category, $this>
     */
    public function category(): BelongsTo
    {
        return $this->belongsTo(Category::class);
    }

    /**
     * @return HasMany<OrderItem, $this>
     */
    public function orderItems(): HasMany
    {
        return $this->hasMany(OrderItem::class);
    }

    /**
     * @return HasMany<Review, $this>
     */
    public function reviews(): HasMany
    {
        return $this->hasMany(Review::class);
    }

    /**
     * @return BelongsToMany<User, $this>
     */
    public function wishlistedBy(): BelongsToMany
    {
        return $this->belongsToMany(User::class, 'wishlists')->withTimestamps();
    }

    /**
     * @return BelongsToMany<Ritual, $this>
     */
    public function rituals(): BelongsToMany
    {
        return $this->belongsToMany(Ritual::class)
            ->withPivot(['step_order', 'instruction']);
    }

    /**
     * @param  Builder<Product>  $query
     * @return Builder<Product>
     */
    public function scopeAvailable(Builder $query): Builder
    {
        return $query->where('is_active', true);
    }

    /**
     * @param  Builder<Product>  $query
     * @return Builder<Product>
     */
    public function scopeWithApprovedReviewSummary(Builder $query): Builder
    {
        return $query
            ->withAvg([
                'reviews as reviews_avg_rating' => fn (Builder $reviews) => $reviews->where('is_approved', true),
            ], 'rating')
            ->withCount([
                'reviews as reviews_count' => fn (Builder $reviews) => $reviews->where('is_approved', true),
            ]);
    }

    /**
     * @param  Builder<Product>  $query
     * @return Builder<Product>
     */
    public function scopeSearch(Builder $query, string $search): Builder
    {
        $terms = collect(preg_split('/\s+/', trim($search)) ?: [])
            ->filter()
            ->take(5);

        foreach ($terms as $term) {
            $pattern = '%'.$term.'%';

            $query->where(fn (Builder $match) => $match
                ->where('name', 'like', $pattern)
                ->orWhere('subtitle', 'like', $pattern)
                ->orWhere('description', 'like', $pattern)
                ->orWhere('ingredients', 'like', $pattern)
                ->orWhere('sku', 'like', $pattern)
                ->orWhereHas('category', fn (Builder $category) => $category->where('name', 'like', $pattern))
            );
        }

        return $query;
    }

    /**
     * @param  Builder<Product>  $query
     * @return Builder<Product>
     */
    public function scopeSortForStorefront(Builder $query, string $sort): Builder
    {
        return match ($sort) {
            'newest' => $query->latest(),
            'price-low' => $query->orderBy('price')->orderBy('id'),
            'price-high' => $query->orderByDesc('price')->orderBy('id'),
            'name' => $query->orderBy('name')->orderBy('id'),
            default => $query->orderByDesc('is_featured')->latest(),
        };
    }
}
