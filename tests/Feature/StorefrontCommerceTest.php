<?php

namespace Tests\Feature;

use App\Models\Category;
use App\Models\Discount;
use App\Models\Order;
use App\Models\Product;
use App\Models\StoreSetting;
use App\Models\User;
use Database\Seeders\DatabaseSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Str;
use Tests\TestCase;

class StorefrontCommerceTest extends TestCase
{
    use RefreshDatabase;

    public function test_finder_receives_only_active_available_products(): void
    {
        $available = $this->product(price: 45, stock: 3);
        $inactive = $this->product(price: 60, stock: 2);
        $inactive->update(['is_active' => false]);

        $this->get('/find-your-ellena')
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('storefront/finder')
                ->has('products', 1)
                ->where('products.0.id', $available->id)
                ->missing('products.0.wholesale_price'),
            );
    }

    public function test_shipping_uses_the_store_threshold(): void
    {
        $product = $this->product(price: 100, stock: 5);
        StoreSetting::create(['key' => 'free_shipping_threshold', 'value' => '120']);

        $this->withSession(['cart' => [$product->id => 1]])
            ->get('/cart')
            ->assertInertia(fn ($page) => $page
                ->where('subtotal', 100)
                ->where('shipping', 0)
                ->where('free_shipping_threshold', 120),
            );
    }

    public function test_discount_is_applied_to_checkout_and_usage_is_counted(): void
    {
        $product = $this->product(price: 100, stock: 5);
        $discount = Discount::create([
            'name' => 'Save ten',
            'code' => 'SAVE10',
            'type' => 'percentage',
            'value' => 10,
            'minimum_order' => 50,
            'usage_limit' => 5,
            'is_active' => true,
        ]);
        $session = ['cart' => [$product->id => 2]];

        $this->withSession($session)
            ->post('/cart/discount', ['code' => 'save10'])
            ->assertRedirect();

        $this->get('/cart')
            ->assertInertia(fn ($page) => $page
                ->where('discount.code', 'SAVE10')
                ->where('discount.amount', 20),
            );

        $checkoutToken = (string) Str::uuid();

        $this->withSession(['checkout_token' => $checkoutToken])->post('/checkout', [
            'customer_name' => 'Test Customer',
            'email' => 'customer@example.com',
            'phone' => '256700000000',
            'address' => '1 Test Street',
            'city' => 'Kampala',
            'country' => 'Uganda',
            'delivery_method' => 'quote',
            'checkout_token' => $checkoutToken,
            'payment_method' => 'manual_confirmation',
        ])->assertRedirect();

        $order = Order::firstOrFail();
        $this->assertSame('SAVE10', $order->discount_code);
        $this->assertSame('20.00', $order->discount_amount);
        $this->assertSame('180.00', $order->total);
        $this->assertSame(1, $discount->fresh()->times_used);
        $this->assertSame(3, $product->fresh()->stock);
    }

    public function test_stale_cart_cannot_create_an_empty_order(): void
    {
        $checkoutToken = (string) Str::uuid();

        $this->withSession([
            'cart' => [999999 => 1],
            'checkout_token' => $checkoutToken,
        ])->postJson('/checkout', [
            'customer_name' => 'Test Customer',
            'email' => 'customer@example.com',
            'phone' => '256700000000',
            'address' => '1 Test Street',
            'city' => 'Kampala',
            'country' => 'Uganda',
            'delivery_method' => 'quote',
            'checkout_token' => $checkoutToken,
            'payment_method' => 'manual_confirmation',
        ])
            ->assertUnprocessable();

        $this->assertDatabaseCount('orders', 0);
    }

    public function test_only_verified_purchasers_can_submit_reviews(): void
    {
        $product = $this->product(price: 80, stock: 5);
        $customer = User::factory()->create();

        $this->actingAs($customer)->post("/products/{$product->slug}/reviews", [
            'rating' => 5,
            'body' => 'This review should be rejected.',
        ])->assertForbidden();

        $order = Order::create([
            'user_id' => $customer->id,
            'number' => 'ELN-TEST-001',
            'customer_name' => $customer->name,
            'email' => $customer->email,
            'status' => 'delivered',
            'payment_status' => 'paid',
            'address' => '1 Test Street',
            'city' => 'Kampala',
            'country' => 'Uganda',
            'subtotal' => 80,
            'shipping' => 0,
            'total' => 80,
        ]);
        $order->items()->create([
            'product_id' => $product->id,
            'product_name' => $product->name,
            'sku' => $product->sku,
            'price' => 80,
            'quantity' => 1,
            'total' => 80,
        ]);

        $this->actingAs($customer)->post("/products/{$product->slug}/reviews", [
            'rating' => 5,
            'title' => 'Beautiful finish',
            'body' => 'This review was submitted after purchase.',
        ])->assertRedirect();

        $this->assertDatabaseHas('reviews', [
            'product_id' => $product->id,
            'user_id' => $customer->id,
            'is_verified_purchase' => 1,
            'is_approved' => 0,
        ]);
    }

    public function test_database_seeder_is_repeatable_without_duplicate_catalog_data(): void
    {
        $this->seed(DatabaseSeeder::class);
        $this->seed(DatabaseSeeder::class);

        $this->assertDatabaseCount('categories', 4);
        $this->assertDatabaseCount('products', 8);
        $this->assertDatabaseCount('banners', 3);
    }

    private function product(float $price, int $stock): Product
    {
        $category = Category::create([
            'name' => 'Skin Care',
            'slug' => 'skin-care-'.uniqid(),
            'is_active' => true,
        ]);

        return Product::create([
            'category_id' => $category->id,
            'name' => 'Test Serum '.uniqid(),
            'slug' => 'test-serum-'.uniqid(),
            'sku' => 'SERUM-'.strtoupper(str()->random(8)),
            'description' => 'A test serum.',
            'price' => $price,
            'stock' => $stock,
            'images' => [],
            'is_active' => true,
        ]);
    }
}
