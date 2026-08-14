<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Symfony\Component\HttpFoundation\Response;

class EnsureAdminTwoFactor
{
    public function handle(Request $request, Closure $next): Response|RedirectResponse
    {
        $user = $request->user();

        if ($user?->is_admin && ! $user->hasEnabledTwoFactorAuthentication()) {
            Inertia::flash('toast', [
                'type' => 'error',
                'message' => 'Set up two-factor authentication before accessing the admin portal.',
            ]);

            return to_route('security.edit');
        }

        return $next($request);
    }
}
