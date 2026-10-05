param([ValidateSet('tests', 'alltests', 'static', 'format', 'migrate', 'build', 'preview', 'access', 'sandbox', 'sandbox-status')][string]$Mode = 'tests')
$ErrorActionPreference = 'Stop'
$paymentPhp = if ($env:ELLENA_PHP_BIN) { $env:ELLENA_PHP_BIN } else { Join-Path $env:LOCALAPPDATA 'Microsoft/WinGet/Packages/PHP.PHP.8.4_Microsoft.Winget.Source_8wekyb3d8bbwe/php.exe' }
$paymentExt = Join-Path (Split-Path $paymentPhp) 'ext'
$paymentArgs = @('-d', "extension_dir=$paymentExt", '-d', 'extension=mbstring', '-d', 'extension=pdo_sqlite', '-d', 'extension=sqlite3', '-d', 'extension=openssl', '-d', 'extension=fileinfo', '-d', 'extension=curl', '-d', 'extension=pdo_mysql')
switch ($Mode) {
    'sandbox-status' { & $paymentPhp @paymentArgs scripts/check-dgateway-sandbox.php --recover }
    'sandbox' { & $paymentPhp @paymentArgs scripts/check-dgateway-sandbox.php }
    'access' { & $paymentPhp @paymentArgs scripts/check-dgateway-access.php }
    'tests' { & $paymentPhp @paymentArgs vendor/phpunit/phpunit/phpunit --filter 'DGatewayPaymentTest|DeliveryPricingTest|PaymentLifecycleTest|OrderEventWebhookTest|CommerceTest|StorefrontCommerceTest|RitualBundleTest' }
    'alltests' { & $paymentPhp @paymentArgs vendor/phpunit/phpunit/phpunit }
    'preview' {
        $env:APP_URL = 'http://127.0.0.1:8012'
        $env:APP_ENV = 'local'
        $env:APP_FORCE_HTTPS = 'false'
        $env:ASSET_URL = ''
        $env:SESSION_DOMAIN = ''
        $env:SESSION_SECURE_COOKIE = 'false'
        $env:INERTIA_SSR_ENABLED = 'false'
        $paymentProject = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path
        $previewArgs = $paymentArgs + @('-S', '127.0.0.1:8012', '../vendor/laravel/framework/src/Illuminate/Foundation/resources/server.php')
        $previewProcess = Start-Process -FilePath $paymentPhp -ArgumentList $previewArgs -WorkingDirectory (Join-Path $paymentProject 'public') -WindowStyle Hidden -RedirectStandardOutput (Join-Path $paymentProject 'storage/logs/delivery-preview.out.log') -RedirectStandardError (Join-Path $paymentProject 'storage/logs/delivery-preview.err.log') -PassThru
        Write-Output "Local preview PID: $($previewProcess.Id)"
    }
    'static' { & $paymentPhp @paymentArgs vendor/phpstan/phpstan/phpstan analyse app/Services/Payments app/Services/DeliveryPricing.php app/Services/Orders/OrderPaymentLifecycle.php app/Models/DeliveryZone.php app/Models/PaymentAttempt.php app/Models/Order.php app/Http/Controllers/DGatewayPaymentController.php app/Http/Controllers/Admin/DeliveryZoneController.php app/Http/Controllers/Admin/OrderController.php app/Http/Controllers/CheckoutController.php app/Console/Commands/ReconcilePayments.php app/Mail/DeliveryQuoteReady.php --memory-limit=1G --error-format=table --no-progress -v }
    'format' { & $paymentPhp @paymentArgs vendor/laravel/pint/builds/pint app/Models/DeliveryZone.php app/Models/PaymentAttempt.php app/Models/Order.php app/Services/DeliveryPricing.php app/Services/Payments app/Services/Orders/OrderPaymentLifecycle.php app/Http/Controllers/DGatewayPaymentController.php app/Http/Controllers/CheckoutController.php app/Http/Controllers/Admin/DeliveryZoneController.php app/Http/Controllers/Admin/OrderController.php app/Console/Commands/ReconcilePayments.php app/Mail/DeliveryQuoteReady.php app/Jobs/SendOrderEventWebhook.php routes/web.php routes/console.php config/checkout.php config/services.php bootstrap/app.php database/migrations/2026_09_29_000001_add_delivery_zones_and_payment_attempts.php tests/Feature/DGatewayPaymentTest.php tests/Feature/DeliveryPricingTest.php tests/Feature/PaymentLifecycleTest.php tests/Feature/CommerceTest.php tests/Feature/StorefrontCommerceTest.php tests/Feature/OrderEventWebhookTest.php }
    'migrate' { & $paymentPhp @paymentArgs artisan migrate --path=database/migrations/2026_09_29_000001_add_delivery_zones_and_payment_attempts.php --force }
    'build' {
        $paymentIniDir = Join-Path $PSScriptRoot '../storage/framework/payment-checks'
        New-Item -ItemType Directory -Force -Path $paymentIniDir | Out-Null
        @("extension_dir=$paymentExt", 'extension=mbstring', 'extension=pdo_sqlite', 'extension=sqlite3', 'extension=openssl', 'extension=fileinfo', 'extension=curl', 'extension=pdo_mysql') | Set-Content -LiteralPath (Join-Path $paymentIniDir 'php.ini')
        $env:PHPRC = (Resolve-Path (Join-Path $paymentIniDir 'php.ini')).Path
        $env:PATH = (Split-Path $paymentPhp) + ';' + $env:PATH
        & npm.cmd run build
    }
}
exit $LASTEXITCODE
