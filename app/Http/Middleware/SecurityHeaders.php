<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Vite;
use Symfony\Component\HttpFoundation\Response;

class SecurityHeaders
{
    public function handle(Request $request, Closure $next): Response
    {
        $nonce = Vite::useCspNonce();
        $request->attributes->set('csp_nonce', $nonce);
        $viteDevAssets = app()->isLocal() && is_file(public_path('hot'))
            ? ' http://127.0.0.1:5173'
            : '';
        $viteDevConnection = $viteDevAssets === ''
            ? ''
            : "{$viteDevAssets} ws://127.0.0.1:5173";

        /** @var Response $response */
        $response = $next($request);

        $response->headers->set('Content-Security-Policy', implode('; ', [
            "default-src 'self'",
            "base-uri 'self'",
            "connect-src 'self' https://accounts.google.com https://api.stripe.com https://r.stripe.com https://m.stripe.network{$viteDevConnection}",
            "font-src 'self' data: https://fonts.gstatic.com{$viteDevAssets}",
            "form-action 'self' https://accounts.google.com",
            "frame-src https://www.google.com https://maps.google.com https://js.stripe.com https://hooks.stripe.com",
            "frame-ancestors 'none'",
            "img-src 'self' data: https:",
            "object-src 'none'",
            "script-src 'self' 'nonce-{$nonce}' https://js.stripe.com{$viteDevAssets}",
            "style-src 'self' 'nonce-{$nonce}' https://fonts.googleapis.com{$viteDevAssets}",
            "style-src-attr 'unsafe-inline'",
        ]));
        $response->headers->set('Cross-Origin-Opener-Policy', 'same-origin-allow-popups');
        $response->headers->set('Permissions-Policy', 'camera=(), microphone=(), geolocation=(), payment=()');
        $response->headers->set('Referrer-Policy', 'strict-origin-when-cross-origin');
        $response->headers->set('X-Content-Type-Options', 'nosniff');
        $response->headers->set('X-Frame-Options', 'DENY');
        $response->headers->set('X-Permitted-Cross-Domain-Policies', 'none');

        if ($request->isSecure()) {
            $response->headers->set('Strict-Transport-Security', 'max-age=31536000');
        }

        return $response;
    }
}
