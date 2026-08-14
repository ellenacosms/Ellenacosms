<?php

namespace Tests\Feature;

use App\Models\Category;
use App\Models\Order;
use App\Models\Product;
use App\Models\Review;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Socialite\Facades\Socialite;
use Laravel\Socialite\Two\User as SocialiteUser;
use Tests\TestCase;

class CommerceTest extends TestCase
{
    use RefreshDatabase;

    private Product $product;

    protected function setUp(): void
    {
        parent::setUp();

        config([
            'services.google.ca_bundle' => null,
            'services.pesapal.consumer_key' => null,
            'services.pesapal.consumer_secret' => null,
            'services.pesapal.ipn_id' => null,
        ]);

        $category = Category::create([
            'name' => 'Skin Care',
            'slug' => 'skin-care',
            'is_active' => true,
        ]);

        $this->product = Product::create([
            'category_id' => $category->id,
            'name' => 'Radiance Elixir',
            'slug' => 'radiance-elixir',
            'sku' => 'TEST-001',
            'description' => 'A luminous serum.',
            'price' => 100,
            'stock' => 5,
            'images' => [],
            'is_active' => true,
            'is_featured' => true,
        ]);
    }

    public function test_storefront_and_product_are_available(): void
    {
        $this->get('/')->assertOk()->assertInertia(fn ($page) => $page
            ->component('storefront/home')
            ->has('featured', 1)
            ->where('featured.0.id', $this->product->id)
            ->has('latestProducts', 1)
            ->where('latestProducts.0.id', $this->product->id));
        $this->get('/products/radiance-elixir')->assertOk()->assertInertia(fn ($page) => $page->component('storefront/product'));
    }

    public function test_shop_sorts_products_with_a_safe_whitelist(): void
    {
        $lowerPrice = Product::create([
            'category_id' => $this->product->category_id,
            'name' => 'Body Veil',
            'slug' => 'body-veil',
            'sku' => 'TEST-LOW',
            'description' => 'A lightweight body veil.',
            'price' => 40,
            'stock' => 5,
            'images' => [],
            'is_active' => true,
        ]);
        $higherPrice = Product::create([
            'category_id' => $this->product->category_id,
            'name' => 'Hair Ritual Oil',
            'slug' => 'hair-ritual-oil',
            'sku' => 'TEST-HIGH',
            'description' => 'A restorative hair ritual.',
            'price' => 180,
            'stock' => 5,
            'images' => [],
            'is_active' => true,
        ]);

        $this->get('/shop?sort=price-low')->assertOk()->assertInertia(fn ($page) => $page
            ->where('filters.sort', 'price-low')
            ->where('products.data.0.id', $lowerPrice->id)
            ->where('products.data.1.id', $this->product->id)
            ->where('products.data.2.id', $higherPrice->id)
        );

        $this->get('/shop?sort=unsafe-column')->assertOk()->assertInertia(fn ($page) => $page
            ->where('filters.sort', 'featured')
            ->where('products.data.0.id', $this->product->id)
        );
    }

    public function test_predictive_search_returns_only_matching_active_products(): void
    {
        $this->product->update(['subtitle' => 'Rosemary scalp support']);
        Product::create([
            'category_id' => $this->product->category_id,
            'name' => 'Hidden Scalp Oil',
            'slug' => 'hidden-scalp-oil',
            'sku' => 'HIDDEN-001',
            'description' => 'A private rosemary formula.',
            'price' => 80,
            'stock' => 5,
            'images' => [],
            'is_active' => false,
        ]);

        $this->getJson('/search/suggestions?q=rosemary')
            ->assertOk()
            ->assertJsonPath('query', 'rosemary')
            ->assertJsonCount(1, 'products')
            ->assertJsonPath('products.0.id', $this->product->id)
            ->assertJsonMissing(['slug' => 'hidden-scalp-oil']);
    }

    public function test_predictive_search_shows_featured_products_before_typing(): void
    {
        $this->getJson('/search/suggestions')
            ->assertOk()
            ->assertJsonCount(1, 'products')
            ->assertJsonPath('products.0.id', $this->product->id);
    }

