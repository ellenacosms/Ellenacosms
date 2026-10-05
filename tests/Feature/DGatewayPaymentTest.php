<?php

namespace Tests\Feature;

use App\Jobs\SendOrderPaymentConfirmation;
use App\Models\Order;
use App\Models\PaymentAttempt;
use App\Models\User;
use App\Services\Payments\DGatewayClient;
use App\Services\Payments\DGatewayPaymentService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\Client\Factory;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Queue;
use Illuminate\Support\Str;
use Tests\TestCase;

class DGatewayPaymentTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        Queue::fake();
        Http::preventStrayRequests();
        config(['services.dgateway.api_key' => 'dgw_test_example', 'services.dgateway.ca_bundle' => null]);
    }

    public function test_collection_uses_server_total_and_reuses_pending_attempt(): void
    {
        $order = $this->order();
        $this->fakePayment();
        $this->actingAs($order->user)->postJson(route('payments.dgateway.start', $order), ['phone' => '0111777771', 'method' => 'mobile', 'expected_total' => 125, 'amount' => 1])->assertOk();
        $this->actingAs($order->user)->postJson(route('payments.dgateway.start', $order), ['phone' => '0111777771', 'method' => 'mobile', 'expected_total' => 125])->assertOk();
        $this->assertDatabaseCount('payment_attempts', 1);
        Http::assertSent(fn ($request) => str_ends_with($request->url(), '/collect') && (float) $request['amount'] === 125.0 && $request['currency'] === 'UGX');
        Http::assertSentCount(2);
    }

    public function test_unpriced_delivery_and_stale_totals_cannot_be_paid(): void
    {
        $order = $this->order(['delivery_fee_status' => 'awaiting_quote']);
        $payload = ['phone' => '0111777771', 'method' => 'mobile', 'expected_total' => 125];
        $this->actingAs($order->user)->postJson(route('payments.dgateway.start', $order), $payload)->assertUnprocessable();
        $order->update(['delivery_fee_status' => 'confirmed', 'total' => 150]);
        $this->postJson(route('payments.dgateway.start', $order), $payload)->assertStatus(409);
        Http::assertNothingSent();
    }

    public function test_webhook_verifies_amount_and_confirms_only_once(): void
    {
        $order = $this->order();
        $this->fakePayment();
        app(DGatewayPaymentService::class)->start($order, '0111777771', 'mobile');
        $this->fakePayment('completed');
        foreach ([1, 2] as $_) {
            $this->postJson(route('payments.dgateway.webhook'), ['reference' => 'txn_example', 'status' => 'failed', 'amount' => 1])->assertOk();
        }
        $this->assertSame('paid', $order->fresh()->payment_status);
        $this->assertSame(1, $order->paymentEvents()->where('status', 'paid')->count());
        Queue::assertPushed(SendOrderPaymentConfirmation::class, 1);
    }

    public function test_mismatched_amount_is_rejected(): void
    {
        $order = $this->order();
        $this->fakePayment();
        app(DGatewayPaymentService::class)->start($order, '0111777771', 'mobile');
        $this->fakePayment('completed', 1);
        $this->postJson(route('payments.dgateway.webhook'), ['reference' => 'txn_example'])->assertUnprocessable();
        $this->assertSame('pending', $order->fresh()->payment_status);
    }

    public function test_status_only_verification_fetches_transaction_totals(): void
    {
        $client = app(DGatewayClient::class);
        Http::fake([
            '*/verify' => Http::response(['data' => ['reference' => 'txn_example', 'status' => 'completed']]),
            '*/transactions/txn_example' => Http::response(['data' => ['reference' => 'txn_example', 'amount' => 125, 'currency' => 'UGX', 'direction' => 'collect']]),
        ]);
        $verified = $client->verify('txn_example');
        $this->assertSame('completed', $verified['status']);
        $this->assertSame(125, $verified['amount']);
        $this->assertSame('UGX', $verified['currency']);
        Http::assertSent(fn ($request) => $request->method() === 'GET' && str_ends_with($request->url(), '/transactions/txn_example'));
    }

    public function test_transaction_details_cannot_substitute_a_different_reference(): void
    {
        Http::fake([
            '*/verify' => Http::response(['data' => ['reference' => 'txn_example', 'status' => 'completed']]),
            '*/transactions/txn_example' => Http::response(['data' => ['reference' => 'txn_other', 'amount' => 125, 'currency' => 'UGX']]),
        ]);
        $this->expectException(\RuntimeException::class);
        app(DGatewayClient::class)->verify('txn_example');
    }

    public function test_ambiguous_response_does_not_allow_a_second_collection(): void
    {
        $order = $this->order();
        Http::fake(['*/collect' => Http::response(['error' => 'unavailable'], 503)]);
        $payload = ['phone' => '0111777771', 'method' => 'mobile', 'expected_total' => 125];
        $this->actingAs($order->user)->postJson(route('payments.dgateway.start', $order), $payload)->assertUnprocessable();
        $this->postJson(route('payments.dgateway.start', $order), $payload)->assertUnprocessable();
        Http::assertSentCount(1);
        $this->assertDatabaseHas('payment_attempts', ['status' => 'unknown']);
    }

    public function test_other_users_and_anonymous_visitors_cannot_pay_or_check_an_order(): void
    {
        $order = $this->order(['user_id' => null]);
        $this->getJson(route('payments.dgateway.status', $order))->assertForbidden();
        $this->actingAs(User::factory()->create())->postJson(route('payments.dgateway.start', $order), [])->assertForbidden();
        Http::assertNothingSent();
    }

    public function test_historical_provider_cannot_be_charged_through_dgateway(): void
    {
        $order = $this->order(['payment_provider' => 'legacy_gateway']);
        $this->actingAs($order->user)->postJson(route('payments.dgateway.start', $order), ['phone' => '0111777771', 'method' => 'mobile', 'expected_total' => 125])->assertUnprocessable();
        Http::assertNothingSent();
    }

    public function test_card_secrets_are_returned_only_to_order_owner_not_serialized_on_order(): void
    {
        config(['services.dgateway.cards_enabled' => true]);
        $order = $this->order();
        Http::fake(['*/collect' => Http::response(['data' => ['reference' => 'txn_card', 'status' => 'pending', 'client_secret' => 'pi_test_secret', 'stripe_publishable_key' => 'pk_test_example']])]);
        $this->actingAs($order->user)->postJson(route('payments.dgateway.start', $order), ['method' => 'card', 'expected_total' => 125])->assertOk()->assertJsonPath('client_secret', 'pi_test_secret');
        $this->assertArrayNotHasKey('client_secret', PaymentAttempt::first()->toArray());
    }

    private function fakePayment(string $status = 'pending', int $amount = 125): void
    {
        Http::swap(new Factory);
        Http::preventStrayRequests();
        Http::fake(['*dgatewayapi.desispay.com/*' => Http::response(['data' => ['reference' => 'txn_example', 'status' => $status, 'amount' => $amount, 'currency' => 'UGX', 'provider' => 'iotec']])]);
    }

    public function test_failed_attempt_can_be_retried_without_losing_old_reference(): void
    {
        $order = $this->order();
        $this->fakePayment();
        $service = app(DGatewayPaymentService::class);
        $service->start($order, '0111777771', 'mobile');
        $this->fakePayment('failed');
        $this->postJson(route('payments.dgateway.webhook'), ['reference' => 'txn_example'])->assertOk();
        Http::swap(new Factory);
        Http::fake(['*/collect' => Http::response(['data' => ['reference' => 'txn_retry', 'status' => 'pending']])]);
        $service->start($order->fresh(), '0111777771', 'mobile');
        $this->assertDatabaseCount('payment_attempts', 2);
        $this->assertSame('txn_retry', $order->fresh()->payment_reference);
        $this->fakePayment('failed');
        $this->postJson(route('payments.dgateway.webhook'), ['reference' => 'txn_example'])->assertOk();
        $this->assertSame('pending', $order->fresh()->payment_status);
        $this->fakePayment('completed');
        $this->postJson(route('payments.dgateway.webhook'), ['reference' => 'txn_example'])->assertOk();
        $this->assertSame('paid', $order->fresh()->payment_status);
    }

    public function test_wrong_currency_cannot_confirm_a_payment(): void
    {
        $order = $this->order();
        $this->fakePayment();
        app(DGatewayPaymentService::class)->start($order, '0111777771', 'mobile');
        Http::swap(new Factory);
        Http::fake(['*/verify' => Http::response(['data' => ['reference' => 'txn_example', 'amount' => 125, 'currency' => 'USD', 'status' => 'completed']])]);
        $this->postJson(route('payments.dgateway.webhook'), ['reference' => 'txn_example'])->assertUnprocessable();
        $this->assertSame('pending', $order->fresh()->payment_status);
    }

    public function test_admin_can_recover_verified_unknown_collection(): void
    {
        $order = $this->order();
        PaymentAttempt::create(['order_id' => $order->id, 'request_id' => (string) Str::uuid(), 'provider' => 'iotec', 'amount' => 125, 'currency' => 'UGX', 'status' => 'unknown']);
        $this->fakePayment('completed');
        $this->actingAs(User::factory()->withTwoFactor()->create(['is_admin' => true]))
            ->post(route('admin.orders.payment.recover', $order), ['reference' => 'txn_example'])->assertSessionHasNoErrors();
        $this->assertSame('paid', $order->fresh()->payment_status);
        $this->assertSame('paid', PaymentAttempt::first()->status);
    }

    public function test_authentication_rejection_can_be_retried_after_configuration_is_fixed(): void
    {
        $order = $this->order();
        Http::fake(['*/collect' => Http::response(['error' => ['code' => 'AUTHENTICATION_ERROR']], 401)]);
        $payload = ['phone' => '0111777771', 'method' => 'mobile', 'expected_total' => 125];
        $this->actingAs($order->user)->postJson(route('payments.dgateway.start', $order), $payload)->assertUnprocessable();
        $this->assertDatabaseHas('payment_attempts', ['status' => 'rejected']);
        $this->fakePayment();
        $this->postJson(route('payments.dgateway.start', $order), $payload)->assertOk();
        $this->assertDatabaseCount('payment_attempts', 2);
    }

    private function order(array $overrides = []): Order
    {
        $user = User::factory()->create();

        return Order::create(['user_id' => $user->id, 'checkout_token' => (string) Str::uuid(), 'number' => 'ELN-'.Str::random(10), 'customer_name' => $user->name, 'email' => $user->email, 'phone' => '0111777771', 'address' => 'Test street', 'city' => 'Kampala', 'country' => 'Uganda', 'payment_method' => 'dgateway', 'payment_provider' => 'dgateway', 'delivery_fee_status' => 'confirmed', 'subtotal' => 100, 'shipping' => 25, 'total' => 125, 'currency' => 'UGX', ...$overrides]);
    }
}
