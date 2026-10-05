<?php

namespace App\Jobs;

use App\Models\Order;
use App\Models\StoreSetting;
use Illuminate\Contracts\Queue\ShouldBeUnique;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class SendOrderEventWebhook implements ShouldBeUnique, ShouldQueue
{
    use Queueable;

    public int $tries = 5;

    public int $uniqueFor = 3600;

    public function __construct(
        public int $orderId,
        public string $event,
    ) {}

    public function uniqueId(): string
    {
        return $this->orderId.':'.$this->event;
    }

    /** @return array<int, int> */
    public function backoff(): array
    {
        return [60, 300, 900, 1800];
    }

    public function handle(): void
    {
        $url = config('services.n8n.order_webhook_url');
        $secret = config('services.n8n.order_webhook_secret');

        if (! is_string($url) || $url === '' || ! is_string($secret) || $secret === '') {
            Log::notice('Order event webhook skipped because n8n is not configured.', [
                'order_id' => $this->orderId,
                'event' => $this->event,
            ]);

            return;
        }

        if (! $this->isAllowedWebhookUrl($url)) {
            Log::error('Order event webhook skipped because its URL is not an approved HTTPS destination.', [
                'order_id' => $this->orderId,
                'event' => $this->event,
            ]);

            return;
        }

        $order = Order::query()->with('items')->find($this->orderId);

        if (! $order) {
            return;
        }

        $payload = [
            'event' => $this->event,
            'occurred_at' => now()->toIso8601String(),
            'order' => [
                'id' => $order->id,
                'number' => $order->number,
                'status' => $order->status,
                'payment_status' => $order->payment_status,
                'payment_method' => $order->payment_method,
                // Opaque UUID used only for the WhatsApp dynamic URL:
                // https://ellenacosms.com/pay/{payment_resume_token}
                'payment_resume_token' => in_array($order->payment_method, ['dgateway', 'manual_confirmation'], true)
                    && $order->payment_status === 'pending'
                    ? $order->checkout_token
                    : null,
                'customer' => [
                    'name' => $order->customer_name,
                    'email' => $order->email,
                    'phone' => $order->phone,
                    'address' => $order->address,
                    'city' => $order->city,
                    'country' => $order->country,
                ],
                'delivery_method' => $order->delivery_method,
                'estimated_delivery_date' => $order->estimated_delivery_date?->toDateString(),
                'currency' => $order->currency ?: StoreSetting::currency(),
                'subtotal' => (float) $order->subtotal,
                'discount_amount' => (float) $order->discount_amount,
                'shipping' => (float) $order->shipping,
                'total' => (float) $order->total,
                'items' => $order->items->map(fn ($item) => [
                    'product_id' => $item->product_id,
                    'name' => $item->product_name,
                    'sku' => $item->sku,
                    'price' => (float) $item->price,
                    'quantity' => $item->quantity,
                    'total' => (float) $item->total,
                ])->values()->all(),
            ],
        ];

        $body = json_encode($payload, JSON_THROW_ON_ERROR);
        $timestamp = (string) now()->getTimestamp();
        $signature = hash_hmac('sha256', $timestamp.'.'.$body, $secret);

        $request = Http::acceptJson()->timeout(10);
        $caBundle = config('services.n8n.ca_bundle');

        if (is_string($caBundle) && is_readable($caBundle)) {
            $request = $request->withOptions(['verify' => $caBundle]);
        }

        $request
            ->withHeaders([
                'X-Ellena-Event' => $this->event,
                'X-Ellena-Timestamp' => $timestamp,
                'X-Ellena-Signature' => 'sha256='.$signature,
                'X-Ellena-Webhook-Secret' => $secret,
            ])
            ->withBody($body, 'application/json')
            ->post($url)
            ->throw();
    }

    private function isAllowedWebhookUrl(string $url): bool
    {
        $scheme = parse_url($url, PHP_URL_SCHEME);
        $host = parse_url($url, PHP_URL_HOST);
        $port = parse_url($url, PHP_URL_PORT);
        $allowedHosts = config('services.n8n.order_webhook_hosts', []);

        return $scheme === 'https'
            && is_string($host)
            && ($port === null || $port === 443)
            && (
                $allowedHosts === []
                || (is_array($allowedHosts)
                    && in_array(strtolower($host), array_map('strtolower', $allowedHosts), true))
            );
    }
}
