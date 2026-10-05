<?php

namespace App\Http\Controllers;

use App\Models\Order;
use App\Models\PaymentAttempt;
use App\Services\Payments\DGatewayPaymentService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;

class DGatewayPaymentController extends Controller
{
    public function resume(Request $request, Order $order): RedirectResponse
    {
        abort_unless(in_array($order->payment_provider, [null, 'dgateway'], true), 410, 'Please contact Ellena about this historical payment.');
        $request->session()->put('last_order_id', $order->id);

        return to_route('checkout.success', $order);
    }

    public function start(Request $request, Order $order, DGatewayPaymentService $payments): JsonResponse
    {
        $this->authorizeOrder($request, $order);
        $data = $request->validate(['phone' => ['nullable', 'string', 'max:30'], 'method' => ['required', 'in:mobile,card'], 'expected_total' => ['required', 'numeric']]);
        abort_unless((int) round((float) $data['expected_total'] * 100) === (int) round((float) $order->total * 100), 409, 'Your order total changed. Reload to review the delivery fee before paying.');

        return response()->json($payments->start($order, $data['phone'] ?? '', $data['method']));
    }

    public function status(Request $request, Order $order, DGatewayPaymentService $payments): JsonResponse
    {
        $this->authorizeOrder($request, $order);
        $attempt = PaymentAttempt::where('order_id', $order->id)->latest('id')->first();
        if ($attempt?->reference && $attempt->status === 'pending') {
            $payments->refresh($attempt, 'customer');
        }

        return response()->json(['payment_status' => $order->fresh()->payment_status, 'attempt_status' => $attempt?->fresh()->status]);
    }

    public function webhook(Request $request, DGatewayPaymentService $payments): JsonResponse
    {
        $data = $request->validate(['reference' => ['required', 'string', 'max:190']]);
        $attempt = PaymentAttempt::where('reference', $data['reference'])->first();
        if (! $attempt) {
            // A notification can arrive before collect returns; reconciliation will recover it.
            return response()->json(['received' => true]);
        }
        // Treat the payload only as a hint; authenticated provider verification is authoritative.
        $payments->refresh($attempt, 'webhook');

        return response()->json(['received' => true]);
    }

    private function authorizeOrder(Request $request, Order $order): void
    {
        abort_unless($request->session()->get('last_order_id') === $order->id
            || ($request->user() && $request->user()->id === $order->user_id)
            || $request->user()?->is_admin, 403);
    }
}
