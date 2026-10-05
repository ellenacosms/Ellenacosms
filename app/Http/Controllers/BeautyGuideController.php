<?php

namespace App\Http\Controllers;

use App\Models\BeautyGuide;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class BeautyGuideController extends Controller
{
    public function index(Request $request): Response
    {
        $category = $request->string('category')->toString();
        $search = trim($request->string('search')->toString());

        if (! array_key_exists($category, BeautyGuide::CATEGORIES)) {
            $category = '';
        }

        $guides = BeautyGuide::published()
            ->withCount(['products' => fn ($query) => $query->available()])
            ->when($category !== '', fn ($query) => $query->where('category', $category))
            ->when($search !== '', fn ($query) => $query->where(function ($articles) use ($search): void {
                $articles
                    ->where('title', 'like', "%{$search}%")
                    ->orWhere('excerpt', 'like', "%{$search}%")
                    ->orWhere('body', 'like', "%{$search}%");
            }))
            ->orderByDesc('is_featured')
            ->orderBy('sort_order')
            ->orderByDesc('published_at')
            ->get()
            ->map(fn (BeautyGuide $guide) => [
                ...$guide->only(['id', 'title', 'slug', 'category', 'eyebrow', 'excerpt', 'hero_image', 'read_minutes', 'is_featured', 'published_at', 'products_count']),
                'category_label' => $guide->category_label,
            ]);

        return Inertia::render('storefront/beauty-guide', [
            'guides' => $guides,
            'categories' => BeautyGuide::CATEGORIES,
            'filters' => ['category' => $category, 'search' => $search],
        ]);
    }

    public function show(BeautyGuide $beautyGuide): Response
    {
        abort_unless(
            BeautyGuide::published()->whereKey($beautyGuide->id)->exists(),
            404,
        );

        $beautyGuide->load([
            'products' => fn ($query) => $query
                ->available()
                ->select([
                    'products.id', 'products.category_id', 'products.name', 'products.slug',
                    'products.sku', 'products.subtitle', 'products.description', 'products.ingredients',
                    'products.usage', 'products.benefits', 'products.concerns', 'products.ritual_steps',
                    'products.price', 'products.compare_price', 'products.stock', 'products.images',
                    'products.is_featured', 'products.is_active',
                ])
                ->withApprovedReviewSummary()
                ->with('category:id,name,slug'),
        ]);

        $related = BeautyGuide::published()
            ->whereKeyNot($beautyGuide->id)
            ->where('category', $beautyGuide->category)
            ->orderByDesc('is_featured')
            ->orderBy('sort_order')
            ->take(3)
            ->get(['id', 'title', 'slug', 'category', 'excerpt', 'hero_image', 'read_minutes']);

        return Inertia::render('storefront/beauty-guide-show', [
            'guide' => [
                ...$beautyGuide->toArray(),
                'category_label' => $beautyGuide->category_label,
            ],
            'related' => $related->map(fn (BeautyGuide $guide) => [
                ...$guide->toArray(),
                'category_label' => $guide->category_label,
            ]),
        ]);
    }
}
