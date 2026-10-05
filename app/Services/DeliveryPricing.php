<?php

namespace App\Services;

use App\Models\DeliveryZone;
use App\Models\StoreSetting;
use Illuminate\Validation\ValidationException;

class DeliveryPricing
{
    /** @return list<array<string, mixed>> */
    public function options(float $subtotal): array
    {
        $options = DeliveryZone::where('is_active', true)->orderBy('country')->orderBy('district')->orderBy('area')->get()
            ->map(fn (DeliveryZone $zone) => $this->zoneOption($zone, $subtotal))->all();
        if (StoreSetting::getValue('pickup_enabled', '0') === '1') {
            $options[] = ['id' => 'pickup', 'label' => 'Store pickup', 'description' => StoreSetting::getValue('pickup_address', ''), 'fee' => 0, 'estimate' => 'We will confirm collection time', 'estimatedDeliveryDate' => null, 'country' => '', 'district' => '', 'area' => '', 'zone_id' => null];
        }
        $options[] = ['id' => 'quote', 'label' => 'Other area — request delivery quote', 'description' => 'Enter your delivery address. We will confirm the fee before you pay.', 'fee' => null, 'estimate' => 'To be confirmed', 'estimatedDeliveryDate' => null, 'country' => '', 'district' => '', 'area' => '', 'zone_id' => null];

        return array_values($options);
    }

    /** @return array<string, mixed> */
    public function resolve(string $id, float $subtotal): array
    {
        $option = collect($this->options($subtotal))->firstWhere('id', $id);
        if (! $option) {
            throw ValidationException::withMessages(['delivery_method' => 'Please select an available delivery area.']);
        }

        return $option;
    }

    /** @return array<string, mixed> */
    private function zoneOption(DeliveryZone $zone, float $subtotal): array
    {
        $fee = $zone->fee === null ? null : (float) $zone->fee;
        if ($fee !== null && $zone->free_above !== null && $subtotal >= (float) $zone->free_above) {
            $fee = 0;
        }

        return ['id' => 'zone_'.$zone->id, 'label' => $zone->district.' / '.$zone->area, 'description' => $zone->country, 'fee' => $fee, 'estimate' => $zone->minimum_days.'–'.$zone->maximum_days.' business days', 'estimatedDeliveryDate' => now()->addWeekdays($zone->maximum_days)->toDateString(), 'country' => $zone->country, 'district' => $zone->district, 'area' => $zone->area, 'zone_id' => $zone->id];
    }
}
