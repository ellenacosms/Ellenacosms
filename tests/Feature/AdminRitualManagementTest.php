<?php

namespace Tests\Feature;

use App\Models\Category;
use App\Models\Product;
use App\Models\Ritual;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class AdminRitualManagementTest extends TestCase
{
    use RefreshDatabase;

    private User $admin;

    /** @var list<Product> */
    private array $products;

    protected function setUp(): void
    {
        parent::setUp();

        $this->admin = User::factory()->withTwoFactor()->create(['is_admin' => true]);
        $category = Category::firstOrCreate(
            ['slug' => 'hair-care'],
            ['name' => 'Hair Care', 'is_active' => true],
        );

        $this->products = collect(['Cleanser', 'Treatment', 'Oil'])
            ->map(fn (string $name, int $index) => Product::create([
                'category_id' => $category->id,
                'name' => $name,
                'slug' => str($name)->slug(),
                'sku' => 'RITUAL-'.($index + 1),
                'description' => $name.' description.',
                'price' => 40 + ($index * 10),
                'stock' => 10,
                'images' => [],
                'is_active' => true,
            ]))
            ->all();
    }

    public function test_only_administrators_can_open_the_ritual_manager(): void
    {
        $this->get('/admin/rituals')->assertRedirect('/login');

        $this->actingAs(User::factory()->create())
            ->get('/admin/rituals')
            ->assertRedirect('/dashboard');

        $this->actingAs($this->admin)
            ->get('/admin/rituals')
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('admin/rituals/index')
                ->has('rituals'));

        $this->actingAs($this->admin)
            ->get('/admin/rituals/create')
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('admin/rituals/form')
                ->has('products', 3));
    }

    public function test_admin_can_create_a_ritual_with_an_image_and_ordered_products(): void
    {
        Storage::fake('public');

        $this->actingAs($this->admin)->post('/admin/rituals', [
            'name' => 'Scalp Renewal',
            'eyebrow' => 'Hair ritual · 2 steps',
            'description' => 'A restorative scalp-to-length routine.',
            'steps_text' => "Cleanse the scalp\nSeal the lengths",
            'discount_percent' => 12,
            'sort_order' => 3,
            'ritual_image' => $this->fakeImage('scalp-renewal.png'),
            'is_featured' => true,
            'is_active' => true,
            'products' => [
                [
                    'product_id' => $this->products[1]->id,
                    'instruction' => 'Apply treatment first.',
                ],
                [
                    'product_id' => $this->products[2]->id,
                    'instruction' => 'Finish with oil.',
                ],
            ],
        ])->assertRedirect('/admin/rituals');

        $ritual = Ritual::where('slug', 'scalp-renewal')->firstOrFail();

        $this->assertSame(['Cleanse the scalp', 'Seal the lengths'], $ritual->steps);
        $this->assertTrue($ritual->is_featured);
        $this->assertSame(
            [$this->products[1]->id, $this->products[2]->id],
            $ritual->products()->pluck('products.id')->all(),
        );
        $this->assertDatabaseHas('product_ritual', [
            'ritual_id' => $ritual->id,
            'product_id' => $this->products[1]->id,
            'step_order' => 1,
            'instruction' => 'Apply treatment first.',
        ]);
        Storage::disk('public')->assertExists(
            str($ritual->image)->after('/storage/')->toString(),
        );
    }

    public function test_admin_can_update_and_reorder_a_ritual(): void
    {
        $ritual = Ritual::create([
            'name' => 'Original Ritual',
            'slug' => 'original-ritual',
            'description' => 'Original description.',
            'discount_percent' => 5,
            'sort_order' => 1,
            'is_active' => true,
        ]);
        $ritual->products()->attach([
            $this->products[0]->id => ['step_order' => 1],
            $this->products[1]->id => ['step_order' => 2],
        ]);

        $this->actingAs($this->admin)->put("/admin/rituals/{$ritual->id}", [
            'name' => 'Updated Ritual',
            'eyebrow' => '',
            'description' => 'Updated description.',
            'steps_text' => 'Apply in order.',
            'discount_percent' => 15,
            'sort_order' => 8,
            'existing_image' => '',
            'image_url' => 'https://example.com/ritual.jpg',
            'is_featured' => false,
            'is_active' => false,
            'products' => [
                [
                    'product_id' => $this->products[2]->id,
                    'instruction' => 'Start here.',
                ],
                [
                    'product_id' => $this->products[0]->id,
                    'instruction' => 'Finish here.',
                ],
            ],
        ])->assertRedirect('/admin/rituals');

        $ritual->refresh();

        $this->assertSame('updated-ritual', $ritual->slug);
        $this->assertSame('https://example.com/ritual.jpg', $ritual->image);
        $this->assertFalse($ritual->is_active);
        $this->assertSame(
            [$this->products[2]->id, $this->products[0]->id],
            $ritual->products()->pluck('products.id')->all(),
        );
        $this->assertDatabaseMissing('product_ritual', [
            'ritual_id' => $ritual->id,
            'product_id' => $this->products[1]->id,
        ]);
    }

    public function test_ritual_requires_two_unique_products(): void
    {
        $response = $this->actingAs($this->admin)->post('/admin/rituals', [
            'name' => 'Invalid Ritual',
            'description' => 'This ritual should not be saved.',
            'discount_percent' => 10,
            'sort_order' => 0,
            'is_featured' => false,
            'is_active' => true,
            'products' => [
                ['product_id' => $this->products[0]->id],
                ['product_id' => $this->products[0]->id],
            ],
        ]);

        $response->assertSessionHasErrors('products.1.product_id');
        $this->assertDatabaseMissing('rituals', ['name' => 'Invalid Ritual']);
    }

    public function test_admin_can_delete_a_ritual(): void
    {
        $ritual = Ritual::create([
            'name' => 'Retired Ritual',
            'slug' => 'retired-ritual',
            'description' => 'No longer offered.',
            'discount_percent' => 0,
            'is_active' => false,
        ]);
        $ritual->products()->attach([
            $this->products[0]->id => ['step_order' => 1],
            $this->products[1]->id => ['step_order' => 2],
        ]);

        $this->actingAs($this->admin)
            ->delete("/admin/rituals/{$ritual->id}")
            ->assertRedirect();

        $this->assertDatabaseMissing('rituals', ['id' => $ritual->id]);
        $this->assertDatabaseMissing('product_ritual', ['ritual_id' => $ritual->id]);
    }

    private function fakeImage(string $name): UploadedFile
    {
        return UploadedFile::fake()->createWithContent(
            $name,
            base64_decode('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII='),
        );
    }
}