    public function test_product_cards_only_summarize_approved_reviews(): void
    {
        Review::create([
            'product_id' => $this->product->id,
            'customer_name' => 'Approved Customer',
            'email' => 'approved@example.com',
            'rating' => 5,
            'body' => 'A polished result.',
            'is_approved' => true,
        ]);
        Review::create([
            'product_id' => $this->product->id,
            'customer_name' => 'Pending Customer',
            'email' => 'pending@example.com',
            'rating' => 1,
            'body' => 'Awaiting moderation.',
            'is_approved' => false,
        ]);

        $this->get('/')->assertOk()->assertInertia(fn ($page) => $page
            ->where('featured.0.reviews_count', 1)
            ->where('featured.0.reviews_avg_rating', 5)
        );
    }

    public function test_customer_can_add_to_cart_and_place_an_order(): void
    {
        $customer = User::factory()->create();

        $this->actingAs($customer);
        $this->post("/cart/{$this->product->id}", ['quantity' => 2])->assertRedirect();
        $this->get('/')->assertOk()->assertInertia(fn ($page) => $page
            ->where('cart_count', 2)
            ->where('cart_summary.count', 2)
            ->where('cart_summary.items.0.product.id', $this->product->id)
            ->where('cart_summary.items.0.quantity', 2)
            ->where('cart_summary.subtotal', 200)
        );
        $this->get('/cart')->assertOk()->assertInertia(fn ($page) => $page
            ->component('storefront/cart')
            ->where('items.0.quantity', 2)
            ->where('total', 200)
        );

        $this->get('/checkout')->assertOk()->assertInertia(fn ($page) => $page
            ->component('storefront/checkout')
            ->has('checkoutToken')
            ->has('deliveryOptions', 2)
            ->where('deliveryOptions.0.id', 'standard')
            ->where('paymentOptions.0.id', 'pesapal')
            ->where('paymentOptions.0.enabled', false)
            ->where('defaultPaymentMethod', 'manual_confirmation')
        );

        $checkoutToken = session('checkout_token');

        $payload = [
            'customer_name' => 'Ada Beauty',
            'email' => 'ada@example.com',
            'phone' => '+254700000000',
            'address' => '12 Garden Lane',
            'city' => 'Nairobi',
            'country' => 'Kenya',
            'notes' => '',
            'delivery_method' => 'standard',
            'checkout_token' => $checkoutToken,
            'payment_method' => 'manual_confirmation',
        ];
        $response = $this->post('/checkout', $payload);

        $order = Order::firstOrFail();
        $response->assertRedirect(route('checkout.success', $order));
        $this->assertSame('200.00', $order->subtotal);
        $this->assertSame('200.00', $order->total);
        $this->assertSame($customer->id, $order->user_id);
        $this->assertSame($customer->email, $order->email);
        $this->assertSame('standard', $order->delivery_method);
        $this->assertNotNull($order->estimated_delivery_date);
        $this->assertSame(3, $this->product->fresh()->stock);
        $this->get(route('checkout.success', $order))->assertOk();

        $this->post('/checkout', $payload)->assertRedirect(route('checkout.success', $order));
        $this->assertSame(1, Order::count());
        $this->assertSame(3, $this->product->fresh()->stock);
    }

    public function test_express_delivery_is_priced_and_saved_server_side(): void
    {
        $customer = User::factory()->create();

        $this->actingAs($customer)
            ->post("/cart/{$this->product->id}", ['quantity' => 1]);
        $this->get('/checkout')->assertOk();

        $response = $this->post('/checkout', [
            'customer_name' => 'Express Customer',
            'email' => 'ignored@example.com',
            'phone' => '',
            'address' => '22 Express Lane',
            'city' => 'Kampala',
            'country' => 'Uganda',
            'notes' => '',
            'delivery_method' => 'express',
            'checkout_token' => session('checkout_token'),
            'payment_method' => 'manual_confirmation',
        ]);

        $order = Order::firstOrFail();
        $response->assertRedirect(route('checkout.success', $order));
        $this->assertSame('express', $order->delivery_method);
        $this->assertSame('25.00', $order->shipping);
        $this->assertSame('125.00', $order->total);
        $this->assertSame($customer->email, $order->email);
    }

