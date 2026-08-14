<?php

namespace App\Services\Payments;

use App\Models\Order;
use Illuminate\Http\Client\PendingRequest;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Str;
use RuntimeException;

class PesapalClient
{
    public function configured(): bool
    {
        return filled(config('services.pesapal.consumer_key'))
            && filled(config('services.pesapal.consumer_secret'));
    }

    public function ready(): bool
    {
        return $this->configured() && filled(config('services.pesapal.ipn_id'));
    }

    public function warmUp(): void
    {
        $this->accessToken();
    }

    /** @return array<string, mixed> */
    public function submitOrder(Order $order, string $merchantReference): array
    {
        $names = preg_split('/\s+/', trim($order->customer_name), 2) ?: [];
        $response = $this->authenticatedRequest()->post(
            $this->baseUrl().'/api/Transactions/SubmitOrderRequest',
            [
                'id' => $merchantReference,
                'currency' => strtoupper((string) config('services.pesapal.currency', 'UGX')),
                'amount' => (float) $order->total,
                'description' => Str::limit('Ellena order '.$order->number, 100, ''),
                'callback_url' => config('services.pesapal.callback_url'),
                'cancellation_url' => config('services.pesapal.cancellation_url'),
                'redirect_mode' => 'TOP_WINDOW',
                'notification_id' => config('services.pesapal.ipn_id'),
                'branch' => 'Ellena',
                'billing_address' => [
                    'email_address' => $order->email,
                    'phone_number' => $order->phone ?? '',
                    'country_code' => $this->countryCode($order->country),
                    'first_name' => $names[0] ?? $order->customer_name,
                    'middle_name' => '',
                    'last_name' => $names[1] ?? '',
                    'line_1' => $order->address,
                    'line_2' => '',
                    'city' => $order->city,
                    'state' => '',
                    'postal_code' => '',
                    'zip_code' => '',
                ],
            ],
        );

        $response->throw();
        $payload = $response->json();

        if (! is_array($payload)
            || blank($payload['order_tracking_id'] ?? null)
            || blank($payload['redirect_url'] ?? null)) {
            throw new RuntimeException($this->errorMessage($payload, 'Pesapal did not create a payment request.'));
        }

        return $payload;
    }

    /** @return array<string, mixed> */
    public function transactionStatus(string $trackingId): array
    {
        $response = $this->authenticatedRequest()->get(
            $this->baseUrl().'/api/Transactions/GetTransactionStatus',
            ['orderTrackingId' => $trackingId],
        );

        $response->throw();
        $payload = $response->json();

        if (! is_array($payload) || blank($payload['payment_status_description'] ?? null)) {
            throw new RuntimeException($this->errorMessage($payload, 'Pesapal did not return a payment status.'));
        }

        return $payload;
    }

    public function registerIpn(string $url): string
    {
        $response = $this->authenticatedRequest()->post(
            $this->baseUrl().'/api/URLSetup/RegisterIPN',
            [
                'url' => $url,
                'ipn_notification_type' => 'POST',
            ],
        );

        $response->throw();
        $payload = $response->json();
        $ipnId = is_array($payload) ? ($payload['ipn_id'] ?? null) : null;

        if (! is_string($ipnId) || ! Str::isUuid($ipnId)) {
            throw new RuntimeException($this->errorMessage($payload, 'Pesapal did not return a valid IPN ID.'));
        }

        return $ipnId;
    }

    private function authenticatedRequest(): PendingRequest
    {
        if (! $this->configured()) {
            throw new RuntimeException('Pesapal credentials are not configured.');
        }

        return $this->http()->withToken($this->accessToken());
    }

    private function accessToken(): string
    {
        $cacheKey = 'pesapal.token.'.hash('sha256', $this->baseUrl().'|'.config('services.pesapal.consumer_key'));
        $cache = Cache::store(config('services.pesapal.cache_store'));
        $cachedToken = $cache->get($cacheKey);

        if (is_string($cachedToken) && $cachedToken !== '') {
            return $cachedToken;
        }

        return $cache->lock($cacheKey.'.lock', 60)->block(30, function () use ($cache, $cacheKey): string {
            $cachedToken = $cache->get($cacheKey);

            if (is_string($cachedToken) && $cachedToken !== '') {
                return $cachedToken;
            }

            $response = $this->http()->post($this->baseUrl().'/api/Auth/RequestToken', [
                'consumer_key' => config('services.pesapal.consumer_key'),
                'consumer_secret' => config('services.pesapal.consumer_secret'),
            ]);

            $response->throw();
            $payload = $response->json();
            $token = is_array($payload) ? ($payload['token'] ?? null) : null;

            if (! is_string($token) || $token === '') {
                throw new RuntimeException($this->errorMessage($payload, 'Pesapal authentication failed.'));
            }

            $cache->put(
                $cacheKey,
                $token,
                now()->addSeconds(max(30, min(240, (int) config('services.pesapal.token_cache_seconds', 240)))),
            );

            return $token;
        });
    }

    private function http(): PendingRequest
    {
        $request = Http::acceptJson()
            ->asJson()
            ->connectTimeout(5)
            ->timeout(20)
            ->retry(2, 250);
        $caBundle = config('services.pesapal.ca_bundle');

        if (filled($caBundle)) {
            if (! is_string($caBundle) || ! is_readable($caBundle)) {
                throw new RuntimeException('The configured Pesapal CA bundle is not readable.');
            }

            $request = $request->withOptions(['verify' => $caBundle]);
        }

        return $request;
    }

    private function baseUrl(): string
    {
        return in_array(config('services.pesapal.environment'), ['live', 'production'], true)
            ? 'https://pay.pesapal.com/v3'
            : 'https://cybqa.pesapal.com/pesapalv3';
    }

    private function countryCode(string $country): string
    {
        return match (Str::lower(trim($country))) {
            'uganda' => 'UG',
            'kenya' => 'KE',
            'tanzania' => 'TZ',
            'rwanda' => 'RW',
            'zambia' => 'ZM',
            'malawi' => 'MW',
            default => '',
        };
    }

    private function errorMessage(mixed $payload, string $fallback): string
    {
        if (! is_array($payload)) {
            return $fallback;
        }

        return (string) data_get($payload, 'error.message', $payload['message'] ?? $fallback);
    }
}
