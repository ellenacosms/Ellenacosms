<?php

namespace App\Http\Responses;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Laravel\Fortify\Contracts\LoginResponse;
use Laravel\Fortify\Contracts\RegisterResponse;
use Symfony\Component\HttpFoundation\Response;

class AuthenticationResponse implements LoginResponse, RegisterResponse
{
    public function toResponse($request): Response
    {
        /** @var Request $request */
        if ($request->wantsJson()) {
            return new JsonResponse(['two_factor' => false], $request->routeIs('register.store') ? 201 : 200);
        }

        $intended = $request->session()->pull('url.intended');
        $user = $request->user();

        if ($user?->is_admin && app()->isProduction()
            && $request->getHost() !== config('app.admin_domain')) {
            Auth::logout();
            $request->session()->invalidate();
            $request->session()->regenerateToken();

            abort(404);
        }

        if ($user?->is_admin) {
            return redirect($this->safeIntendedUrl($intended) ?? route('admin.dashboard'));
        }

        if ($this->isAdminUrl($intended)) {
            Inertia::flash('toast', [
                'type' => 'error',
                'message' => 'This is a customer account. Sign in with an administrator account to access the admin dashboard.',
            ]);
        }

        return redirect($this->isAdminUrl($intended) ? route('dashboard') : ($this->safeIntendedUrl($intended) ?? route('dashboard')));
    }

    private function isAdminUrl(?string $url): bool
    {
        $path = $url ? parse_url($url, PHP_URL_PATH) : null;

        return is_string($path) && ($path === '/admin' || Str::startsWith($path, '/admin/'));
    }

    private function safeIntendedUrl(?string $url): ?string
    {
        if (! $url) {
            return null;
        }

        $host = parse_url($url, PHP_URL_HOST);

        return $host === null || $host === request()->getHost() ? $url : null;
    }
}
