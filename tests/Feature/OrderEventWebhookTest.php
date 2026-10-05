<?php

namespace Tests\Feature;

use App\Jobs\SendOrderEventWebhook;
use App\Models\Order;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\Client\Request as ClientRequest;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Str;
use Tests\TestCase;

class OrderEventWebhookTest extends TestCase
{
    use RefreshDatabase;

    public function test_it_sends_a_signed_order_event_payload(): void
    {
        config([
            'services.n8n.order_webhook_url' => 'https://n8n.example.test/webhook/orders',
            'services.n8n.order_webhook_secret' => 'shared-test-secret',
            'services.n8n.order_webhook_hosts' => ['n8n.example.test'],
            'services.dgateway.currency' => 'UGX',
        ]);
        Http::fake(['https://n8n.example.test/*' => Http::response(['ok' => true])]);

        $order = Order::create([
            'number' => 'ELN-'.Str::upper(Str::random(10)),
            'customer_name' => 'Jane Doe',
            'email' => 'jane@example.test',
            'phone' => '256700000000',
            'address' => '1 Test Street',
            'city' => 'Kampala',
            'country' => 'Uganda',
            'payment_method' => 'dgateway',
            'payment_status' => 'paid',
            'subtotal' => 5000,
            'discount_amount' => 0,
            'shipping' => 0,
            'total' => 5000,
        ]);
        $order->items()->create([
            'product_name' => 'Test Lotion',
            'sku' => 'TEST-001',
            'price' => 5000,
            'quantity' => 1,
            'total' => 5000,
        ]);

        (new SendOrderEventWebhook($order->id, 'payment.confirmed'))->handle();

        Http::assertSent(function (ClientRequest $request) use ($order): bool {
            $timestamp = (string) $request->header('X-Ellena-Timestamp')[0];
            $expected = 'sha256='.hash_hmac(
                'sha256',
                $timestamp.'.'.$request->body(),
                'shared-test-secret',
            );

            return $request->url() === 'https://n8n.example.test/webhook/orders'
                && $request->header('X-Ellena-Event')[0] === 'payment.confirmed'
                && hash_equals($expected, $request->header('X-Ellena-Signature')[0])
                && hash_equals('shared-test-secret', $request->header('X-Ellena-Webhook-Secret')[0])
                && $request['order']['id'] === $order->id
                && $request['order']['items'][0]['sku'] === 'TEST-001';
        });
    }
}
