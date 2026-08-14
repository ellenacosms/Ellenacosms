<?php

namespace App\Http\Controllers;

use App\Models\Order;
use App\Services\Payments\PesapalPaymentService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;
use Throwable;

class PesapalPaymentController extends Controller
{
    public function start(Request $request, Order $order, PesapalPaymentService $pesapal): JsonResponse|RedirectResponse
    {
        abort_unless($this->canAccessOrder($request, $order), 403);

        if ($order->payment_status === 'paid') {
            $request->session()->put('last_order_id', $order->id);

            return to_route('checkout.success', $order);
        }

        try {
            $paymentUrl = $pesapal->start($order, 'customer_retry');
            $request->session()->put('last_order_id', $order->id);

            if ($request->expectsJson()) {
                return response()->json(['payment_url' => $paymentUrl]);
            }

            return to_route('checkout.success', $order)->with('open_pesapal', true);
        } catch (Throwable $exception) {
            Log::warning('Pesapal payment initiation failed.', [
                'order_id' => $order->id,
                'exception' => $exception::class,
                'message' => $exception->getMessage(),
            ]);

            $request->session()->put('last_order_id', $order->id);

            return to_route('checkout.success', $order)->withErrors([
                'payment' => $this->pesapalErrorMessage($exception),
            ]);
        }
    }

    public function prepare(PesapalPaymentService $pesapal): JsonResponse
    {
        try {
            $pesapal->warmUp();

            return response()->json(['ready' => true]);
        } catch (Throwable $exception) {
            Log::notice('Pesapal preparation failed.', [
                'exception' => $exception::class,
                'message' => $exception->getMessage(),
            ]);

            return response()->json(['ready' => false], 503);
        }
    }

    public function callback(Request $request, PesapalPaymentService $pesapal): RedirectResponse
    {
        $trackingId = trim((string) $request->query('OrderTrackingId'));
        $merchantReference = trim((string) $request->query('OrderMerchantReference'));
        abort_unless(Str::isUuid($trackingId) && $merchantReference !== '', 422);

        $order = Order::query()
            ->where('payment_merchant_reference', $merchantReference)
            ->firstOrFail();

        try {
            $pesapal->refresh($order, $trackingId, $merchantReference, 'callback');
            $paymentStatus = $order->fresh()->payment_status;
            $message = match ($paymentStatus) {
                'paid' => 'Thank you for shopping with us. Your payment was successful and your order is being prepared.',
                'failed', 'refunded' => 'Sorry, your payment failed. You can try again securely or choose another payment method.',
                default => 'Your payment is pending. We will update your order automatically once Pesapal confirms it.',
            };
        } catch (Throwable $exception) {
            Log::warning('Pesapal callback verification failed.', [
                'order_id' => $order->id,
                'exception' => $exception::class,
                'message' => $exception->getMessage(),
            ]);
            $message = 'We could not confirm the payment yet. The order remains safe and will be checked automatically.';
        }

        if ($this->canAccessOrder($request, $order)) {
            $request->session()->put('last_order_id', $order->id);

            return to_route('checkout.success', $order)->with('payment_message', $message);
        }

        $request->session()->put('url.intended', route('checkout.success', $order));

        return to_route('login')->with('status', 'Sign in to view your updated payment status.');
    }

    public function ipn(Request $request, PesapalPaymentService $pesapal): JsonResponse
    {
        $trackingId = trim((string) $request->input('OrderTrackingId'));
        $merchantReference = trim((string) $request->input('OrderMerchantReference'));
        $notificationType = trim((string) $request->input('OrderNotificationType', 'IPNCHANGE'));

        if (! Str::isUuid($trackingId) || $merchantReference === '') {
            return $this->ipnResponse($notificationType, $trackingId, $merchantReference, 500);
        }

        try {
            $order = Order::query()
                ->where('payment_merchant_reference', $merchantReference)
                ->firstOrFail();
            $pesapal->refresh($order, $trackingId, $merchantReference, 'ipn');

            return $this->ipnResponse($notificationType, $trackingId, $merchantReference, 200);
        } catch (Throwable $exception) {
            Log::error('Pesapal IPN processing failed.', [
                'merchant_reference' => $merchantReference,
                'tracking_id' => $trackingId,
                'exception' => $exception::class,
                'message' => $exception->getMessage(),
            ]);

            return $this->ipnResponse($notificationType, $trackingId, $merchantReference, 500);
        }
    }

    private function ipnResponse(
        string $notificationType,
        string $trackingId,
        string $merchantReference,
        int $status,
    ): JsonResponse {
        return response()->json([
            'orderNotificationType' => $notificationType ?: 'IPNCHANGE',
            'orderTrackingId' => $trackingId,
            'orderMerchantReference' => $merchantReference,
            'status' => $status,
        ], $status === 200 ? 200 : 500);
    }

    private function canAccessOrder(Request $request, Order $order): bool
    {
        return $request->session()->get('last_order_id') === $order->id
            || $request->user()?->id === $order->user_id
            || (bool) $request->user()?->is_admin;
    }

    private function pesapalErrorMessage(Throwable $exception): string
    {
        if (str_contains($exception->getMessage(), 'Transaction amount exceeds limit')) {
            return 'Pesapal cannot accept this order amount under the current merchant-account limit. Please contact us or choose another payment method.';
        }

        return 'Pesapal could not be opened. Please try payment again in a moment.';
    }
}
