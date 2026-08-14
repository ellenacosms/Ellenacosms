<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class CustomerController extends Controller
{
    public function index(Request $request): Response
    {
        return Inertia::render('admin/customers/index', [
            'customers' => User::where('is_admin', false)
                ->withCount('orders')
                ->withSum('orders', 'total')
                ->when($request->string('search')->isNotEmpty(), fn ($query) => $query
                    ->where(fn ($search) => $search->where('name', 'like', '%'.$request->string('search').'%')
                        ->orWhere('email', 'like', '%'.$request->string('search').'%')))
                ->latest()
                ->paginate(20)
                ->withQueryString(),
            'search' => $request->string('search'),
        ]);
    }

    public function show(User $customer): Response
    {
        abort_if($customer->is_admin, 404);

        return Inertia::render('admin/customers/show', [
            'customer' => $customer,
            'orders' => $customer->orders()->with('items')->latest()->get(),
            'metrics' => [
                'orders' => $customer->orders()->count(),
                'spent' => (float) $customer->orders()->where('status', '!=', 'cancelled')->sum('total'),
                'average' => (float) $customer->orders()->where('status', '!=', 'cancelled')->avg('total'),
            ],
        ]);
    }
}
