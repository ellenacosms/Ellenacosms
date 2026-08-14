<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Symfony\Component\HttpFoundation\Response;

class EnsureAdmin
{
    public function handle(Request $request, Closure $next): Response|RedirectResponse
    {
        if (! $request->user()?->is_admin) {
            Inertia::flash('toast', [
                'type' => 'error',
                'message' => 'Administrator access is required for that page.',
            ]);

            return to_route('dashboard');
        }

        return $next($request);
    }
}
