<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\DeliveryZone;
use App\Models\StoreSetting;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class DeliveryZoneController extends Controller
{
    public function index(): Response
    {
        return Inertia::render('admin/delivery', ['zones' => DeliveryZone::orderBy('district')->orderBy('area')->get(), 'pickupEnabled' => StoreSetting::getValue('pickup_enabled', '0') === '1', 'pickupAddress' => StoreSetting::getValue('pickup_address', '')]);
    }

    public function store(Request $request): RedirectResponse
    {
        DeliveryZone::create($this->validated($request));

        return back()->with('success', 'Delivery area added.');
    }

    public function update(Request $request, DeliveryZone $delivery): RedirectResponse
    {
        $delivery->update($this->validated($request, $delivery));

        return back()->with('success', 'Delivery area updated.');
    }

    public function pickup(Request $request): RedirectResponse
    {
        $data = $request->validate(['enabled' => ['required', 'boolean'], 'address' => ['nullable', 'required_if:enabled,true', 'string', 'max:190']]);
        StoreSetting::updateOrCreate(['key' => 'pickup_enabled'], ['value' => $data['enabled'] ? '1' : '0']);
        StoreSetting::updateOrCreate(['key' => 'pickup_address'], ['value' => $data['address'] ?? '']);

        return back()->with('success', 'Pickup settings saved.');
    }

    /** @return array<string, mixed> */
    private function validated(Request $request, ?DeliveryZone $zone = null): array
    {
        return $request->validate([
            'country' => ['required', 'string', 'max:100'],
            'district' => ['required', 'string', 'max:100'],
            'area' => ['required', 'string', 'max:100', Rule::unique('delivery_zones')->where('country', $request->input('country'))->where('district', $request->input('district'))->ignore($zone)],
            'fee' => ['nullable', 'numeric', 'min:0', 'max:999999999'],
            'free_above' => ['nullable', 'numeric', 'min:0', 'max:999999999'],
            'minimum_days' => ['required', 'integer', 'min:0', 'max:90'],
            'maximum_days' => ['required', 'integer', 'gte:minimum_days', 'max:90'],
            'is_active' => ['required', 'boolean'],
        ]);
    }
}
