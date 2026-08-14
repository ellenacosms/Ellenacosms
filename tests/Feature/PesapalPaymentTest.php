<?php

namespace Tests\Feature;

use App\Models\Order;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Str;
use Tests\TestCase;

class PesapalPaymentTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        Cache::flush();
        Http::preventStrayRequests();
        config([
            'services.pesapal.environment' => 'sandbox',
            'services.pesapal.consumer_key' => 'sandbox-key',
            'services.pesapal.consumer_secret' => 'sandbox-secret',
            'services.pesapal.ipn_id' => (string) Str::uuid(),
            'services.pesapal.currency' => 'UGX',
            'services.pesapal.callback_url' => 'https://ellena.test/payments/pesapal/callback',
            'services.pesapal.ipn_url' => 'https://ellena.test/payments/pesapal/ipn',
            'services.pesapal.cancellation_url' => 'https://ellena.test/dashboard#orders',
            'services.pesapal.ca_bundle' => null,
            'services.pesapal.cache_store' => null,
            'services.pesapal.token_cache_seconds' => 240,
        ]);
    }

    public function test_checkout_warmup_reuses_one_pesapal_token(): void
    {
        $user = User::factory()->create();

        Http::fake([
            '*/api/Auth/RequestToken' => Http::response([
                'token' => 'sandbox-token',
                'status' => '200',
            ]),
        ]);

        foreach (range(1, 10) as $attempt) {
            $this->actingAs($user)
                ->postJson(route('payments.pesapal.prepare'))
                ->assertOk()
                ->assertJson(['ready' => true]);
        }

        Http::assertSentCount(1);
    }

    public function test_customer_can_start_a_pesapal_payment(): void
    {
        $trackingId = (string) Str::uuid();
        $order = $this->order();

        Http::fake([
            '*/api/Auth/RequestToken' => Http::response([
                'token' => 'sandbox-token',
                'status' => '200',
            ]),
            '*/api/Transactions/SubmitOrderRequest' => Http::response([
                'order_tracking_id' => $trackingId,
                'merchant_reference' => 'accepted',
                'redirect_url' => 'https://cybqa.pesapal.com/pesapaliframe/payment',
                'status' => '200',
            ]),
        ]);

        $this->actingAs($order->user)
            ->post(route('payments.pesapal.start', $order))
            ->assertRedirect(route('checkout.success', $order))
            ->assertSessionHas('open_pesapal', true);

        $order->refresh();
        $this->assertSame('pesapal', $order->payment_provider);
        $this->assertSame($trackingId, $order->payment_reference);
        $this->assertNotNull($order->payment_merchant_reference);
        $this->assertSame('pending', $order->payment_status);
    }

    public function test_pesapal_ipn_verifies_and_marks_matching_payment_paid(): void
    {
        $trackingId = (string) Str::uuid();
        $merchantReference = 'ELLENA-TEST-IPN';
        $order = $this->order([
            'payment_reference' => $trackingId,
            'payment_merchant_reference' => $merchantReference,
        ]);

        Http::fake([
            '*/api/Auth/RequestToken' => Http::response([
                'token' => 'sandbox-token',
                'status' => '200',
            ]),
            '*/api/Transactions/GetTransactionStatus*' => Http::response([
                'payment_status_description' => 'Completed',
                'amount' => 125,
                'currency' => 'UGX',
                'merchant_reference' => $merchantReference,
                'confirmation_code' => 'PSP12345',
                'description' => 'Payment completed',
                'status' => '200',
            ]),
        ]);

        $this->postJson(route('payments.pesapal.ipn'), [
            'OrderTrackingId' => $trackingId,
            'OrderMerchantReference' => $merchantReference,
            'OrderNotificationType' => 'IPNCHANGE',
        ])->assertOk()->assertJson([
            'orderNotificationType' => 'IPNCHANGE',
            'orderTrackingId' => $trackingId,
            'orderMerchantReference' => $merchantReference,
            'status' => 200,
        ]);

        $order->refresh();
        $this->assertSame('paid', $order->payment_status);
        $this->assertSame('PSP12345', $order->payment_confirmation_code);
        $this->assertNotNull($order->paid_at);
    }

    public function test_pesapal_amount_mismatch_is_rejected(): void
    {
        $trackingId = (string) Str::uuid();
        $merchantReference = 'ELLENA-TEST-MISMATCH';
        $order = $this->order([
            'payment_reference' => $trackingId,
            'payment_merchant_reference' => $merchantReference,
        ]);

        Http::fake([
            '*/api/Auth/RequestToken' => Http::response(['token' => 'sandbox-token']),
            '*/api/Transactions/GetTransactionStatus*' => Http::response([
                'payment_status_description' => 'Completed',
                'amount' => 1,
                'currency' => 'UGX',
                'merchant_reference' => $merchantReference,
            ]),
        ]);

        $this->postJson(route('payments.pesapal.ipn'), [
            'OrderTrackingId' => $trackingId,
            'OrderMerchantReference' => $merchantReference,
            'OrderNotificationType' => 'IPNCHANGE',
        ])->assertStatus(500)->assertJsonPath('status', 500);

        $this->assertSame('pending', $order->fresh()->payment_status);
    }

    public function test_retry_replaces_an_invalid_pesapal_transaction(): void
    {
        $oldTrackingId = (string) Str::uuid();
        $newTrackingId = (string) Str::uuid();
        $oldMerchantReference = 'ELLENA-INVALID-PAYMENT';
        $order = $this->order([
            'payment_status' => 'pending',
            'payment_reference' => $oldTrackingId,
            'payment_merchant_reference' => $oldMerchantReference,
            'payment_redirect_url' => 'https://cybqa.pesapal.com/pesapaliframe/old-payment',
        ]);

        Http::fake([
            '*/api/Auth/RequestToken' => Http::response(['token' => 'sandbox-token']),
            '*/api/Transactions/GetTransactionStatus*' => Http::response([
                'payment_status_description' => 'INVALID',
                'merchant_reference' => $oldMerchantReference,
                'message' => 'Payment was not completed',
            ]),
            '*/api/Transactions/SubmitOrderRequest' => Http::response([
                'order_tracking_id' => $newTrackingId,
                'redirect_url' => 'https://cybqa.pesapal.com/pesapaliframe/new-payment',
            ]),
        ]);

        $this->actingAs($order->user)
            ->post(route('payments.pesapal.start', $order))
            ->assertRedirect(route('checkout.success', $order))
            ->assertSessionHas('open_pesapal', true);

        $order->refresh();
        $this->assertSame('pending', $order->payment_status);
        $this->assertSame($newTrackingId, $order->payment_reference);
        $this->assertNotSame($oldMerchantReference, $order->payment_merchant_reference);
    }

    public function test_order_success_opens_a_valid_pesapal_url_in_the_modal(): void
    {
        $paymentUrl = 'https://cybqa.pesapal.com/pesapaliframe/payment';
        $order = $this->order([
            'payment_status' => 'pending',
            'payment_redirect_url' => $paymentUrl,
        ]);

        $this->actingAs($order->user)
            ->withSession([
                'last_order_id' => $order->id,
                'open_pesapal' => true,
            ])
            ->get(route('checkout.success', $order))
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('storefront/order-success')
                ->where('pesapalUrl', $paymentUrl)
                ->where('openPesapal', false));
    }

    /** @param array<string, mixed> $overrides */
    private function order(array $overrides = []): Order
    {
        $user = User::factory()->create();

        return Order::create([
            'user_id' => $user->id,
            'number' => 'ELN-'.Str::upper(Str::random(10)),
            'customer_name' => $user->name,
            'email' => $user->email,
            'phone' => '+256700000000',
            'address' => '22 Garden Lane',
            'city' => 'Kampala',
            'country' => 'Uganda',
            'delivery_method' => 'express',
            'estimated_delivery_date' => now()->addDays(2),
            'payment_method' => 'pesapal',
            'payment_provider' => 'pesapal',
            'subtotal' => 100,
            'shipping' => 25,
            'total' => 125,
            ...$overrides,
        ]);
    }
}
