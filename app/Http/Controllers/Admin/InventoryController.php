<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Product;
use App\Models\StoreSetting;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class InventoryController extends Controller
{
    public function index(Request $request): Response
    {
        $lowStockThreshold = StoreSetting::lowStockThreshold();

        return Inertia::render('admin/inventory', [
            'products' => Product::with('category')
                ->when($request->string('status')->toString() === 'low', fn ($query) => $query->whereBetween('stock', [1, $lowStockThreshold]))
                ->when($request->string('status')->toString() === 'out', fn ($query) => $query->where('stock', 0))
                ->when($request->string('search')->isNotEmpty(), fn ($query) => $query
                    ->where(fn ($search) => $search->where('name', 'like', '%'.$request->string('search').'%')
                        ->orWhere('sku', 'like', '%'.$request->string('search').'%')))
                ->orderBy('stock')
                ->paginate(20)
                ->withQueryString(),
            'filters' => $request->only('status', 'search'),
            'summary' => [
                'units' => Product::sum('stock'),
                'low' => Product::whereBetween('stock', [1, $lowStockThreshold])->count(),
                'out' => Product::where('stock', 0)->count(),
                'value' => (float) Product::selectRaw('SUM(stock * price) as total')->value('total'),
            ],
            'lowStockThreshold' => $lowStockThreshold,
        ]);
    }

    public function update(Request $request, Product $product): RedirectResponse
    {
        $data = $request->validate(['stock' => ['required', 'integer', 'min:0', 'max:999999']]);
        $product->update(['stock' => $data['stock']]);

        return back()->with('success', 'Inventory updated.');
    }
}
