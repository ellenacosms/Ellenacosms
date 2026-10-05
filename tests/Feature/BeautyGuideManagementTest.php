<?php

namespace Tests\Feature;

use App\Models\BeautyGuide;
use App\Models\Category;
use App\Models\Product;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class BeautyGuideManagementTest extends TestCase
{
    use RefreshDatabase;

    public function test_storefront_only_lists_currently_published_guides(): void
    {
        $published = $this->guide(['title' => 'Published Guide', 'slug' => 'published-guide']);
        $this->guide(['title' => 'Draft Guide', 'slug' => 'draft-guide', 'is_published' => false]);
        $this->guide(['title' => 'Scheduled Guide', 'slug' => 'scheduled-guide', 'published_at' => now()->addDay()]);

        $this->get('/beauty-guide')
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('storefront/beauty-guide')
                ->has('guides', 1)
                ->where('guides.0.id', $published->id));
    }

    public function test_published_guide_shows_structured_content_and_available_products(): void
    {
        $guide = $this->guide();
        $product = $this->product();
        $guide->products()->attach($product->id, ['sort_order' => 1, 'note' => 'Best starting point.']);

        $this->get("/beauty-guide/{$guide->slug}")
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('storefront/beauty-guide-show')
                ->where('guide.id', $guide->id)
                ->where('guide.steps.0', 'Begin gently.')
                ->where('guide.faqs.0.question', 'How often?')
                ->where('guide.products.0.id', $product->id)
                ->missing('guide.products.0.wholesale_price'));
    }

    public function test_published_guides_are_included_in_the_sitemap(): void
    {
        $published = $this->guide(['slug' => 'visible-guide']);
        $this->guide([
            'title' => 'Future Guide',
            'slug' => 'future-guide',
            'published_at' => now()->addDay(),
        ]);

        $this->get('/sitemap.xml')
            ->assertOk()
            ->assertSee(route('beauty-guide.show', $published), escape: false)
            ->assertDontSee('/beauty-guide/future-guide', escape: false);
    }

    public function test_admin_can_create_a_scheduled_shoppable_guide(): void
    {
        $admin = User::factory()->withTwoFactor()->create(['is_admin' => true]);
        $product = $this->product();

        $this->actingAs($admin)->post('/admin/beauty-guides', [
            'title' => 'Layering Hair Care',
            'category' => 'hair-care',
            'eyebrow' => 'The crown ritual',
            'excerpt' => 'Learn how to layer hair care.',
            'body' => 'Begin with hydration and finish with considered nourishment.',
            'sections_text' => 'Start light | Use lighter textures first.',
            'steps_text' => "Hydrate first\nSeal the lengths",
            'faqs_text' => 'How often? | Begin weekly and adjust.',
            'seo_title' => 'How to Layer Hair Care',
            'seo_description' => 'A practical guide to layering Ellena hair care.',
            'read_minutes' => 5,
            'sort_order' => 2,
            'published_at' => now()->addDay()->format('Y-m-d H:i:s'),
            'is_featured' => true,
            'is_published' => true,
            'existing_image' => '',
            'image_url' => 'https://example.com/hair-guide.jpg',
            'products' => [['product_id' => $product->id, 'note' => 'Start here.']],
        ])->assertRedirect('/admin/beauty-guides');

        $guide = BeautyGuide::where('slug', 'layering-hair-care')->firstOrFail();
        $this->assertSame('Start light', $guide->sections[0]['heading']);
        $this->assertSame(['Hydrate first', 'Seal the lengths'], $guide->steps);
        $this->assertSame('How often?', $guide->faqs[0]['question']);
        $this->assertDatabaseHas('beauty_guide_product', [
            'beauty_guide_id' => $guide->id,
            'product_id' => $product->id,
            'sort_order' => 1,
            'note' => 'Start here.',
        ]);
    }

    private function guide(array $overrides = []): BeautyGuide
    {
        return BeautyGuide::create([
            'title' => 'Moisture Guide',
            'slug' => 'moisture-guide',
            'category' => 'hair-care',
            'excerpt' => 'A useful guide to moisture.',
            'body' => 'A considered opening for this article.',
            'sections' => [['heading' => 'Start here', 'body' => 'Use a gentle approach.']],
            'steps' => ['Begin gently.'],
            'faqs' => [['question' => 'How often?', 'answer' => 'Begin weekly.']],
            'is_published' => true,
            'published_at' => now()->subHour(),
            ...$overrides,
        ]);
    }

    private function product(): Product
    {
        $category = Category::firstOrCreate(
            ['slug' => 'hair-care'],
            ['name' => 'Hair Care', 'is_active' => true],
        );

        return Product::create([
            'category_id' => $category->id,
            'name' => 'Guide Hair Oil',
            'slug' => 'guide-hair-oil',
            'sku' => 'GUIDE-001',
            'description' => 'A nourishing oil.',
            'price' => 45,
            'stock' => 5,
            'images' => [],
            'is_active' => true,
        ]);
    }
}
