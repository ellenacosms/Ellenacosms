<?php

namespace App\Http\Middleware;

use App\Models\Category;
use App\Models\StoreSetting;
use App\Services\StoreCart;
use Illuminate\Http\Request;
use Illuminate\Validation\Rules\Password;
use Inertia\Middleware;

class HandleInertiaRequests extends Middleware
{
    /**
     * The root template that's loaded on the first page visit.
     *
     * @see https://inertiajs.com/server-side-setup#root-template
     *
     * @var string
     */
    protected $rootView = 'app';

    /**
     * Determines the current asset version.
     *
     * @see https://inertiajs.com/asset-versioning
     */
    public function version(Request $request): ?string
    {
        return parent::version($request);
    }

    /**
     * Define the props that are shared by default.
     *
     * @see https://inertiajs.com/shared-data
     *
     * @return array<string, mixed>
     */
    public function share(Request $request): array
    {
        $cartDetails = null;
        $resolveCart = function () use (&$cartDetails, $request): array {
            return $cartDetails ??= app(StoreCart::class)->details($request);
        };

        return [
            ...parent::share($request),
            'name' => config('app.name'),
            'seo' => fn () => [
                'siteName' => config('app.name', 'Ellena Beauty'),
                'baseUrl' => rtrim((string) config('app.url'), '/'),
                'defaultImage' => asset('images/social/ellena-beauty-share-products.png'),
            ],
            'storeSettings' => fn () => StoreSetting::frontendValues(),
            'customerRegistration' => fn () => [
                'passwordRules' => Password::defaults()->toPasswordRulesString(),
                'googleEnabled' => filled(config('services.google.client_id'))
                    && filled(config('services.google.client_secret'))
                    && filled(config('services.google.redirect')),
            ],
            'storeCategories' => fn () => Category::query()
                ->where('is_active', true)
                ->orderBy('name')
                ->get(['id', 'name', 'slug']),
            'auth' => [
                'user' => $request->user(),
            ],
            'wishlist_product_ids' => fn () => $request->user()
                ? $request->user()->wishlistProducts()->pluck('products.id')->map(fn ($id) => (int) $id)->all()
                : [],
            'cart_count' => fn () => $resolveCart()['count'],
            'cart_summary' => fn () => $resolveCart(),
            'flash' => [
                'success' => fn () => $request->session()->get('success'),
                'payment_message' => fn () => $request->session()->get('payment_message'),
            ],
            'sidebarOpen' => ! $request->hasCookie('sidebar_state') || $request->cookie('sidebar_state') === 'true',
        ];
    }
}
