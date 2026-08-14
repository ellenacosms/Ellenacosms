<?php

namespace App\Http\Controllers;

use App\Models\N8nCheckoutSession;
use App\Models\Product;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\Cache;
use Illuminate\Validation\ValidationException;

class N8nCheckoutSessionController extends Controller
{
    public function store(Request $request): JsonResponse
    {
        if (! $this->isAuthorized($request)) {
            return response()->json(['message' => 'Unauthorized.'], 401);
        }

        $validated = $request->validate([
            'items' => ['required', 'array', 'min:1', 'max:20'],
            'items.*.product_id' => ['nullable', 'integer', 'distinct', 'exists:products,id', 'required_without:items.*.product_name'],
            'items.*.product_name' => ['nullable', 'string', 'distinct', 'max:255', 'required_without:items.*.product_id'],
            'items.*.quantity' => ['required', 'integer', 'min:1', 'max:20'],
            'customer' => ['nullable', 'array'],
            'customer.name' => ['nullable', 'string', 'max:120'],
            'customer.email' => ['nullable', 'email', 'max:190'],
            'customer.phone' => ['nullable', 'string', 'max:30'],
        ]);

        $requestedIds = collect($validated['items'])->pluck('product_id')->filter()->map(fn (mixed $id): int => (int) $id);
        $requestedNames = collect($validated['items'])->pluck('product_name')->filter()->values();
        $products = Product::query()
            ->available()
            ->where(fn ($query) => $query
                ->whereIn('id', $requestedIds)
                ->orWhereIn('name', $requestedNames))
            ->get();
        $productsById = $products->keyBy('id');
        $productsByName = $products->keyBy('name');

        /** @var array<int, int> $items */
        $items = [];

        foreach ($validated['items'] as $item) {
            $product = isset($item['product_id'])
                ? $productsById->get((int) $item['product_id'])
                : $productsByName->get($item['product_name']);

            if (! $product) {
                throw ValidationException::withMessages([
                    'items' => 'One or more selected products are unavailable.',
                ]);
            }

            $items[$product->id] = ($items[$product->id] ?? 0) + (int) $item['quantity'];
        }

        foreach ($items as $productId => $quantity) {
            $product = $productsById->get($productId);

            if ($quantity > 20 || $product->stock < $quantity) {
                throw ValidationException::withMessages([
                    'items' => "{$product->name} no longer has enough stock.",
                ]);
            }
        }

        $session = N8nCheckoutSession::create([
            'token' => (string) Str::uuid(),
            'items' => $items,
            'customer' => $validated['customer'] ?? null,
            'expires_at' => now()->addMinutes((int) config('services.n8n.checkout_session_minutes', 30)),
        ]);

        $checkoutPath = route('n8n.checkout-sessions.open', $session->token, false);
        $checkoutUrl = rtrim((string) config('app.url'), '/').$checkoutPath;

        return response()->json([
            'checkout_url' => $checkoutUrl,
            'expires_at' => $session->expires_at->toIso8601String(),
        ], 201);
    }

    public function open(Request $request, string $token): RedirectResponse
    {
        $checkoutSession = N8nCheckoutSession::query()->where('token', $token)->firstOrFail();

        abort_if($checkoutSession->used_at !== null || $checkoutSession->expires_at->isPast(), 410, 'This checkout link has expired.');

        /** @var array<int, int> $items */
        $items = collect($checkoutSession->items)
            ->mapWithKeys(fn (mixed $quantity, mixed $productId): array => [(int) $productId => (int) $quantity])
            ->all();

        $request->session()->put('cart', $items);
        $request->session()->forget(['cart_rituals', 'discount_code', 'last_checkout_token']);
        $request->session()->put('checkout_token', (string) Str::uuid());
        $request->session()->put('n8n_checkout_session_id', $checkoutSession->id);
        $request->session()->put('n8n_checkout_customer', $checkoutSession->customer ?? []);

        return to_route('checkout.create');
    }

    private function isAuthorized(Request $request): bool
    {
        $configuredSecret = (string) config('services.n8n.checkout_session_secret');
        $timestamp = (string) $request->header('X-N8N-Timestamp');
        $signature = (string) $request->header('X-N8N-Signature');
        $maxAge = max(60, (int) config('services.n8n.checkout_max_age_seconds', 300));

        if ($configuredSecret === '' || ! ctype_digit($timestamp)) {
            return false;
        }

        if (abs(now()->getTimestamp() - (int) $timestamp) > $maxAge) {
            return false;
        }

        $expected = 'sha256='.hash_hmac('sha256', $timestamp.'.'.$request->getContent(), $configuredSecret);

        if (! hash_equals($expected, $signature)) {
            return false;
        }

        $replayKey = 'n8n.checkout.replay.'.hash('sha256', $signature);

        return Cache::add($replayKey, true, now()->addSeconds($maxAge));
    }
}
