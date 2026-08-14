<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Order;
use App\Models\Product;
use App\Models\User;
use Inertia\Inertia;
use Inertia\Response;

class DashboardController extends Controller
{
    public function __invoke(): Response
    {
        return Inertia::render('admin/dashboard', [
            'stats' => [
                'revenue' => (float) Order::where('status', '!=', 'cancelled')->sum('total'),
                'orders' => Order::count(),
                'products' => Product::count(),
                'customers' => User::where('is_admin', false)->count(),
            ],
            'recentOrders' => Order::latest()->take(6)->get(),
            'lowStock' => Product::where('stock', '<=', 10)->orderBy('stock')->take(5)->get(),
        ]);
    }
}
