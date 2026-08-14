<?php

namespace App\Http\Controllers;

use App\Models\Product;
use App\Services\StoreCart;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class CartController extends Controller
{
    public function __construct(private StoreCart $cart) {}

    public function index(Request $request): Response
    {
        return Inertia::render('storefront/cart', $this->cart->details($request));
    }

    public function store(Request $request, Product $product): RedirectResponse
    {
        $validated = $request->validate(['quantity' => ['required', 'integer', 'min:1', 'max:20']]);
        abort_unless($product->is_active && $product->stock > 0, 422, 'This product is unavailable.');

        $cart = $request->session()->get('cart', []);
        $cart[$product->id] = min(($cart[$product->id] ?? 0) + $validated['quantity'], $product->stock);
        $request->session()->put('cart', $cart);

        return back()->with('success', $product->name.' was added to your bag.');
    }

    public function update(Request $request, Product $product): RedirectResponse
    {
        $validated = $request->validate(['quantity' => ['required', 'integer', 'min:0', 'max:20']]);
        $cart = $request->session()->get('cart', []);

        if ($validated['quantity'] === 0) {
            unset($cart[$product->id]);
        } else {
            $cart[$product->id] = min($validated['quantity'], $product->stock);
        }

        $request->session()->put('cart', $cart);

        return back();
    }

    public function applyDiscount(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'code' => ['required', 'string', 'max:40'],
        ]);

        $discount = $this->cart->discountForCode($validated['code']);
        $details = $this->cart->details($request);
        abort_unless($discount && $discount->isEligibleFor($details['discountable_subtotal']), 422, 'That discount code is not available for this order.');

        $request->session()->put('discount_code', $discount->code);

        return back()->with('success', $discount->code.' was applied.');
    }

    public function removeDiscount(Request $request): RedirectResponse
    {
        $request->session()->forget('discount_code');

        return back()->with('success', 'Discount removed.');
    }

    public function destroy(Request $request, Product $product): RedirectResponse
    {
        $cart = $request->session()->get('cart', []);
        unset($cart[$product->id]);
        $request->session()->put('cart', $cart);

        return back();
    }
}
