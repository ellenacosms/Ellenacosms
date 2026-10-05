<?php

namespace Tests\Feature;

use App\Models\Category;
use App\Models\Order;
use App\Models\Product;
use App\Models\Ritual;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class RitualBundleTest extends TestCase
{
    use RefreshDatabase;

    private Product $cleanser;

    private Product $oil;

    private Ritual $ritual;

    protected function setUp(): void
    {
        parent::setUp();

        $category = Category::create([
            'name' => 'Ritual Test Body Care',
            'slug' => 'ritual-test-body-care',
            'is_active' => true,
        ]);
        $this->cleanser = $this->product($category, 'Test Body Cleanser', 'test-body-cleanser', 'RITUAL-001', 100);
        $this->oil = $this->product($category, 'Test Body Oil', 'test-body-oil', 'RITUAL-002', 50);
        $this->ritual = Ritual::create([
            'name' => 'Test Body Ritual',
            'slug' => 'test-body-ritual',
            'eyebrow' => 'The test ritual',
            'description' => 'A complete body ritual for testing.',
            'discount_percent' => 10,
            'steps' => ['Cleanse.', 'Seal.'],
            'is_active' => true,
            'is_featured' => true,
        ]);
        $this->ritual->products()->attach([
            $this->cleanser->id => ['step_order' => 1, 'instruction' => 'Cleanse first.'],
            $this->oil->id => ['step_order' => 2, 'instruction' => 'Seal second.'],
        ]);
    }

    public function test_ritual_page_exposes_products_and_truthful_bundle_pricing(): void
    {
        $this->get('/rituals')
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('storefront/rituals')
                ->where('rituals.0.name', 'Test Body Ritual')
                ->where('rituals.0.products.0.id', $this->cleanser->id)
                ->where('rituals.0.regular_price', 150)
                ->where('rituals.0.savings', 15)
                ->where('rituals.0.bundle_price', 135)
                ->where('rituals.0.is_available', true));
    }

    public function test_complete_ritual_receives_savings_that_disappear_when_it_is_broken(): void
    {
        $this->from('/rituals')
            ->post("/rituals/{$this->ritual->slug}/cart", ['quantity' => 1])
            ->assertRedirect('/rituals');

        $this->get('/cart')->assertInertia(fn ($page) => $page
            ->where('count', 2)
            ->where('subtotal', 150)
            ->where('bundle_discount.amount', 15)
            ->where('bundle_discount.rituals.0.name', 'Test Body Ritual')
            ->where('shipping', 0)
            ->where('total', 135));

        $this->patch("/cart/{$this->cleanser->id}", ['quantity' => 0]);

        $this->get('/cart')->assertInertia(fn ($page) => $page
            ->where('count', 1)
            ->where('bundle_discount', null)
            ->where('subtotal', 50));
    }

    public function test_unavailable_product_prevents_adding_an_incomplete_ritual(): void
    {
        $this->oil->update(['stock' => 0]);

        $this->post("/rituals/{$this->ritual->slug}/cart", ['quantity' => 1])
            ->assertSessionHasErrors('ritual');

        $this->assertEmpty(session('cart', []));
    }

    public function test_ritual_savings_are_preserved_on_the_order(): void
    {
        $customer = User::factory()->create();
        $this->actingAs($customer)
            ->post("/rituals/{$this->ritual->slug}/cart", ['quantity' => 1]);
        $this->actingAs($customer)->get('/checkout')->assertOk();
        $checkoutToken = session('checkout_token');

        $this->actingAs($customer)->post('/checkout', [
            'customer_name' => $customer->name,
            'email' => $customer->email,
            'phone' => '+256700000000',
            'address' => '12 Ritual Lane',
            'city' => 'Kampala',
            'country' => 'Uganda',
            'notes' => null,
            'delivery_method' => 'quote',
            'checkout_token' => $checkoutToken,
            'payment_method' => 'manual_confirmation',
        ])->assertRedirect();

        $order = Order::latest('id')->firstOrFail();

        $this->assertSame('RITUAL SAVINGS', $order->discount_code);
        $this->assertSame('15.00', $order->discount_amount);
        $this->assertSame('135.00', $order->total);
        $this->assertFalse(session()->has('cart_rituals'));
    }

    private function product(
        Category $category,
        string $name,
        string $slug,
        string $sku,
        float $price,
    ): Product {
        return Product::create([
            'category_id' => $category->id,
            'name' => $name,
            'slug' => $slug,
            'sku' => $sku,
            'description' => 'A considered test formula.',
            'price' => $price,
            'stock' => 10,
            'images' => [],
            'is_active' => true,
        ]);
    }
}
