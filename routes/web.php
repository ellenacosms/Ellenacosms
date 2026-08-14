<?php

use App\Http\Controllers\Admin\BannerController as AdminBannerController;
use App\Http\Controllers\Admin\CategoryController as AdminCategoryController;
use App\Http\Controllers\Admin\CustomerController as AdminCustomerController;
use App\Http\Controllers\Admin\DashboardController as AdminDashboardController;
use App\Http\Controllers\Admin\DiscountController as AdminDiscountController;
use App\Http\Controllers\Admin\InventoryController as AdminInventoryController;
use App\Http\Controllers\Admin\NewsletterSubscriberController as AdminNewsletterSubscriberController;
use App\Http\Controllers\Admin\OrderController as AdminOrderController;
use App\Http\Controllers\Admin\ProductController as AdminProductController;
use App\Http\Controllers\Admin\ProductTransferController as AdminProductTransferController;
use App\Http\Controllers\Admin\ReviewController as AdminReviewController;
use App\Http\Controllers\Admin\RitualController as AdminRitualController;
use App\Http\Controllers\Admin\StoreSettingController as AdminStoreSettingController;
use App\Http\Controllers\Auth\GoogleAuthController;
use App\Http\Controllers\CartController;
use App\Http\Controllers\CheckoutController;
use App\Http\Controllers\CustomerOrderController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\N8nCheckoutSessionController;
use App\Http\Controllers\NewsletterController;
use App\Http\Controllers\PesapalPaymentController;
use App\Http\Controllers\ReviewController;
use App\Http\Controllers\RitualController;
use App\Http\Controllers\StorefrontController;
use App\Http\Controllers\SitemapController;
use App\Http\Controllers\WishlistController;
use Illuminate\Support\Facades\Route;

Route::get('/', [StorefrontController::class, 'home'])->name('home');
Route::get('/sitemap.xml', SitemapController::class)->name('sitemap');
Route::get('/shop', [StorefrontController::class, 'shop'])->name('shop');
Route::get('/rituals', [RitualController::class, 'index'])->name('rituals.index');
Route::post('/rituals/{ritual:slug}/cart', [RitualController::class, 'addToCart'])
    ->middleware('throttle:20,1')
    ->name('rituals.cart.store');
Route::get('/search/suggestions', [StorefrontController::class, 'searchSuggestions'])
    ->middleware('throttle:60,1')
    ->name('search.suggestions');
Route::redirect('/ellenacosms/govern', '/admin')->name('admin.entry');
Route::get('/products/{product:slug}', [StorefrontController::class, 'product'])->name('products.show');
Route::get('/cart', [CartController::class, 'index'])->name('cart.index');
Route::post('/cart/discount', [CartController::class, 'applyDiscount'])
    ->middleware('throttle:10,1')
    ->name('cart.discount.apply');
Route::delete('/cart/discount', [CartController::class, 'removeDiscount'])->name('cart.discount.remove');
Route::post('/cart/{product}', [CartController::class, 'store'])->name('cart.store');
Route::patch('/cart/{product}', [CartController::class, 'update'])->name('cart.update');
Route::delete('/cart/{product}', [CartController::class, 'destroy'])->name('cart.destroy');
Route::post('/integrations/n8n/checkout-sessions', [N8nCheckoutSessionController::class, 'store'])
    ->middleware('throttle:20,1')
    ->name('n8n.checkout-sessions.store');
Route::get('/checkout/session/{token}', [N8nCheckoutSessionController::class, 'open'])
    ->middleware('throttle:20,1')
    ->name('n8n.checkout-sessions.open');
Route::post('/products/{product:slug}/reviews', [ReviewController::class, 'store'])
    ->middleware(['auth', 'verified', 'throttle:10,1'])
    ->name('products.reviews.store');
Route::get('/checkout/access', [CheckoutController::class, 'access'])->name('checkout.access');
Route::get('/checkout', [CheckoutController::class, 'create'])->name('checkout.create');
Route::post('/checkout', [CheckoutController::class, 'store'])
    ->middleware('throttle:10,1')
    ->name('checkout.store');
Route::get('/order/{order}/success', [CheckoutController::class, 'success'])->name('checkout.success');
Route::post('/orders/{order}/payments/pesapal', [PesapalPaymentController::class, 'start'])
    ->middleware('throttle:10,1')
    ->name('payments.pesapal.start');
Route::post('/payments/pesapal/prepare', [PesapalPaymentController::class, 'prepare'])
    ->middleware('throttle:30,1')
    ->name('payments.pesapal.prepare');
