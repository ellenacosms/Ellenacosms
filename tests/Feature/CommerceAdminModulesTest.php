<?php

namespace Tests\Feature;

use App\Models\Banner;
use App\Models\Category;
use App\Models\ContactSubmission;
use App\Models\Discount;
use App\Models\Product;
use App\Models\Review;
use App\Models\StoreSetting;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class CommerceAdminModulesTest extends TestCase
{
    use RefreshDatabase;

    private User $admin;

    private Product $product;

    protected function setUp(): void
    {
        parent::setUp();

        $this->admin = User::factory()->withTwoFactor()->create(['is_admin' => true]);
        $category = Category::create([
            'name' => 'Skin Care',
            'slug' => 'skin-care',
            'is_active' => true,
        ]);
        $this->product = Product::create([
            'category_id' => $category->id,
            'name' => 'Test Serum',
            'slug' => 'test-serum',
            'sku' => 'SERUM-001',
            'description' => 'A test serum.',
            'price' => 80,
            'stock' => 4,
            'images' => [],
            'is_active' => true,
        ]);
    }

    public function test_admin_can_open_every_commerce_module(): void
    {
        $customer = User::factory()->create();
        $submission = ContactSubmission::create([
            'name' => 'Amina Customer',
            'email' => 'amina@example.com',
            'topic' => 'wholesale',
            'preferred_contact_method' => 'email',
            'message' => 'Wholesale enquiry for the Ellena team.',
        ]);

        $pages = [
            '/admin/products' => 'admin/products/index',
            '/admin/products/create' => 'admin/products/form',
            '/admin/categories' => 'admin/categories',
            '/admin/inventory' => 'admin/inventory',
            '/admin/orders' => 'admin/orders/index',
            '/admin/customers' => 'admin/customers/index',
            "/admin/customers/{$customer->id}" => 'admin/customers/show',
            '/admin/discounts' => 'admin/discounts',
            '/admin/banners' => 'admin/banners',
            '/admin/reviews' => 'admin/reviews',
            '/admin/contact-submissions' => 'admin/contact-submissions',
            "/admin/contact-submissions/{$submission->id}" => 'admin/contact-submission-show',
            '/admin/newsletter' => 'admin/newsletter-subscribers',
            '/admin/settings' => 'admin/settings',
        ];

        foreach ($pages as $url => $component) {
            $this->actingAs($this->admin)
                ->get($url)
                ->assertOk()
                ->assertInertia(fn ($page) => $page->component($component));
        }
    }

    public function test_admin_can_upload_product_images(): void
    {
        Storage::fake('public');

        $this->actingAs($this->admin)->post('/admin/products', [
            'category_id' => $this->product->category_id,
            'name' => 'Uploaded Cream',
            'description' => 'A cream with uploaded photography.',
            'price' => 95,
            'stock' => 12,
            'product_images' => [
                $this->fakeImage('cream-cover.png'),
                $this->fakeImage('cream-detail.png'),
            ],
            'is_featured' => true,
            'is_active' => true,
        ])->assertRedirect('/admin/products');

        $product = Product::where('name', 'Uploaded Cream')->firstOrFail();
        $this->assertCount(2, $product->images);
        $this->assertMatchesRegularExpression('/^EL-SKI-[A-Z0-9]{8}$/', $product->sku);

        foreach ($product->images as $image) {
            Storage::disk('public')->assertExists(str($image)->after('/storage/')->toString());
        }
    }

    public function test_admin_can_edit_a_category_and_hide_it_from_the_storefront(): void
    {
        $category = Category::where('slug', 'skin-care')->firstOrFail();

        $this->actingAs($this->admin)
            ->from('/admin/categories')
            ->put("/admin/categories/{$category->id}", [
                'name' => 'Daily Skin Care',
                'description' => 'Everyday care for healthy-looking skin.',
                'image' => '/images/campaign/daily-skin-care.jpg',
                'is_active' => false,
            ])
            ->assertRedirect('/admin/categories');

        $this->assertDatabaseHas('categories', [
            'id' => $category->id,
            'name' => 'Daily Skin Care',
            'slug' => 'daily-skin-care',
            'image' => '/images/campaign/daily-skin-care.jpg',
            'is_active' => false,
        ]);
    }

    public function test_admin_can_export_products_as_csv(): void
    {
        $response = $this->actingAs($this->admin)
            ->get('/admin/products/export')
            ->assertOk()
            ->assertHeader('content-type', 'text/csv; charset=UTF-8');

        $csv = $response->streamedContent();

        $this->assertStringContainsString('category_slug', $csv);
        $this->assertStringContainsString('SERUM-001', $csv);
        $this->assertStringContainsString('Test Serum', $csv);
    }

    public function test_admin_can_bulk_create_and_update_products_by_sku(): void
    {
        $csv = implode("\n", [
            'sku,name,category_slug,subtitle,description,ingredients,usage,price,compare_price,stock,image_urls,is_featured,is_active',
            'SERUM-001,Updated Test Serum,skin-care,,Updated description,,,89.00,,15,https://example.com/serum.jpg,1,1',
            ',Bulk Cream,skin-care,Daily moisturizer,A bulk-created cream,,,65.00,75.00,30,https://example.com/cream.jpg|https://example.com/detail.jpg,0,1',
            'BAD-100,Invalid Product,missing-category,,Invalid category,,,20.00,,2,,0,1',
        ]);

        $this->actingAs($this->admin)
            ->post('/admin/products/import', [
                'file' => UploadedFile::fake()->createWithContent('products.csv', $csv),
            ])
            ->assertRedirect('/admin/products')
            ->assertSessionHas('import_result.created', 1)
            ->assertSessionHas('import_result.updated', 1)
            ->assertSessionHas('import_result.skipped', 1);

        $this->assertDatabaseHas('products', [
            'sku' => 'SERUM-001',
            'name' => 'Updated Test Serum',
            'stock' => 15,
        ]);
        $this->assertDatabaseHas('products', [
            'name' => 'Bulk Cream',
            'stock' => 30,
        ]);
        $bulkProduct = Product::where('name', 'Bulk Cream')->firstOrFail();
        $this->assertMatchesRegularExpression('/^EL-SKI-[A-Z0-9]{8}$/', $bulkProduct->sku);
    }

    public function test_admin_import_maps_best_for_to_product_concerns(): void
    {
        $csv = implode("\n", [
            'sku,name,category_slug,subtitle,description,ingredients,usage,best for,price,compare_price,stock,image_urls,is_featured,is_active',
            'SERUM-001,Updated Test Serum,skin-care,,Updated description,,,Dryness,89.00,,15,,1,1',
        ]);

        $this->actingAs($this->admin)
            ->post('/admin/products/import', [
                'file' => UploadedFile::fake()->createWithContent('products.csv', $csv),
            ])
            ->assertRedirect('/admin/products')
            ->assertSessionHas('import_result.updated', 1);

        $this->assertSame(
            ['Dryness'],
            Product::where('sku', 'SERUM-001')->firstOrFail()->concerns,
        );
    }

    public function test_admin_can_upload_and_manage_an_ad_banner(): void
    {
        Storage::fake('public');

        $this->actingAs($this->admin)->post('/admin/banners', [
            'name' => 'Summer launch',
            'placement' => 'hero',
            'eyebrow' => 'New season',
            'title' => 'Summer luminosity',
            'subtitle' => 'Discover the new collection.',
            'image_file' => $this->fakeImage('summer.png'),
            'cta_label' => 'Shop now',
            'cta_url' => '/shop',
            'text_position' => 'left',
            'overlay_opacity' => 20,
            'sort_order' => 1,
            'is_active' => true,
        ])->assertRedirect();

        $banner = Banner::firstOrFail();
        Storage::disk('public')->assertExists(str($banner->image)->after('/storage/')->toString());

        $this->get('/')
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('storefront/home')
                ->where('heroBanner.id', $banner->id));
    }

    public function test_admin_can_adjust_inventory(): void
    {
        $this->actingAs($this->admin)
            ->patch("/admin/inventory/{$this->product->id}", ['stock' => 24])
            ->assertRedirect();

        $this->assertSame(24, $this->product->fresh()->stock);
    }

    public function test_admin_can_toggle_a_product_as_featured(): void
    {
        $this->assertFalse((bool) $this->product->is_featured);

        $this->actingAs($this->admin)
            ->patch("/admin/products/{$this->product->id}/featured", [
                'is_featured' => true,
            ])
            ->assertRedirect();

        $this->assertTrue($this->product->fresh()->is_featured);

        $this->get('/')
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->where('featured.0.id', $this->product->id));
    }

    public function test_admin_can_create_and_toggle_a_discount(): void
    {
        $this->actingAs($this->admin)->post('/admin/discounts', [
            'name' => 'Launch offer',
            'code' => 'launch20',
            'type' => 'percentage',
            'value' => 20,
            'minimum_order' => 100,
            'usage_limit' => 50,
            'starts_at' => null,
            'ends_at' => null,
            'is_active' => true,
        ])->assertRedirect();

        $discount = Discount::firstOrFail();
        $this->assertSame('LAUNCH20', $discount->code);

        $this->actingAs($this->admin)->put("/admin/discounts/{$discount->id}", [
            'name' => $discount->name,
            'code' => $discount->code,
            'type' => $discount->type,
            'value' => $discount->value,
            'minimum_order' => $discount->minimum_order,
            'usage_limit' => $discount->usage_limit,
            'starts_at' => null,
            'ends_at' => null,
            'is_active' => false,
        ])->assertRedirect();

        $this->assertFalse($discount->fresh()->is_active);
    }

    public function test_admin_can_moderate_reviews_and_save_store_settings(): void
    {
        $review = Review::create([
            'product_id' => $this->product->id,
            'customer_name' => 'Reviewer',
            'email' => 'reviewer@example.com',
            'rating' => 5,
            'body' => 'Excellent.',
            'is_approved' => false,
        ]);

        $this->actingAs($this->admin)
            ->put("/admin/reviews/{$review->id}", ['is_approved' => true])
            ->assertRedirect();

        $this->assertTrue($review->fresh()->is_approved);

        $this->actingAs($this->admin)->put('/admin/settings', [
            'store_name' => 'ELLENA',
            'support_email' => 'support@example.com',
            'currency' => 'UGX',
            'free_shipping_threshold' => 150,
            'low_stock_threshold' => 10,
            'order_prefix' => 'ELN',
        ])->assertRedirect();

        $this->assertSame(
            'support@example.com',
            StoreSetting::where('key', 'support_email')->value('value'),
        );
    }

    private function fakeImage(string $name): UploadedFile
    {
        return UploadedFile::fake()->createWithContent(
            $name,
            base64_decode('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII='),
        );
    }
}
