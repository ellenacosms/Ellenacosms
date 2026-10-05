<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureAdminDomain
{
    public function handle(Request $request, Closure $next): Response
    {
        if (app()->isProduction()
            && $request->getHost() !== config('app.admin_domain')) {
            abort(404);
        }

        return $next($request);
    }
}
