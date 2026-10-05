<?php

namespace App\Support;

use App\Models\Product;
use Illuminate\Database\Eloquent\Builder;

class StorefrontMerchandising
{
    /**
     * @return array<string, array<string, string>>
     */
    public static function edits(): array
    {
        return [
            'available-now' => [
                'slug' => 'available-now',
                'eyebrow' => 'Ready to shop',
                'title' => 'Available now',
                'description' => 'In-stock formulas ready to begin their journey to your shelf.',
            ],
            'new-noteworthy' => [
                'slug' => 'new-noteworthy',
                'eyebrow' => 'Fresh discoveries',
                'title' => 'New & noteworthy',
                'description' => 'The latest additions to the collection, gathered into one considered edit.',
            ],
            'under-10000' => [
                'slug' => 'under-10000',
                'eyebrow' => 'Everyday value',
                'title' => 'Under UGX 10,000',
                'description' => 'Useful everyday care at an easy, approachable price point.',
            ],
            'expert-selected' => [
                'slug' => 'expert-selected',
                'eyebrow' => 'From the Beauty Guide',
                'title' => 'Expert selected',
                'description' => 'Products chosen inside our practical guides for a clearer, more confident routine.',
            ],
        ];
    }

    /**
     * @return list<array<string, string>>
     */
    public static function concerns(): array
    {
        return [
            [
                'slug' => 'hydration',
                'title' => 'Moisture & hydration',
                'description' => 'Comfort dry hair and skin with replenishing, easy-to-layer textures.',
                'href' => '/shop?concern=hydration',
                'image' => '/images/catalog/body-care-editorial.png',
            ],
            [
                'slug' => 'strength-repair',
                'title' => 'Strength & repair',
                'description' => 'Support stressed lengths, visible damage, and protective-style care.',
                'href' => '/shop?category=hair-care&concern=strength-repair',
                'image' => '/images/catalog/hair-care-editorial.png',
            ],
            [
                'slug' => 'scalp-care',
                'title' => 'Scalp care',
                'description' => 'Begin at the roots with focused cleansing, comfort, and nourishment.',
                'href' => '/shop?category=hair-care&concern=scalp-care',
                'image' => '/images/campaign/ellena-hair-care-dark.png',
            ],
            [
                'slug' => 'softness',
                'title' => 'Softness & glow',
                'description' => 'Smooth texture and seal in a soft, luminous finish from head to toe.',
                'href' => '/shop?concern=softness',
                'image' => '/images/campaign/ellena-body-care-dark.png',
            ],
            [
                'slug' => 'cleansing',
                'title' => 'Gentle cleansing',
                'description' => 'Refresh daily buildup without leaving hair or skin feeling stripped.',
                'href' => '/shop?concern=cleansing',
                'image' => '/images/campaign/ellena-family-care-banner.png',
            ],
            [
                'slug' => 'layering',
                'title' => 'Scent layering',
                'description' => 'Build a quiet signature with complementary body care and fragrance.',
                'href' => '/shop?concern=layering',
                'image' => '/images/catalog/rituals-editorial.png',
            ],
        ];
    }

    /**
     * @param  Builder<Product>  $query
     * @return Builder<Product>
     */
    public static function applyEdit(Builder $query, string $edit): Builder
    {
        return match ($edit) {
            'available-now' => $query->where('stock', '>', 0),
            'under-10000' => $query->where('stock', '>', 0)->where('price', '<=', 10000),
            'expert-selected' => $query->whereHas('beautyGuides', fn (Builder $guides) => $guides->published()),
            default => $query,
        };
    }

    /**
     * @param  Builder<Product>  $query
     * @return Builder<Product>
     */
    public static function applyConcern(Builder $query, string $concern): Builder
    {
        $terms = self::concernTerms()[$concern] ?? [];

        if ($terms === []) {
            return $query;
        }

        return $query->where(function (Builder $search) use ($terms): void {
            foreach ($terms as $term) {
                $pattern = "%{$term}%";
                $search
                    ->orWhere('name', 'like', $pattern)
                    ->orWhere('subtitle', 'like', $pattern)
                    ->orWhere('description', 'like', $pattern)
                    ->orWhere('ingredients', 'like', $pattern)
                    ->orWhere('usage', 'like', $pattern)
                    ->orWhere('benefits', 'like', $pattern)
                    ->orWhere('concerns', 'like', $pattern)
                    ->orWhere('ritual_steps', 'like', $pattern);
            }
        });
    }

    /**
     * @return array<string, list<string>>
     */
    private static function concernTerms(): array
    {
        return [
            'scalp-care' => ['scalp', 'root', 'rosemary'],
            'strength-repair' => ['strong', 'repair', 'restor', 'damage', 'breakage', 'ceramide', 'baobab'],
            'hydration' => ['hydrat', 'hyaluronic', 'moisture', 'dryness', 'dry hair', 'dry skin'],
            'softness' => ['soft', 'smooth', 'supple', 'texture', 'radiance'],
            'cleansing' => ['clean', 'polish', 'exfoliat', 'buildup'],
            'aromatic-care' => ['mist', 'sandalwood', 'aromatic', 'bergamot'],
            'evening-ritual' => ['night', 'midnight', 'evening', 'overnight', 'sandalwood'],
            'layering' => ['ritual', 'layer', 'mist', 'oil', 'scent'],
        ];
    }
}
