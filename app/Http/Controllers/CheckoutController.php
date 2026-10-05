<?php

namespace App\Http\Controllers;

use App\Jobs\SendOrderEventWebhook;
use App\Models\Discount;
use App\Models\N8nCheckoutSession;
use App\Models\Order;
use App\Models\Product;
use App\Models\StoreSetting;
use App\Models\User;
use App\Services\DeliveryPricing;
use App\Services\Payments\DGatewayPaymentService;
use App\Services\StoreCart;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Rules\Password;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;
use Symfony\Component\HttpFoundation\Response as HttpResponse;

class CheckoutController extends Controller
{
    public function __construct(
        private StoreCart $cart,
        private DGatewayPaymentService $payments,
    ) {}

    public function access(Request $request): HttpResponse|RedirectResponse
    {
        $details = $this->cart->details($request);

        if (count($details['items']) === 0) {
            return to_route('cart.index');
        }

        if ($request->user()?->hasVerifiedEmail()) {
            return to_route('checkout.create');
        }

        if ($request->user()) {
            $request->session()->put('url.intended', route('checkout.create'));

            return to_route('verification.notice');
        }

        $request->session()->put('url.intended', route('checkout.create'));
        $googleCallbackOrigin = $this->googleCallbackOrigin();

        $response = Inertia::render('storefront/checkout-access', [
            'itemCount' => $details['count'],
            'total' => $details['total'],
            'googleEnabled' => filled(config('services.google.client_id'))
                && filled(config('services.google.client_secret'))
                && $googleCallbackOrigin !== null,
            'googleCallbackOrigin' => $googleCallbackOrigin,
            'passwordRules' => Password::defaults()->toPasswordRulesString(),
        ])->toResponse($request);

        $response->headers->set('Cross-Origin-Opener-Policy', 'same-origin-allow-popups');

        return $response;
    }

