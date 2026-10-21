<?php

declare(strict_types=1);
if (PHP_SAPI !== 'cli') { exit(1); }
$root = '/home2/ellenaco/ellena';
require $root.'/vendor/autoload.php';
$app = require $root.'/bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();
// No persistent sessions, jobs, mail, analytics hooks or external SSR for private checks.
config(['session.driver' => 'array', 'cache.default' => 'array', 'mail.default' => 'array', 'inertia.ssr.enabled' => false]);
$viewCache = '/home2/ellenaco/ellena-live-release-20261020/smoke-views';
if (!is_dir($viewCache)) { mkdir($viewCache, 0700); }
config(['view.compiled' => $viewCache]);
$new = ($argv[1] ?? '') === 'new';
if ($new && !config('checkout.payments_paused')) { throw new RuntimeException('Payments are not paused'); }
$http = $app->make(Illuminate\Contracts\Http\Kernel::class);
foreach (['/', '/shop', '/cart', '/contact', ...($new ? ['/checkout'] : [])] as $path) {
    $request = Illuminate\Http\Request::create('https://ellenacosms.com'.$path, 'GET');
    $response = $http->handle($request);
    if ($response->getStatusCode() !== 200) { throw new RuntimeException('Private route failed: '.$path); }
    if ($path === '/checkout' && !str_contains($response->getContent(), 'payments-paused')) { throw new RuntimeException('Missing paused checkout page'); }
    echo $path." HTTP 200\n";
}
$manifest = json_decode(file_get_contents('/home2/ellenaco/public_html/build/manifest.json'), true, 512, JSON_THROW_ON_ERROR);
foreach ($manifest as $entry) {
    foreach (array_merge([$entry['file']], $entry['css'] ?? [], $entry['assets'] ?? []) as $file) {
        if (!is_file('/home2/ellenaco/public_html/build/'.$file)) { throw new RuntimeException('Missing built asset'); }
    }
}
echo "PRIVATE_HEALTH_PASS\n";
