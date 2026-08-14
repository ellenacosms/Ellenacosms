<?php

namespace App\Services\Payments;

use App\Models\Order;
use App\Services\Orders\OrderPaymentLifecycle;
use Illuminate\Support\Str;
use RuntimeException;

class PesapalPaymentService
{
    public function __construct(
        private PesapalClient $client,
        private OrderPaymentLifecycle $lifecycle,
    ) {}

    public function ready(): bool
    {
        return $this->client->ready();
    }

    public function warmUp(): void
    {
        if (! $this->ready()) {
            throw new RuntimeException('Pesapal is not configured.');
        }

        $this->client->warmUp();
    }

    public function paymentUrl(Order $order): ?string
    {
        return $this->validRedirectUrl($order->payment_redirect_url)
            ? $order->payment_redirect_url
            : null;
    }

    public function start(Order $order, string $source = 'checkout'): string
    {
        if (! $this->ready()) {
            throw new RuntimeException('Pesapal is not ready. Add credentials and register the IPN URL first.');
        }

        if ($order->payment_status === 'paid') {
            throw new RuntimeException('This order is already paid.');
        }

        if ($order->payment_status === 'refunded') {
            throw new RuntimeException('A refunded order cannot be paid again.');
        }

        if ($order->payment_status === 'pending' && $this->validRedirectUrl($order->payment_redirect_url)) {
            $trackingId = (string) $order->payment_reference;
            $merchantReference = (string) $order->payment_merchant_reference;

            if (Str::isUuid($trackingId) && $merchantReference !== '') {
                $this->refresh($order, $trackingId, $merchantReference);
                $order->refresh();

                if ($order->payment_status === 'paid') {
                    throw new RuntimeException('This order is already paid.');
                }

                if ($order->payment_status === 'refunded') {
                    throw new RuntimeException('A refunded order cannot be paid again.');
                }

                if ($order->payment_status === 'pending') {
                    return $order->payment_redirect_url;
                }
            } else {
                return $order->payment_redirect_url;
            }
        }

        if ($order->resources_released_at || in_array($order->payment_status, ['failed', 'expired'], true)) {
            $order = $this->lifecycle->reactivate($order);
        }

        $merchantReference = Str::limit(
            $order->number.'-'.Str::upper(Str::random(6)),
            50,
            '',
        );
        $payload = $this->client->submitOrder($order, $merchantReference);
        $trackingId = (string) $payload['order_tracking_id'];
        $redirectUrl = (string) $payload['redirect_url'];

        if (! Str::isUuid($trackingId)
            || ! $this->validRedirectUrl($redirectUrl)) {
            throw new RuntimeException('Pesapal returned an invalid payment destination.');
        }

        $order->forceFill([
            'payment_method' => 'pesapal',
            'payment_provider' => 'pesapal',
            'payment_reference' => $trackingId,
            'payment_merchant_reference' => $merchantReference,
            'payment_redirect_url' => $redirectUrl,
            'payment_status' => 'pending',
            'payment_status_message' => 'Waiting for customer payment.',
            'expires_at' => now()->addMinutes((int) config('checkout.unpaid_order_expiry_minutes', 30)),
            'expired_at' => null,
        ])->save();
        $order->paymentEvents()->create([
            'source' => $source,
            'status' => 'pending',
            'message' => 'Pesapal payment initiated.',
            'reference' => $trackingId,
        ]);

        return $redirectUrl;
    }

    /** @return array<string, mixed> */
    public function refresh(Order $order, string $trackingId, string $merchantReference, string $source = 'callback'): array
    {
        if ($order->payment_merchant_reference !== $merchantReference) {
            throw new RuntimeException('The Pesapal merchant reference does not match this order.');
        }

        if ($order->payment_reference && $order->payment_reference !== $trackingId) {
            throw new RuntimeException('The Pesapal tracking ID does not match this order.');
        }

        $payload = $this->client->transactionStatus($trackingId);

        if (($payload['merchant_reference'] ?? null) !== $merchantReference) {
            throw new RuntimeException('Pesapal returned a mismatched merchant reference.');
        }

        $status = Str::upper((string) $payload['payment_status_description']);
        $paymentStatus = match ($status) {
            'COMPLETED' => 'paid',
            'FAILED', 'INVALID' => 'failed',
            'REVERSED' => 'refunded',
            default => 'pending',
        };

        if ($paymentStatus === 'paid') {
            $expectedCurrency = Str::upper((string) config('services.pesapal.currency', 'UGX'));
            $currency = Str::upper((string) ($payload['currency'] ?? ''));
            $amount = (float) ($payload['amount'] ?? 0);

            if ($currency !== $expectedCurrency || abs($amount - (float) $order->total) > 0.01) {
                throw new RuntimeException('Pesapal payment amount or currency does not match the order.');
            }
        }

        $this->lifecycle->apply($order, $paymentStatus, [
            'payment_provider' => 'pesapal',
            'payment_reference' => $trackingId,
            'payment_confirmation_code' => $payload['confirmation_code'] ?? $order->payment_confirmation_code,
            'payment_status_message' => $payload['description'] ?? $payload['message'] ?? $status,
            'payment_redirect_url' => in_array($paymentStatus, ['failed', 'paid', 'refunded'], true)
                ? null
                : $order->payment_redirect_url,
            'expires_at' => $paymentStatus === 'paid' ? null : $order->expires_at,
        ], $source);

        return $payload;
    }

    private function validRedirectUrl(?string $url): bool
    {
        if (! is_string($url) || $url === '') {
            return false;
        }

        $host = parse_url($url, PHP_URL_HOST);

        return parse_url($url, PHP_URL_SCHEME) === 'https'
            && is_string($host)
            && ($host === 'pesapal.com' || str_ends_with($host, '.pesapal.com'));
    }
}
