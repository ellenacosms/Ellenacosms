<?php

// Read-only credential check: never initiates a collection or modifies an order.
require __DIR__.'/../vendor/autoload.php';
$app = require __DIR__.'/../bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();
$key = (string) config('services.dgateway.api_key');
if ($key === '') {
    fwrite(STDERR, "D-Gateway key is not configured.\n");
    exit(1);
}
if (rtrim((string) config('services.dgateway.api_url'), '/') !== 'https://dgatewayapi.desispay.com') {
    fwrite(STDERR, "Read-only check requires the documented D-Gateway API host.\n");
    exit(1);
}
echo 'Key mode: '.(str_starts_with($key, 'dgw_live_') ? 'live' : (str_starts_with($key, 'dgw_test_') ? 'test' : 'unrecognized'))."\n";
try {
    app(App\Services\Payments\DGatewayClient::class)->verify('ellena-access-check-'.Illuminate\Support\Str::uuid());
    echo "Verification endpoint reached. No collection was requested.\n";
} catch (Illuminate\Http\Client\RequestException $exception) {
    $status = $exception->response->status();
    echo "Verification HTTP status: {$status}\n";
    $code = $exception->response->json('error.code');
    if (is_string($code) && preg_match('/^[A-Z_]{1,80}$/', $code)) {
        echo "Provider error code: {$code}\n";
    }
    if ($status === 404) {
        echo "Unknown test reference rejected as expected. No collection was requested.\n";
    } elseif (in_array($status, [401, 403], true)) {
        echo "Provider rejected API access. Check merchant activation and API-key permissions.\n";
        exit(1);
    } else {
        echo "Provider returned an unexpected status. No collection was requested.\n";
        exit(1);
    }
} catch (Throwable $exception) {
    echo 'Read-only check failed ('.get_class($exception)."). No collection was requested.\n";
    exit(1);
}
