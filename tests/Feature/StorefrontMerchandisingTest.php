<?php

namespace Tests\Feature;

use App\Models\Category;
use App\Models\Product;
use App\Models\Ritual;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class StorefrontMerchandisingTest extends TestCase
{
    use RefreshDatabase;

    public function test_discovery_room_exposes_real_edits_and_available_products(): void
    {
        $featured = $this->product('Most Loved Oil', true);
        $featured->category->update([
            'image' => '/images/catalog/body-care-editorial.png',
        ]);
        $this->product('Daily Wash');
        $firstCategoryImage = Category::query()
            ->where('is_active', true)
            ->orderBy('name')
            ->value('image');

        $this->get('/discover')
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('storefront/discover')
                ->has('edits', 4)
                ->where('edits.0.slug', 'available-now')
                ->where('edits.0.image', $firstCategoryImage)
                ->where('edits.0.products_count', 2)
                ->has('featuredProducts', 1)
                ->where('featuredProducts.0.id', $featured->id)
                ->where('featuredProductsTitle', 'Most-loved formulas.')
                ->has('concerns', 6),
            );
    }

    public function test_curated_edit_filters_the_live_catalogue(): void
    {
        $featured = $this->product('Most Loved Oil', true);
        $unavailable = $this->product('Daily Wash');
        $unavailable->update(['stock' => 0]);

        $this->get('/shop?edit=available-now')
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('storefront/shop')
                ->where('activeEdit.slug', 'available-now')
                ->where('products.total', 1)
                ->where('products.data.0.id', $featured->id),
            );
    }

    public function test_concern_discovery_uses_structured_product_details(): void
    {
        $hydrating = $this->product('Comfort Oil');
        $hydrating->update([
            'concerns' => ['Dryness'],
            'benefits' => ['Supports lasting moisture'],
        ]);
        $this->product('Aromatic Mist');

        $this->get('/shop?concern=hydration')
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->where('products.total', 1)
                ->where('products.data.0.id', $hydrating->id),
            );
    }

    public function test_product_search_and_concern_filters_include_usage_guidance(): void
    {
        $usageMatched = $this->product('Daily Care Cream');
        $usageMatched->update([
            'usage' => 'Massage into dry skin after bathing for daily moisture.',
        ]);
        $this->product('Aromatic Mist');

        $this->get('/shop?search=bathing')
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->where('products.total', 1)
                ->where('products.data.0.id', $usageMatched->id),
            );

        $this->get('/shop?concern=hydration')
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->where('products.total', 1)
                ->where('products.data.0.id', $usageMatched->id),
            );
    }

    public function test_product_recommendations_prioritize_shared_rituals(): void
    {
        $first = $this->product('Cleansing Oil');
        $companion = $this->product('Finishing Mist');
        $ritual = Ritual::create([
            'name' => 'Daily Layering',
            'slug' => 'daily-layering',
            'description' => 'A coordinated two-step ritual.',
            'is_active' => true,
        ]);
        $ritual->products()->attach([
            $first->id => ['step_order' => 1],
            $companion->id => ['step_order' => 2],
        ]);

        $this->get("/products/{$first->slug}")
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->where('related.0.id', $companion->id)
                ->where('recommendationContext', 'Selected because these formulas share a complete Ellena ritual.'),
            );
    }

    private function product(string $name, bool $featured = false): Product
    {
        $category = Category::firstOrCreate(
            ['slug' => 'body-care'],
            ['name' => 'Body Care', 'is_active' => true],
        );

        return Product::create([
            'category_id' => $category->id,
            'name' => $name,
            'slug' => str($name)->slug().'-'.str()->lower(str()->random(6)),
            'sku' => 'EDIT-'.str()->upper(str()->random(8)),
            'description' => 'A considered everyday formula.',
            'price' => 80,
            'stock' => 12,
            'images' => [],
            'is_featured' => $featured,
            'is_active' => true,
        ]);
    }
}
