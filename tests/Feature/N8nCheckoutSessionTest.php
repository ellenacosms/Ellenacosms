<?php

namespace Tests\Feature;

use App\Models\Category;
use App\Models\N8nCheckoutSession;
use App\Models\Product;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Str;
use Tests\TestCase;

class N8nCheckoutSessionTest extends TestCase
{
    use RefreshDatabase;

    public function test_n8n_can_create_a_short_lived_checkout_link_that_seeds_the_guest_cart(): void
    {
        config(['services.n8n.checkout_session_secret' => 'checkout-test-secret']);
        $product = $this->createProduct(stock: 4);
        $payload = [
            'items' => [
                ['product_name' => $product->name, 'quantity' => 2],
            ],
            'customer' => [
                'name' => 'Jane Doe',
                'email' => 'jane@example.test',
                'phone' => '256700000000',
            ],
        ];
        $timestamp = (string) now()->getTimestamp();
        $body = json_encode($payload, JSON_THROW_ON_ERROR);

        $response = $this->withHeaders([
            'X-N8N-Timestamp' => $timestamp,
            'X-N8N-Signature' => 'sha256='.hash_hmac('sha256', $timestamp.'.'.$body, 'checkout-test-secret'),
        ])->postJson(route('n8n.checkout-sessions.store'), $payload);

        $response->assertCreated()
            ->assertJsonStructure(['checkout_url', 'expires_at']);

        $checkoutUrl = (string) $response->json('checkout_url');
        $this->assertNotEmpty($checkoutUrl);
        $this->assertDatabaseCount('n8n_checkout_sessions', 1);

        $this->get($checkoutUrl)
            ->assertRedirect(route('checkout.create'))
            ->assertSessionHas('cart', [$product->id => 2])
            ->assertSessionHas('n8n_checkout_customer.email', 'jane@example.test');
    }

    public function test_checkout_session_endpoint_requires_its_shared_secret(): void
    {
        config(['services.n8n.checkout_session_secret' => 'checkout-test-secret']);

        $this->postJson(route('n8n.checkout-sessions.store'), [
            'items' => [['product_id' => 1, 'quantity' => 1]],
        ])->assertUnauthorized();

        $this->assertDatabaseCount('n8n_checkout_sessions', 0);
    }

    public function test_checkout_link_can_only_be_opened_before_expiry_and_before_its_order_is_created(): void
    {
        $session = N8nCheckoutSession::create([
            'token' => (string) Str::uuid(),
            'items' => [1 => 1],
            'expires_at' => now()->subMinute(),
        ]);

        $this->get(route('n8n.checkout-sessions.open', $session->token))->assertGone();
    }

    private function createProduct(int $stock): Product
    {
        $category = Category::create([
            'name' => 'Test category',
            'slug' => 'test-category',
        ]);

        return Product::create([
            'category_id' => $category->id,
            'name' => 'Test product',
            'slug' => 'test-product',
            'sku' => 'TEST-'.Str::upper(Str::random(6)),
            'description' => 'A test product.',
            'price' => 5000,
            'stock' => $stock,
            'is_active' => true,
        ]);
    }
}
