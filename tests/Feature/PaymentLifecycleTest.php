<?php

namespace Tests\Feature;

use App\Jobs\SendOrderEventWebhook;
use App\Jobs\SendOrderPaymentConfirmation;
use App\Mail\OrderPaymentConfirmed;
use App\Models\Category;
use App\Models\Discount;
use App\Models\Order;
use App\Models\Product;
use App\Models\User;
use App\Services\Orders\OrderPaymentLifecycle;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Queue;
use Illuminate\Support\Str;
use Tests\TestCase;

class PaymentLifecycleTest extends TestCase
{
    use RefreshDatabase;

    public function test_failed_payment_releases_stock_and_discount_once(): void
    {
        [$order, $product, $discount] = $this->reservedOrder();
        $lifecycle = app(OrderPaymentLifecycle::class);

        $lifecycle->apply($order, 'failed', [
            'payment_status_message' => 'Payment failed',
        ], 'test');
        $lifecycle->apply($order->fresh(), 'failed', [
            'payment_status_message' => 'Payment failed',
        ], 'test');

        $this->assertSame(5, $product->fresh()->stock);
        $this->assertSame(0, $discount->fresh()->times_used);
        $this->assertNotNull($order->fresh()->resources_released_at);
        $this->assertDatabaseCount('order_payment_events', 1);
    }

    public function test_paid_transition_queues_one_confirmation(): void
    {
        Queue::fake();
        [$order] = $this->reservedOrder();
        $lifecycle = app(OrderPaymentLifecycle::class);

        $lifecycle->apply($order, 'paid', [
            'payment_status_message' => 'Payment completed',
        ], 'ipn');
        $lifecycle->apply($order->fresh(), 'paid', [
            'payment_status_message' => 'Payment completed',
        ], 'callback');

        Queue::assertPushed(SendOrderPaymentConfirmation::class, 1);
        Queue::assertPushed(SendOrderEventWebhook::class, function (SendOrderEventWebhook $job) use ($order): bool {
            return $job->orderId === $order->id && $job->event === 'payment.confirmed';
        });
        $this->assertSame('paid', $order->fresh()->payment_status);
        $this->assertDatabaseCount('order_payment_events', 1);
    }

    public function test_reconciler_expires_unpaid_order_and_releases_resources(): void
    {
        [$order, $product, $discount] = $this->reservedOrder([
            'created_at' => now()->subHour(),
            'expires_at' => now()->subMinute(),
            'payment_reference' => null,
            'payment_merchant_reference' => null,
        ]);

        $this->artisan('pesapal:reconcile')->assertSuccessful();

        $order->refresh();
        $this->assertSame('expired', $order->payment_status);
        $this->assertSame('cancelled', $order->status);
        $this->assertSame(5, $product->fresh()->stock);
        $this->assertSame(0, $discount->fresh()->times_used);
    }

    public function test_reactivated_order_without_a_new_transaction_expires_safely(): void
    {
        [$order, $product, $discount] = $this->reservedOrder();
        $lifecycle = app(OrderPaymentLifecycle::class);
        $lifecycle->apply($order, 'failed', [], 'test');
        $reactivated = $lifecycle->reactivate($order->fresh());
        $reactivated->forceFill(['expires_at' => now()->subMinute()])->save();

        $this->assertSame(3, $product->fresh()->stock);
        $this->assertSame(1, $discount->fresh()->times_used);
        $this->assertNull($reactivated->payment_reference);

        $this->artisan('pesapal:reconcile')->assertSuccessful();

        $this->assertSame('expired', $reactivated->fresh()->payment_status);
        $this->assertSame(5, $product->fresh()->stock);
        $this->assertSame(0, $discount->fresh()->times_used);
    }

    public function test_confirmation_job_sends_only_for_paid_order_once(): void
    {
        Mail::fake();
        [$order] = $this->reservedOrder(['payment_status' => 'paid']);
        $job = new SendOrderPaymentConfirmation($order->id);

        $job->handle();
        $job->handle();

        Mail::assertSent(OrderPaymentConfirmed::class, 1);
        $this->assertNotNull($order->fresh()->confirmation_sent_at);
    }

