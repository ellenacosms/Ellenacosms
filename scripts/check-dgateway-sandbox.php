<?php

// Explicit sandbox smoke test. No local orders, stock, or notifications are changed.
require __DIR__.'/../vendor/autoload.php';
$app = require __DIR__.'/../bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();
if (! str_starts_with((string) config('services.dgateway.api_key'), 'dgw_test_')
    || rtrim((string) config('services.dgateway.api_url'), '/') !== 'https://dgatewayapi.desispay.com') {
    fwrite(STDERR, "Sandbox check requires a test key and the official API host.\n");
    exit(1);
}
try {
    $client = app(App\Services\Payments\DGatewayClient::class);
    if (in_array('--recover', $argv, true)) {
        $response = Illuminate\Support\Facades\Http::acceptJson()->withHeaders(['X-API-Key' => config('services.dgateway.api_key')])
            ->withOptions(['verify' => config('services.dgateway.ca_bundle') ?: true])
            ->timeout(25)->get('https://dgatewayapi.desispay.com/v1/payments/transactions', ['per_page' => 100])->throw();
        $matches = array_values(array_filter($response->json('data') ?? [], function ($transaction) {
            $metadata = $transaction['metadata'] ?? [];
            if (is_string($metadata)) {
                $metadata = json_decode($metadata, true);
            }
            return ($metadata['purpose'] ?? null) === 'sandbox_smoke_test';
        }));
        if (count($matches) !== 1) {
            throw new RuntimeException('Sandbox reference could not be uniquely recovered.');
        }
        $payment = $matches[0];
    } else {
        $payment = $client->collect([
        'amount' => 1000,
        'currency' => 'UGX',
        'phone_number' => '0111777771',
        'provider' => 'iotec',
        'description' => 'Ellena sandbox integration check',
        'metadata' => ['request_id' => (string) Illuminate\Support\Str::uuid(), 'purpose' => 'sandbox_smoke_test'],
        ]);
    }
    echo 'Sandbox reference: '.$payment['reference']."\n";
    // Never retry collection, even if verification fails.
    for ($poll = 0; $poll < 6; $poll++) {
        $verified = $client->verify($payment['reference']);
        $status = $verified['status'] ?? null;
        if (in_array($status, ['completed', 'failed'], true)) {
            break;
        }
        if ($poll < 5) {
            sleep(5);
        }
    }
    echo json_encode(array_intersect_key($verified, array_flip(['status', 'amount', 'currency', 'failure_reason'])), JSON_THROW_ON_ERROR)."\n";
    if (! isset($verified['amount'], $verified['currency'])) {
        $details = Illuminate\Support\Facades\Http::acceptJson()->withHeaders(['X-API-Key' => config('services.dgateway.api_key')])
            ->withOptions(['verify' => config('services.dgateway.ca_bundle') ?: true])
            ->timeout(25)->get('https://dgatewayapi.desispay.com/v1/payments/transactions/'.rawurlencode($payment['reference']))->throw()->json('data');
        echo 'Transaction details: '.json_encode(array_intersect_key($details, array_flip(['reference', 'status', 'amount', 'currency', 'direction'])), JSON_THROW_ON_ERROR)."\n";
        $verified += $details;
    }
    if (($verified['reference'] ?? null) !== $payment['reference']
        || (float) ($verified['amount'] ?? 0) !== 1000.0
        || ($verified['currency'] ?? null) !== 'UGX'
        || $status !== 'completed') {
        fwrite(STDERR, "Sandbox payment did not verify as completed with the expected amount and currency. Check the provider sandbox dashboard before repeating.\n");
        exit(1);
    }
    echo "Sandbox collection and authenticated verification passed: completed, UGX 1,000. No real funds or local orders changed.\n";
} catch (Throwable $exception) {
    echo 'Sandbox check failed ('.get_class($exception)."). Check the provider sandbox dashboard before repeating.\n";
    exit(1);
}
