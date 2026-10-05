<?php

namespace Tests\Feature;

use App\Mail\DeliveryQuoteReady;
use App\Models\DeliveryZone;
use App\Models\Order;
use App\Models\PaymentAttempt;
use App\Models\StoreSetting;
use App\Models\User;
use App\Services\DeliveryPricing;
use App\Services\Payments\DGatewayPaymentService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Queue;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;
use Tests\TestCase;

class DeliveryPricingTest extends TestCase
{
    use RefreshDatabase;

    public function test_unpriced_areas_never_become_free_even_above_a_threshold(): void
    {
        $zone = DeliveryZone::create(['country' => 'Uganda', 'district' => 'Kampala', 'area' => 'Test area', 'fee' => null, 'free_above' => 100, 'minimum_days' => 1, 'maximum_days' => 3, 'is_active' => true]);
        $pricing = app(DeliveryPricing::class);
        $this->assertNull($pricing->resolve('zone_'.$zone->id, 1000)['fee']);
        $this->assertNull($pricing->resolve('quote', 1000)['fee']);
        $zone->update(['fee' => 5000, 'free_above' => 100000]);
        $this->assertSame(5000.0, $pricing->resolve('zone_'.$zone->id, 1000)['fee']);
        $this->assertSame(0, $pricing->resolve('zone_'.$zone->id, 100000)['fee']);
    }

    public function test_pickup_requires_explicit_enablement(): void
    {
        $pricing = app(DeliveryPricing::class);
        $this->assertNotContains('pickup', array_column($pricing->options(100), 'id'));
        StoreSetting::updateOrCreate(['key' => 'pickup_enabled'], ['value' => '1']);
        $this->assertSame(0, $pricing->resolve('pickup', 100)['fee']);
    }

    public function test_admin_quote_updates_total_and_queues_customer_link(): void
    {
        Mail::fake();
        $order = $this->order();
        $admin = User::factory()->withTwoFactor()->create(['is_admin' => true]);
        $this->actingAs($admin)->post(route('admin.orders.delivery-quote', $order), ['shipping' => 5000])->assertSessionHasNoErrors();
        $this->assertSame('105000.00', $order->fresh()->total);
        $this->assertSame('confirmed', $order->fresh()->delivery_fee_status);
        Mail::assertQueued(DeliveryQuoteReady::class);
    }

    public function test_customer_cannot_set_quote_and_admin_cannot_reprice_paid_order(): void
    {
        Mail::fake();
        $order = $this->order();
        $this->actingAs(User::factory()->create())->post(route('admin.orders.delivery-quote', $order), ['shipping' => 1])->assertRedirect();
        $this->assertSame('100000.00', $order->fresh()->total);
        $order->update(['payment_status' => 'paid']);
        $this->actingAs(User::factory()->withTwoFactor()->create(['is_admin' => true]))->post(route('admin.orders.delivery-quote', $order), ['shipping' => 1])->assertSessionHasErrors('shipping');
        $this->assertSame('100000.00', $order->fresh()->total);
        Mail::assertNothingQueued();
    }

    public function test_expired_pickup_cannot_be_collected(): void
    {
        Queue::fake();
        $order = $this->order();
        $order->update(['delivery_method' => 'pickup', 'payment_method' => 'pay_at_shop', 'delivery_fee_status' => 'confirmed', 'expires_at' => now()->subMinute()]);
        $this->actingAs(User::factory()->withTwoFactor()->create(['is_admin' => true]))->post(route('admin.orders.collect-pickup', $order))->assertSessionHasErrors('pickup');
        $this->assertSame('pending', $order->fresh()->payment_status);
        $this->assertNotSame('delivered', $order->fresh()->status);
    }

    public function test_shop_payment_cannot_start_online_collection(): void
    {
        Http::preventStrayRequests();
        config(['services.dgateway.api_key' => 'dgw_test_example']);
        $order = $this->order();
        $order->update(['delivery_method' => 'pickup', 'payment_method' => 'pay_at_shop', 'delivery_fee_status' => 'confirmed']);
        try {
            app(DGatewayPaymentService::class)->start($order, '0111777771', 'mobile');
            $this->fail('Shop payment unexpectedly started an online collection.');
        } catch (ValidationException $exception) {
            $this->assertArrayHasKey('payment', $exception->errors());
        }
        $this->assertDatabaseCount('payment_attempts', 0);
        Http::assertNothingSent();
    }

    private function order(): Order
    {
        return Order::create(['number' => 'ELN-'.Str::random(10), 'checkout_token' => (string) Str::uuid(), 'customer_name' => 'Test Customer', 'email' => 'customer@example.com', 'address' => 'Test street', 'city' => 'Kampala', 'country' => 'Uganda', 'delivery_fee_status' => 'awaiting_quote', 'subtotal' => 100000, 'total' => 100000, 'currency' => 'UGX']);
    }

    public function test_admin_can_manage_delivery_zones_and_disable_pickup(): void
    {
        $this->actingAs(User::factory()->withTwoFactor()->create(['is_admin' => true]));
        $zone = ['country' => 'Uganda', 'district' => 'Kampala', 'area' => 'Central', 'fee' => null, 'free_above' => null, 'minimum_days' => 1, 'maximum_days' => 3, 'is_active' => true];
        $this->post(route('admin.delivery.store'), $zone)->assertSessionHasNoErrors();
        $this->get(route('admin.delivery.index'))->assertOk();
        $created = DeliveryZone::firstOrFail();
        $this->put(route('admin.delivery.update', $created), [...$zone, 'fee' => 5000, 'is_active' => false])->assertSessionHasNoErrors();
        $this->assertCount(1, app(DeliveryPricing::class)->options(10000));
        $this->put(route('admin.delivery.pickup'), ['enabled' => true, 'address' => 'Test pickup counter'])->assertSessionHasNoErrors();
        $this->assertSame(0, app(DeliveryPricing::class)->resolve('pickup', 10000)['fee']);
        $this->put(route('admin.delivery.pickup'), ['enabled' => false, 'address' => ''])->assertSessionHasNoErrors();
        $this->assertCount(1, app(DeliveryPricing::class)->options(10000));
    }

    public function test_delivery_quote_cannot_change_during_unknown_collection(): void
    {
        $order = $this->order();
        PaymentAttempt::create(['order_id' => $order->id, 'request_id' => (string) Str::uuid(), 'provider' => 'iotec', 'amount' => 100000, 'currency' => 'UGX', 'status' => 'unknown']);
        $this->actingAs(User::factory()->withTwoFactor()->create(['is_admin' => true]))->post(route('admin.orders.delivery-quote', $order), ['shipping' => 1])->assertSessionHasErrors('shipping');
        $this->assertSame('100000.00', $order->fresh()->total);
    }
}