    public function test_admin_manual_payment_confirmation_uses_lifecycle(): void
    {
        Queue::fake();
        [$order] = $this->reservedOrder([
            'payment_method' => 'manual_confirmation',
            'payment_provider' => null,
        ]);
        $admin = User::factory()->withTwoFactor()->create(['is_admin' => true]);

        $this->actingAs($admin)
            ->put(route('admin.orders.update', $order), [
                'status' => 'processing',
                'payment_status' => 'paid',
            ])
            ->assertRedirect();

        $this->assertSame('paid', $order->fresh()->payment_status);
        Queue::assertPushed(SendOrderPaymentConfirmation::class, 1);
    }

    public function test_admin_can_verify_pesapal_status_without_editing_it(): void
    {
        Queue::fake();
        [$order] = $this->reservedOrder();
        $admin = User::factory()->withTwoFactor()->create(['is_admin' => true]);
        config([
            'services.pesapal.environment' => 'sandbox',
            'services.pesapal.consumer_key' => 'sandbox-key',
            'services.pesapal.consumer_secret' => 'sandbox-secret',
            'services.pesapal.ipn_id' => (string) Str::uuid(),
            'services.pesapal.currency' => 'UGX',
            'services.pesapal.ca_bundle' => null,
        ]);
        Http::fake([
            '*/api/Auth/RequestToken' => Http::response(['token' => 'sandbox-token']),
            '*/api/Transactions/GetTransactionStatus*' => Http::response([
                'payment_status_description' => 'COMPLETED',
                'merchant_reference' => $order->payment_merchant_reference,
                'amount' => 90,
                'currency' => 'UGX',
                'confirmation_code' => 'PSP-ADMIN',
                'description' => 'Payment completed',
            ]),
        ]);

        $this->actingAs($admin)
            ->post(route('admin.orders.payment.refresh', $order))
            ->assertRedirect();

        $this->assertSame('paid', $order->fresh()->payment_status);
        $this->assertDatabaseHas('order_payment_events', [
            'order_id' => $order->id,
            'source' => 'admin',
            'status' => 'paid',
        ]);
    }

    /**
     * @param  array<string, mixed>  $overrides
     * @return array{Order, Product, Discount}
     */
    private function reservedOrder(array $overrides = []): array
    {
        $category = Category::create([
            'name' => 'Body Care',
            'slug' => 'body-care-'.Str::random(6),
            'is_active' => true,
        ]);
        $product = Product::create([
            'category_id' => $category->id,
            'name' => 'Body Oil',
            'slug' => 'body-oil-'.Str::random(6),
            'sku' => 'BODY-'.Str::upper(Str::random(6)),
            'description' => 'Test product',
            'price' => 50,
            'stock' => 3,
            'images' => [],
            'is_active' => true,
        ]);
        $discount = Discount::create([
            'name' => 'Test discount',
            'code' => 'TEST'.Str::upper(Str::random(4)),
            'type' => 'fixed',
            'value' => 10,
            'times_used' => 1,
            'is_active' => true,
        ]);
        $user = User::factory()->create();
        $order = Order::create([
            'user_id' => $user->id,
            'number' => 'ELN-'.Str::upper(Str::random(10)),
            'customer_name' => $user->name,
            'email' => $user->email,
            'address' => '1 Test Street',
            'city' => 'Kampala',
            'country' => 'Uganda',
            'payment_method' => 'pesapal',
            'payment_provider' => 'pesapal',
            'payment_status' => 'pending',
            'payment_reference' => (string) Str::uuid(),
            'payment_merchant_reference' => 'ELN-TEST-'.Str::upper(Str::random(6)),
            'discount_id' => $discount->id,
            'discount_code' => $discount->code,
            'discount_amount' => 10,
            'subtotal' => 100,
            'shipping' => 0,
            'total' => 90,
            ...$overrides,
        ]);
        $order->items()->create([
            'product_id' => $product->id,
            'product_name' => $product->name,
            'sku' => $product->sku,
            'price' => 50,
            'quantity' => 2,
            'total' => 100,
        ]);

        return [$order, $product, $discount];
    }
}
