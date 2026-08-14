<?php

namespace App\Http\Controllers;

use App\Jobs\SendOrderEventWebhook;
use App\Models\Discount;
use App\Models\N8nCheckoutSession;
use App\Models\Order;
use App\Models\Product;
use App\Models\StoreSetting;
use App\Models\User;
use App\Services\Payments\PesapalPaymentService;
use App\Services\StoreCart;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Rules\Password;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;
use Symfony\Component\HttpFoundation\Response as HttpResponse;
use Throwable;

class CheckoutController extends Controller
{
    public function __construct(
        private StoreCart $cart,
        private PesapalPaymentService $pesapal,
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
            'defaultPaymentMethod' => $this->pesapal->ready() ? 'pesapal' : 'manual_confirmation',
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $user = $request->user();

        $validated = $request->validate([
            'customer_name' => ['required', 'string', 'max:120'],
            'email' => ['required', 'email', 'max:190'],
            'phone' => ['nullable', 'string', 'max:30'],
            'address' => ['required', 'string', 'max:190'],
            'city' => ['required', 'string', 'max:100'],
            'country' => ['required', 'string', 'max:100'],
            'notes' => ['nullable', 'string', 'max:1000'],
            'delivery_method' => ['required', Rule::in(array_keys(config('checkout.delivery_methods', [])))],
            'checkout_token' => ['required', 'uuid'],
            'payment_method' => ['required', Rule::in(['pesapal', 'manual_confirmation'])],
        ]);
        if ($user) {
            $validated['email'] = $user->email;
        }

        if ($validated['payment_method'] === 'pesapal' && ! $this->pesapal->ready()) {
            throw ValidationException::withMessages([
                'payment_method' => 'Pesapal is not available yet. Choose confirmation payment or try again later.',
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
            $freeShippingThreshold = StoreSetting::freeShippingThreshold();
            $delivery = $this->deliveryOption(
                $validated['delivery_method'],
                $discountedSubtotal,
                $freeShippingThreshold,
            );
            $shipping = $delivery['fee'];
            $prefix = StoreSetting::orderPrefix();
            $order = Order::create([
                ...$validated,
                'user_id' => $user?->id,
                'number' => $prefix.'-'.now()->format('ymd').'-'.Str::upper(Str::random(6)),
                'estimated_delivery_date' => $delivery['estimatedDeliveryDate'],
                'payment_method' => $validated['payment_method'],
                'payment_provider' => $validated['payment_method'] === 'pesapal' ? 'pesapal' : null,
                'expires_at' => $validated['payment_method'] === 'pesapal'
                    ? now()->addMinutes((int) config('checkout.unpaid_order_expiry_minutes', 30))
                    : null,
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
            'pesapalReady' => $this->pesapal->ready(),
            'pesapalUrl' => $this->pesapal->paymentUrl($order),
            'openPesapal' => false,
        ]);
    }

    private function paymentOptions(): array
    {
        return [
            [
                'id' => 'pesapal',
                'label' => 'Pesapal',
                'description' => 'Pay securely with mobile money or card.',
                'enabled' => $this->pesapal->ready(),
            ],
            [
                'id' => 'manual_confirmation',
                'label' => 'Payment after confirmation',
                'description' => 'Place the order now and receive payment instructions from Ellena.',
                'enabled' => true,
            ],
        ];
    }

    private function pesapalErrorMessage(Throwable $exception): string
    {
        if (str_contains($exception->getMessage(), 'Transaction amount exceeds limit')) {
            return 'Your order is safe, but its amount exceeds the limit configured for our Pesapal account. Please contact us or choose another payment method.';
        }

        return 'Your order is safe, but Pesapal could not be opened. Try payment again below.';
    }

    /** @param array<string, mixed> $details */
    private function deliveryOptions(array $details): array
    {
        $discountedSubtotal = max(
            0,
            (float) $details['subtotal']
                - (float) ($details['bundle_discount']['amount'] ?? 0)
                - (float) ($details['discount']['amount'] ?? 0),
        );

        return collect(config('checkout.delivery_methods', []))
            ->map(function (array $method, string $id) use ($discountedSubtotal): array {
                $delivery = $this->deliveryOption(
                    $id,
                    $discountedSubtotal,
                    StoreSetting::freeShippingThreshold(),
                );

                return [
                    'id' => $id,
                    'label' => $method['label'],
                    'description' => $method['description'],
                    'fee' => $delivery['fee'],
                    'estimate' => $delivery['estimate'],
                    'estimatedDeliveryDate' => $delivery['estimatedDeliveryDate'],
                ];
            })
            ->values()
            ->all();
    }

    /** @return array{fee: float, estimate: string, estimatedDeliveryDate: string} */
    private function deliveryOption(string $id, float $subtotal, float $freeShippingThreshold): array
    {
        $method = config("checkout.delivery_methods.{$id}");
        abort_unless(is_array($method), 422, 'Please select a valid delivery method.');

        $fee = (float) $method['fee'];

        if (($method['free_shipping_eligible'] ?? false) && $subtotal >= $freeShippingThreshold) {
            $fee = 0;
        }

        $minimumDate = now()->addWeekdays((int) $method['minimum_business_days']);
        $maximumDate = now()->addWeekdays((int) $method['maximum_business_days']);

        return [
            'fee' => $fee,
            'estimate' => $minimumDate->format('j M').' – '.$maximumDate->format('j M'),
            'estimatedDeliveryDate' => $maximumDate->toDateString(),
        ];
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
