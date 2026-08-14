<?php

namespace App\Http\Controllers;

use App\Models\Banner;
use App\Models\Category;
use App\Models\Product;
use App\Services\RecentlyViewedProducts;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class StorefrontController extends Controller
{
    /**
     * @var array<string, list<string>>
     */
    private const CONCERN_TERMS = [
        'scalp-care' => ['scalp', 'root', 'rosemary'],
        'strength-repair' => ['strong', 'repair', 'restor', 'damage', 'ceramide', 'baobab'],
        'hydration' => ['hydrat', 'hyaluronic', 'moisture'],
        'softness' => ['soft', 'smooth', 'supple'],
        'cleansing' => ['clean', 'polish', 'exfoliat'],
        'aromatic-care' => ['mist', 'sandalwood', 'aromatic', 'bergamot'],
        'evening-ritual' => ['night', 'midnight', 'evening', 'overnight', 'sandalwood'],
        'layering' => ['ritual', 'layer', 'mist', 'oil'],
    ];

    public function home(): Response
    {
        $banners = Banner::currentlyVisible()
            ->orderBy('sort_order')
            ->orderBy('id')
            ->get();

        return Inertia::render('storefront/home', [
            'featured' => Product::available()->withApprovedReviewSummary()->where('is_featured', true)->with('category')->latest()->take(4)->get(),
            'latestProducts' => Product::available()->withApprovedReviewSummary()->with('category')->latest()->take(4)->get(),
            'categories' => Category::where('is_active', true)->withCount(['products' => fn ($query) => $query->available()])->get(),
            'heroBanner' => $banners->firstWhere('placement', 'hero'),
            'promotionBanners' => $banners->where('placement', 'promotion')->values(),
        ]);
    }

    public function shop(Request $request): Response
    {
        $concern = $request->string('concern')->toString();
        $concernTerms = self::CONCERN_TERMS[$concern] ?? [];
        $requestedSort = $request->string('sort')->toString();
        $sort = in_array($requestedSort, Product::STOREFRONT_SORTS, true)
            ? $requestedSort
            : 'featured';

        $products = Product::available()
            ->withApprovedReviewSummary()
            ->with('category')
            ->when($request->string('category')->isNotEmpty(), fn ($query) => $query->whereHas('category', fn ($category) => $category->where('slug', $request->string('category'))))
            ->when($request->string('search')->isNotEmpty(), fn ($query) => $query->search($request->string('search')->toString()))
            ->when($concernTerms !== [], fn ($query) => $query->where(function ($search) use ($concernTerms): void {
                foreach ($concernTerms as $term) {
                    $search
                        ->orWhere('name', 'like', "%{$term}%")
                        ->orWhere('subtitle', 'like', "%{$term}%")
                        ->orWhere('description', 'like', "%{$term}%")
                        ->orWhere('ingredients', 'like', "%{$term}%");
                }
            }))
            ->sortForStorefront($sort)
            ->paginate(12)
            ->withQueryString();

        return Inertia::render('storefront/shop', [
            'products' => $products,
            'categories' => Category::where('is_active', true)
                ->select(['id', 'name', 'slug', 'description', 'image'])
                ->withCount(['products' => fn ($query) => $query->available()])
                ->get(),
            'filters' => [
                ...$request->only('category', 'search', 'concern'),
                'sort' => $sort,
            ],
        ]);
    }

    public function product(
        Request $request,
        Product $product,
        RecentlyViewedProducts $recentlyViewedProducts,
    ): Response {
        abort_unless($product->is_active, 404);

        $recentlyViewed = $recentlyViewedProducts->get($request, 4, $product->id);
        $recentlyViewedProducts->remember($request, $product);

        $canReview = $request->user()?->orders()
            ->reviewEligible()
            ->whereHas('items', fn ($query) => $query->where('product_id', $product->id))
            ->exists() ?? false;

        return Inertia::render('storefront/product', [
            'product' => $product->load('category'),
            'reviews' => $product->reviews()
                ->where('is_approved', true)
                ->latest()
                ->take(8)
                ->get(['id', 'customer_name', 'rating', 'title', 'body', 'is_verified_purchase', 'created_at']),
            'canReview' => $canReview,
            'related' => Product::available()
                ->withApprovedReviewSummary()
                ->with('category')
                ->where('category_id', $product->category_id)
                ->whereKeyNot($product->id)
                ->take(4)
                ->get(),
            'recentlyViewed' => $recentlyViewed,
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
}