    public function create(Request $request): Response|RedirectResponse
    {
        $details = $this->cart->details($request);

        if (count($details['items']) === 0) {
            return to_route('cart.index');
        }

        $checkoutToken = $request->session()->get('checkout_token');

        if (! is_string($checkoutToken) || ! Str::isUuid($checkoutToken)) {
            $checkoutToken = (string) Str::uuid();
            $request->session()->put('checkout_token', $checkoutToken);
        }

        return Inertia::render('storefront/checkout', [
            ...$details,
            'customer' => $request->user()?->only(['name', 'email'])
                ?? $request->session()->get('n8n_checkout_customer'),
            'checkoutToken' => $checkoutToken,
            'deliveryOptions' => $this->deliveryOptions($details),
            'paymentOptions' => $this->paymentOptions(),
            'defaultPaymentMethod' => $this->payments->ready() ? 'dgateway' : 'manual_confirmation',
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $user = $request->user();

        $validated = $request->validate([
            'customer_name' => ['required', 'string', 'max:120'],
            'email' => ['required', 'email', 'max:190'],
            'phone' => ['required', 'string', 'max:30'],
            'address' => ['required_unless:delivery_method,pickup', 'nullable', 'string', 'max:190'],
            'city' => ['required_unless:delivery_method,pickup', 'nullable', 'string', 'max:100'],
            'country' => ['required_unless:delivery_method,pickup', 'nullable', 'string', 'max:100'],
            'notes' => ['nullable', 'string', 'max:1000'],
            'delivery_method' => ['required', 'string', 'max:50'],
            'checkout_token' => ['required', 'uuid'],
            'payment_method' => ['required', Rule::in(['dgateway', 'manual_confirmation', 'pay_at_shop'])],
        ]);
        if ($validated['payment_method'] === 'pay_at_shop' && $validated['delivery_method'] !== 'pickup') {
            throw ValidationException::withMessages(['payment_method' => 'Pay at shop requires store pickup.']);
        }
        if ($user) {
            $validated['email'] = $user->email;
        }

        if ($validated['payment_method'] === 'dgateway' && ! $this->payments->ready()) {
            throw ValidationException::withMessages([
                'payment_method' => 'D-Gateway is not available yet. Choose confirmation payment or try again later.',
            ]);
        }

        $sessionToken = $request->session()->get('checkout_token')
            ?? $request->session()->get('last_checkout_token');
        abort_unless(
            is_string($sessionToken) && hash_equals($sessionToken, $validated['checkout_token']),
            419,
            'Your checkout session expired. Please review your order and try again.'
        );

        $existingOrder = Order::query()
            ->where('checkout_token', $validated['checkout_token'])
            ->first();

        if ($existingOrder) {
            $request->session()->put('last_order_id', $existingOrder->id);

            return to_route('checkout.success', $existingOrder);
        }

        $cart = $request->session()->get('cart', []);
        abort_if(! is_array($cart) || empty($cart), 422, 'Your bag is empty.');
        $this->cart->details($request);
        $cart = $request->session()->get('cart', []);
        abort_if(empty($cart), 422, 'Your bag is empty.');

        [$order, $created] = DB::transaction(function () use ($validated, $cart, $request, $user) {
            if ($user) {
                User::query()->whereKey($user->id)->lockForUpdate()->firstOrFail();
            }

            $existingOrder = Order::query()
                ->where('checkout_token', $validated['checkout_token'])
                ->first();

            if ($existingOrder) {
                return [$existingOrder, false];
            }

            $products = Product::whereIn('id', array_keys($cart))->lockForUpdate()->get();
            abort_if($products->count() !== count($cart), 422, 'Some items in your bag are no longer available.');
            $subtotal = 0;

            foreach ($products as $product) {
                $quantity = (int) $cart[$product->id];
                abort_if($quantity < 1 || $quantity > 20, 422, 'Your bag contains an invalid quantity.');
                abort_if(! $product->is_active || $product->stock < $quantity, 422, $product->name.' no longer has enough stock.');
                $subtotal = round($subtotal + ((float) $product->price * $quantity), 2);
            }

            $bundleDiscount = $this->cart->bundleDiscountFor($request, $products, $cart);
            $discountableSubtotal = max(0, $subtotal - (float) ($bundleDiscount['amount'] ?? 0));
            $discount = Discount::available()
                ->where('code', $request->session()->get('discount_code'))
                ->lockForUpdate()
                ->first();
            abort_if($discount && ! $discount->isEligibleFor($discountableSubtotal), 422, 'The discount code no longer applies to this order.');
            $codeDiscountAmount = $discount?->amountFor($discountableSubtotal) ?? 0;
            $discountAmount = round((float) ($bundleDiscount['amount'] ?? 0) + $codeDiscountAmount, 2);
            $discountedSubtotal = round(max(0, $subtotal - $discountAmount), 2);
            $delivery = app(DeliveryPricing::class)->resolve($validated['delivery_method'], $discountedSubtotal);
            $shipping = $delivery['fee'] ?? 0;
            if ($validated['delivery_method'] === 'pickup') {
                if (mb_strlen((string) $delivery['description']) > 255) {
                    throw ValidationException::withMessages(['delivery_method' => 'Please contact the shop to confirm pickup instructions.']);
                }
                $validated['address'] = $delivery['description'];
                $validated['city'] = '';
                $validated['country'] = '';
            }
            if ($delivery['zone_id']) {
                $validated['city'] = $delivery['district'];
                $validated['country'] = $delivery['country'];
            }
            $prefix = StoreSetting::orderPrefix();
            $order = Order::create([
                ...$validated,
                'user_id' => $user?->id,
                'number' => $prefix.'-'.now()->format('ymd').'-'.Str::upper(Str::random(6)),
                'estimated_delivery_date' => $delivery['estimatedDeliveryDate'],
                'delivery_zone_id' => $delivery['zone_id'],
                'delivery_area' => $delivery['label'],
                'delivery_fee_status' => $delivery['fee'] === null ? 'awaiting_quote' : 'confirmed',
                'currency' => StoreSetting::currency(),
                'payment_method' => $validated['payment_method'],
                'payment_provider' => $validated['payment_method'] === 'dgateway' ? 'dgateway' : null,
                'expires_at' => now()->addHours(48),
                'subtotal' => $subtotal,
                'discount_id' => $discount?->id,
                'discount_code' => collect([
                    $bundleDiscount ? 'RITUAL SAVINGS' : null,
                    $discount?->code,
                ])->filter()->join(' + ') ?: null,
                'discount_amount' => $discountAmount,
                'shipping' => $shipping,
                'total' => round($discountedSubtotal + $shipping, 2),
            ]);

            if ($discount) {
                $discount->increment('times_used');
            }

            foreach ($products as $product) {
                $quantity = (int) $cart[$product->id];
                $order->items()->create([
                    'product_id' => $product->id,
                    'product_name' => $product->name,
                    'sku' => $product->sku,
                    'price' => $product->price,
                    'quantity' => $quantity,
                    'total' => round((float) $product->price * $quantity, 2),
                ]);
                $product->decrement('stock', $quantity);
            }

            return [$order, true];
        });

        if ($created) {
            $checkoutSessionId = $request->session()->pull('n8n_checkout_session_id');

            if (is_int($checkoutSessionId)) {
                N8nCheckoutSession::query()
                    ->whereKey($checkoutSessionId)
                    ->whereNull('used_at')
                    ->update(['used_at' => now()]);
            }

            $request->session()->forget(['cart', 'cart_rituals', 'discount_code']);
            DB::afterCommit(fn () => SendOrderEventWebhook::dispatch($order->id, 'order.created'));
        }

        $request->session()->forget('checkout_token');
        $request->session()->put('last_checkout_token', $validated['checkout_token']);
        $request->session()->put('last_order_id', $order->id);

        return to_route('checkout.success', $order);
    }

    public function success(Request $request, Order $order): Response
    {
        abort_unless(
            $request->session()->get('last_order_id') === $order->id
            || ($request->user() && $request->user()->id === $order->user_id)
            || $request->user()?->is_admin,
            403
        );

        return Inertia::render('storefront/order-success', [
            'order' => $order->load('items'),
            'gatewayReady' => $this->payments->ready(),
            'cardsEnabled' => (bool) config('services.dgateway.cards_enabled'),
        ]);
    }

    /** @return list<array{id: string, label: string, description: string, enabled: bool}> */
    private function paymentOptions(): array
    {
        return [
            [
                'id' => 'dgateway',
                'label' => 'D-Gateway',
                'description' => 'Pay securely with mobile money or card.',
                'enabled' => $this->payments->ready(),
            ],
            [
                'id' => 'manual_confirmation',
                'label' => 'Payment after confirmation',
                'description' => 'Place the order now and receive payment instructions from Ellena.',
                'enabled' => true,
            ],
            [
                'id' => 'pay_at_shop',
                'label' => 'Pay at shop',
                'description' => 'Reserve your items and pay when you collect them. Bring your order code within 48 hours.',
                'enabled' => StoreSetting::getValue('pickup_enabled', '0') === '1',
            ],
        ];
    }

    /** @param array<string, mixed> $details
     * @return list<array<string, mixed>>
     */
    private function deliveryOptions(array $details): array
    {
        $subtotal = max(0, (float) $details['subtotal'] - (float) ($details['bundle_discount']['amount'] ?? 0) - (float) ($details['discount']['amount'] ?? 0));

        return app(DeliveryPricing::class)->options($subtotal);
    }

    private function googleCallbackOrigin(): ?string
    {
        $redirect = (string) config('services.google.redirect');
        $scheme = parse_url($redirect, PHP_URL_SCHEME);
        $host = parse_url($redirect, PHP_URL_HOST);
        $port = parse_url($redirect, PHP_URL_PORT);

        if (! in_array($scheme, ['http', 'https'], true) || ! is_string($host) || $host === '') {
            return null;
        }

        return $scheme.'://'.$host.($port ? ':'.$port : '');
    }
}
