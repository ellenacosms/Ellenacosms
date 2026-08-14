<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        $definitions = [
            'hair-care' => [
                'name' => 'Hair Care',
                'description' => 'Performance-led care for stronger, healthier-looking hair.',
                'image' => '/images/catalog/hair-care-editorial.png',
            ],
            'body-care' => [
                'name' => 'Body Care',
                'description' => 'Sensory essentials for soft, nourished, luminous skin.',
                'image' => '/images/catalog/body-care-editorial.png',
            ],
            'rituals' => [
                'name' => 'Rituals',
                'description' => 'Layered moments designed to make care feel considered.',
                'image' => '/images/catalog/rituals-editorial.png',
            ],
        ];

        $categoryIds = [];

        foreach ($definitions as $slug => $definition) {
            DB::table('categories')->updateOrInsert(
                ['slug' => $slug],
                [
                    'name' => $definition['name'],
                    'description' => $definition['description'],
                    'image' => $definition['image'],
                    'is_active' => true,
                    'updated_at' => now(),
                    'created_at' => now(),
                ],
            );

            $categoryIds[$slug] = DB::table('categories')->where('slug', $slug)->value('id');
        }

        $products = [
            'radiance-elixir-serum' => ['category' => 'hair-care', 'name' => 'Radiance Elixir Scalp Serum', 'subtitle' => 'Concentrated scalp nourishment'],
            'velvet-matte-rose' => ['category' => 'body-care', 'name' => 'Velvet Body Polish', 'subtitle' => 'Softening exfoliating polish'],
            'midnight-recovery-cream' => ['category' => 'hair-care', 'name' => 'Midnight Recovery Hair Mask', 'subtitle' => 'Restorative overnight hair care'],
            'hydra-veil-mist' => ['category' => 'body-care', 'name' => 'Hydra Veil Body Mist', 'subtitle' => 'Refreshing all-over hydration'],
            'silk-canvas-primer' => ['category' => 'body-care', 'name' => 'Silk Canvas Body Oil', 'subtitle' => 'Soft-focus nourishing oil'],
            'rose-gold-cleansing-oil' => ['category' => 'body-care', 'name' => 'Rose Gold Body Cleansing Oil', 'subtitle' => 'Silken daily cleanse'],
            'peptide-lip-treatment' => ['category' => 'body-care', 'name' => 'Peptide Hand Treatment', 'subtitle' => 'Barrier-support hand care'],
            'no-01-santal-lumiere' => ['category' => 'rituals', 'name' => 'No. 01 Santal Body Mist', 'subtitle' => 'Aromatic body veil'],
        ];

        foreach ($products as $slug => $product) {
            DB::table('products')->where('slug', $slug)->update([
                'category_id' => $categoryIds[$product['category']],
                'name' => $product['name'],
                'subtitle' => $product['subtitle'],
                'updated_at' => now(),
            ]);
        }

        DB::table('categories')
            ->whereIn('slug', ['skin-care', 'makeup', 'fragrance'])
            ->whereNotExists(fn ($query) => $query
                ->select(DB::raw(1))
                ->from('products')
                ->whereColumn('products.category_id', 'categories.id'))
            ->delete();
    }

    public function down(): void {}
};
