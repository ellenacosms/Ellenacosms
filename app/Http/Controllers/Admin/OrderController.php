<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Jobs\SendOrderEventWebhook;
use App\Mail\DeliveryQuoteReady;
use App\Models\Order;
use App\Models\PaymentAttempt;
use App\Services\Orders\OrderPaymentLifecycle;
use App\Services\Payments\DGatewayClient;
use App\Services\Payments\DGatewayPaymentService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Mail;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;
use Throwable;

class OrderController extends Controller
{
    public function index(Request $request): Response
    {
        return Inertia::render('admin/orders/index', [
            'orders' => Order::when($request->string('status')->isNotEmpty(), fn ($query) => $query->where('status', $request->string('status')))
                ->when($request->filled('code'), fn ($query) => $query->where('number', strtoupper(trim((string) $request->input('code')))))
                ->latest()->paginate(15)->withQueryString(),
            'status' => $request->string('status'),
            'code' => $request->string('code'),
        ]);
    }

    public function show(Order $order): Response
    {
        return Inertia::render('admin/orders/show', [
            'order' => $order->load(['items', 'paymentEvents']),
            'uncertainPayment' => PaymentAttempt::where('order_id', $order->id)->whereIn('status', ['unknown', 'initiating'])->latest('id')->first()?->only(['request_id', 'created_at']),
        ]);
    }

    public function update(Request $request, Order $order, OrderPaymentLifecycle $lifecycle): RedirectResponse
    {
        $data = $request->validate([
            'status' => ['required', Rule::in(['pending', 'payment_review', 'processing', 'shipped', 'delivered', 'cancelled'])],
            'payment_status' => ['required', Rule::in(['pending', 'paid', 'failed', 'expired', 'refunded'])],
        ]);

        if ($order->payment_provider !== null && $data['payment_status'] !== $order->payment_status) {
            throw ValidationException::withMessages([
                'payment_status' => 'Online payment status must be verified with the refresh action.',
            ]);
        }

        if ($data['payment_status'] === 'paid' && $order->delivery_fee_status !== 'confirmed') {
            throw ValidationException::withMessages(['payment_status' => 'Confirm the delivery fee before recording payment.']);
        }
        $statusChanged = $data['status'] !== $order->status;
        $order->update(['status' => $data['status']]);

        if ($statusChanged) {
            SendOrderEventWebhook::dispatch($order->id, 'order.status_changed');
        }

        if ($data['payment_status'] !== $order->payment_status) {
            $lifecycle->apply($order, $data['payment_status'], [
                'payment_status_message' => 'Payment status updated by an administrator.',
            ], 'admin');
        }

        return back()->with('success', 'Order updated.');
    }

    public function collectPickup(Request $request, Order $order, OrderPaymentLifecycle $lifecycle): RedirectResponse
    {
        DB::transaction(function () use ($request, $order, $lifecycle) {
            $locked = Order::lockForUpdate()->findOrFail($order->id);
            if ($locked->delivery_method !== 'pickup' || $locked->payment_method !== 'pay_at_shop'
                || $locked->payment_provider !== null || $locked->resources_released_at
                || in_array($locked->status, ['cancelled', 'payment_review'], true)
                || in_array($locked->payment_status, ['expired', 'failed', 'refunded'], true)
                || ($locked->payment_status !== 'paid' && ($locked->expires_at && now()->greaterThan($locked->expires_at)))) {
                throw ValidationException::withMessages(['pickup' => 'This reservation cannot be collected. Check its status and stock before taking payment.']);
            }
            if ($locked->status === 'delivered' && $locked->payment_status === 'paid') {
                return;
            }
            $lifecycle->apply($locked, 'paid', ['payment_status_message' => 'Payment received at shop by staff #'.$request->user()->id.'.'], 'shop_pickup');
            $locked->update(['status' => 'delivered']);
            DB::afterCommit(fn () => SendOrderEventWebhook::dispatch($locked->id, 'order.status_changed'));
        });

        return back()->with('success', 'Shop payment and collection recorded.');
    }

