<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Category;
use App\Models\Product;
use App\Support\ProductSku;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;

class ProductController extends Controller
{
    public function index(Request $request): Response
    {
        return Inertia::render('admin/products/index', [
            'products' => Product::with('category')
                ->when($request->string('search')->isNotEmpty(), fn ($query) => $query->where('name', 'like', '%'.$request->string('search').'%'))
                ->latest()->paginate(15)->withQueryString(),
            'search' => $request->string('search'),
            'importResult' => $request->session()->get('import_result'),
        ]);
    }

    public function create(): Response
    {
        return Inertia::render('admin/products/form', [
            'product' => null,
            'categories' => Category::orderBy('name')->get(),
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        Product::create($this->validated($request));

        return to_route('admin.products.index')->with('success', 'Product created.');
    }

    public function edit(Product $product): Response
    {
        return Inertia::render('admin/products/form', [
            'product' => $product,
            'categories' => Category::orderBy('name')->get(),
        ]);
    }

    public function update(Request $request, Product $product): RedirectResponse
    {
        $data = $this->validated($request, $product);
        $removedImages = array_diff($product->images ?? [], $data['images']);
        $product->update($data);

        foreach ($removedImages as $image) {
            $this->deleteManagedUpload($image);
        }

        return to_route('admin.products.index')->with('success', 'Product updated.');
    }

    public function destroy(Product $product): RedirectResponse
    {
        foreach ($product->images ?? [] as $image) {
            $this->deleteManagedUpload($image);
        }

        $product->delete();

        return back()->with('success', 'Product deleted.');
    }

    public function featured(Request $request, Product $product): RedirectResponse
    {
        $data = $request->validate([
            'is_featured' => ['required', 'boolean'],
        ]);

        $product->update($data);

        return back()->with('success', $product->is_featured
            ? 'Product added to the featured collection.'
            : 'Product removed from the featured collection.');
    }

    /**
     * @return array<string, mixed>
     */
    private function validated(Request $request, ?Product $product = null): array
    {
        $data = $request->validate([
            'category_id' => ['required', 'exists:categories,id'],
            'name' => ['required', 'string', 'max:190'],
            'subtitle' => ['nullable', 'string', 'max:190'],
            'description' => ['required', 'string'],
            'ingredients' => ['nullable', 'string'],
            'usage' => ['nullable', 'string'],
            'benefits_text' => ['nullable', 'string', 'max:2000'],
            'concerns_text' => ['nullable', 'string', 'max:2000'],
            'ritual_steps_text' => ['nullable', 'string', 'max:3000'],
            'price' => ['required', 'numeric', 'min:0'],
            'compare_price' => ['nullable', 'numeric', 'min:0', 'gte:price'],
            'stock' => ['required', 'integer', 'min:0'],
            'images_text' => ['nullable', 'string'],
            'existing_images' => ['nullable', 'array', 'max:12'],
            'existing_images.*' => ['string', 'max:2048'],
            'product_images' => ['nullable', 'array', 'max:8'],
            'product_images.*' => ['image', 'mimes:jpg,jpeg,png,webp,avif', 'max:8192'],
            'is_featured' => ['boolean'],
            'is_active' => ['boolean'],
        ]);

        $data['slug'] = $this->uniqueSlug($data['name'], $product);
        if (! $product) {
            $data['sku'] = ProductSku::generate((int) $data['category_id']);
        }
        $data['benefits'] = $this->lineList($data['benefits_text'] ?? '', 3);
        $data['concerns'] = $this->lineList($data['concerns_text'] ?? '', 6);
        $data['ritual_steps'] = $this->lineList($data['ritual_steps_text'] ?? '', 4);
        $imageLines = preg_split('/\r\n|\r|\n/', $data['images_text'] ?? '') ?: [];
        $uploadedImages = collect($request->file('product_images', []))
            ->filter(fn (mixed $file) => $file instanceof UploadedFile)
            ->map(fn (UploadedFile $file) => $this->storeUpload($file))
            ->all();

        $data['images'] = collect($this->imageList($data['existing_images'] ?? null))
            ->merge(collect($imageLines)->map(fn (string $url) => trim($url))->filter())
            ->merge($uploadedImages)
            ->unique()
            ->take(12)
            ->values()
            ->all();

        unset(
            $data['benefits_text'],
            $data['concerns_text'],
            $data['ritual_steps_text'],
            $data['images_text'],
            $data['existing_images'],
            $data['product_images'],
        );

        return $data;
    }

    /**
     * @return list<string>
     */
    private function imageList(mixed $value): array
    {
        if (! is_array($value)) {
            return [];
        }

        $images = [];

        foreach ($value as $image) {
            if (is_string($image) && $image !== '') {
                $images[] = $image;
            }
        }

        return $images;
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

    private function uniqueSlug(string $name, ?Product $product = null): string
    {
        $base = Str::slug($name) ?: 'product';
        $slug = $base;
        $suffix = 2;

        while (Product::where('slug', $slug)
            ->when($product, fn ($query) => $query->whereKeyNot($product->getKey()))
            ->exists()) {
            $slug = $base.'-'.$suffix++;
        }

        return $slug;
    }

    private function storeUpload(UploadedFile $file): string
    {
        $disk = (string) config('filesystems.media_disk', 'public');
        $path = $file->store('products', $disk);

        abort_if($path === false, 500, 'The product image could not be stored.');

        return Storage::disk($disk)->url($path);
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
