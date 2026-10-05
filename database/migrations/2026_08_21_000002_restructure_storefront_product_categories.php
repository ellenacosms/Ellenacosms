<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        DB::transaction(function (): void {
            $definitions = [
                'hair-care' => [
                    'name' => 'Hair Care',
                    'description' => 'Performance-led care for stronger, healthier-looking hair.',
                    'image' => '/images/catalog/hair-care-editorial.png',
                ],
                'body-care' => [
                    'name' => 'Body Care',
                    'description' => 'Everyday essentials for soft, nourished, comfortable skin.',
                    'image' => '/images/catalog/body-care-editorial.png',
                ],
                'baby-care' => [
                    'name' => 'Baby Care',
                    'description' => 'Gentle everyday essentials for the smallest rituals.',
                    'image' => '/images/campaign/ellena-family-care-banner.png',
                ],
                'fragrance' => [
                    'name' => 'Fragrance',
                    'description' => 'Scents and finishing touches for a lasting signature.',
                    'image' => '/images/catalog/rituals-editorial.png',
                ],
            ];

            $categoryIds = [];

            foreach ($definitions as $slug => $definition) {
                DB::table('categories')->updateOrInsert(
                    ['slug' => $slug],
                    [
                        ...$definition,
                        'is_active' => true,
                        'updated_at' => now(),
                        'created_at' => now(),
                    ],
                );

                $categoryIds[$slug] = DB::table('categories')
                    ->where('slug', $slug)
                    ->value('id');
            }

            DB::table('products')
                ->where('name', 'like', '%baby%')
                ->update([
                    'category_id' => $categoryIds['baby-care'],
                    'updated_at' => now(),
                ]);

            DB::table('products')
                ->where(function ($query): void {
                    $query
                        ->where('name', 'like', '%perfume%')
                        ->orWhere('name', 'like', '%deodorant%')
                        ->orWhere('name', 'like', '%body mist%');
                })
                ->update([
                    'category_id' => $categoryIds['fragrance'],
                    'updated_at' => now(),
                ]);

            DB::table('categories')
                ->where('slug', 'rituals')
                ->update(['is_active' => false, 'updated_at' => now()]);
        });
    }

    public function down(): void
    {
        DB::transaction(function (): void {
            $bodyCareId = DB::table('categories')->where('slug', 'body-care')->value('id');

            if ($bodyCareId) {
                DB::table('products')
                    ->whereIn('category_id', DB::table('categories')->whereIn('slug', ['baby-care', 'fragrance'])->pluck('id'))
                    ->update(['category_id' => $bodyCareId, 'updated_at' => now()]);
            }

            DB::table('categories')
                ->where('slug', 'rituals')
                ->update(['is_active' => true, 'updated_at' => now()]);
        });
    }
};
