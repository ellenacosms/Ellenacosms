<?php

namespace Database\Seeders;

use App\Models\Product;
use App\Models\Ritual;
use Illuminate\Database\Seeder;

class RitualSeeder extends Seeder
{
    public function run(): void
    {
        $rituals = [
            [
                'slug' => 'root-to-length-renewal',
                'name' => 'Root-to-Length Renewal',
                'eyebrow' => 'The hair ritual',
                'description' => 'A restorative pairing for a refreshed scalp, replenished lengths, and stronger-looking hair from root to tip.',
                'image' => '/images/catalog/hair-care-editorial.png',
                'discount_percent' => 10,
                'steps' => ['Reset the scalp with targeted hydration.', 'Replenish clean lengths with the recovery mask.', 'Repeat weekly or whenever hair feels depleted.'],
                'sort_order' => 1,
                'is_featured' => true,
                'category' => 'hair-care',
                'fallback_terms' => ['oil', 'food', 'mousse', 'gel', 'pomade'],
                'products' => [
                    'radiance-elixir-serum' => ['step_order' => 1, 'instruction' => 'Massage into the scalp and roots.'],
                    'midnight-recovery-cream' => ['step_order' => 2, 'instruction' => 'Smooth through lengths and leave to replenish.'],
                ],
            ],
            [
                'slug' => 'body-glow-layering',
                'name' => 'Body Glow Layering',
                'eyebrow' => 'The body ritual',
                'description' => 'Cleanse, polish, and seal in moisture for skin that feels soft, smooth, and quietly luminous.',
                'image' => '/images/catalog/body-care-editorial.png',
                'discount_percent' => 12,
                'steps' => ['Cleanse damp skin without stripping.', 'Polish in slow circular motions.', 'Press body oil onto damp skin to seal in softness.'],
                'sort_order' => 2,
                'is_featured' => true,
                'category' => 'body-care',
                'fallback_terms' => ['wash', 'lotion', 'jelly', 'oil', 'cream'],
                'products' => [
                    'rose-gold-cleansing-oil' => ['step_order' => 1, 'instruction' => 'Begin with a silken daily cleanse.'],
                    'velvet-matte-rose' => ['step_order' => 2, 'instruction' => 'Polish rough texture two or three times weekly.'],
                    'silk-canvas-primer' => ['step_order' => 3, 'instruction' => 'Seal moisture into freshly dried skin.'],
                ],
            ],
            [
                'slug' => 'hydration-and-scent',
                'name' => 'Hydration & Scent',
                'eyebrow' => 'The finishing ritual',
                'description' => 'A light, sensorial layering ritual that pairs lasting hydration with Ellena’s warm signature body veil.',
                'image' => '/images/catalog/rituals-editorial.png',
                'discount_percent' => 10,
                'steps' => ['Mist clean skin with weightless hydration.', 'Layer body oil wherever extra nourishment is needed.', 'Finish on pulse points with the Santal body veil.'],
                'sort_order' => 3,
                'is_featured' => false,
                'category' => 'fragrance',
                'fallback_terms' => ['perfume', 'mist', 'spray'],
                'products' => [
                    'hydra-veil-mist' => ['step_order' => 1, 'instruction' => 'Mist generously over clean skin.'],
                    'silk-canvas-primer' => ['step_order' => 2, 'instruction' => 'Massage onto damp skin.'],
                    'no-01-santal-lumiere' => ['step_order' => 3, 'instruction' => 'Finish over pulse points and collarbone.'],
                ],
            ],
            [
                'slug' => 'gentle-baby-basics',
                'name' => 'Gentle Baby Basics',
                'eyebrow' => 'The family ritual',
                'description' => 'A simple bath-to-moisture sequence composed from the gentle baby-care formulas currently available.',
                'image' => '/images/campaign/ellena-family-care-banner.png',
                'discount_percent' => 8,
                'steps' => ['Begin with a mild bath-time cleanse.', 'Layer lotion onto clean, slightly damp skin.', 'Use oil or jelly only where extra comfort is needed.'],
                'sort_order' => 4,
                'is_featured' => false,
                'category' => 'baby-care',
                'fallback_terms' => ['wash', 'lotion', 'oil', 'jelly'],
                'products' => [],
            ],
        ];

        foreach ($rituals as $data) {
            $products = collect($data['products'])
                ->mapWithKeys(function (array $pivot, string $slug): array {
                    $productId = Product::where('slug', $slug)->value('id');

                    return $productId ? [$productId => $pivot] : [];
                });

            if ($products->count() < 2) {
                $fallbackProducts = collect($data['fallback_terms'])
                    ->map(function (string $term) use ($data, $products): ?Product {
                        return Product::available()
                            ->where('stock', '>', 0)
                            ->whereHas('category', fn ($category) => $category->where('slug', $data['category']))
                            ->where('name', 'like', "%{$term}%")
                            ->whereNotIn('id', $products->keys())
                            ->orderByDesc('stock')
                            ->first();
                    })
                    ->filter()
                    ->unique('id')
                    ->take(3);

                foreach ($fallbackProducts as $index => $product) {
                    $products->put($product->id, [
                        'step_order' => $products->count() + 1,
                        'instruction' => 'Use this formula as the next step of the ritual.',
                    ]);
                }
            }

            $ritual = Ritual::updateOrCreate(
                ['slug' => $data['slug']],
                collect($data)->except(['products', 'category', 'fallback_terms'])->all(),
            );
            $ritual->products()->sync($products->all());
        }
    }
}
