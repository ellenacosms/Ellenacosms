<?php

namespace Tests\Feature;

use App\Models\Category;
use App\Models\Product;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class WishlistAndRecentlyViewedTest extends TestCase
{
    use RefreshDatabase;

    private Category $category;

    protected function setUp(): void
    {
        parent::setUp();

        $this->category = Category::create([
            'name' => 'Wishlist Test Care',
            'slug' => 'wishlist-test-care',
            'is_active' => true,
        ]);
    }

    public function test_verified_customer_can_save_and_remove_a_product(): void
    {
        $customer = User::factory()->create();
        $product = $this->product('Scalp Oil', 'scalp-oil', 'HAIR-001');

        $this->actingAs($customer)
            ->from('/shop')
            ->post("/wishlist/{$product->id}")
            ->assertRedirect('/shop');

        $this->actingAs($customer)
            ->from('/shop')
            ->post("/wishlist/{$product->id}")
            ->assertRedirect('/shop');

        $this->assertDatabaseCount('wishlists', 1);
        $this->assertDatabaseHas('wishlists', [
            'user_id' => $customer->id,
            'product_id' => $product->id,
        ]);

        $this->actingAs($customer)
            ->get('/shop')
            ->assertInertia(fn ($page) => $page
                ->where('wishlist_product_ids', [$product->id]));

        $this->actingAs($customer)
            ->from('/shop')
            ->delete("/wishlist/{$product->id}")
            ->assertRedirect('/shop');

        $this->assertDatabaseCount('wishlists', 0);
    }

    public function test_guest_cannot_change_a_wishlist(): void
    {
        $product = $this->product('Body Veil', 'body-veil', 'BODY-001');

        $this->post("/wishlist/{$product->id}")
            ->assertRedirect('/register');

        $this->assertDatabaseCount('wishlists', 0);
    }

    public function test_dashboard_contains_saved_and_recent_products_in_view_order(): void
    {
        $customer = User::factory()->create();
        $first = $this->product('Scalp Oil', 'scalp-oil', 'HAIR-001');
        $second = $this->product('Hair Milk', 'hair-milk', 'HAIR-002');

        $customer->wishlistProducts()->attach($first);

        $this->actingAs($customer)->get("/products/{$first->slug}")->assertOk();
        $this->actingAs($customer)->get("/products/{$second->slug}")
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->where('recentlyViewed.0.id', $first->id));

        $this->actingAs($customer)
            ->get('/dashboard')
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('dashboard')
                ->where('wishlistProducts.0.id', $first->id)
                ->where('recentlyViewed.0.id', $second->id)
                ->where('recentlyViewed.1.id', $first->id));
    }

    private function product(string $name, string $slug, string $sku): Product
    {
        return Product::create([
            'category_id' => $this->category->id,
            'name' => $name,
            'slug' => $slug,
            'sku' => $sku,
            'description' => 'A considered Ellena formula.',
            'price' => 75,
            'stock' => 10,
            'images' => [],
            'is_active' => true,
        ]);
    }
}
