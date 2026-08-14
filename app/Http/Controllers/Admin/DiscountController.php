<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Discount;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class DiscountController extends Controller
{
    public function index(): Response
    {
        return Inertia::render('admin/discounts', [
            'discounts' => Discount::latest()->get(),
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        Discount::create($this->validated($request));

        return back()->with('success', 'Discount created.');
    }

    public function update(Request $request, Discount $discount): RedirectResponse
    {
        $discount->update($this->validated($request, $discount));

        return back()->with('success', 'Discount updated.');
    }

    public function destroy(Discount $discount): RedirectResponse
    {
        $discount->delete();

        return back()->with('success', 'Discount deleted.');
    }

    /**
     * @return array<string, mixed>
     */
    private function validated(Request $request, ?Discount $discount = null): array
    {
        $data = $request->validate([
            'name' => ['required', 'string', 'max:120'],
            'code' => ['required', 'string', 'max:40', Rule::unique('discounts')->ignore($discount)],
            'type' => ['required', Rule::in(['percentage', 'fixed'])],
            'value' => [
                'required',
                'numeric',
                'min:0',
                Rule::when($request->input('type') === 'percentage', ['max:100']),
            ],
            'minimum_order' => ['nullable', 'numeric', 'min:0'],
            'usage_limit' => ['nullable', 'integer', 'min:1'],
            'starts_at' => ['nullable', 'date'],
            'ends_at' => ['nullable', 'date', 'after_or_equal:starts_at'],
            'is_active' => ['boolean'],
        ]);
        $data['code'] = Str::upper($data['code']);

        return $data;
    }
}