    public function test_guest_can_place_an_order_without_an_account(): void
    {
        $this->post("/cart/{$this->product->id}", ['quantity' => 1]);

        $this->get('/checkout')->assertOk()->assertInertia(fn ($page) => $page
            ->component('storefront/checkout')
            ->where('customer', null),
        );

        $response = $this->post('/checkout', [
            'customer_name' => 'Guest Customer',
            'email' => 'guest@example.com',
            'phone' => '+254700000000',
            'address' => '1 Guest Street',
            'city' => 'Nairobi',
            'country' => 'Kenya',
            'delivery_method' => 'standard',
            'checkout_token' => session('checkout_token'),
            'payment_method' => 'manual_confirmation',
        ]);

        $order = Order::firstOrFail();
        $response->assertRedirect(route('checkout.success', $order));
        $this->assertNull($order->user_id);
        $this->assertSame('guest@example.com', $order->email);
        $this->get(route('checkout.success', $order))->assertOk();

        $unverifiedCustomer = User::factory()->unverified()->create();
        $this->actingAs($unverifiedCustomer)
            ->get('/checkout')
            ->assertRedirect(route('cart.index'));
    }

    public function test_google_auth_creates_a_verified_customer_and_preserves_checkout(): void
    {
        Socialite::fake('google', SocialiteUser::fake([
            'id' => 'google-customer-123',
            'name' => 'Google Customer',
            'email' => 'google@example.com',
            'email_verified' => true,
        ]));

        $this->withSession([
            'cart' => [$this->product->id => 1],
            'url.intended' => route('checkout.create'),
        ])->get(route('auth.google.callback'))->assertRedirect(route('checkout.create'));

        $this->assertAuthenticated();
        $customer = User::where('email', 'google@example.com')->firstOrFail();
        $this->assertSame('google-customer-123', $customer->google_id);
        $this->assertNotNull($customer->email_verified_at);
        $this->get('/checkout')->assertOk()->assertInertia(fn ($page) => $page
            ->component('storefront/checkout')
            ->where('customer.email', 'google@example.com')
        );
    }

    public function test_google_auth_popup_notifies_the_verified_opener(): void
    {
        Socialite::fake('google', SocialiteUser::fake([
            'id' => 'popup-google-customer-123',
            'name' => 'Popup Customer',
            'email' => 'popup@example.com',
            'email_verified' => true,
        ]));

        $channel = str_repeat('a', 48);

        $response = $this->withSession([
            'url.intended' => route('checkout.create'),
            'oauth.google.popup' => [
                'channel' => $channel,
                'openerOrigin' => 'http://localhost',
            ],
        ])->get(route('auth.google.callback'));

        $response
            ->assertOk()
            ->assertViewIs('auth.google-popup')
            ->assertViewHas('openerOrigin', 'http://localhost')
            ->assertViewHas('payload', fn (array $payload) => $payload['type'] === 'ellena:google-auth'
                && $payload['channel'] === $channel
                && $payload['status'] === 'success'
                && $payload['redirect'] === route('checkout.create'));

        $this->assertAuthenticated();
        $this->assertNotNull(User::where('email', 'popup@example.com')->firstOrFail()->email_verified_at);
    }

    public function test_order_confirmation_is_not_publicly_enumerable(): void
    {
        $order = Order::create([
            'number' => 'ELN-TEST',
            'customer_name' => 'Private Customer',
            'email' => 'private@example.com',
            'address' => 'Private',
            'city' => 'Nairobi',
            'country' => 'Kenya',
            'subtotal' => 100,
            'shipping' => 0,
            'total' => 100,
        ]);

        $this->get(route('checkout.success', $order))->assertForbidden();
    }

    public function test_only_admins_can_access_the_admin_dashboard(): void
    {
        $customer = User::factory()->create();
        $admin = User::factory()->withTwoFactor()->create(['is_admin' => true]);

        $this->actingAs($customer)->get('/admin')->assertRedirect('/dashboard');
        $this->actingAs($admin)->get('/admin')->assertOk()->assertInertia(fn ($page) => $page->component('admin/dashboard'));
    }

    public function test_private_admin_entry_redirects_to_the_admin_dashboard_route(): void
    {
        $this->get('/ellenacosms/govern')->assertRedirect('/admin');
    }

