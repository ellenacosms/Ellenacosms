<?php

namespace App\Services\Orders;

use App\Jobs\SendOrderEventWebhook;
use App\Jobs\SendOrderPaymentConfirmation;
use App\Models\Discount;
use App\Models\Order;
use App\Models\Product;
use Illuminate\Support\Facades\DB;
use RuntimeException;

class OrderPaymentLifecycle
{
    /** @param array<string, mixed> $attributes */
    public function apply(Order $order, string $paymentStatus, array $attributes, string $source): Order
    {
        $shouldConfirm = false;

        $updatedOrder = DB::transaction(function () use ($order, $paymentStatus, $attributes, $source, &$shouldConfirm): Order {
            $lockedOrder = Order::query()->with('items')->lockForUpdate()->findOrFail($order->id);
            $previousStatus = $lockedOrder->payment_status;

            if ($previousStatus === 'paid' && ! in_array($paymentStatus, ['paid', 'refunded'], true)) {
                $paymentStatus = 'paid';
            }

            if ($previousStatus === 'refunded') {
                $paymentStatus = 'refunded';
            }

            if ($previousStatus === 'expired' && ! in_array($paymentStatus, ['paid', 'refunded'], true)) {
                $paymentStatus = 'expired';
            }

            $fulfilmentHold = false;

            if ($paymentStatus === 'paid' && $lockedOrder->resources_released_at) {
                $fulfilmentHold = ! $this->reserveResources($lockedOrder);
            }

            if (in_array($paymentStatus, ['failed', 'expired'], true)) {
                $this->releaseResources($lockedOrder);
            }

            $lockedOrder->forceFill([
                ...$attributes,
                'payment_status' => $paymentStatus,
                'payment_checked_at' => now(),
                'paid_at' => $paymentStatus === 'paid' ? ($lockedOrder->paid_at ?? now()) : $lockedOrder->paid_at,
                'expired_at' => $paymentStatus === 'expired' ? ($lockedOrder->expired_at ?? now()) : $lockedOrder->expired_at,
                'status' => $fulfilmentHold
                    ? 'payment_review'
                    : ($paymentStatus === 'expired' ? 'cancelled' : $lockedOrder->status),
            ])->save();

            if ($previousStatus !== $paymentStatus) {
                $lockedOrder->paymentEvents()->create([
                    'source' => $source,
                    'status' => $paymentStatus,
                    'message' => $lockedOrder->payment_status_message,
                    'reference' => $lockedOrder->payment_reference,
                ]);
            }

            $shouldConfirm = $paymentStatus === 'paid'
                && $previousStatus !== 'paid'
                && ! $lockedOrder->confirmation_sent_at;

            return $lockedOrder->fresh(['items', 'paymentEvents']);
        });

        if ($shouldConfirm) {
            DB::afterCommit(fn () => SendOrderPaymentConfirmation::dispatch($updatedOrder->id));
            DB::afterCommit(fn () => SendOrderEventWebhook::dispatch($updatedOrder->id, 'payment.confirmed'));
        }

        return $updatedOrder;
    }

    public function expire(Order $order, string $source = 'reconciliation'): Order
    {
        return $this->apply($order, 'expired', [
            'payment_status_message' => 'Payment window expired before confirmation.',
            'payment_redirect_url' => null,
        ], $source);
    }

    public function reactivate(Order $order): Order
    {
        return DB::transaction(function () use ($order): Order {
            $lockedOrder = Order::query()->with('items')->lockForUpdate()->findOrFail($order->id);

            if ($lockedOrder->resources_released_at && ! $this->reserveResources($lockedOrder)) {
                throw new RuntimeException('This order can no longer be reserved because an item is out of stock.');
            }

            $lockedOrder->forceFill([
                'status' => 'pending',
                'payment_status' => 'pending',
                'payment_status_message' => 'Preparing a new payment request.',
                'payment_reference' => null,
                'payment_merchant_reference' => null,
                'payment_redirect_url' => null,
                'payment_checked_at' => null,
                'expired_at' => null,
                'expires_at' => now()->addMinutes((int) config('checkout.unpaid_order_expiry_minutes', 30)),
            ])->save();

            return $lockedOrder->fresh('items');
        });
    }

    private function releaseResources(Order $order): void
    {
        if ($order->resources_released_at) {
            return;
        }

        $productIds = $order->items->pluck('product_id')->filter()->unique()->sort()->values();
        $products = Product::query()->whereKey($productIds)->lockForUpdate()->get()->keyBy('id');

        foreach ($order->items as $item) {
            $products->get($item->product_id)?->increment('stock', $item->quantity);
        }

        if ($order->discount_id) {
            $discount = Discount::query()->lockForUpdate()->find($order->discount_id);

            if ($discount && $discount->times_used > 0) {
                $discount->decrement('times_used');
            }
        }

        $order->forceFill(['resources_released_at' => now()]);
    }

    private function reserveResources(Order $order): bool
    {
        $productIds = $order->items->pluck('product_id')->filter()->unique()->sort()->values();
        $products = Product::query()->whereKey($productIds)->lockForUpdate()->get()->keyBy('id');

        foreach ($order->items as $item) {
            $product = $products->get($item->product_id);

            if (! $product || $product->stock < $item->quantity) {
                return false;
            }
        }

        foreach ($order->items as $item) {
            $products->get($item->product_id)?->decrement('stock', $item->quantity);
        }

        if ($order->discount_id) {
            Discount::query()->lockForUpdate()->find($order->discount_id)?->increment('times_used');
        }

        $order->forceFill([
            'resources_released_at' => null,
            'expired_at' => null,
        ]);

        return true;
    }
}
