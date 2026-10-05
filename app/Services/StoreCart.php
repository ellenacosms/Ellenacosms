<?php

namespace App\Services;

use App\Models\Discount;
use App\Models\Product;
use App\Models\Ritual;
use App\Models\StoreSetting;
use Illuminate\Http\Request;
use Illuminate\Support\Collection;

class StoreCart
{
    /**
     * @return array<string, mixed>
     */
    public function details(Request $request): array
    {
        $rawCart = $request->session()->get('cart', []);
        $cart = [];

        if (is_array($rawCart)) {
            foreach ($rawCart as $productId => $quantity) {
                $productId = (int) $productId;
                $quantity = (int) $quantity;

                if ($productId > 0 && $quantity > 0) {
                    $cart[$productId] = $quantity;
                }
            }
        }

        $products = Product::with('category')
            ->whereIn('id', array_keys($cart))
            ->get()
            ->keyBy('id');
        $validCart = [];
        $items = collect($cart)->map(function (int $quantity, int $productId) use ($products, &$validCart) {
            $product = $products->get($productId);

            if (! $product || ! $product->is_active || $product->stock < 1) {
                return null;
            }

            $quantity = min($quantity, $product->stock, 20);
            $validCart[$product->id] = $quantity;

            return [
                'product' => $product,
                'quantity' => $quantity,
                'line_total' => round((float) $product->price * $quantity, 2),
            ];
        })->filter()->values();

        $request->session()->put('cart', $validCart);
        $subtotal = round((float) $items->sum('line_total'), 2);
        $bundleDiscount = $this->bundleDiscountFor($request, $products, $validCart);
        $discountableSubtotal = max(0, $subtotal - (float) ($bundleDiscount['amount'] ?? 0));
        $discount = $this->discountForCode((string) $request->session()->get('discount_code', ''));

        if ($discount && ! $discount->isEligibleFor($discountableSubtotal)) {
            $request->session()->forget('discount_code');
            $discount = null;
        }

        $discountAmount = $discount?->amountFor($discountableSubtotal) ?? 0;
        $discountedSubtotal = max(0, $discountableSubtotal - $discountAmount);
        $freeShippingThreshold = StoreSetting::freeShippingThreshold();
        $shipping = 0;

        return [
            'items' => $items,
            'count' => array_sum($validCart),
            'subtotal' => $subtotal,
            'discountable_subtotal' => $discountableSubtotal,
            'bundle_discount' => $bundleDiscount,
            'discount' => $discount ? [
                'code' => $discount->code,
                'name' => $discount->name,
                'amount' => $discountAmount,
            ] : null,
            'shipping' => $shipping,
            'total' => round($discountedSubtotal + $shipping, 2),
            'free_shipping_threshold' => $freeShippingThreshold,
        ];
    }

    /**
     * @param  Collection<int, Product>  $products
     * @param  array<int, int>  $cart
     * @return array{amount: float, rituals: list<array<string, mixed>>}|null
     */
    public function bundleDiscountFor(Request $request, Collection $products, array $cart): ?array
    {
        $tracked = collect($request->session()->get('cart_rituals', []))
            ->map(fn ($quantity) => max(0, (int) $quantity))
            ->filter()
            ->all();

        if ($tracked === []) {
            return null;
        }

        $remainingQuantities = collect($cart)
            ->mapWithKeys(fn ($quantity, $productId) => [(int) $productId => (int) $quantity])
            ->all();
        $products = $products->keyBy('id');
        $validTracking = [];
        $lines = [];
        $amount = 0.0;

        $rituals = Ritual::available()
            ->whereIn('id', array_keys($tracked))
            ->with('products')
            ->orderBy('sort_order')
            ->orderBy('id')
            ->get();

        foreach ($rituals as $ritual) {
            if ($ritual->products->isEmpty()) {
                continue;
            }

            $eligibleQuantity = (int) $tracked[$ritual->id];

            foreach ($ritual->products as $ritualProduct) {
                $product = $products->get($ritualProduct->id);

                if (! $product || ! $product->is_active || $product->stock < 1) {
                    $eligibleQuantity = 0;
                    break;
                }

                $eligibleQuantity = min(
                    $eligibleQuantity,
                    (int) ($remainingQuantities[$ritualProduct->id] ?? 0),
                );
            }

            if ($eligibleQuantity < 1) {
                continue;
            }

            $regularPrice = round((float) $ritual->products->sum(
                fn ($ritualProduct) => (float) $products->get($ritualProduct->id)->price,
            ) * $eligibleQuantity, 2);
            $ritualSaving = round($regularPrice * ((float) $ritual->discount_percent / 100), 2);

            foreach ($ritual->products as $ritualProduct) {
                $remainingQuantities[$ritualProduct->id] -= $eligibleQuantity;
            }

            $validTracking[$ritual->id] = $eligibleQuantity;
            $amount += $ritualSaving;
            $lines[] = [
                'id' => $ritual->id,
                'name' => $ritual->name,
                'slug' => $ritual->slug,
                'quantity' => $eligibleQuantity,
                'discount_percent' => (float) $ritual->discount_percent,
                'amount' => $ritualSaving,
            ];
        }

        $request->session()->put('cart_rituals', $validTracking);

        if ($amount <= 0) {
            return null;
        }

        return [
            'amount' => round($amount, 2),
            'rituals' => $lines,
        ];
    }

    public function discountForCode(string $code): ?Discount
    {
        return Discount::query()
            ->available()
            ->whereRaw('UPPER(code) = ?', [strtoupper(trim($code))])
            ->first();
    }
}
