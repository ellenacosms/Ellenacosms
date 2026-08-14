<?php

namespace App\Support;

use App\Models\Category;
use App\Models\Product;
use Illuminate\Support\Str;

class ProductSku
{
    public static function generate(int $categoryId): string
    {
        $categorySlug = Category::whereKey($categoryId)->value('slug') ?? 'product';
        $prefix = Str::upper(Str::substr(preg_replace('/[^a-z0-9]/i', '', $categorySlug) ?: 'PRD', 0, 3));

        do {
            $sku = 'EL-'.$prefix.'-'.Str::upper(Str::random(8));
        } while (Product::where('sku', $sku)->exists());

        return $sku;
    }
}
