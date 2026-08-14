<?php

namespace App\Services;

use App\Models\Product;
use Illuminate\Database\Eloquent\Collection as EloquentCollection;
use Illuminate\Http\Request;

class RecentlyViewedProducts
{
    private const SESSION_KEY = 'recently_viewed_product_ids';

    public function remember(Request $request, Product $product): void
    {
        $productIds = collect($request->session()->get(self::SESSION_KEY, []))
            ->prepend($product->id)
            ->map(fn ($productId) => (int) $productId)
            ->unique()
            ->take(12)
            ->values()
            ->all();

        $request->session()->put(self::SESSION_KEY, $productIds);
    }

    /**
     * @return EloquentCollection<int, Product>
     */
    public function get(Request $request, int $limit = 8, ?int $except = null): EloquentCollection
    {
        $productIds = collect($request->session()->get(self::SESSION_KEY, []))
            ->map(fn ($productId) => (int) $productId)
            ->when($except, fn ($ids) => $ids->reject(fn ($productId) => $productId === $except))
            ->unique()
            ->take($limit)
            ->values();

        if ($productIds->isEmpty()) {
            return new EloquentCollection;
        }

        $positions = $productIds->flip();

        return Product::available()
            ->withApprovedReviewSummary()
            ->with('category')
            ->whereKey($productIds)
            ->get()
            ->sortBy(fn (Product $product) => $positions->get($product->id))
            ->values();
    }
}
