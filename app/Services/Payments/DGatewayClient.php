<?php

namespace App\Services\Payments;

use Illuminate\Support\Facades\Http;
use RuntimeException;

class DGatewayClient
{
    public function ready(): bool
    {
        return filled(config('services.dgateway.api_key'));
    }

    /** @param array<string, mixed> $data
     * @return array<string, mixed>
     */
    public function collect(array $data): array
    {
        // Never automatically repeat a collection: a timeout may have charged the payer.
        return $this->request('/v1/payments/collect', $data);
    }

    /** @return array<string, mixed> */
    public function verify(string $reference): array
    {
        $verified = $this->request('/v1/webhooks/verify', ['reference' => $reference]);
        if (! isset($verified['amount'], $verified['currency'])) {
            // The deployed verify API returns status only; retrieve authenticated transaction totals.
            $details = $this->request('/v1/payments/transactions/'.rawurlencode($reference), [], 'GET');
            if ($verified['reference'] !== $reference || $details['reference'] !== $reference) {
                throw new RuntimeException('The payment provider returned a mismatched reference.');
            }
            $verified += $details;
        }

        return $verified;
    }

    /** @param array<string, mixed> $data
     * @return array<string, mixed>
     */
    private function request(string $path, array $data, string $method = 'POST'): array
    {
        if (! $this->ready()) {
            throw new RuntimeException('Online payments are not configured yet.');
        }
        $base = rtrim((string) config('services.dgateway.api_url'), '/');
        if (parse_url($base, PHP_URL_SCHEME) !== 'https') {
            throw new RuntimeException('D-Gateway requires an HTTPS API URL.');
        }
        $http = Http::acceptJson()->asJson()->withHeaders(['X-API-Key' => config('services.dgateway.api_key')])->connectTimeout(5)->timeout(25);
        if ($bundle = config('services.dgateway.ca_bundle')) {
            $http = $http->withOptions(['verify' => $bundle]);
        }
        $response = $method === 'GET' ? $http->get($base.$path) : $http->post($base.$path, $data);
        $response->throw();
        $payload = $response->json('data');
        if (! is_array($payload) || ! is_string($payload['reference'] ?? null) || strlen($payload['reference']) > 190 || $payload['reference'] === '') {
            throw new RuntimeException('The payment provider returned an incomplete response.');
        }

        return $payload;
    }
}
