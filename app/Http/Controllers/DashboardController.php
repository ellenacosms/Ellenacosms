<?php

namespace App\Http\Controllers;

use App\Services\RecentlyViewedProducts;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class DashboardController extends Controller
{
    public function __invoke(
        Request $request,
        RecentlyViewedProducts $recentlyViewedProducts,
    ): Response|RedirectResponse {
        if ($request->user()?->is_admin) {
            return to_route('admin.dashboard');
        }

        $orders = $request->user()
            ->orders()
            ->with(['items.product'])
            ->latest()
            ->get();

        $wishlistProducts = $request->user()
            ->wishlistProducts()
            ->available()
            ->withApprovedReviewSummary()
            ->with('category')
            ->orderByDesc('wishlists.created_at')
            ->take(8)
            ->get();

        return Inertia::render('dashboard', [
            'orders' => $orders,
            'wishlistProducts' => $wishlistProducts,
            'recentlyViewed' => $recentlyViewedProducts->get($request),
            'summary' => [
                'orders' => $orders->count(),
                'active' => $orders->whereIn('status', ['pending', 'processing', 'shipped'])->count(),
                'spent' => (float) $orders->where('status', '!=', 'cancelled')->sum('total'),
            ],
        ]);
    }
}
