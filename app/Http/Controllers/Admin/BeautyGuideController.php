<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\BeautyGuide;
use App\Models\Product;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class BeautyGuideController extends Controller
{
    public function index(): Response
    {
        return Inertia::render('admin/beauty-guides/index', [
            'guides' => BeautyGuide::withCount('products')
                ->orderByDesc('is_featured')
                ->orderBy('sort_order')
                ->orderByDesc('updated_at')
                ->get()
                ->map(fn (BeautyGuide $guide) => [
                    ...$guide->toArray(),
                    'category_label' => $guide->category_label,
                ]),
        ]);
    }

    public function create(): Response
    {
        return Inertia::render('admin/beauty-guides/form', [
            'guide' => null,
            'categories' => BeautyGuide::CATEGORIES,
            'products' => $this->products(),
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $data = $this->validated($request);
        $image = $this->resolveImage($request, $data);

        DB::transaction(function () use ($data, $image): void {
            $guide = BeautyGuide::create($this->attributes($data, $image));
            $guide->products()->sync($this->productSync($data['products'] ?? []));
        });

        return to_route('admin.beauty-guides.index')->with('success', 'Beauty guide created.');
    }

    public function edit(BeautyGuide $beautyGuide): Response
    {
        $beautyGuide->load('products');

        return Inertia::render('admin/beauty-guides/form', [
            'guide' => [
                ...$beautyGuide->toArray(),
                'sections_text' => $this->pairsToText($beautyGuide->sections ?? [], 'heading', 'body'),
                'steps_text' => collect($beautyGuide->steps ?? [])->implode("\n"),
                'faqs_text' => $this->pairsToText($beautyGuide->faqs ?? [], 'question', 'answer'),
            ],
            'categories' => BeautyGuide::CATEGORIES,
            'products' => $this->products(),
        ]);
    }

    public function update(Request $request, BeautyGuide $beautyGuide): RedirectResponse
    {
        $data = $this->validated($request);
        $previousImage = $beautyGuide->hero_image;
        $image = $this->resolveImage($request, $data);

        DB::transaction(function () use ($beautyGuide, $data, $image): void {
            $beautyGuide->update($this->attributes($data, $image, $beautyGuide));
            $beautyGuide->products()->sync($this->productSync($data['products'] ?? []));
        });

        if ($previousImage && $previousImage !== $image) {
            $this->deleteManagedUpload($previousImage);
        }

        return to_route('admin.beauty-guides.index')->with('success', 'Beauty guide updated.');
    }

    public function destroy(BeautyGuide $beautyGuide): RedirectResponse
    {
        $image = $beautyGuide->hero_image;
        $beautyGuide->delete();

        if ($image) {
            $this->deleteManagedUpload($image);
        }

        return back()->with('success', 'Beauty guide deleted.');
    }

    private function validated(Request $request): array
    {
        return $request->validate([
            'title' => ['required', 'string', 'max:190'],
            'category' => ['required', Rule::in(array_keys(BeautyGuide::CATEGORIES))],
            'eyebrow' => ['nullable', 'string', 'max:190'],
            'excerpt' => ['required', 'string', 'max:600'],
            'body' => ['required', 'string', 'max:20000'],
            'sections_text' => ['nullable', 'string', 'max:20000'],
            'steps_text' => ['nullable', 'string', 'max:8000'],
            'faqs_text' => ['nullable', 'string', 'max:12000'],
            'seo_title' => ['nullable', 'string', 'max:190'],
            'seo_description' => ['nullable', 'string', 'max:320'],
            'read_minutes' => ['required', 'integer', 'min:1', 'max:60'],
            'sort_order' => ['required', 'integer', 'min:0', 'max:65535'],
            'published_at' => ['nullable', 'date'],
            'is_featured' => ['required', 'boolean'],
            'is_published' => ['required', 'boolean'],
            'existing_image' => ['nullable', 'string', 'max:2048'],
            'image_url' => ['nullable', 'url:http,https', 'max:2048'],
            'guide_image' => ['nullable', 'image', 'mimes:jpg,jpeg,png,webp,avif', 'max:8192'],
            'products' => ['nullable', 'array', 'max:8'],
            'products.*.product_id' => ['required', 'integer', 'distinct', 'exists:products,id'],
            'products.*.note' => ['nullable', 'string', 'max:255'],
        ]);
    }

    private function attributes(array $data, ?string $image, ?BeautyGuide $guide = null): array
    {
        return [
            'title' => $data['title'],
            'slug' => $this->uniqueSlug($data['title'], $guide),
            'category' => $data['category'],
            'eyebrow' => $data['eyebrow'] ?: null,
            'excerpt' => $data['excerpt'],
            'body' => $data['body'],
            'hero_image' => $image,
            'sections' => $this->parsePairs($data['sections_text'] ?? '', 'heading', 'body', 12),
            'steps' => $this->lineList($data['steps_text'] ?? '', 12),
            'faqs' => $this->parsePairs($data['faqs_text'] ?? '', 'question', 'answer', 12),
            'seo_title' => $data['seo_title'] ?: null,
            'seo_description' => $data['seo_description'] ?: null,
            'read_minutes' => $data['read_minutes'],
            'sort_order' => $data['sort_order'],
            'is_featured' => $data['is_featured'],
            'is_published' => $data['is_published'],
            'published_at' => $data['published_at'] ?: null,
        ];
    }

    private function productSync(array $products): array
    {
        return collect($products)->values()->mapWithKeys(fn (array $product, int $index) => [
            (int) $product['product_id'] => [
                'sort_order' => $index + 1,
                'note' => filled($product['note'] ?? null) ? trim((string) $product['note']) : null,
            ],
        ])->all();
    }

    private function products(): array
    {
        return Product::with('category:id,name')->orderBy('name')
            ->get(['id', 'category_id', 'name', 'slug', 'sku', 'stock', 'images', 'is_active'])
            ->all();
    }

    private function lineList(string $value, int $limit): array
    {
        return collect(preg_split('/\r\n|\r|\n/', $value) ?: [])
            ->map(fn (string $line) => trim($line))->filter()->unique()->take($limit)->values()->all();
    }

    private function parsePairs(string $value, string $first, string $second, int $limit): array
    {
        return collect(preg_split('/\r\n|\r|\n/', $value) ?: [])
            ->map(function (string $line) use ($first, $second): ?array {
                [$left, $right] = array_pad(explode('|', $line, 2), 2, '');
                $left = trim($left);
                $right = trim($right);

                return $left !== '' && $right !== '' ? [$first => $left, $second => $right] : null;
            })->filter()->take($limit)->values()->all();
    }

    private function pairsToText(array $pairs, string $first, string $second): string
    {
        return collect($pairs)->map(fn (array $pair) => ($pair[$first] ?? '').' | '.($pair[$second] ?? ''))->implode("\n");
    }

    private function resolveImage(Request $request, array $data): ?string
    {
        $file = $request->file('guide_image');
        if ($file instanceof UploadedFile) {
            $disk = (string) config('filesystems.media_disk', 'public');
            $path = $file->store('beauty-guides', $disk);
            abort_if($path === false, 500, 'The guide image could not be stored.');

            return Storage::disk($disk)->url($path);
        }

        return $data['image_url'] ?: ($data['existing_image'] ?: null);
    }

    private function uniqueSlug(string $title, ?BeautyGuide $guide = null): string
    {
        $base = Str::slug($title) ?: 'beauty-guide';
        $slug = $base;
        $suffix = 2;
        while (BeautyGuide::where('slug', $slug)->when($guide, fn ($query) => $query->whereKeyNot($guide->getKey()))->exists()) {
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
