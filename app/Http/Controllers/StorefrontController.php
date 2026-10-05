<?php

namespace App\Http\Controllers;

use App\Models\Banner;
use App\Models\BeautyGuide;
use App\Models\Category;
use App\Models\Product;
use App\Models\Ritual;
use App\Services\RecentlyViewedProducts;
use App\Support\StorefrontMerchandising;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class StorefrontController extends Controller
{
    public function home(): Response
    {
        $banners = Banner::currentlyVisible()
            ->orderBy('sort_order')
            ->orderBy('id')
            ->get();

        return Inertia::render('storefront/home', [
            'featured' => Product::available()->withApprovedReviewSummary()->where('is_featured', true)->with('category')->latest()->take(4)->get(),
            'latestProducts' => Product::available()->withApprovedReviewSummary()->with('category')->latest()->take(4)->get(),
            'categories' => Category::where('is_active', true)
                ->withCount(['products' => fn ($query) => $query->available()])
                ->orderBy('name')
                ->get(),
            'heroBanner' => $banners->firstWhere('placement', 'hero'),
            'promotionBanners' => $banners->where('placement', 'promotion')->values(),
            'merchandisingEdits' => $this->merchandisingEdits(),
        ]);
    }

    public function discover(): Response
    {
        $featuredProducts = Product::available()
            ->withApprovedReviewSummary()
            ->with('category')
            ->where('is_featured', true)
            ->latest()
            ->take(4)
            ->get();
        $featuredProductsTitle = 'Most-loved formulas.';
        $featuredProductsEyebrow = 'A trusted starting point';

        if ($featuredProducts->isEmpty()) {
            $featuredProducts = Product::available()
                ->withApprovedReviewSummary()
                ->with('category')
                ->where('stock', '>', 0)
                ->orderByDesc('stock')
                ->latest()
                ->take(4)
                ->get();
            $featuredProductsTitle = 'Ready when you are.';
            $featuredProductsEyebrow = 'Available now';
        }

        return Inertia::render('storefront/discover', [
            'edits' => $this->merchandisingEdits(),
            'concerns' => StorefrontMerchandising::concerns(),
            'featuredProducts' => $featuredProducts->makeHidden(['wholesale_price', 'wholesale_min_qty']),
            'featuredProductsTitle' => $featuredProductsTitle,
            'featuredProductsEyebrow' => $featuredProductsEyebrow,
            'rituals' => Ritual::available()
                ->whereHas('products')
                ->withCount('products')
                ->orderByDesc('is_featured')
                ->orderBy('sort_order')
                ->take(3)
                ->get(['id', 'name', 'slug', 'eyebrow', 'description', 'image', 'is_featured']),
            'guides' => BeautyGuide::published()
                ->orderByDesc('is_featured')
                ->orderBy('sort_order')
                ->take(3)
                ->get(['id', 'title', 'slug', 'category', 'eyebrow', 'excerpt', 'hero_image', 'read_minutes']),
        ]);
    }

    public function finder(): Response
    {
        return Inertia::render('storefront/finder', [
            'products' => Product::available()
                ->select([
                    'id',
                    'category_id',
                    'name',
                    'slug',
                    'sku',
                    'subtitle',
                    'description',
                    'ingredients',
                    'usage',
                    'benefits',
                    'concerns',
                    'ritual_steps',
                    'price',
                    'compare_price',
                    'stock',
                    'images',
                    'is_featured',
                    'is_active',
                ])
                ->withApprovedReviewSummary()
                ->with('category:id,name,slug')
                ->orderByDesc('is_featured')
                ->orderBy('name')
                ->get(),
        ]);
    }

    public function shop(Request $request): Response
    {
        $concern = $request->string('concern')->toString();
        $edit = $request->string('edit')->toString();
        $edits = StorefrontMerchandising::edits();
        $activeEdit = $edits[$edit] ?? null;
        $requestedSort = $request->string('sort')->toString();
        $sort = $edit === 'new-noteworthy' && $requestedSort === ''
            ? 'newest'
            : (in_array($requestedSort, Product::STOREFRONT_SORTS, true)
            ? $requestedSort
            : 'featured');

        $products = Product::available()
            ->withApprovedReviewSummary()
            ->with('category')
            ->when($request->string('category')->isNotEmpty(), fn ($query) => $query->whereHas('category', fn ($category) => $category->where('slug', $request->string('category'))))
            ->when($request->string('search')->isNotEmpty(), fn ($query) => $query->search($request->string('search')->toString()))
            ->when($concern !== '', fn ($query) => StorefrontMerchandising::applyConcern($query, $concern))
            ->when($activeEdit !== null, fn ($query) => StorefrontMerchandising::applyEdit($query, $edit))
            ->sortForStorefront($sort)
            ->paginate(12)
            ->withQueryString();

        $merchandisingEdits = $this->merchandisingEdits();

        return Inertia::render('storefront/shop', [
            'products' => $products,
            'categories' => Category::where('is_active', true)
                ->select(['id', 'name', 'slug', 'description', 'image'])
                ->withCount(['products' => fn ($query) => $query->available()])
                ->get(),
            'filters' => [
                ...$request->only('category', 'search', 'concern', 'edit'),
                'sort' => $sort,
            ],
            'edits' => $merchandisingEdits,
            'activeEdit' => collect($merchandisingEdits)->firstWhere('slug', $edit),
        ]);
    }

    public function product(
        Request $request,
        Product $product,
        RecentlyViewedProducts $recentlyViewedProducts,
    ): Response {
        abort_unless($product->is_active, 404);

        $product->loadAvg([
            'reviews as reviews_avg_rating' => fn ($reviews) => $reviews->where('is_approved', true),
        ], 'rating')->loadCount([
            'reviews as reviews_count' => fn ($reviews) => $reviews->where('is_approved', true),
        ]);

        $recentlyViewed = $recentlyViewedProducts->get($request, 4, $product->id);
        $recentlyViewedProducts->remember($request, $product);

        $canReview = $request->user()?->orders()
            ->reviewEligible()
            ->whereHas('items', fn ($query) => $query->where('product_id', $product->id))
            ->exists() ?? false;

        $ritualIds = $product->rituals()->where('is_active', true)->pluck('rituals.id');
        $guideIds = $product->beautyGuides()->published()->pluck('beauty_guides.id');
        $linkedRituals = $product->rituals()
            ->available()
            ->orderBy('rituals.sort_order')
            ->take(2)
            ->get(['rituals.id', 'rituals.name', 'rituals.slug', 'rituals.description']);
        $linkedGuides = $product->beautyGuides()
            ->published()
            ->take(2)
            ->get(['beauty_guides.id', 'beauty_guides.title', 'beauty_guides.slug', 'beauty_guides.excerpt']);

        $related = Product::available()
            ->withApprovedReviewSummary()
            ->with('category')
            ->whereKeyNot($product->id)
            ->where(function ($recommendations) use ($product, $ritualIds, $guideIds): void {
                $recommendations->where('category_id', $product->category_id);

                if ($ritualIds->isNotEmpty()) {
                    $recommendations->orWhereHas('rituals', fn ($rituals) => $rituals->whereKey($ritualIds));
                }

                if ($guideIds->isNotEmpty()) {
                    $recommendations->orWhereHas('beautyGuides', fn ($guides) => $guides->whereKey($guideIds));
                }
            })
            ->orderByDesc('is_featured')
            ->take(4)
            ->get();

        return Inertia::render('storefront/product', [
            'product' => $product->load('category')->makeHidden(['wholesale_price', 'wholesale_min_qty']),
            'variants' => Product::available()
                ->with('category')
                ->where('category_id', $product->category_id)
                ->where('name', $product->name)
                ->whereKeyNot($product->id)
                ->orderBy('price')
                ->get()
                ->makeHidden(['wholesale_price', 'wholesale_min_qty']),
            'reviews' => $product->reviews()
                ->where('is_approved', true)
                ->latest()
                ->take(8)
                ->get(['id', 'customer_name', 'rating', 'title', 'body', 'is_verified_purchase', 'created_at']),
            'canReview' => $canReview,
            'related' => $related->makeHidden(['wholesale_price', 'wholesale_min_qty']),
            'recommendationContext' => $ritualIds->isNotEmpty()
                ? 'Selected because these formulas share a complete Ellena ritual.'
                : ($guideIds->isNotEmpty()
                    ? 'Selected from the same Beauty Guide recommendations.'
                    : 'Selected to complement the same care category.'),
            'recentlyViewed' => $recentlyViewed,
            'linkedRituals' => $linkedRituals,
            'linkedGuides' => $linkedGuides,
        ]);
    }

    public function searchSuggestions(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'q' => ['nullable', 'string', 'max:80'],
        ]);
        $search = trim((string) ($validated['q'] ?? ''));

        if ($search !== '' && mb_strlen($search) < 2) {
            return response()->json([
                'query' => $search,
                'products' => [],
            ]);
        }

        $products = Product::available()
            ->with('category:id,name,slug')
            ->select([
                'id',
                'category_id',
                'name',
                'slug',
                'subtitle',
                'price',
                'compare_price',
                'stock',
                'images',
                'is_featured',
            ])
            ->when(
                $search !== '',
                fn ($query) => $query
                    ->search($search)
                    ->orderByRaw('CASE WHEN name LIKE ? THEN 0 ELSE 1 END', [$search.'%']),
                fn ($query) => $query->where('is_featured', true),
            )
            ->orderByDesc('is_featured')
            ->orderBy('name')
            ->limit(6)
            ->get();

        return response()->json([
            'query' => $search,
            'products' => $products,
        ]);
    }

    /**
     * @return list<array<string, mixed>>
     */
    private function merchandisingEdits(): array
    {
        $categoryImages = Category::query()
            ->where('is_active', true)
            ->orderBy('name')
            ->pluck('image')
            ->map(fn (mixed $image) => is_string($image) ? $image : '')
            ->values();

        return collect(StorefrontMerchandising::edits())
            ->values()
            ->map(function (array $edit, int $index) use ($categoryImages): array {
                $query = StorefrontMerchandising::applyEdit(Product::available(), $edit['slug']);

                return [
                    ...$edit,
                    'image' => $categoryImages->get($index, ''),
                    'products_count' => $query->count(),
                    'href' => '/shop?edit='.$edit['slug'],
                ];
            })
            ->values()
            ->all();
    }
}
