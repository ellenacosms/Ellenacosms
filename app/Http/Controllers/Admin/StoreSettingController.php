<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\StoreSetting;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class StoreSettingController extends Controller
{
    public function edit(): Response
    {
        return Inertia::render('admin/settings', [
            'settings' => StoreSetting::pluck('value', 'key'),
        ]);
    }

    public function update(Request $request): RedirectResponse
    {
        $data = $request->validate([
            'store_name' => ['required', 'string', 'max:120'],
            'support_email' => ['required', 'email'],
            'currency' => ['required', 'string', 'size:3', 'alpha'],
            'free_shipping_threshold' => ['required', 'numeric', 'min:0'],
            'low_stock_threshold' => ['required', 'integer', 'min:0'],
            'order_prefix' => ['required', 'string', 'max:10', 'alpha_dash'],
        ]);
        $data['currency'] = strtoupper($data['currency']);
        $data['order_prefix'] = strtoupper($data['order_prefix']);

        foreach ($data as $key => $value) {
            StoreSetting::updateOrCreate(['key' => $key], ['value' => (string) $value]);
        }

        return back()->with('success', 'Store settings saved.');
    }
}
