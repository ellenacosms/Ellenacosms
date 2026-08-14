<?php

namespace App\Http\Controllers;

use App\Models\Product;
use App\Models\Review;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;

class ReviewController extends Controller
{
    public function store(Request $request, Product $product): RedirectResponse
    {
        abort_unless($product->is_active, 404);

        $verifiedPurchase = $request->user()->orders()
            ->reviewEligible()
            ->whereHas('items', fn ($query) => $query->where('product_id', $product->id))
            ->exists();
        abort_unless($verifiedPurchase, 403, 'You can review products after purchasing them.');

        $validated = $request->validate([
            'rating' => ['required', 'integer', 'min:1', 'max:5'],
            'title' => ['nullable', 'string', 'max:120'],
            'body' => ['required', 'string', 'min:10', 'max:2000'],
        ]);

        Review::updateOrCreate(
            ['product_id' => $product->id, 'user_id' => $request->user()->id],
            [
                ...$validated,
                'user_id' => $request->user()->id,
                'customer_name' => $request->user()->name,
                'email' => $request->user()->email,
                'is_verified_purchase' => true,
                'is_approved' => false,
            ],
        );

        return back()->with('success', 'Thank you. Your review is awaiting approval.');
    }
}
