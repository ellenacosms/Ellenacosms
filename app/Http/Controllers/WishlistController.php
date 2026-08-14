<?php

namespace App\Http\Controllers;

use App\Models\Product;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;

class WishlistController extends Controller
{
    public function store(Request $request, Product $product): RedirectResponse
    {
        abort_unless($product->is_active, 404);

        $request->user()->wishlistProducts()->syncWithoutDetaching([$product->id]);

        return back(303)->with('success', "{$product->name} was saved to your ritual.");
    }

    public function destroy(Request $request, Product $product): RedirectResponse
    {
        $request->user()->wishlistProducts()->detach($product->id);

        return back(303)->with('success', "{$product->name} was removed from your saved ritual.");
    }
}
