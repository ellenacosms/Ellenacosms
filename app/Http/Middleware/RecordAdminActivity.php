<?php

namespace App\Http\Middleware;

use App\Models\AdminActivity;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class RecordAdminActivity
{
    public function handle(Request $request, Closure $next): Response
    {
        /** @var Response $response */
        $response = $next($request);

        if (! in_array($request->method(), ['GET', 'HEAD', 'OPTIONS'], true) && $request->user()?->is_admin) {
            AdminActivity::create([
                'user_id' => $request->user()->id,
                'route' => $request->route()?->getName(),
                'method' => $request->method(),
                'status_code' => $response->getStatusCode(),
                'ip_hash' => hash_hmac('sha256', (string) $request->ip(), (string) config('app.key')),
                'user_agent' => substr((string) $request->userAgent(), 0, 1000) ?: null,
            ]);
        }

        return $response;
    }
}
