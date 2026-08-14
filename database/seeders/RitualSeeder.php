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
                'products' => [
                    'hydra-veil-mist' => ['step_order' => 1, 'instruction' => 'Mist generously over clean skin.'],
                    'silk-canvas-primer' => ['step_order' => 2, 'instruction' => 'Massage onto damp skin.'],
                    'no-01-santal-lumiere' => ['step_order' => 3, 'instruction' => 'Finish over pulse points and collarbone.'],
                ],
            ],
        ];

        foreach ($rituals as $data) {
            $products = collect($data['products'])
                ->mapWithKeys(function (array $pivot, string $slug): array {
                    $productId = Product::where('slug', $slug)->value('id');

                    return $productId ? [$productId => $pivot] : [];
                });

            $ritual = Ritual::updateOrCreate(
                ['slug' => $data['slug']],
                collect($data)->except('products')->all(),
            );
            $ritual->products()->sync($products->all());
        }
    }
}
