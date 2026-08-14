<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Product;
use App\Models\Ritual;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;

class RitualController extends Controller
{
    public function index(): Response
    {
        return Inertia::render('admin/rituals/index', [
            'rituals' => Ritual::with('products:id,name,slug,images')
                ->withCount('products')
                ->orderBy('sort_order')
                ->orderBy('name')
                ->get(),
        ]);
    }

    public function create(): Response
    {
        return Inertia::render('admin/rituals/form', [
            'ritual' => null,
            'products' => $this->products(),
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $data = $this->validated($request);
        $image = $this->resolveImage($request, $data);

        DB::transaction(function () use ($data, $image): void {
            $ritual = Ritual::create($this->attributes($data, $image));
            $ritual->products()->sync($this->productSync($data['products']));
        });

        return to_route('admin.rituals.index')->with('success', 'Ritual created.');
    }

    public function edit(Ritual $ritual): Response
    {
        $ritual->load('products');

        return Inertia::render('admin/rituals/form', [
            'ritual' => $ritual,
            'products' => $this->products(),
        ]);
    }

    public function update(Request $request, Ritual $ritual): RedirectResponse
    {
        $data = $this->validated($request);
        $previousImage = $ritual->image;
        $image = $this->resolveImage($request, $data);

        DB::transaction(function () use ($ritual, $data, $image): void {
            $ritual->update($this->attributes($data, $image, $ritual));
            $ritual->products()->sync($this->productSync($data['products']));
        });

        if ($previousImage && $previousImage !== $image) {
            $this->deleteManagedUpload($previousImage);
        }

        return to_route('admin.rituals.index')->with('success', 'Ritual updated.');
    }

    public function destroy(Ritual $ritual): RedirectResponse
    {
        $image = $ritual->image;
        $ritual->delete();

        if ($image) {
            $this->deleteManagedUpload($image);
        }

        return back()->with('success', 'Ritual deleted.');
    }

    /**
     * @return array<string, mixed>
     */
    private function validated(Request $request): array
    {
        return $request->validate([
            'name' => ['required', 'string', 'max:190'],
            'eyebrow' => ['nullable', 'string', 'max:190'],
            'description' => ['required', 'string', 'max:3000'],
            'steps_text' => ['nullable', 'string', 'max:3000'],
            'discount_percent' => ['required', 'numeric', 'min:0', 'max:50'],
            'sort_order' => ['required', 'integer', 'min:0', 'max:65535'],
            'existing_image' => ['nullable', 'string', 'max:2048'],
            'image_url' => ['nullable', 'url:http,https', 'max:2048'],
            'ritual_image' => ['nullable', 'image', 'mimes:jpg,jpeg,png,webp,avif', 'max:8192'],
            'is_featured' => ['required', 'boolean'],
            'is_active' => ['required', 'boolean'],
            'products' => ['required', 'array', 'min:2', 'max:8'],
            'products.*.product_id' => ['required', 'integer', 'distinct', 'exists:products,id'],
            'products.*.instruction' => ['nullable', 'string', 'max:255'],
        ]);
    }

    /**
     * @param  array<string, mixed>  $data
     * @return array<string, mixed>
     */
    private function attributes(array $data, ?string $image, ?Ritual $ritual = null): array
    {
        return [
            'name' => $data['name'],
            'slug' => $this->uniqueSlug($data['name'], $ritual),
            'eyebrow' => $data['eyebrow'] ?: null,
            'description' => $data['description'],
            'image' => $image,
            'discount_percent' => $data['discount_percent'],
            'steps' => $this->lineList($data['steps_text'] ?? '', 8),
            'sort_order' => $data['sort_order'],
            'is_featured' => $data['is_featured'],
            'is_active' => $data['is_active'],
        ];
    }

    /**
     * @param  array<int, array{product_id: int, instruction?: string|null}>  $products
     * @return array<int, array{step_order: int, instruction: string|null}>
     */
    private function productSync(array $products): array
    {
        return collect($products)
            ->values()
            ->mapWithKeys(fn (array $product, int $index) => [
                (int) $product['product_id'] => [
                    'step_order' => $index + 1,
                    'instruction' => filled($product['instruction'] ?? null)
                        ? trim((string) $product['instruction'])
                        : null,
                ],
            ])
            ->all();
    }

    /**
     * @return list<Product>
     */
    private function products(): array
    {
        return Product::with('category:id,name')
            ->orderBy('name')
            ->get(['id', 'category_id', 'name', 'slug', 'sku', 'stock', 'images', 'is_active'])
            ->all();
    }

    /**
     * @return list<string>
     */
    private function lineList(string $value, int $limit): array
    {
        return collect(preg_split('/\r\n|\r|\n/', $value) ?: [])
            ->map(fn (string $line) => trim($line))
            ->filter()
            ->unique()
            ->take($limit)
            ->values()
            ->all();
    }

    /**
     * @param  array<string, mixed>  $data
     */
    private function resolveImage(Request $request, array $data): ?string
    {
        $file = $request->file('ritual_image');

        if ($file instanceof UploadedFile) {
            $disk = (string) config('filesystems.media_disk', 'public');
            $path = $file->store('rituals', $disk);

            abort_if($path === false, 500, 'The ritual image could not be stored.');

            return Storage::disk($disk)->url($path);
        }

        return $data['image_url'] ?: ($data['existing_image'] ?: null);
    }

    private function uniqueSlug(string $name, ?Ritual $ritual = null): string
    {
        $base = Str::slug($name) ?: 'ritual';
        $slug = $base;
        $suffix = 2;

        while (Ritual::where('slug', $slug)
            ->when($ritual, fn ($query) => $query->whereKeyNot($ritual->getKey()))
            ->exists()) {
            $slug = $base.'-'.$suffix++;
        }

        return $slug;
    }

    private function deleteManagedUpload(string $url): void
    {
        $disk = (string) config('filesystems.media_disk', 'public');
        $prefix = rtrim(Storage::disk($disk)->url(''), '/').'/';

        if (str_starts_with($url, $prefix)) {
            Storage::disk($disk)->delete(substr($url, strlen($prefix)));
        }
    }
}