    public function test_admin_login_redirects_to_the_admin_dashboard(): void
    {
        $admin = User::factory()->create([
            'email' => 'admin@example.com',
            'password' => 'password',
            'is_admin' => true,
        ]);

        $this->post('/login', [
            'email' => $admin->email,
            'password' => 'password',
        ])->assertRedirect('/admin');
    }

    public function test_admin_visiting_customer_dashboard_is_redirected_to_commerce_dashboard(): void
    {
        $admin = User::factory()->withTwoFactor()->create(['is_admin' => true]);

        $this->actingAs($admin)->get('/dashboard')->assertRedirect('/admin');
    }

    public function test_customer_registration_never_redirects_to_the_admin_dashboard(): void
    {
        $this->get('/admin')->assertRedirect('/login');

        $response = $this->post('/register', [
            'name' => 'New Customer',
            'email' => 'new@example.com',
            'password' => 'password',
            'password_confirmation' => 'password',
        ]);

        $response->assertRedirect('/dashboard');
        $this->assertFalse(User::where('email', 'new@example.com')->firstOrFail()->is_admin);
    }

    public function test_customer_login_with_admin_intended_url_redirects_to_customer_dashboard(): void
    {
        $customer = User::factory()->create([
            'email' => 'customer@example.com',
            'password' => 'password',
        ]);

        $this->get('/admin')->assertRedirect('/login');
        $this->post('/login', [
            'email' => $customer->email,
            'password' => 'password',
        ])->assertRedirect('/dashboard');
    }

    public function test_customer_dashboard_shows_only_their_order_details(): void
    {
        $customer = User::factory()->create();
        $otherCustomer = User::factory()->create();
        $order = Order::create([
            'user_id' => $customer->id,
            'number' => 'ELN-CUSTOMER',
            'customer_name' => $customer->name,
            'email' => $customer->email,
            'address' => '12 Garden Lane',
            'city' => 'Nairobi',
            'country' => 'Kenya',
            'subtotal' => 100,
            'shipping' => 0,
            'total' => 100,
        ]);
        Order::create([
            'user_id' => $otherCustomer->id,
            'number' => 'ELN-OTHER',
            'customer_name' => $otherCustomer->name,
            'email' => $otherCustomer->email,
            'address' => 'Private',
            'city' => 'Nairobi',
            'country' => 'Kenya',
            'subtotal' => 50,
            'shipping' => 0,
            'total' => 50,
        ]);
        $order->items()->create([
            'product_id' => $this->product->id,
            'product_name' => $this->product->name,
            'sku' => $this->product->sku,
            'price' => 100,
            'quantity' => 1,
            'total' => 100,
        ]);

        $this->actingAs($customer)->get('/dashboard')
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('dashboard')
                ->has('orders', 1)
                ->where('orders.0.number', 'ELN-CUSTOMER')
                ->where('orders.0.items.0.product_name', $this->product->name)
                ->where('summary.orders', 1)
                ->where('summary.spent', 100)
            );
    }

    public function test_customer_can_view_their_order_but_not_another_customers_order(): void
    {
        $customer = User::factory()->create();
        $otherCustomer = User::factory()->create();
        $ownOrder = Order::create([
            'user_id' => $customer->id,
            'number' => 'ELN-OWN',
            'customer_name' => $customer->name,
            'email' => $customer->email,
            'address' => '12 Garden Lane',
            'city' => 'Nairobi',
            'country' => 'Kenya',
            'subtotal' => 100,
            'shipping' => 0,
            'total' => 100,
        ]);
        $otherOrder = Order::create([
            'user_id' => $otherCustomer->id,
            'number' => 'ELN-PRIVATE',
            'customer_name' => $otherCustomer->name,
            'email' => $otherCustomer->email,
            'address' => 'Private',
            'city' => 'Nairobi',
            'country' => 'Kenya',
            'subtotal' => 50,
            'shipping' => 0,
            'total' => 50,
        ]);

        $this->actingAs($customer)
            ->get("/dashboard/orders/{$ownOrder->id}")
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('account/order')
                ->where('order.number', 'ELN-OWN')
            );

        $this->actingAs($customer)
            ->get("/dashboard/orders/{$otherOrder->id}")
            ->assertForbidden();
    }
}
