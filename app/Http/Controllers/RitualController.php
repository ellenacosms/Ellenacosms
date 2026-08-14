<?php

namespace App\Http\Controllers;

use App\Models\Ritual;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

class RitualController extends Controller
{
    public function index(): Response
    {
        $rituals = Ritual::available()
            ->whereHas('products')
            ->with(['products' => fn ($query) => $query
                ->withApprovedReviewSummary()
                ->with('category')])
            ->orderBy('sort_order')
            ->orderBy('id')
            ->get()
            ->map(function (Ritual $ritual): array {
                $regularPrice = round((float) $ritual->products->sum(fn ($product) => (float) $product->price), 2);
                $savings = round($regularPrice * ((float) $ritual->discount_percent / 100), 2);

                return [
                    ...$ritual->only([
                        'id', 'name', 'slug', 'eyebrow', 'description', 'image',
                        'discount_percent', 'steps', 'is_featured',
                    ]),
                    'products' => $ritual->products,
                    'regular_price' => $regularPrice,
                    'bundle_price' => round($regularPrice - $savings, 2),
                    'savings' => $savings,
                    'is_available' => $ritual->products->isNotEmpty()
                        && $ritual->products->every(fn ($product) => $product->is_active && $product->stock > 0),
                ];
            });

        return Inertia::render('storefront/rituals', [
            'rituals' => $rituals,
        ]);
    }

    public function addToCart(Request $request, Ritual $ritual): RedirectResponse
    {
        abort_unless($ritual->is_active, 404);

        $validated = $request->validate([
            'quantity' => ['sometimes', 'integer', 'min:1', 'max:3'],
        ]);
        $quantity = (int) ($validated['quantity'] ?? 1);
        $products = $ritual->products()->get();

        abort_if($products->isEmpty(), 422, 'This ritual is not available yet.');

        $cart = $request->session()->get('cart', []);
        $cart = is_array($cart) ? $cart : [];

        foreach ($products as $product) {
            $newQuantity = (int) ($cart[$product->id] ?? 0) + $quantity;

            if (! $product->is_active || $product->stock < $newQuantity || $newQuantity > 20) {
                throw ValidationException::withMessages([
                    'ritual' => "{$product->name} does not have enough stock to add this complete ritual.",
                ]);
            }

            $cart[$product->id] = $newQuantity;
        }

        $cartRituals = $request->session()->get('cart_rituals', []);
        $cartRituals = is_array($cartRituals) ? $cartRituals : [];
        $cartRituals[$ritual->id] = min((int) ($cartRituals[$ritual->id] ?? 0) + $quantity, 3);

        $request->session()->put('cart', $cart);
        $request->session()->put('cart_rituals', $cartRituals);

        return back(303)->with('success', "{$ritual->name} was added with ritual savings.");
    }
}