    public function refreshPayment(Order $order, DGatewayPaymentService $payments): RedirectResponse
    {
        $attempt = PaymentAttempt::where('order_id', $order->id)->latest('id')->first();
        if (! $attempt?->reference) {
            return back()->withErrors(['payment' => 'No D-Gateway transaction is available to verify.']);
        }
        try {
            $payments->refresh($attempt, 'admin');

            return back()->with('success', 'Payment verified with D-Gateway.');
        } catch (Throwable $exception) {
            return back()->withErrors(['payment' => 'Payment verification is temporarily unavailable.']);
        }
    }

    public function quoteDelivery(Request $request, Order $order): RedirectResponse
    {
        $data = $request->validate(['shipping' => ['required', 'numeric', 'min:0', 'max:999999999'], 'estimated_delivery_date' => ['nullable', 'date', 'after_or_equal:today']]);
        DB::transaction(function () use ($order, $data) {
            $locked = Order::lockForUpdate()->findOrFail($order->id);
            if ($locked->delivery_method === 'pickup' || in_array($locked->payment_status, ['paid', 'refunded'], true)
                || $locked->payment_reference
                || $locked->resources_released_at
                || $locked->status === 'cancelled'
                || PaymentAttempt::where('order_id', $locked->id)->exists()) {
                throw ValidationException::withMessages(['shipping' => 'Delivery cannot be changed after payment starts or the reservation ends.']);
            }
            $locked->forceFill([
                'shipping' => $data['shipping'],
                'total' => round(max(0, (float) $locked->subtotal - (float) $locked->discount_amount) + (float) $data['shipping'], 2),
                'delivery_fee_status' => 'confirmed',
                'estimated_delivery_date' => $data['estimated_delivery_date'] ?? null,
                'expires_at' => now()->addHours(48),
            ])->save();
            DB::afterCommit(fn () => Mail::to($locked->email)->queue(new DeliveryQuoteReady($locked)));
        });

        return back()->with('success', 'Delivery confirmed. A payment link has been queued for the customer.');
    }

    public function recoverPayment(Request $request, Order $order, DGatewayPaymentService $payments): RedirectResponse
    {
        $data = $request->validate(['reference' => ['required', 'string', 'max:190']]);
        $attempt = PaymentAttempt::where('order_id', $order->id)->whereIn('status', ['unknown', 'initiating'])->latest('id')->firstOrFail();
        // Staff locate the exact collection in the D-Gateway dashboard before recovery.
        $verified = app(DGatewayClient::class)->verify($data['reference']);
        if ($verified['reference'] !== $data['reference'] || (float) ($verified['amount'] ?? -1) !== (float) $attempt->amount
            || ($verified['currency'] ?? null) !== $attempt->currency
            || (isset($verified['metadata']['request_id']) && $verified['metadata']['request_id'] !== $attempt->request_id)) {
            throw ValidationException::withMessages(['reference' => 'This transaction does not match the payment attempt.']);
        }
        DB::transaction(function () use ($order, $attempt, $data) {
            $locked = Order::lockForUpdate()->findOrFail($order->id);
            $current = PaymentAttempt::lockForUpdate()->findOrFail($attempt->id);
            if (! in_array($current->status, ['unknown', 'initiating'], true)) {
                throw ValidationException::withMessages(['reference' => 'This attempt has already been recovered.']);
            }
            if (PaymentAttempt::where('reference', $data['reference'])->exists()) {
                throw ValidationException::withMessages(['reference' => 'This transaction is already linked to an order.']);
            }
            $current->update(['reference' => $data['reference'], 'status' => 'pending']);
            $locked->forceFill(['payment_reference' => $data['reference']])->save();
            $locked->paymentEvents()->create(['source' => 'admin_recovery', 'status' => 'pending', 'reference' => $data['reference'], 'message' => 'Administrator linked a provider-verified transaction after an uncertain collection.']);
        });
        $payments->refresh($attempt->fresh(), 'admin_recovery');

        return back()->with('success', 'Payment recovered and verified.');
    }
}
