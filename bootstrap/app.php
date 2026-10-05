<?php

use App\Http\Middleware\EnsureAdmin;
use App\Http\Middleware\EnsureAdminDomain;
use App\Http\Middleware\EnsureAdminTwoFactor;
use App\Http\Middleware\HandleAppearance;
use App\Http\Middleware\HandleInertiaRequests;
use App\Http\Middleware\RecordAdminActivity;
use App\Http\Middleware\SecurityHeaders;
use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Http\Middleware\AddLinkHeadersForPreloadedAssets;
use Illuminate\Http\Request;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware): void {
        $middleware->redirectGuestsTo(function (Request $request): string {
            return $request->is('admin') || $request->is('admin/*')
                ? route('admin.entry')
                : route('register');
        });

        $middleware->validateCsrfTokens(except: [
            'integrations/n8n/checkout-sessions',
            'payments/dgateway/webhook',
        ]);

        $middleware->trustProxies(
            at: ['127.0.0.1', '::1'],
            headers: Request::HEADER_X_FORWARDED_FOR
                | Request::HEADER_X_FORWARDED_HOST
                | Request::HEADER_X_FORWARDED_PORT
                | Request::HEADER_X_FORWARDED_PROTO,
        );

        $middleware->trustHosts(
            at: [
                '^ellenacosms\\.com$',
                '^www\\.ellenacosms\\.com$',
                '^admin\\.ellenacosms\\.com$',
            ],
            subdomains: false,
        );

        $middleware->alias([
            'admin' => EnsureAdmin::class,
            'admin.domain' => EnsureAdminDomain::class,
            'admin.two-factor' => EnsureAdminTwoFactor::class,
            'admin.audit' => RecordAdminActivity::class,
        ]);
        $middleware->encryptCookies(except: ['appearance', 'sidebar_state']);

        $middleware->web(append: [
            HandleAppearance::class,
            HandleInertiaRequests::class,
            SecurityHeaders::class,
            AddLinkHeadersForPreloadedAssets::class,
        ]);
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        $exceptions->shouldRenderJsonWhen(
            fn (Request $request) => $request->is('api/*') || $request->expectsJson(),
        );
    })->create();