Route::get('/payments/pesapal/callback', [PesapalPaymentController::class, 'callback'])
    ->middleware('throttle:60,1')
    ->name('payments.pesapal.callback');
Route::match(['get', 'post'], '/payments/pesapal/ipn', [PesapalPaymentController::class, 'ipn'])
    ->middleware('throttle:120,1')
    ->name('payments.pesapal.ipn');
Route::get('/auth/google/redirect', [GoogleAuthController::class, 'redirect'])
    ->middleware(['guest', 'throttle:20,1'])
    ->name('auth.google.redirect');
Route::get('/auth/google/callback', [GoogleAuthController::class, 'callback'])
    ->middleware(['guest', 'throttle:20,1'])
    ->name('auth.google.callback');
Route::post('/newsletter', [NewsletterController::class, 'store'])
    ->middleware('throttle:5,1')
    ->name('newsletter.store');
Route::get('/newsletter/confirm/{token}', [NewsletterController::class, 'confirm'])
    ->middleware('throttle:20,1')
    ->name('newsletter.confirm');
Route::get('/newsletter/unsubscribe/{subscriber}', [NewsletterController::class, 'showUnsubscribe'])
    ->middleware('signed')
    ->name('newsletter.unsubscribe.show');
Route::delete('/newsletter/unsubscribe/{subscriber}', [NewsletterController::class, 'unsubscribe'])
    ->middleware(['signed', 'throttle:10,1'])
    ->name('newsletter.unsubscribe');

Route::middleware(['auth', 'verified'])->group(function () {
    Route::get('dashboard', DashboardController::class)->name('dashboard');
    Route::get('dashboard/orders/{order}', [CustomerOrderController::class, 'show'])->name('customer.orders.show');
    Route::post('wishlist/{product}', [WishlistController::class, 'store'])
        ->middleware('throttle:30,1')
        ->name('wishlist.store');
    Route::delete('wishlist/{product}', [WishlistController::class, 'destroy'])
        ->middleware('throttle:30,1')
        ->name('wishlist.destroy');
});

Route::prefix('admin')->name('admin.')->middleware(['auth', 'admin', 'admin.two-factor', 'admin.audit'])->group(function () {
    Route::get('/', AdminDashboardController::class)->name('dashboard');
    Route::get('products/export', [AdminProductTransferController::class, 'export'])->name('products.export');
    Route::get('products/import-template', [AdminProductTransferController::class, 'template'])->name('products.import-template');
    Route::post('products/import', [AdminProductTransferController::class, 'import'])->name('products.import');
    Route::patch('products/{product}/featured', [AdminProductController::class, 'featured'])->name('products.featured');
    Route::resource('products', AdminProductController::class)->except('show');
    Route::resource('rituals', AdminRitualController::class)->except('show');
    Route::resource('categories', AdminCategoryController::class)->only(['index', 'store', 'update', 'destroy']);
    Route::get('inventory', [AdminInventoryController::class, 'index'])->name('inventory.index');
    Route::patch('inventory/{product}', [AdminInventoryController::class, 'update'])->name('inventory.update');
    Route::resource('orders', AdminOrderController::class)->only(['index', 'show', 'update']);
    Route::post('orders/{order}/payment/refresh', [AdminOrderController::class, 'refreshPayment'])
        ->middleware('throttle:20,1')
        ->name('orders.payment.refresh');
    Route::resource('customers', AdminCustomerController::class)->only(['index', 'show']);
    Route::resource('discounts', AdminDiscountController::class)->only(['index', 'store', 'update', 'destroy']);
    Route::resource('banners', AdminBannerController::class)->only(['index', 'store', 'update', 'destroy']);
    Route::resource('reviews', AdminReviewController::class)->only(['index', 'update', 'destroy']);
    Route::get('newsletter/export', [AdminNewsletterSubscriberController::class, 'export'])->name('newsletter.export');
    Route::post('newsletter/{subscriber}/resend', [AdminNewsletterSubscriberController::class, 'resend'])->name('newsletter.resend');
    Route::resource('newsletter', AdminNewsletterSubscriberController::class)
        ->parameters(['newsletter' => 'subscriber'])
        ->only(['index', 'destroy']);
    Route::get('settings', [AdminStoreSettingController::class, 'edit'])->name('settings.edit');
    Route::put('settings', [AdminStoreSettingController::class, 'update'])->name('settings.update');
});

require __DIR__.'/settings.php';
